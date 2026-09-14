import type { Metadata } from "next";
import Link from "next/link";
import { Reading } from "@/components/reading";

export const metadata: Metadata = {
  title: "Nothing filed here — Red Sky",
  robots: { index: false },
};

// The window, reading nothing: a baseline with the noise left in and no peak.
const FLAT = Array.from({ length: 63 }, (_, i) => {
  const x = i * 10;
  const y = 300 + Math.sin(i * 1.7) * 1.4 + Math.cos(i * 0.6) * 0.8;
  return `${i === 0 ? "M" : "L"}${x},${y.toFixed(1)}`;
}).join(" ");

const ROUTES = [
  { label: "The catalogue", href: "/catalog", note: "Every sequence, with its lot and trace" },
  { label: "Look up a lot", href: "/certificates", note: "By the number printed on the vial" },
  { label: "The sitemap", href: "/sitemap", note: "Every page, on one sheet" },
  { label: "Contact the team", href: "/contact", note: "Answered within a business day" },
];

export default function NotFound() {
  return (
    <article className="bg-paper">
      <div className="shell pb-20 pt-12 md:pb-28 md:pt-16">
        <div className="grid12 gap-y-12">
          <div className="col-span-12 lg:col-span-6">
            <p className="rail-label">404 — no signal at this address</p>
            <h1 className="t-display mt-7 max-w-[13ch] md:mt-9">Nothing is filed under that address.</h1>
            <p className="t-lead mt-7 max-w-[46ch]">
              The page may have moved, or the link may be old. If you were after a specific lot, its
              number will find it faster than the address will.
            </p>
          </div>

          <figure className="col-span-12 lg:col-span-5 lg:col-start-8">
            <Reading
              reading="hplc"
              drawKey={0}
              path={FLAT}
              alt="A flat chromatogram through the Red Sky disc: a baseline with no peak."
            />
            <figcaption className="t-data mt-3 border-t border-hairline pt-3 text-[0.75rem] text-graphite">
              Baseline only · no principal peak · nothing to integrate
            </figcaption>
          </figure>
        </div>

        <ul role="list" className="mt-16 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
          {ROUTES.map((r) => (
            <li key={r.href} className="border-b border-hairline">
              <Link
                href={r.href}
                className="group flex h-full flex-col gap-1 py-5 pr-6 no-underline"
              >
                <span className="flex items-center gap-2.5 text-[1.0625rem] font-medium transition-colors duration-150 group-hover:text-sun">
                  {r.label}
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                    <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </span>
                <span className="text-[0.875rem] text-graphite">{r.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
