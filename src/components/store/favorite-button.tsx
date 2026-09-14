"use client";

import { useId, useState } from "react";
import { setFavorite, useSession } from "@/lib/session-client";
import { Tip, useTip, type Placement } from "./icon-tip";

/**
 * A toggle, not a link: the heart fills in the mark's red, and the count of
 * people who favorited the sequence sits in a tip that opens on hover and on
 * keyboard focus.
 */
export function FavoriteButton({
  slug,
  name,
  variant = "card",
  placement = "left",
}: {
  slug: string;
  name: string;
  variant?: "card" | "detail";
  placement?: Placement;
}) {
  const session = useSession();
  const on = session.favorites.mine.includes(slug);
  const count = session.favorites.counts[slug] ?? 0;
  const tipId = useId();
  const tip = useTip();
  const [failed, setFailed] = useState(false);
  const [pop, setPop] = useState(false);

  async function toggle(touch: boolean) {
    setFailed(false);
    setPop(!on);
    if (touch) tip.flash();
    if (!(await setFavorite(slug, !on))) {
      setFailed(true);
      tip.setOpen(true);
    }
  }

  const label = failed ? (
    "That did not save. Try again."
  ) : session.status === "loading" ? (
    "Counting favorites…"
  ) : session.status === "offline" ? (
    "Favorite count unavailable"
  ) : count === 0 ? (
    "No favorites yet"
  ) : (
    <>
      <span className="t-data font-medium">{count}</span> {count === 1 ? "favorite" : "favorites"}
      {on && <span className="text-[#a7aeb9]"> · {count === 1 ? "yours" : "including yours"}</span>}
    </>
  );

  const detail = variant === "detail";

  return (
    <span className="relative inline-flex" {...tip.wrapper}>
      <button
        type="button"
        aria-pressed={on}
        aria-label={`Favorite ${name}`}
        aria-describedby={tipId}
        {...tip.trigger}
        onClick={(e) => toggle(tip.wasTouch(e.currentTarget))}
        className={`relative grid place-items-center transition-colors duration-150 ${
          detail ? "h-12 w-12" : "h-11 w-11"
        } ${on ? "text-sun" : "text-graphite hover:text-ink"}`}
      >
        <svg
          width={detail ? 22 : 18}
          height={detail ? 20 : 16}
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
          />
        </svg>
      </button>
      <Tip id={tipId} open={tip.open} placement={placement}>
        {label}
      </Tip>
    </span>
  );
}
