import type { CategoryKey } from "@/lib/posts";
import { curveFor, sticksFor, traceFor } from "@/lib/trace";

/**
 * Entries have no photography, so each one gets the house mark instead: the
 * instrument window from the hero, at card scale, with the reading chosen by
 * what the entry is about and seeded by its number — so no two match.
 */
const VB = { w: 240, h: 135 };
const DISC = { cx: 120, cy: 74, r: 30 };
/** The generators draw on a 240x64 baseline; drop them into the taller frame. */
const SHIFT = 42;

function pathFor(category: CategoryKey, no: number) {
  if (category === "method") return sticksFor(no);
  if (category === "handling") return curveFor(no);
  return traceFor(4 + (no % 9) + no / 10, 99 + (no % 7) / 10);
}

const ALT: Record<CategoryKey, string> = {
  analysis: "A chromatogram trace drawn through the Red Sky disc.",
  method: "A mass-spectrum stick plot drawn through the Red Sky disc.",
  handling: "A cold-chain temperature curve drawn through the Red Sky disc.",
  "release-notes": "A release chromatogram drawn through the Red Sky disc.",
};

export function PostThumb({
  category,
  no,
  className = "",
}: {
  category: CategoryKey;
  no: number;
  className?: string;
}) {
  const d = pathFor(category, no);
  const clip = `thumb-disc-${no}`;

  return (
    <div className={`sun-field relative overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={ALT[category]}
      >
        <defs>
          <clipPath id={clip}>
            <circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} />
          </clipPath>
        </defs>

        <g transform={`translate(0 ${SHIFT})`}>
          <path
            d={d}
            fill="none"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        <circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} fill="var(--color-paper)" />

        <g clipPath={`url(#${clip})`} transform={`translate(0 ${SHIFT})`}>
          <path
            d={d}
            fill="none"
            stroke="var(--color-sun)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>

      <span className="t-data absolute left-3 top-2.5 text-[0.625rem] text-[var(--color-on-sun)]">
        № {String(no).padStart(3, "0")}
      </span>
    </div>
  );
}
