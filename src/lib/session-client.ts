import { useSyncExternalStore } from "react";
import { normalizeCart, type CartLine, type Plan } from "./account";

/**
 * The browser's copy of /api/session: who is signed in, favorites, waitlists,
 * the cart and the header's slice of the profile. Pages are static, so every
 * personal detail arrives here after load and every control reads from here.
 *
 * Favorites and cart changes apply optimistically and roll back if the server
 * refuses; waitlists wait for the server because joining can fail validation.
 */

type Tally = { counts: Record<string, number>; mine: string[] };

export type SessionData = {
  user: { email: string } | null;
  favorites: Tally;
  waitlist: Tally;
  cart: CartLine[];
  profile: { name: string; email: string; avatar: string | null; seed: number };
};

export type Session = SessionData & { status: "loading" | "ready" | "offline" };

const EMPTY: Session = {
  status: "loading",
  user: null,
  favorites: { counts: {}, mine: [] },
  waitlist: { counts: {}, mine: [] },
  cart: [],
  profile: { name: "", email: "", avatar: null, seed: 0 },
};

let state: Session = EMPTY;
let inflight: Promise<void> | null = null;
let fetchedAt = 0;
const listeners = new Set<() => void>();

function set(next: Session) {
  state = next;
  listeners.forEach((l) => l());
}

const patch = (fn: (s: Session) => Session) => set(fn(state));

export function refreshSession() {
  fetchedAt = Date.now();
  inflight = fetch("/api/session", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data: SessionData) => set({ ...data, status: "ready" }))
    .catch(() => patch((s) => ({ ...s, status: s.status === "ready" ? "ready" : "offline" })));
  return inflight;
}

// Another tab may have changed things; catch up when this one is looked at again.
function onVisible() {
  if (document.visibilityState === "visible" && Date.now() - fetchedAt > 30_000) {
    void refreshSession();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!inflight) {
    void refreshSession();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useSession() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "That did not go through. Try again.");
  return data as T;
}

const withMine = (mine: string[], slug: string, on: boolean) =>
  on ? [...new Set([...mine, slug])] : mine.filter((m) => m !== slug);

/* ── Favorites ─────────────────────────────────────────────── */

export async function setFavorite(slug: string, on: boolean) {
  const was = state.favorites.mine.includes(slug);
  if (was === on) return true;
  const before = state.favorites.counts[slug] ?? 0;

  patch((s) => ({
    ...s,
    favorites: {
      counts: { ...s.favorites.counts, [slug]: Math.max(0, before + (on ? 1 : -1)) },
      mine: withMine(s.favorites.mine, slug, on),
    },
  }));

  try {
    const { count } = await post<{ count: number }>("/api/favorites", { slug, on });
    patch((s) => ({
      ...s,
      favorites: { ...s.favorites, counts: { ...s.favorites.counts, [slug]: count } },
    }));
    return true;
  } catch {
    patch((s) => ({
      ...s,
      favorites: {
        counts: { ...s.favorites.counts, [slug]: before },
        mine: withMine(s.favorites.mine, slug, was),
      },
    }));
    return false;
  }
}

/* ── Waitlist ──────────────────────────────────────────────── */

export async function setWaitlist(slug: string, on: boolean, email?: string) {
  try {
    const res = await post<{ count: number; email: string | null }>("/api/waitlist", {
      slug,
      on,
      email,
    });
    patch((s) => ({
      ...s,
      waitlist: {
        counts: { ...s.waitlist.counts, [slug]: res.count },
        mine: withMine(s.waitlist.mine, slug, on),
      },
      profile: { ...s.profile, email: s.profile.email || res.email || "" },
    }));
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}

/* ── Cart ──────────────────────────────────────────────────── */

export type CartOp =
  | { op: "add"; slug: string; plan: Plan; quantity: number }
  | { op: "quantity"; slug: string; plan: Plan; quantity: number }
  | { op: "plan"; slug: string; plan: Plan; to: Plan }
  | { op: "remove"; slug: string; plan: Plan };

/** The same arithmetic the server does, so the optimistic cart matches the real one. */
function apply(lines: CartLine[], op: CartOp) {
  const same = (l: CartLine) => l.slug === op.slug && l.plan === op.plan;
  switch (op.op) {
    case "add":
      return normalizeCart([...lines, { slug: op.slug, plan: op.plan, quantity: op.quantity }]);
    case "quantity":
      return normalizeCart(lines.map((l) => (same(l) ? { ...l, quantity: op.quantity } : l)));
    case "plan":
      return normalizeCart(lines.map((l) => (same(l) ? { ...l, plan: op.to } : l)));
    case "remove":
      return lines.filter((l) => !same(l));
  }
}

export async function changeCart(op: CartOp) {
  const before = state.cart;
  patch((s) => ({ ...s, cart: apply(s.cart, op) }));
  try {
    const { cart } = await post<{ cart: CartLine[] }>("/api/cart", op);
    patch((s) => ({ ...s, cart }));
    return true;
  } catch {
    patch((s) => ({ ...s, cart: before }));
    return false;
  }
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
