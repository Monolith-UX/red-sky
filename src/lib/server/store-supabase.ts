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
import type { LotRecord } from "@/lib/lots";
import type { ImageType, ProductImage, ProductRecord } from "@/lib/products";
import type {
  AdminLogEntry,
  AdminOrder,
  AdminStanding,
  ContactMessage,
  Kept,
  SessionRecord,
  User,
} from "./store-file";

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
    // The dashboard also shows the API address (…/rest/v1/); the client wants the project root.
    const url = process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, "");
    const key = process.env.SUPABASE_SECRET_KEY?.trim();
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
  source?: PlacedOrder["source"];
};

const toPlaced = (r: OrderRow): PlacedOrder => ({
  ref: r.ref,
  placed: iso(r.placed)!,
  lines: r.lines,
  weekday: r.weekday,
  standing: r.standing,
  totals: r.totals ?? undefined,
  address: r.address ?? undefined,
  source: r.source ?? "checkout",
});

type StandingRow = {
  id: string;
  slug: string;
  quantity: number;
  weekday: Weekday;
  status: StandingOrder["status"];
  next_dispatch: string;
  created: string;
  address?: Address | null;
};

const toStanding = (r: StandingRow): StandingOrder => ({
  id: r.id,
  slug: r.slug,
  quantity: r.quantity,
  weekday: r.weekday,
  status: r.status,
  nextDispatch: r.next_dispatch,
  created: r.created,
  address: r.address ?? null,
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
  address: o.address ?? null,
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

/** Moves every one of an owner's standing orders to this address. Returns how many moved. */
async function setStandingAddress(owner: string, address: Address) {
  const rows = must(await db().from("standing_orders").update({ address }).eq("owner", owner).select("id"));
  return (rows ?? []).length;
}

/**
 * Records a month's shipment and advances its standing orders in one
 * transaction (`record_shipment`), refusing if any order has moved on since
 * staff saw it.
 */
async function recordShipment(
  owner: string,
  order: PlacedOrder,
  advance: { id: string; from: string; nextDispatch: string }[],
) {
  return must(
    await db().rpc("record_shipment", { p_owner: owner, p_order: order, p_advance: advance }),
  ) as boolean;
}

/* ── Admin ─────────────────────────────────────────────────── */

type LotRow = {
  slug: string;
  stock: LotRecord["stock"];
  price: number;
  fill: string;
  lot: string | null;
  purity: number | null;
  released: string | null;
  expected: string | null;
  retention: number | null;
  observed_mass: number | null;
  water: number | null;
  largest_impurity: string | null;
  analyst: string | null;
  salt: string | null;
  appearance: string | null;
  certificate: string | null;
  sample: boolean;
  updated: string;
  updated_by: string;
};

// numeric columns arrive as numbers or strings depending on precision; normalise.
const n = (v: number | string | null) => (v === null ? null : Number(v));

const toLot = (r: LotRow): LotRecord => ({
  slug: r.slug,
  stock: r.stock,
  price: Number(r.price),
  fill: r.fill,
  lot: r.lot,
  purity: n(r.purity),
  released: r.released,
  expected: r.expected,
  retention: n(r.retention),
  observedMass: n(r.observed_mass),
  water: n(r.water),
  largestImpurity: r.largest_impurity,
  analyst: r.analyst,
  salt: r.salt,
  appearance: r.appearance,
  certificate: r.certificate,
  sample: r.sample,
  updated: iso(r.updated)!,
  updatedBy: r.updated_by,
});

async function getLots(): Promise<Record<string, LotRecord>> {
  const rows = must(await db().from("lots").select()) as LotRow[];
  return Object.fromEntries(rows.map((r) => [r.slug, toLot(r)]));
}

/** Saves a lot, keeping its certificate unless `certificate` is given (null removes it). */
async function saveLot(record: Omit<LotRecord, "certificate" | "updated">, certificate?: string | null) {
  const row = {
    slug: record.slug,
    stock: record.stock,
    price: record.price,
    fill: record.fill,
    lot: record.lot,
    purity: record.purity,
    released: record.released,
    expected: record.expected,
    retention: record.retention,
    observed_mass: record.observedMass,
    water: record.water,
    largest_impurity: record.largestImpurity,
    analyst: record.analyst,
    salt: record.salt,
    appearance: record.appearance,
    sample: record.sample,
    updated: new Date().toISOString(),
    updated_by: record.updatedBy,
    ...(certificate === undefined ? {} : { certificate }),
  };
  return toLot(must(await db().from("lots").upsert(row).select().single()) as LotRow);
}

async function deleteLot(slug: string) {
  must(await db().from("lots").delete().eq("slug", slug));
}

const CERTS = "certificates";
const certificatePath = (lot: string) => `${lot.replace(/[^A-Z0-9-]/gi, "")}.pdf`;

/** Stores a certificate PDF under its lot number and returns the path to record on the lot. */
async function saveCertificate(lot: string, bytes: Uint8Array) {
  const path = certificatePath(lot);
  must(await db().storage.from(CERTS).upload(path, bytes, { contentType: "application/pdf", upsert: true }));
  return path;
}

async function readCertificate(lot: string) {
  const row = must(await db().from("lots").select("certificate").eq("lot", lot).not("certificate", "is", null).limit(1));
  if (!row?.length) return null;
  const { data, error } = await db().storage.from(CERTS).download(certificatePath(lot));
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** Emails for a set of owners: live accounts first, then closed ones held in `retained`. */
async function emailsFor(owners: string[]) {
  const unique = [...new Set(owners)];
  if (!unique.length) return { email: new Map<string, string>(), closed: new Set<string>() };
  const [users, kept] = await Promise.all([
    db().from("users").select("id, email").in("id", unique),
    db().from("retained").select("owner, email").in("owner", unique),
  ]);
  const email = new Map<string, string>();
  const closed = new Set<string>();
  for (const r of must(kept) as { owner: string; email: string }[]) {
    email.set(r.owner, r.email);
    closed.add(r.owner);
  }
  for (const r of must(users) as { id: string; email: string }[]) {
    email.set(r.id, r.email);
    closed.delete(r.id);
  }
  return { email, closed };
}

/* ── Products ──────────────────────────────────────────────── */

type ProductRow = Omit<ProductRecord, "updatedBy" | "price" | "retention" | "purity"> & {
  updated_by: string;
  price: number | string;
  retention: number | string;
  purity: number | string | null;
};

const toProduct = (r: ProductRow): ProductRecord => ({
  ...r,
  price: Number(r.price),
  retention: Number(r.retention),
  purity: r.purity === null ? null : Number(r.purity),
  images: r.images ?? [],
  updated: iso(r.updated)!,
  updatedBy: r.updated_by,
});

const fromProduct = ({ updatedBy, ...p }: Omit<ProductRecord, "updated">) => ({
  ...p,
  updated_by: updatedBy,
  updated: new Date().toISOString(),
});

async function getProducts(): Promise<Record<string, ProductRecord>> {
  const res = await db().from("products").select();
  // Before the products migration is run the table does not exist: that reads as "none saved".
  if (res.error?.code === "PGRST205") return {};
  const rows = must(res) as ProductRow[];
  return Object.fromEntries(rows.map((r) => [r.slug, toProduct(r)]));
}

async function saveProduct(product: Omit<ProductRecord, "updated">) {
  return toProduct(must(await db().from("products").upsert(fromProduct(product)).select().single()) as ProductRow);
}

/** Adds products that are not there yet; never overwrites. Returns how many were added. */
async function importProducts(rows: Omit<ProductRecord, "updated">[]) {
  const added = must(
    await db().from("products").upsert(rows.map(fromProduct), { onConflict: "slug", ignoreDuplicates: true }).select("slug"),
  );
  return (added ?? []).length;
}

/** Whether anything that must stay readable refers to this product: an order, a standing order or a story. */
async function productInUse(slug: string) {
  const [placed, standing, stories] = await Promise.all([
    // lines is jsonb: contains() would send an array literal, which Postgres rejects for json.
    db().from("placed_orders").select("ref").filter("lines", "cs", JSON.stringify([{ slug }])).limit(1),
    db().from("standing_orders").select("id").eq("slug", slug).limit(1),
    db().from("stories").select("id").contains("slugs", [slug]).limit(1),
  ]);
  return [placed, standing, stories].some((r) => ((must(r as { data: unknown[] | null; error: { message: string } | null }) ?? []).length > 0));
}

const PRODUCT_BUCKET = "product-images";
const IMAGE_EXT: Record<ImageType, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const productImagePath = (slug: string, img: Pick<ProductImage, "id" | "type">) =>
  `${slug.replace(/[^a-z0-9-]/g, "")}/${img.id.replace(/[^a-z0-9]/g, "")}.${IMAGE_EXT[img.type]}`;

/** Deletes a product that nothing refers to, with its lot, favorites, waitlist entries and images. */
async function deleteProduct(slug: string) {
  const files = must(await db().storage.from(PRODUCT_BUCKET).list(slug.replace(/[^a-z0-9-]/g, "")));
  if (files?.length) await db().storage.from(PRODUCT_BUCKET).remove(files.map((f) => `${slug}/${f.name}`));
  must(await db().from("favorites").delete().eq("slug", slug));
  must(await db().from("waitlist").delete().eq("slug", slug));
  must(await db().from("lots").delete().eq("slug", slug));
  must(await db().from("products").delete().eq("slug", slug));
}

async function saveProductImage(slug: string, img: Pick<ProductImage, "id" | "type">, bytes: Uint8Array) {
  must(await db().storage.from(PRODUCT_BUCKET).upload(productImagePath(slug, img), bytes, { contentType: img.type, upsert: true }));
}

async function readProductImage(slug: string, img: Pick<ProductImage, "id" | "type">) {
  const { data, error } = await db().storage.from(PRODUCT_BUCKET).download(productImagePath(slug, img));
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

async function removeProductImage(slug: string, img: Pick<ProductImage, "id" | "type">) {
  await db().storage.from(PRODUCT_BUCKET).remove([productImagePath(slug, img)]);
}

async function allPlacedOrders(limit = 200): Promise<AdminOrder[]> {
  const rows = must(
    await db().from("placed_orders").select().order("placed", { ascending: false }).limit(limit),
  ) as (OrderRow & { owner: string })[];
  const { email, closed } = await emailsFor(rows.map((r) => r.owner));
  return rows.map((r) => ({
    order: toPlaced(r),
    email: email.get(r.owner) ?? null,
    closed: closed.has(r.owner) || !email.has(r.owner),
  }));
}

async function allStandingOrders(): Promise<AdminStanding[]> {
  const rows = must(await db().from("standing_orders").select().order("next_dispatch")) as (StandingRow & {
    owner: string;
  })[];
  const { email } = await emailsFor(rows.map((r) => r.owner));
  return rows.map((r) => ({ ...toStanding(r), owner: r.owner, email: email.get(r.owner) ?? null }));
}

async function allMessages(limit = 200): Promise<ContactMessage[]> {
  const rows = must(await db().from("messages").select().order("received", { ascending: false }).limit(limit));
  return (rows as ContactMessage[]).map((m) => ({ ...m, received: iso(m.received)! }));
}

async function logAdmin(actor: string, action: string, detail: Record<string, unknown> = {}) {
  must(await db().from("admin_log").insert({ actor, action, detail }));
}

async function adminLog(limit = 50): Promise<AdminLogEntry[]> {
  const rows = must(await db().from("admin_log").select("at, actor, action, detail").order("at", { ascending: false }).limit(limit));
  return (rows as AdminLogEntry[]).map((r) => ({ ...r, at: iso(r.at)! }));
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
  setStandingAddress,
  recordShipment,
  getProducts,
  saveProduct,
  importProducts,
  productInUse,
  deleteProduct,
  saveProductImage,
  readProductImage,
  removeProductImage,
  getLots,
  saveLot,
  deleteLot,
  saveCertificate,
  readCertificate,
  allPlacedOrders,
  allStandingOrders,
  allMessages,
  logAdmin,
  adminLog,
} satisfies { [K in keyof typeof FileStore]: unknown };

export default store;
