"use client";

import { useEffect, useId, useRef, useState } from "react";
import { setFavorite, useSession } from "@/lib/session-client";

/**
 * A toggle, not a link: the heart fills in the mark's red, and the count of
 * people who favorited the sequence sits in a tooltip that opens on hover and
 * on keyboard focus, stays open while the pointer is over it, and closes on
 * Escape (WCAG 1.4.13). A tap on a touch screen shows it briefly too.
 */
export function FavoriteButton({
  slug,
  name,
  variant = "card",
}: {
  slug: string;
  name: string;
  /** card: bare icon over the vial, tip below. detail: bordered, tip above. */
  variant?: "card" | "detail";
}) {
  const session = useSession();
  const on = session.favorites.mine.includes(slug);
  const count = session.favorites.counts[slug] ?? 0;

  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pop, setPop] = useState(false);
  const hover = useRef<number | undefined>(undefined);
  const linger = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(
    () => () => {
      window.clearTimeout(hover.current);
      window.clearTimeout(linger.current);
    },
    [],
  );

  async function toggle(touch: boolean) {
    setFailed(false);
    setPop(!on);
    if (touch) {
      setOpen(true);
      window.clearTimeout(linger.current);
      linger.current = window.setTimeout(() => setOpen(false), 2400);
    }
    const ok = await setFavorite(slug, !on);
    if (!ok) {
      setFailed(true);
      setOpen(true);
    }
  }

  const tip =
    failed ? (
      "That did not save. Try again."
    ) : session.status === "loading" ? (
      "Counting favorites…"
    ) : session.status === "offline" ? (
      "Favorite count unavailable"
    ) : count === 0 ? (
      "No favorites yet"
    ) : (
      <>
        <span className="t-data font-medium">{count}</span>{" "}
        {count === 1 ? "favorite" : "favorites"}
        {on && <span className="text-[#a7aeb9]"> · {count === 1 ? "yours" : "including yours"}</span>}
      </>
    );

  const detail = variant === "detail";

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(e) => {
        if (e.pointerType === "touch") return;
        window.clearTimeout(hover.current);
        hover.current = window.setTimeout(() => setOpen(true), 180);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "touch") return;
        window.clearTimeout(hover.current);
        setOpen(false);
      }}
    >
      <button
        type="button"
        aria-pressed={on}
        aria-label={`Favorite ${name}`}
        aria-describedby={tipId}
        onPointerUp={(e) => (e.currentTarget.dataset.touch = String(e.pointerType === "touch"))}
        onClick={(e) => toggle(e.currentTarget.dataset.touch === "true")}
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`group/fav relative grid place-items-center transition-colors duration-150 ${
          detail
            ? "h-12 w-12 border border-graphite hover:border-ink"
            : "h-11 w-11"
        } ${on ? "text-sun" : "text-graphite hover:text-ink"}`}
      >
        <svg
          width={detail ? 20 : 18}
          height={detail ? 18 : 16}
          viewBox="0 0 20 18"
          aria-hidden="true"
          onAnimationEnd={() => setPop(false)}
          className={pop ? "fav-pop" : undefined}
        >
          <path
            d="M10 16.4S1.6 11.3 1.6 5.8A4.2 4.2 0 0 1 5.8 1.6c1.8 0 3.3 1 4.2 2.5.9-1.5 2.4-2.5 4.2-2.5a4.2 4.2 0 0 1 4.2 4.2c0 5.5-8.4 10.6-8.4 10.6Z"
            fill={on ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            className="transition-[fill] duration-150"
          />
        </svg>
      </button>

      <span
        role="tooltip"
        id={tipId}
        className={`pointer-events-auto absolute right-0 z-30 whitespace-nowrap bg-ink px-3 py-2 text-[0.75rem] leading-none text-paper shadow-[0_10px_24px_-12px_rgba(20,22,26,0.55)] transition-[opacity,transform] duration-150 ease-out ${
          detail ? "bottom-full mb-2.5" : "top-full mt-1"
        } ${
          open
            ? "visible translate-y-0 opacity-100"
            : `invisible opacity-0 ${detail ? "translate-y-1" : "-translate-y-1"}`
        }`}
      >
        {/* caret, pinned over the button's centre */}
        <span
          aria-hidden="true"
          className={`absolute h-2 w-2 rotate-45 bg-ink ${
            detail ? "-bottom-1 right-[1.25rem]" : "-top-1 right-[1.125rem]"
          }`}
        />
        <span className="relative">{tip}</span>
      </span>
    </span>
  );
}
