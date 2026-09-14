"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type CatalogItem, waitingFor } from "@/lib/catalog";
import { isEmail } from "@/lib/forms";
import { setWaitlist, useSession } from "@/lib/session-client";
import { Tip, useTip, type Placement } from "./icon-tip";

/**
 * The bell under the heart, on anything with nothing to sell yet. One click
 * joins with the address on the account, or opens a one-field form beside the
 * icon when there is none; a second click leaves. The tip counts who is waiting.
 */
export function WaitlistButton({
  item,
  variant = "card",
  placement = "left",
}: {
  item: CatalogItem;
  variant?: "card" | "detail";
  placement?: Placement;
}) {
  const session = useSession();
  const on = session.waitlist.mine.includes(item.slug);
  const count = session.waitlist.counts[item.slug] ?? 0;
  const known = session.profile.email;

  const tipId = useId();
  const formId = useId();
  const tip = useTip();
  const [asking, setAsking] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLFormElement>(null);

  // The form closes on Escape or a click anywhere else, and hands focus back.
  useEffect(() => {
    if (!asking) return;
    field.current?.focus();
    const close = () => {
      setAsking(false);
      setError("");
      button.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && e.target !== button.current) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [asking]);

  async function join(address?: string) {
    setPending(true);
    setError("");
    const res = await setWaitlist(item.slug, true, address);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setAsking(false);
    tip.flash(2000);
    return true;
  }

  async function toggle(touch: boolean) {
    if (pending) return;
    if (on) {
      setPending(true);
      await setWaitlist(item.slug, false);
      setPending(false);
      if (touch) tip.flash();
      return;
    }
    if (known) {
      await join();
      return;
    }
    tip.setOpen(false);
    setAsking((a) => !a);
  }

  const label =
    session.status === "loading" ? (
      "Join the waitlist"
    ) : on ? (
      <>
        On the waitlist · <span className="t-data font-medium">{count}</span> waiting
      </>
    ) : count > 0 ? (
      <>
        Join the waitlist · <span className="t-data font-medium">{count}</span> waiting
      </>
    ) : (
      "Join the waitlist"
    );

  const detail = variant === "detail";

  return (
    <span className="relative inline-flex" {...tip.wrapper}>
      <button
        ref={button}
        type="button"
        aria-pressed={on}
        aria-label={`Waitlist for ${item.name}`}
        aria-describedby={tipId}
        aria-expanded={known || on ? undefined : asking}
        aria-controls={asking ? formId : undefined}
        disabled={pending}
        {...tip.trigger}
        onClick={(e) => toggle(tip.wasTouch(e.currentTarget))}
        className={`relative grid place-items-center transition-colors duration-150 disabled:opacity-60 ${
          detail ? "h-12 w-12" : "h-11 w-11"
        } ${on ? "text-ink" : "text-graphite hover:text-ink"}`}
      >
        <svg width={detail ? 20 : 17} height={detail ? 22 : 18} viewBox="0 0 18 20" aria-hidden="true">
          <path
            d="M9 1.8c-3.1 0-5.3 2.4-5.3 5.4v3.6L2 13.9h14l-1.7-3.1V7.2c0-3-2.2-5.4-5.3-5.4Z"
            fill={on ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M6.9 16.4a2.2 2.2 0 0 0 4.2 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      {!asking && (
        <Tip id={tipId} open={tip.open} placement={placement}>
          {label}
        </Tip>
      )}

      {asking && (
        <form
          ref={panel}
          id={formId}
          noValidate
          aria-label={`Join the waitlist for ${item.name}`}
          onSubmit={async (e) => {
            e.preventDefault();
            const value = email.trim();
            if (!isEmail(value)) {
              setError("That address is missing an @ or a domain.");
              field.current?.focus();
              return;
            }
            await join(value);
          }}
          className="absolute right-full top-0 z-40 mr-1.5 w-[16.5rem] border border-ink bg-paper p-3.5 text-left shadow-[0_18px_40px_-20px_rgba(20,22,26,0.55)]"
        >
          <label htmlFor={`${formId}-email`} className="t-label block text-graphite">
            Email me when it is {item.stock === "upcoming" ? "released" : "back"}
          </label>
          <input
            ref={field}
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            placeholder="you@lab.org"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${formId}-note`}
            className="mt-2 h-10 w-full border border-graphite bg-white px-2.5 text-[0.875rem]"
          />
          <p id={`${formId}-note`} className={`mt-1.5 text-[0.75rem] leading-snug ${error ? "text-sun" : "text-graphite"}`} role={error ? "alert" : undefined}>
            {error || waitingFor(item)}
          </p>
          <button type="submit" disabled={pending} className="btn btn-primary mt-2.5 min-h-[2.5rem] w-full px-3 text-[0.8125rem] disabled:opacity-60">
            {pending ? "Joining…" : "Join the waitlist"}
          </button>
        </form>
      )}
    </span>
  );
}
