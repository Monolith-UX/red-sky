"use client";

import Link from "next/link";
import { Avatar } from "@/components/account/avatar";
import { cartCount, useSession } from "@/lib/session-client";

/**
 * The header's two personal controls. Until the session has loaded they read
 * neutrally, so someone who is already signed in never sees "Sign in" flash.
 */

export function AccountLink({ light }: { light: boolean }) {
  const session = useSession();
  const signedIn = !!session.user;
  const label = session.status === "loading" ? "Account" : signedIn ? "Account" : "Sign in";

  return (
    <Link
      href="/account"
      className={`hidden h-11 items-center gap-2.5 px-3 text-[0.8125rem] no-underline transition-colors duration-150 lg:flex ${
        light ? "text-[var(--color-on-sun)] hover:text-white" : "text-graphite hover:text-ink"
      }`}
    >
      {signedIn && (
        <span
          className={`rounded-full ${light ? "shadow-[0_0_0_1.5px_rgba(255,255,255,0.7)]" : ""}`}
        >
          <Avatar src={session.profile.avatar} seed={session.profile.seed} size={24} />
        </span>
      )}
      {label}
    </Link>
  );
}

export function CartLink({ onNavigate }: { onNavigate?: () => void }) {
  const session = useSession();
  const count = cartCount(session.cart);
  const ready = session.status === "ready";

  return (
    <Link
      href="/cart"
      onClick={onNavigate}
      className="flex h-11 items-center gap-2 px-3 no-underline"
      aria-label={ready ? `Cart, ${count} ${count === 1 ? "vial" : "vials"}` : "Cart"}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M1 1.5h2.2l1.9 8.6h7.1l1.6-6.1H4.4"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="square"
        />
        <circle cx="6.4" cy="13.4" r="1.2" fill="currentColor" />
        <circle cx="11.9" cy="13.4" r="1.2" fill="currentColor" />
      </svg>
      <span
        className={`t-data min-w-[1ch] text-[0.75rem] transition-opacity duration-150 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        {count}
      </span>
    </Link>
  );
}

/** The drawer's version: a full row, since there is room to say it. */
export function DrawerAccountItem({ onNavigate }: { onNavigate: () => void }) {
  const session = useSession();
  const signedIn = !!session.user;
  return (
    <Link
      href="/account"
      onClick={onNavigate}
      className="flex items-center justify-between gap-4 py-5 no-underline"
    >
      <span className="flex items-center gap-3">
        {signedIn && <Avatar src={session.profile.avatar} seed={session.profile.seed} size={28} />}
        <span className="t-h3">{signedIn || session.status === "loading" ? "Account" : "Sign in"}</span>
      </span>
      <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true">
        <path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </Link>
  );
}
