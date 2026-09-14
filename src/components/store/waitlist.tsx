"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { type CatalogItem, shortDate } from "@/lib/catalog";
import { isEmail } from "@/lib/forms";
import { setWaitlist, useSession } from "@/lib/session-client";

/** What the waitlist is waiting for, in one line. */
export function waitingFor(item: CatalogItem) {
  if (item.stock === "upcoming") return `First lot expected ${shortDate(item.expected)}`;
  return item.expected ? `Next lot expected ${shortDate(item.expected)}` : "Next lot in synthesis";
}

const others = (n: number) => (n === 1 ? "1 other" : `${n} others`);

/**
 * Stands in for the order button when there is nothing to sell. With an
 * address already on the account, joining is one click; without one, the
 * control opens into a single email field in place.
 */
export function WaitlistControl({
  item,
  variant = "card",
}: {
  item: CatalogItem;
  variant?: "card" | "detail";
}) {
  const session = useSession();
  const joined = session.waitlist.mine.includes(item.slug);
  const count = session.waitlist.counts[item.slug] ?? 0;
  const known = session.profile.email;

  const [asking, setAsking] = useState(variant === "detail");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  // The account's address usually arrives a moment after the page does.
  useEffect(() => {
    if (known) setEmail((current) => current || known);
  }, [known]);

  async function join(address?: string) {
    const value = (address ?? "").trim();
    if (address !== undefined && !isEmail(value)) {
      setError("That address is missing an @ or a domain. Check it and try again.");
      input.current?.focus();
      return;
    }
    setPending(true);
    setError("");
    const res = await setWaitlist(item.slug, true, address === undefined ? undefined : value);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      input.current?.focus();
    }
  }

  async function leave() {
    setPending(true);
    const res = await setWaitlist(item.slug, false);
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  const detail = variant === "detail";

  /* ── On the list ─────────────────────────────────────────── */
  if (joined) {
    return (
      <div
        className={detail ? "mt-6 border border-ink bg-paper px-5 py-4" : "relative z-10 mt-3"}
        aria-live="polite"
      >
        <p className={`flex items-center gap-2.5 ${detail ? "text-[0.9375rem] font-medium" : "min-h-[2.75rem] border border-ink px-3 text-[0.8125rem] font-medium"}`}>
          <span className="dot" aria-hidden="true" />
          On the waitlist
          {count > 1 && (
            <span className="t-data ml-auto text-[0.75rem] font-normal text-graphite">
              with {others(count - 1)}
            </span>
          )}
        </p>
        {detail && (
          <p className="mt-2 max-w-[48ch] text-[0.8125rem] leading-relaxed text-graphite">
            One email to {known || "your address"}, the day the certificate goes up. Waitlists
            are listed on <Link href="/account#waitlist" className="decoration-sun underline-offset-4">your account</Link>.
          </p>
        )}
        <button
          type="button"
          onClick={leave}
          disabled={pending}
          className={`inline-flex h-9 items-center text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink disabled:opacity-50 ${detail ? "mt-2" : "mt-1"}`}
        >
          Leave the waitlist<span className="visually-hidden"> for {item.name}</span>
        </button>
        {error && <p className="text-[0.8125rem] text-sun">{error}</p>}
      </div>
    );
  }

  /* ── One click, with an address already on the account ───── */
  if (!asking && known) {
    return (
      <div className="relative z-10 mt-3">
        <button
          type="button"
          onClick={() => join()}
          disabled={pending}
          className="btn btn-ghost min-h-[2.75rem] w-full disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join the waitlist"}
          <span className="visually-hidden"> for {item.name}</span>
        </button>
        {error && <p className="mt-2 text-[0.8125rem] text-sun" role="alert">{error}</p>}
      </div>
    );
  }

  /* ── Closed, on a card ───────────────────────────────────── */
  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => {
          setAsking(true);
          requestAnimationFrame(() => input.current?.focus());
        }}
        className="btn btn-ghost relative z-10 mt-3 min-h-[2.75rem] w-full"
      >
        Join the waitlist
        <span className="visually-hidden"> for {item.name}</span>
      </button>
    );
  }

  /* ── The form ────────────────────────────────────────────── */
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        join(email);
      }}
      className={detail ? "mt-6" : "relative z-10 mt-3"}
    >
      <label htmlFor={`${id}-email`} className={detail ? "t-label block text-graphite" : "visually-hidden"}>
        Email me when {item.name} is released
      </label>
      <div className={`flex gap-2 ${detail ? "mt-2.5 flex-col sm:flex-row" : ""}`}>
        <input
          ref={input}
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          placeholder={detail ? "you@lab.org" : "Email for the waitlist"}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : detail ? `${id}-note` : undefined}
          className={`min-w-0 flex-1 border border-graphite bg-white px-3 text-[0.875rem] placeholder:text-graphite/70 ${detail ? "h-12" : "h-11"}`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`btn btn-primary shrink-0 disabled:opacity-60 ${detail ? "" : "min-h-[2.75rem] px-4"}`}
        >
          {pending ? "Joining…" : detail ? "Join the waitlist" : "Join"}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-[0.8125rem] leading-snug text-sun">
          {error}
        </p>
      ) : (
        detail && (
          <p id={`${id}-note`} className="mt-2.5 max-w-[48ch] text-[0.8125rem] leading-relaxed text-graphite">
            One email, the day the certificate goes up — nothing else.
            {count > 0 && (
              <>
                {" "}
                <span className="t-data">{count}</span> already waiting.
              </>
            )}
          </p>
        )
      )}
      {!detail && (
        <button
          type="button"
          onClick={() => {
            setAsking(false);
            setError("");
          }}
          className="mt-1 inline-flex h-9 items-center text-[0.8125rem] text-graphite hover:text-ink"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
