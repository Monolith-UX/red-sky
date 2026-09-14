import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { cookies } from "next/headers";
import {
  deleteSession,
  getSession,
  getUser,
  putSession,
  type SessionRecord,
} from "./store";
import { ensureVisitor, readVisitor } from "./visitor";

/**
 * Email-and-password accounts with a session that outlives the browser: a
 * returning visitor is signed straight back in until they sign out or ninety
 * days pass without a visit. Tokens are random and only their hashes are
 * stored; passwords are scrypt-hashed with a per-user salt.
 */

const COOKIE = "rs_session";
const KEEP_DAYS = 90;
/** Unticking "keep me signed in" still caps the server side of the session. */
const BROWSER_SESSION_HOURS = 12;
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

/* ── Passwords ─────────────────────────────────────────────── */

const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const derive = (password: string, salt: Buffer, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, 64, options, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

/** A hash to verify against when no account exists, so timing does not reveal which addresses do. */
const DECOY = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function verifyPassword(password: string, stored: string | null) {
  const [scheme, N, r, p, salt, key] = (stored ?? DECOY).split("$");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await derive(password, Buffer.from(salt, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return stored !== null && actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* ── Attempts ──────────────────────────────────────────────── */

const g = globalThis as unknown as { __redSkyAttempts?: Map<string, number[]> };
const attempts = (g.__redSkyAttempts ??= new Map<string, number[]>());

/** Five tries per address per ten minutes. In memory, so it resets with the server. */
export function allowAttempt(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  attempts.set(key, [...recent, now]);
  return true;
}

export const clearAttempts = (key: string) => attempts.delete(key);

/* ── Sessions ──────────────────────────────────────────────── */

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function readToken() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

async function writeCookie(token: string, persistent: boolean) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(persistent ? { maxAge: KEEP_DAYS * 24 * 60 * 60 } : {}),
  });
}

const expiry = (persistent: boolean) =>
  new Date(
    Date.now() + (persistent ? KEEP_DAYS * 24 * 60 * 60 * 1000 : BROWSER_SESSION_HOURS * 60 * 60 * 1000),
  ).toISOString();

/** Server Actions and Route Handlers only: it writes a cookie. */
export async function startSession(user: string, persistent: boolean) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date().toISOString();
  await putSession(hashToken(token), { user, persistent, created: now, expires: expiry(persistent) });
  await writeCookie(token, persistent);
}

async function current(): Promise<{ hash: string; record: SessionRecord } | null> {
  const token = await readToken();
  if (!token) return null;
  const hash = hashToken(token);
  const record = await getSession(hash);
  return record ? { hash, record } : null;
}

/** The signed-in user, if any. Safe to call while rendering: it never writes. */
export async function currentUser() {
  const session = await current();
  if (!session) return null;
  const user = await getUser(session.record.user);
  return user ? { id: user.id, email: user.email } : null;
}

/**
 * Slides a persistent session forward, at most once a day, so someone who
 * keeps coming back is never asked to sign in again. Writes a cookie.
 */
export async function renewSession() {
  const session = await current();
  if (!session?.record.persistent) return;
  const remaining = Date.parse(session.record.expires) - Date.now();
  if (KEEP_DAYS * 24 * 60 * 60 * 1000 - remaining < RENEW_AFTER_MS) return;
  await putSession(session.hash, { ...session.record, expires: expiry(true) });
  const token = await readToken();
  if (token) await writeCookie(token, true);
}

export async function endSession() {
  const session = await current();
  if (session) await deleteSession(session.hash);
  (await cookies()).delete(COOKIE);
}

/* ── Owner ─────────────────────────────────────────────────── */

/** Whose records a request reads: the signed-in user's, else this browser's guest id. */
export async function readOwner() {
  return (await currentUser())?.id ?? (await readVisitor());
}

/** As `readOwner`, but creates the guest id on first use. Writes a cookie. */
export async function ensureOwner() {
  return (await currentUser())?.id ?? (await ensureVisitor());
}
