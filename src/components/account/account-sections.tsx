"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { changePassword, saveProfile, signOut } from "@/app/account/actions";
import { ProductCard } from "@/components/catalog/product-card";
import { Check, Field, FormMessage, PasswordField } from "@/components/forms/fields";
import type { Profile } from "@/lib/account";
import { STOCK_LABEL, catalogue, waitingFor } from "@/lib/catalog";
import { refreshSession, setWaitlist, useSession } from "@/lib/session-client";

/**
 * Keeps the header's copy of the session honest after a server-side change —
 * signing in or out redirects here, and the header would not otherwise know.
 */
export function SessionSync({ signedIn }: { signedIn: boolean }) {
  useEffect(() => {
    void refreshSession();
  }, [signedIn]);
  return null;
}

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="inline-flex h-11 items-center gap-2.5 text-[0.8125rem] text-graphite transition-colors duration-150 hover:text-ink disabled:opacity-60"
    >
      <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true">
        <path d="M5 1H1v10h4M9 3l3 3-3 3M12 6H4.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function ProfileForm({ profile, signInEmail }: { profile: Profile; signInEmail: string }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  const saved = useRef(state);

  useEffect(() => {
    if (state !== saved.current && state.ok) void refreshSession();
    saved.current = state;
  }, [state]);

  const v = state.fields ?? profile;

  return (
    <form action={action} noValidate className="grid gap-5 md:grid-cols-2">
      <Field label="Name" name="name" autoComplete="name" defaultValue={v.name} optional />
      <Field
        label="Organisation"
        name="organisation"
        autoComplete="organization"
        defaultValue={v.organisation}
        optional
      />
      <Field
        label="Contact email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={v.email || signInEmail}
        className="md:col-span-2"
        note={`Where waitlist and order notices go. You sign in as ${signInEmail}.`}
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? "Saving…" : "Save details"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} noValidate className="grid gap-5 md:grid-cols-2">
      <PasswordField label="Current password" name="current" autoComplete="current-password" />
      <PasswordField
        label="New password"
        name="replacement"
        autoComplete="new-password"
        note="At least 10 characters."
      />
      <div className="md:col-span-2">
        <Check name="everywhere" defaultChecked>
          Sign out every other device that is signed in to this account
        </Check>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-ghost disabled:opacity-60">
          {pending ? "Changing…" : "Change password"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}

/**
 * Favorited sequences as catalogue cards. Un-favoriting keeps the card in
 * place, heart emptied, until the page is left — a slip is one click to undo
 * rather than a card that vanishes from under the pointer.
 */
export function SavedGrid({ initial }: { initial: string[] }) {
  const session = useSession();
  const mine = session.status === "ready" ? session.favorites.mine : initial;
  const [kept, setKept] = useState(() => new Set(initial));

  useEffect(() => {
    setKept((prev) => (mine.every((s) => prev.has(s)) ? prev : new Set([...prev, ...mine])));
  }, [mine]);

  const items = catalogue.filter((c) => kept.has(c.slug) || mine.includes(c.slug));

  if (!items.length) {
    return (
      <div className="border-y border-hairline py-12">
        <p className="t-h3">Nothing favorited yet.</p>
        <p className="t-body mt-3 text-[0.9375rem]">
          The heart on any catalogue card saves the sequence here, and hovering it shows how many
          other people have saved it too.
        </p>
        <Link href="/catalog" className="btn btn-ghost mt-6">
          Browse the catalogue
        </Link>
      </div>
    );
  }

  return (
    <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug}>
          <ProductCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export function WaitlistList({ initial }: { initial: string[] }) {
  const session = useSession();
  const mine = session.status === "ready" ? session.waitlist.mine : initial;
  const [pending, setPending] = useState<string | null>(null);
  const items = catalogue.filter((c) => mine.includes(c.slug));

  if (!items.length) {
    return (
      <p className="border-y border-hairline py-8 text-[0.9375rem] leading-relaxed text-graphite">
        Not waiting on anything. Sequences that are out of stock or not yet released take a
        waitlist instead of a cart, and they are listed here once you join one.
      </p>
    );
  }

  return (
    <ul role="list" className="border-t border-ink">
      {items.map((item) => (
        <li
          key={item.slug}
          className="grid grid-cols-1 items-center gap-x-6 gap-y-2 border-b border-hairline py-5 md:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <span>
            <Link href={`/catalog/${item.slug}`} className="t-h3 no-underline hover:text-sun">
              {item.name}
            </Link>
            <span className="t-data mt-1 block text-[0.75rem] text-graphite">
              {STOCK_LABEL[item.stock]} · {waitingFor(item)}
            </span>
          </span>
          <span className="t-data text-[0.8125rem] text-graphite md:text-right">
            {session.waitlist.counts[item.slug] ?? 1} waiting
          </span>
          <button
            type="button"
            disabled={pending === item.slug}
            onClick={async () => {
              setPending(item.slug);
              await setWaitlist(item.slug, false);
              setPending(null);
            }}
            className="justify-self-start text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink disabled:opacity-50 md:justify-self-end"
          >
            Leave<span className="visually-hidden"> the waitlist for {item.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
