import "server-only";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  EMPTY_PROFILE,
  normalizeCart,
  type Address,
  type AvatarType,
  type CartLine,
  type PlacedOrder,
  type Profile,
  type StandingOrder,
} from "@/lib/account";
import type { Story } from "@/lib/stories";

/**
 * Local persistence for everything that belongs to a visitor rather than to
 * the catalogue: favorites, the account profile, standing orders and contact
 * messages. One JSON file, written atomically, with writes queued so two
 * requests never interleave a read-modify-write.
 *
 * This is the seam for a real database. It holds under `next dev` and on a
 * single long-running `next start`; on serverless hosting the filesystem is
 * not persistent, so replace these functions with Postgres (or Supabase)
 * before deploying there. Nothing outside this file knows the storage format.
 */

export type ContactMessage = {
  ref: string;
  received: string;
  topic: string;
  name: string;
  email: string;
  organisation: string;
  lot: string;
  message: string;
};

export type WaitlistEntry = { visitor: string; email: string; joined: string };

export type User = { id: string; email: string; passwordHash: string; created: string };

export type SessionRecord = {
  user: string;
  persistent: boolean;
  created: string;
  expires: string;
};

/**
 * Every record below is keyed by an owner id: a signed-in user's id, or a
 * guest browser's visitor id. Both are UUIDs, and signing in folds the guest's
 * records into the user's (see `mergeOwner`).
 */
type Db = {
  users: Record<string, User>;
  /** sha256 of the session token → session, so a copied store holds no live tokens */
  sessions: Record<string, SessionRecord>;
  /** slug → visitor ids, so a count is the number of people, not of clicks */
  favorites: Record<string, string[]>;
  waitlist: Record<string, WaitlistEntry[]>;
  profiles: Record<string, Profile>;
  carts: Record<string, CartLine[]>;
  placed: Record<string, PlacedOrder[]>;
  orders: Record<string, StandingOrder[]>;
  messages: ContactMessage[];
  stories: Story[];
  subscribers: { email: string; joined: string }[];
};

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");
const AVATARS = path.join(DIR, "avatars");

const empty = (): Db => ({
  users: {},
  sessions: {},
  favorites: {},
  waitlist: {},
  profiles: {},
  carts: {},
  placed: {},
  orders: {},
  messages: [],
  stories: [],
  subscribers: [],
});

async function read(): Promise<Db> {
  try {
    return { ...empty(), ...JSON.parse(await readFile(FILE, "utf8")) };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw e;
  }
}

// Windows can briefly lock the target while an indexer or scanner reads it.
async function replace(from: string, to: string, tries = 5): Promise<void> {
  try {
    await rename(from, to);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (tries > 0 && (code === "EPERM" || code === "EBUSY" || code === "EACCES")) {
      await new Promise((r) => setTimeout(r, 40));
      return replace(from, to, tries - 1);
    }
    throw e;
  }
}

async function write(db: Db) {
  await mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await replace(tmp, FILE);
}

// Kept on globalThis so a hot reload in development does not start a second queue.
const g = globalThis as unknown as { __redSkyQueue?: Promise<unknown> };

function update<T>(fn: (db: Db) => T): Promise<T> {
  const run = async () => {
    const db = await read();
    const result = fn(db);
    await write(db);
    return result;
  };
  const next = (g.__redSkyQueue ?? Promise.resolve()).then(run, run);
  g.__redSkyQueue = next.catch(() => undefined);
  return next;
}

/* ── Users and sessions ────────────────────────────────────── */

export async function findUserByEmail(email: string) {
  const db = await read();
  return Object.values(db.users).find((u) => u.email === email) ?? null;
}

export async function getUser(id: string) {
  return (await read()).users[id] ?? null;
}

/** Returns false, and writes nothing, when the address already has an account. */
export function createUser(user: User) {
  return update((db) => {
    if (Object.values(db.users).some((u) => u.email === user.email)) return false;
    db.users[user.id] = user;
    return true;
  });
}

export async function getSession(hash: string) {
  const record = (await read()).sessions[hash];
  return record && Date.parse(record.expires) > Date.now() ? record : null;
}

export function putSession(hash: string, record: SessionRecord) {
  return update((db) => {
    // Expired sessions are swept whenever a new one is written.
    const now = Date.now();
    for (const [key, s] of Object.entries(db.sessions)) {
      if (Date.parse(s.expires) <= now) delete db.sessions[key];
    }
    db.sessions[hash] = record;
  });
}

export function deleteSession(hash: string) {
  return update((db) => {
    delete db.sessions[hash];
  });
}

/**
 * Signing in keeps what the guest did before it: favorites, waitlists and the
 * cart move to the account, and profile fields the account lacks are filled.
 */
export function mergeOwner(from: string, into: string) {
  if (from === into) return Promise.resolve();
  return update((db) => {
    for (const [slug, ids] of Object.entries(db.favorites)) {
      if (ids.includes(from)) {
        db.favorites[slug] = [...new Set(ids.map((id) => (id === from ? into : id)))];
      }
    }
    for (const [slug, entries] of Object.entries(db.waitlist)) {
      const guest = entries.find((e) => e.visitor === from);
      if (!guest) continue;
      const rest = entries.filter((e) => e.visitor !== from);
      db.waitlist[slug] = rest.some((e) => e.visitor === into)
        ? rest
        : [...rest, { ...guest, visitor: into }];
    }
    if (db.carts[from]?.length) {
      db.carts[into] = normalizeCart([...(db.carts[into] ?? []), ...db.carts[from]]);
    }
    delete db.carts[from];

    const guest = db.profiles[from];
    if (guest) {
      const mine = { ...EMPTY_PROFILE, ...db.profiles[into] };
      db.profiles[into] = {
        ...mine,
        name: mine.name || guest.name,
        organisation: mine.organisation || guest.organisation,
        email: mine.email || guest.email,
      };
      delete db.profiles[from];
    }
  });
}

/* ── Favorites ─────────────────────────────────────────────── */

export async function favoriteSnapshot(visitor: string | null) {
  const db = await read();
  const counts: Record<string, number> = {};
  const mine: string[] = [];
  for (const [slug, ids] of Object.entries(db.favorites)) {
    counts[slug] = ids.length;
    if (visitor && ids.includes(visitor)) mine.push(slug);
  }
  return { counts, mine };
}

/** Idempotent, so a retried request or a double click cannot count twice. */
export function setFavorite(visitor: string, slug: string, on: boolean) {
  return update((db) => {
    const ids = new Set(db.favorites[slug] ?? []);
    if (on) ids.add(visitor);
    else ids.delete(visitor);
    db.favorites[slug] = [...ids];
    return ids.size;
  });
}

/* ── Waitlist ──────────────────────────────────────────────── */

export async function waitlistSnapshot(visitor: string | null) {
  const db = await read();
  const counts: Record<string, number> = {};
  const mine: string[] = [];
  for (const [slug, entries] of Object.entries(db.waitlist)) {
    counts[slug] = entries.length;
    if (visitor && entries.some((e) => e.visitor === visitor)) mine.push(slug);
  }
  return { counts, mine };
}

/**
 * Joins with `email`, or leaves when it is null. The first address anyone
 * gives also becomes the account's, so the next waitlist is a single click.
 */
export function setWaitlist(visitor: string, slug: string, email: string | null) {
  return update((db) => {
    const others = (db.waitlist[slug] ?? []).filter((e) => e.visitor !== visitor);
    db.waitlist[slug] = email
      ? [...others, { visitor, email, joined: new Date().toISOString() }]
      : others;
    if (email && !db.profiles[visitor]?.email) {
      db.profiles[visitor] = { ...EMPTY_PROFILE, ...db.profiles[visitor], email };
    }
    return db.waitlist[slug].length;
  });
}

/* ── Profile and avatar ────────────────────────────────────── */

export async function getProfile(visitor: string | null): Promise<Profile> {
  if (!visitor) return EMPTY_PROFILE;
  const db = await read();
  return { ...EMPTY_PROFILE, ...db.profiles[visitor] };
}

export function saveProfile(
  visitor: string,
  fields: Pick<Profile, "name" | "organisation" | "email">,
) {
  return update((db) => {
    db.profiles[visitor] = { ...EMPTY_PROFILE, ...db.profiles[visitor], ...fields };
    return db.profiles[visitor];
  });
}

export function saveAddress(owner: string, address: Address) {
  return update((db) => {
    db.profiles[owner] = { ...EMPTY_PROFILE, ...db.profiles[owner], address };
  });
}

const EXT: Record<AvatarType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const avatarFile = (visitor: string, type: AvatarType) =>
  path.join(AVATARS, `${visitor}.${EXT[type]}`);

export async function saveAvatar(visitor: string, type: AvatarType, bytes: Uint8Array) {
  const previous = (await getProfile(visitor)).avatar;
  await mkdir(AVATARS, { recursive: true });
  await writeFile(avatarFile(visitor, type), bytes);
  if (previous && previous.type !== type) {
    await rm(avatarFile(visitor, previous.type), { force: true });
  }
  return update((db) => {
    const avatar = { type, version: Date.now() };
    db.profiles[visitor] = { ...EMPTY_PROFILE, ...db.profiles[visitor], avatar };
    return avatar;
  });
}

export async function readAvatar(visitor: string) {
  const { avatar } = await getProfile(visitor);
  if (!avatar) return null;
  try {
    return { ...avatar, bytes: await readFile(avatarFile(visitor, avatar.type)) };
  } catch {
    return null;
  }
}

export async function removeAvatar(visitor: string) {
  const { avatar } = await getProfile(visitor);
  if (avatar) await rm(avatarFile(visitor, avatar.type), { force: true });
  return update((db) => {
    if (db.profiles[visitor]) db.profiles[visitor].avatar = null;
  });
}

/* ── Cart and checkout ─────────────────────────────────────── */

export async function getCart(visitor: string | null): Promise<CartLine[]> {
  if (!visitor) return [];
  return (await read()).carts[visitor] ?? [];
}

export function changeCart(visitor: string, change: (lines: CartLine[]) => CartLine[]) {
  return update((db) => {
    db.carts[visitor] = normalizeCart(change(db.carts[visitor] ?? []));
    return db.carts[visitor];
  });
}

/** One write: record the order, open its standing orders, empty the cart. */
export function placeOrder(visitor: string, order: PlacedOrder, standing: StandingOrder[]) {
  return update((db) => {
    db.placed[visitor] = [...(db.placed[visitor] ?? []), order];
    db.orders[visitor] = [...(db.orders[visitor] ?? []), ...standing];
    db.carts[visitor] = [];
    return order;
  });
}

/* ── Standing orders ───────────────────────────────────────── */

export async function getOrders(visitor: string | null): Promise<StandingOrder[]> {
  if (!visitor) return [];
  return (await read()).orders[visitor] ?? [];
}

/**
 * Applies `change` to one of this visitor's orders. Returning null from the
 * change deletes the order; an id that belongs to someone else is a no-op.
 */
export function changeOrder(
  visitor: string,
  id: string,
  change: (order: StandingOrder) => StandingOrder | null,
) {
  return update((db) => {
    const list = db.orders[visitor] ?? [];
    const at = list.findIndex((o) => o.id === id);
    if (at === -1) return false;
    const next = change(list[at]);
    db.orders[visitor] = next
      ? list.map((o, i) => (i === at ? next : o))
      : list.filter((_, i) => i !== at);
    return true;
  });
}

/* ── Client stories ────────────────────────────────────────── */

export function addStory(story: Story) {
  return update((db) => {
    db.stories.push(story);
    return story.id;
  });
}

export async function storiesWith(...statuses: Story["status"][]) {
  return (await read()).stories
    .filter((s) => statuses.includes(s.status))
    .sort((a, b) => (b.published ?? b.received).localeCompare(a.published ?? a.received));
}

export function setStoryStatus(id: string, status: Story["status"]) {
  return update((db) => {
    const story = db.stories.find((s) => s.id === id);
    if (!story) return false;
    story.status = status;
    story.published = status === "published" ? new Date().toISOString() : null;
    return true;
  });
}

/** Whether an owner has placed an order that included any of these sequences. */
export async function hasOrdered(owner: string, slugs: string[]) {
  const orders = (await read()).placed[owner] ?? [];
  return orders.some((o) => o.lines.some((l) => slugs.includes(l.slug)));
}

/* ── Account housekeeping ──────────────────────────────────── */

export async function placedOrders(owner: string): Promise<PlacedOrder[]> {
  return [...((await read()).placed[owner] ?? [])].sort((a, b) => b.placed.localeCompare(a.placed));
}

export function setPasswordHash(user: string, passwordHash: string) {
  return update((db) => {
    if (db.users[user]) db.users[user].passwordHash = passwordHash;
  });
}

/** Signs a user out everywhere except the session in `keep`. */
export function endOtherSessions(user: string, keep: string | null) {
  return update((db) => {
    for (const [hash, s] of Object.entries(db.sessions)) {
      if (s.user === user && hash !== keep) delete db.sessions[hash];
    }
  });
}

export function subscribe(email: string) {
  return update((db) => {
    const known = db.subscribers.some((s) => s.email === email);
    if (!known) db.subscribers.push({ email, joined: new Date().toISOString() });
    return !known;
  });
}

/* ── Contact ───────────────────────────────────────────────── */

export function addMessage(message: ContactMessage) {
  return update((db) => {
    db.messages.push(message);
    return message.ref;
  });
}
