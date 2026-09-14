/**
 * What an account holds. Shared by the server store, the Server Actions and
 * the client components, so the rules for dates and limits live in one place.
 */

import { clean } from "./forms";

export type AvatarType = "image/png" | "image/jpeg" | "image/webp";

export type Address = {
  recipient: string;
  organisation: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  phone: string;
};

export const ADDRESS_FIELDS: { key: keyof Address; label: string; required: boolean; autoComplete: string; max: number }[] = [
  { key: "recipient", label: "Recipient in the building", required: true, autoComplete: "name", max: 80 },
  { key: "organisation", label: "Organisation or lab", required: false, autoComplete: "organization", max: 120 },
  { key: "line1", label: "Street address", required: true, autoComplete: "address-line1", max: 120 },
  { key: "line2", label: "Building, floor, room", required: false, autoComplete: "address-line2", max: 120 },
  { key: "city", label: "City", required: true, autoComplete: "address-level2", max: 80 },
  { key: "region", label: "State or region", required: true, autoComplete: "address-level1", max: 80 },
  { key: "postal", label: "Postal code", required: true, autoComplete: "postal-code", max: 16 },
  { key: "country", label: "Country", required: true, autoComplete: "country-name", max: 60 },
  { key: "phone", label: "Phone for the courier", required: false, autoComplete: "tel", max: 30 },
];

/**
 * Reads an address posted as `address.<field>`, the shape both the checkout
 * and the account page send. `missing` is the first required field left empty.
 */
export function readAddress(form: FormData) {
  const address = Object.fromEntries(
    ADDRESS_FIELDS.map((f) => [f.key, clean(form.get(`address.${f.key}`), f.max)]),
  ) as Address;
  const missing = ADDRESS_FIELDS.find((f) => f.required && !address[f.key]) ?? null;
  return { address, missing };
}

export type Profile = {
  name: string;
  organisation: string;
  email: string;
  avatar: { type: AvatarType; version: number } | null;
  address: Address | null;
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  organisation: "",
  email: "",
  avatar: null,
  address: null,
};

/** Monday to Wednesday only, so no box sits in a depot over a weekend. */
export type Weekday = 1 | 2 | 3;

export const DISPATCH_DAYS: { value: Weekday; label: string }[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
];

export const dayLabel = (w: Weekday) =>
  DISPATCH_DAYS.find((d) => d.value === w)?.label ?? "Monday";

export type StandingOrder = {
  id: string;
  slug: string;
  quantity: number;
  weekday: Weekday;
  status: "active" | "paused";
  /** YYYY-MM-DD. Meaningful only while the order is active. */
  nextDispatch: string;
  created: string;
};

export const MAX_QUANTITY = 20;

export const isWeekday = (v: unknown): v is Weekday => v === 1 || v === 2 || v === 3;

/* ── Cart ──────────────────────────────────────────────────── */

/** A line is bought once, or becomes a standing order at checkout. */
export type Plan = "once" | "monthly";

export const isPlan = (v: unknown): v is Plan => v === "once" || v === "monthly";

export type CartLine = { slug: string; plan: Plan; quantity: number };

/**
 * The same sequence can sit in the cart twice, once on each plan; any other
 * duplicate is merged. Quantities are clamped rather than rejected.
 */
export function normalizeCart(lines: CartLine[]): CartLine[] {
  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    const key = `${line.slug}:${line.plan}`;
    const quantity = (merged.get(key)?.quantity ?? 0) + Math.floor(line.quantity);
    merged.set(key, { ...line, quantity });
  }
  return [...merged.values()]
    .filter((l) => l.quantity > 0)
    .map((l) => ({ ...l, quantity: Math.min(MAX_QUANTITY, l.quantity) }));
}

export type PlacedOrder = {
  ref: string;
  placed: string;
  lines: CartLine[];
  /** Dispatch day chosen for the monthly lines, if there were any. */
  weekday: Weekday | null;
  standing: string[];
  /** Prices as they were when the order was placed, not as they are now. */
  totals?: { once: number; monthly: number; saving: number; today: number };
  address?: Address;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

function firstWeekdayOf(year: number, month: number, weekday: Weekday) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset));
}

/**
 * Standing orders dispatch on the first chosen weekday of each month. The next
 * dispatch is the first one strictly after `from`, so an order set up on the
 * day itself goes out next month rather than in a rush the same afternoon.
 */
export function nextDispatch(weekday: Weekday, from: Date | string): string {
  const day = typeof from === "string" ? new Date(from + "T00:00:00Z") : from;
  const today = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  let candidate = firstWeekdayOf(day.getUTCFullYear(), day.getUTCMonth(), weekday);
  if (candidate.getTime() <= today) {
    candidate = firstWeekdayOf(day.getUTCFullYear(), day.getUTCMonth() + 1, weekday);
  }
  return iso(candidate);
}

export const todayIso = () => iso(new Date());

/** "Tue, Oct 6, 2026" — a dispatch is a day of the week before it is a date. */
export const dispatchDate = (isoDate: string) =>
  new Date(isoDate + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * Dispatches are not run by this build, so a stored date can fall behind the
 * calendar. Anything already past rolls forward to the next real dispatch.
 */
export const upcomingDispatch = (order: Pick<StandingOrder, "weekday" | "nextDispatch">, today: string) =>
  order.nextDispatch > today ? order.nextDispatch : nextDispatch(order.weekday, today);
