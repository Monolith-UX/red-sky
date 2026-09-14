import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_PROFILE,
  normalizeCart,
  type Address,
  type AvatarType,
  type CartLine,
  type PlacedOrder,
  type Profile,
  type StandingOrder,
  type Weekday,
} from "@/lib/account";
import type { Story } from "@/lib/stories";
import type * as FileStore from "./store-file";
import type { ContactMessage, Kept, SessionRecord, User } from "./store-file";

/**
 * The store over Supabase: Postgres for records, a private Storage bucket for
 * profile photos. The same functions, with the same results, as
 * `store-file.ts`; the schema is `supabase/migrations/`. Server-only, with the
 * secret key — row-level security is on and has no policies, so the public
 * key can reach nothing.
 */

let client: SupabaseClient | null = null;

function db() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must both be set.");
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

/** Unwraps a query, throwing its error so a failed write is never mistaken for an empty result. */
function must<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

const iso = (v: string | null) => (v ? new Date(v).toISOString() : v);

/* ── Rows ──────────────────────────────────────────────────── */

type ProfileRow = {
  owner: string;
  name: string;
  organisation: string;
  email: string;
  avatar_type: AvatarType | null;
  avatar_version: number | null;
  address: Address | null;
};

const toProfile = (r: ProfileRow | null): Profile =>
  r
    ? {
        name: r.name,
        organisation: r.organisation,
        email: r.email,
        avatar: r.avatar_type ? { type: r.avatar_type, version: Number(r.avatar_version) } : null,
        address: r.address,
      }
    : EMPTY_PROFILE;

type OrderRow = {
  ref: string;
  placed: string;
  lines: CartLine[];
  weekday: Weekday | null;
  standing: string[];
  totals: PlacedOrder["totals"] | null;
  address: Address | null;
};

const toPlaced = (r: OrderRow): PlacedOrder => ({
  ref: r.ref,
  placed: iso(r.placed)!,
  lines: r.lines,
  weekday: r.weekday,
  standing: r.standing,
  totals: r.totals ?? undefined,
  address: r.address ?? undefined,
});

type StandingRow = {
  id: string;
  slug: string;
  quantity: number;
  weekday: Weekday;
  status: StandingOrder["status"];
  next_dispatch: string;
  created: string;
};

const toStanding = (r: StandingRow): StandingOrder => ({
  id: r.id,
  slug: r.slug,
  quantity: r.quantity,
  weekday: r.weekday,
  status: r.status,
  nextDispatch: r.next_dispatch,
  created: r.created,
});

const fromStanding = (owner: string, o: StandingOrder): StandingRow & { owner: string } => ({
  id: o.id,
  owner,
  slug: o.slug,
  quantity: o.quantity,
  weekday: o.weekday,
  status: o.status,
  next_dispatch: o.nextDispatch,
  created: o.created,
});

type StoryRow = Omit<Story, "verifiedOrder"> & { verified_order: boolean };

const toStory = ({ verified_order, ...r }: StoryRow): Story => ({
  ...r,
  received: iso(r.received)!,
  published: iso(r.published),
  verifiedOrder: verified_order,
});

const toUser = (r: { id: string; email: string; password_hash: string; created: string }): User => ({
  id: r.id,
  email: r.email,
  passwordHash: r.password_hash,
  created: iso(r.created)!,
});

/* ── Users and sessions ────────────────────────────────────── */

async function findUserByEmail(email: string) {
  const row = must(await db().from("users").select().eq("email", email).maybeSingle());
  return row ? toUser(row) : null;
}

async function getUser(id: string) {
  const row = must(await db().from("users").select().eq("id", id).maybeSingle());
  return row ? toUser(row) : null;
}

/** Returns false, and writes nothing, when the address already has an account. */
async function createUser(user: User) {
  const { error } = await db()
    .from("users")
    .insert({ id: user.id, email: user.email, password_hash: user.passwordHash, created: user.created });
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Supabase: ${error.message}`);
  return true;
}

async function getSession(hash: string) {
  const row = must(await db().from("sessions").select().eq("hash", hash).maybeSingle());
  if (!row || Date.parse(row.expires) <= Date.now()) return null;
  const record: SessionRecord = {
    user: row.user_id,
    persistent: row.persistent,
    created: iso(row.created)!,
    expires: iso(row.expires)!,
  };
  return record;
}

async function putSession(hash: string, record: SessionRecord) {
  // Expired sessions are swept whenever a new one is written.
  must(await db().from("sessions").delete().lte("expires", new Date().toISOString()));
  must(
    await db().from("sessions").upsert({
      hash,
      user_id: record.user,
      persistent: record.persistent,
      created: record.created,
      expires: record.expires,
    }),
  );
}

async function deleteSession(hash: string) {
  must(await db().from("sessions").delete().eq("hash", hash));
}

async function mergeOwner(from: string, into: string) {
  if (from === into) return;
  must(await db().rpc("merge_owner", { p_from: from, p_into: into }));
}

/* ── Favorites and waitlist ────────────────────────────────── */

async function snapshot(table: "favorites" | "waitlist", view: string, visitor: string | null) {
  const [counted, mine] = await Promise.all([
    db().from(view).select("slug, n"),
    visitor ? db().from(table).select("slug").eq("owner", visitor) : Promise.resolve({ data: [], error: null }),
  ]);
  const counts: Record<string, number> = {};
  for (const r of must(counted) as { slug: string; n: number }[]) counts[r.slug] = r.n;
  return { counts, mine: (must(mine) as { slug: string }[]).map((r) => r.slug) };
}

const favoriteSnapshot = (visitor: string | null) => snapshot("favorites", "favorite_counts", visitor);
const waitlistSnapshot = (visitor: string | null) => snapshot("waitlist", "waitlist_counts", visitor);

async function countOf(table: "favorites" | "waitlist", slug: string) {
  const { count, error } = await db().from(table).select("*", { count: "exact", head: true }).eq("slug", slug);
  if (error) throw new Error(`Supabase: ${error.message}`);
  return count ?? 0;
}

/** Idempotent, so a retried request or a double click cannot count twice. */
async function setFavorite(visitor: string, slug: string, on: boolean) {
  if (on) {
    must(await db().from("favorites").upsert({ slug, owner: visitor }, { ignoreDuplicates: true }));
  } else {
    must(await db().from("favorites").delete().eq("slug", slug).eq("owner", visitor));
  }
  return countOf("favorites", slug);
}

/**
 * Joins with `email`, or leaves when it is null. The first address anyone
 * gives also becomes the account's, so the next waitlist is a single click.
 */
async function setWaitlist(visitor: string, slug: string, email: string | null) {
  if (email) {
    must(
      await db()
        .from("waitlist")
        .upsert({ slug, owner: visitor, email, joined: new Date().toISOString() }),
    );
    const profile = await getProfile(visitor);
    if (!profile.email) must(await db().from("profiles").upsert({ owner: visitor, email }));
  } else {
    must(await db().from("waitlist").delete().eq("slug", slug).eq("owner", visitor));
  }
  return countOf("waitlist", slug);
}

/* ── Profile and avatar ────────────────────────────────────── */

async function getProfile(visitor: string | null): Promise<Profile> {
  if (!visitor) return EMPTY_PROFILE;
  return toProfile(must(await db().from("profiles").select().eq("owner", visitor).maybeSingle()));
}

// An upsert updates only the columns it is given, so other profile fields are kept.
async function saveProfile(visitor: string, fields: Pick<Profile, "name" | "organisation" | "email">) {
  return toProfile(must(await db().from("profiles").upsert({ owner: visitor, ...fields }).select().single()));
}

/** Null removes the saved address; orders already placed keep their own copy. */
async function saveAddress(owner: string, address: Address | null) {
  must(await db().from("profiles").upsert({ owner, address }));
}

const BUCKET = "avatars";
const EXT: Record<AvatarType, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const avatarPath = (visitor: string, type: AvatarType) => `${visitor}.${EXT[type]}`;

async function saveAvatar(visitor: string, type: AvatarType, bytes: Uint8Array) {
  const previous = (await getProfile(visitor)).avatar;
  must(await db().storage.from(BUCKET).upload(avatarPath(visitor, type), bytes, { contentType: type, upsert: true }));
  if (previous && previous.type !== type) {
    await db().storage.from(BUCKET).remove([avatarPath(visitor, previous.type)]);
  }
  const avatar = { type, version: Date.now() };
  must(await db().from("profiles").upsert({ owner: visitor, avatar_type: type, avatar_version: avatar.version }));
  return avatar;
}

async function readAvatar(visitor: string) {
  const { avatar } = await getProfile(visitor);
  if (!avatar) return null;
  const { data, error } = await db().storage.from(BUCKET).download(avatarPath(visitor, avatar.type));
  if (error || !data) return null;
  return { ...avatar, bytes: Buffer.from(await data.arrayBuffer()) };
}

async function removeAvatar(visitor: string) {
  const { avatar } = await getProfile(visitor);
  if (avatar) await db().storage.from(BUCKET).remove([avatarPath(visitor, avatar.type)]);
  must(await db().from("profiles").update({ avatar_type: null, avatar_version: null }).eq("owner", visitor));
}

/* ── Cart and checkout ─────────────────────────────────────── */

async function getCart(visitor: string | null): Promise<CartLine[]> {
  if (!visitor) return [];
  const row = must(await db().from("carts").select("lines").eq("owner", visitor).maybeSingle());
  // A merged guest cart is stored concatenated; normalising on read folds it together.
  return normalizeCart((row?.lines as CartLine[] | undefined) ?? []);
}

async function changeCart(visitor: string, change: (lines: CartLine[]) => CartLine[]) {
  const lines = normalizeCart(change(await getCart(visitor)));
  must(await db().from("carts").upsert({ owner: visitor, lines }));
  return lines;
}

/** One transaction: record the order, open its standing orders, empty the cart. */
async function placeOrder(visitor: string, order: PlacedOrder, standing: StandingOrder[]) {
  must(await db().rpc("place_order", { p_owner: visitor, p_order: order, p_standing: standing }));
  return order;
}

/* ── Standing orders ───────────────────────────────────────── */

async function getOrders(visitor: string | null): Promise<StandingOrder[]> {
  if (!visitor) return [];
  const rows = must(await db().from("standing_orders").select().eq("owner", visitor).order("created"));
  return (rows as StandingRow[]).map(toStanding);
}

/**
 * Applies `change` to one of this visitor's orders. Returning null from the
 * change deletes the order; an id that belongs to someone else is a no-op.
 */
async function changeOrder(visitor: string, id: string, change: (order: StandingOrder) => StandingOrder | null) {
  const row = must(await db().from("standing_orders").select().eq("owner", visitor).eq("id", id).maybeSingle());
  if (!row) return false;
  const next = change(toStanding(row as StandingRow));
  if (next) {
    must(await db().from("standing_orders").update(fromStanding(visitor, next)).eq("owner", visitor).eq("id", id));
  } else {
    must(await db().from("standing_orders").delete().eq("owner", visitor).eq("id", id));
  }
  return true;
}

/* ── Client stories ────────────────────────────────────────── */

async function addStory(story: Story) {
  const { verifiedOrder, ...rest } = story;
  must(await db().from("stories").insert({ ...rest, verified_order: verifiedOrder }));
  return story.id;
}

async function storiesWith(...statuses: Story["status"][]) {
  const rows = must(await db().from("stories").select().in("status", statuses));
  return (rows as StoryRow[])
    .map(toStory)
    .sort((a, b) => (b.published ?? b.received).localeCompare(a.published ?? a.received));
}

async function setStoryStatus(id: string, status: Story["status"]) {
  const rows = must(
    await db()
      .from("stories")
      .update({ status, published: status === "published" ? new Date().toISOString() : null })
      .eq("id", id)
      .select("id"),
  );
  return (rows ?? []).length > 0;
}

/** Whether an owner has placed an order that included any of these sequences. */
async function hasOrdered(owner: string, slugs: string[]) {
  const orders = await placedOrders(owner);
  return orders.some((o) => o.lines.some((l) => slugs.includes(l.slug)));
}

/* ── Account housekeeping ──────────────────────────────────── */

async function placedOrders(owner: string): Promise<PlacedOrder[]> {
  const rows = must(await db().from("placed_orders").select().eq("owner", owner).order("placed", { ascending: false }));
  return (rows as OrderRow[]).map(toPlaced);
}

async function setPasswordHash(user: string, passwordHash: string) {
  must(await db().from("users").update({ password_hash: passwordHash }).eq("id", user));
}

/** Signs a user out everywhere except the session in `keep`. */
async function endOtherSessions(user: string, keep: string | null) {
  const query = db().from("sessions").delete().eq("user_id", user);
  must(await (keep ? query.neq("hash", keep) : query));
}

/** Addresses a person has used with us: the sign-in address and the contact email, if different. */
async function emailsOf(user: User) {
  const { email } = await getProfile(user.id);
  return [...new Set([user.email, email].filter(Boolean))];
}

/**
 * Everything held against one account, for the copy the privacy policy
 * promises. Credentials are left out on purpose: the password and session
 * hashes are only useful to someone trying to break in.
 */
async function exportOwner(id: string) {
  const user = await getUser(id);
  if (!user) return null;
  const emails = await emailsOf(user);
  const [profile, avatar, sessions, favorites, waitlists, cart, orders, standingOrders, stories, messages, list] =
    await Promise.all([
      getProfile(id),
      readAvatar(id),
      db().from("sessions").select("persistent, created, expires").eq("user_id", id),
      db().from("favorites").select("slug").eq("owner", id),
      db().from("waitlist").select("slug, email, joined").eq("owner", id),
      getCart(id),
      placedOrders(id),
      getOrders(id),
      db().from("stories").select().eq("owner", id),
      db().from("messages").select().in("email", emails),
      db().from("subscribers").select().in("email", emails),
    ]);

  return {
    account: { email: user.email, created: user.created },
    profile: {
      name: profile.name,
      organisation: profile.organisation,
      email: profile.email,
      address: profile.address,
      avatar: avatar ? `data:${avatar.type};base64,${avatar.bytes.toString("base64")}` : null,
    },
    sessions: (must(sessions) as { persistent: boolean; created: string; expires: string }[]).map((s) => ({
      persistent: s.persistent,
      created: iso(s.created)!,
      expires: iso(s.expires)!,
    })),
    favorites: (must(favorites) as { slug: string }[]).map((f) => f.slug),
    waitlists: (must(waitlists) as { slug: string; email: string; joined: string }[]).map((w) => ({
      ...w,
      joined: iso(w.joined)!,
    })),
    cart,
    orders: [...orders].reverse(),
    standingOrders,
    stories: (must(stories) as StoryRow[]).map(toStory).map(({ owner: _owner, ...story }) => story),
    messages: (must(messages) as ContactMessage[]).map((m) => ({ ...m, received: iso(m.received)! })),
    mailingList: (must(list) as { email: string; joined: string }[]).map((s) => ({ ...s, joined: iso(s.joined)! })),
  };
}

/**
 * Closes an account in one transaction (`close_account` in the migration):
 * deletes what the privacy policy says goes, keeps what it says stays, and
 * returns the kept categories. The photo is removed from Storage afterwards.
 */
async function closeAccount(id: string): Promise<Kept[] | null> {
  const { avatar } = await getProfile(id);
  const kept = must(await db().rpc("close_account", { p_user: id })) as Kept[] | null;
  if (kept && avatar) await db().storage.from(BUCKET).remove([avatarPath(id, avatar.type)]);
  return kept;
}

async function subscribe(email: string) {
  const rows = must(
    await db().from("subscribers").upsert({ email }, { onConflict: "email", ignoreDuplicates: true }).select("email"),
  );
  return (rows ?? []).length > 0;
}

/* ── Attempts ──────────────────────────────────────────────── */

/** Records an attempt at `key`, or refuses it once `limit` fall inside the window. Shared by every instance. */
async function allowAttempt(key: string, limit: number, windowMs: number) {
  return must(await db().rpc("allow_attempt", { p_key: key, p_limit: limit, p_window_ms: windowMs })) as boolean;
}

async function clearAttempts(key: string) {
  must(await db().from("attempts").delete().eq("key", key));
}

/* ── Contact ───────────────────────────────────────────────── */

async function addMessage(message: ContactMessage) {
  must(await db().from("messages").insert(message));
  return message.ref;
}

/** Type-checked against the file store, so the two cannot drift apart. */
const store = {
  findUserByEmail,
  getUser,
  createUser,
  getSession,
  putSession,
  deleteSession,
  mergeOwner,
  favoriteSnapshot,
  setFavorite,
  waitlistSnapshot,
  setWaitlist,
  getProfile,
  saveProfile,
  saveAddress,
  saveAvatar,
  readAvatar,
  removeAvatar,
  getCart,
  changeCart,
  placeOrder,
  getOrders,
  changeOrder,
  addStory,
  storiesWith,
  setStoryStatus,
  hasOrdered,
  placedOrders,
  setPasswordHash,
  endOtherSessions,
  exportOwner,
  closeAccount,
  subscribe,
  allowAttempt,
  clearAttempts,
  addMessage,
} satisfies { [K in keyof typeof FileStore]: unknown };

export default store;
