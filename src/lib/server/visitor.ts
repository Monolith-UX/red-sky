import "server-only";
import { cookies } from "next/headers";

/**
 * Until sign-in exists, an account belongs to a browser: an opaque id in an
 * httpOnly cookie, set the first time someone saves something — never on a
 * plain page view. When real auth lands, swap `readVisitor` for the session's
 * user id and everything keyed on it carries over.
 */

const COOKIE = "rs_visitor";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export async function readVisitor() {
  const value = (await cookies()).get(COOKIE)?.value;
  return value && UUID.test(value) ? value : null;
}

/** Writes a cookie, so only call it from a Server Action or a Route Handler. */
export async function ensureVisitor() {
  const existing = await readVisitor();
  if (existing) return existing;
  const id = crypto.randomUUID();
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

/** Drops the guest id, so a closed account leaves nothing tying this browser to it. */
export async function forgetVisitor() {
  (await cookies()).delete(COOKIE);
}

/** A stable small number for drawing a default avatar, without exposing the id. */
export function seedOf(visitor: string | null) {
  if (!visitor) return 0;
  let h = 2166136261;
  for (const ch of visitor) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (h >>> 0) % 9973;
}

/**
 * Route Handlers do not get the Origin check Server Actions have built in.
 * Browsers always send Origin on a cross-origin or same-origin POST fetch.
 */
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Small JSON bodies only; anything larger is not something this API accepts. */
export async function readJson(request: Request, limit = 2048): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > limit) return null;
  const text = await request.text();
  if (text.length > limit) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
