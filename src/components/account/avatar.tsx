import { useId } from "react";
import { traceFor } from "@/lib/trace";

/**
 * A photograph if one was uploaded; otherwise the house mark. The default is
 * the instrument window at avatar scale — a paper-white reading drawn through
 * the red disc and seeded by the account, the way a lot seeds its own trace.
 */
export function Avatar({
  src,
  seed,
  size,
  alt = "",
}: {
  src: string | null;
  seed: number;
  size: number;
  alt?: string;
}) {
  const id = useId();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a private, per-account image the optimizer cannot cache
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="block shrink-0 rounded-full bg-bench-deep object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  const d = traceFor(3 + (seed % 13) + (seed % 10) / 10, 99 + (seed % 9) / 10, {
    x: -8,
    w: 116,
    top: 26,
    base: 70,
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className="block shrink-0"
    >
      <defs>
        <linearGradient id={`${id}-field`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#bd0c30" />
          <stop offset="0.46" stopColor="#9e0225" />
          <stop offset="1" stopColor="#6f0a1c" />
        </linearGradient>
        <clipPath id={`${id}-disc`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-field)`} />
      <path
        d={d}
        clipPath={`url(#${id}-disc)`}
        fill="none"
        stroke="#fff"
        strokeWidth={size < 40 ? 5 : 2.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}
