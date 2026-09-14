import type { Metadata } from "next";
import Link from "next/link";
import { PageMasthead } from "@/components/page-masthead";
import { SectionHeader } from "@/components/section-header";
import { catalogue, released } from "@/lib/catalog";
import { byDate, longDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "About Red Sky",
  description:
    "Red Sky Biosciences releases research peptides against data a stranger can check: the trace, the mass, the salt form and the analyst's initials.",
};

const RULES = [
  {
    title: "A floor with nothing beneath it",
    body: "Every lot clears 99% area purity or it is destroyed. There is no discount tier and no second channel, because a floor only means something if no version of the product sits below it.",
    link: { href: "/blog/why-we-destroy-a-lot", label: "Why we destroy a lot" },
  },
  {
    title: "The trace ships with the vial",
    body: "A purity figure without its chromatogram cannot be checked by anyone. Every certificate carries the trace, the method, observed against theoretical mass, and the analyst's initials.",
    link: { href: "/blog/how-to-read-a-coa", label: "How to read a certificate" },
  },
  {
    title: "Plain about what a test cannot show",
    body: "Area purity is not net peptide content, and a matching mass does not prove sequence order. We say which question each measurement answers rather than imply that it answers more.",
    link: { href: "/blog/what-mass-spec-can-tell-you", label: "What mass spectrometry can tell you" },
  },
  {
    title: "Research use, and nothing else",
    body: "Everything here is sold for in-vitro laboratory research. We do not give dosing, medical or veterinary guidance, and we do not answer questions framed that way.",
    link: { href: "/terms", label: "The terms of sale" },
  },
];

/** The three people whose bylines run the journal and whose initials sign the certificates. */
const BENCH = [
  { name: "Joanna Reyes", initials: "J.R.", focus: "Analysis", about: "Purity, chromatograms, mass spectrometry and what a certificate should contain." },
  { name: "Marcus Bell", initials: "M.B.", focus: "Method and release", about: "Synthesis, lyophilization, and the monthly release notes — including the lots that did not clear." },
  { name: "Priya Anand", initials: "P.A.", focus: "Handling", about: "The cold chain, reconstitution, and what the colour of a vial does and does not mean." },
];

export default function AboutPage() {
  return (
    <>
      <PageMasthead
        eyebrow="About — Red Sky Biosciences"
        heading="A supplier that publishes its own numbers."
        lead="Red Sky sells research peptides to institutions and to individual researchers, and releases every lot against data a stranger can check. The rest of this page is how, and who."
        stats={[
          { label: "Sequences", value: String(catalogue.length) },
          { label: "Certificates published", value: String(released.length) },
          { label: "Shipments logged this year", value: "412" },
        ]}
      />

      {/* ── Rules ──────────────────────────────────────────────────── */}
      <section aria-labelledby="rules-heading" className="py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow="What we hold to — four rules"
            heading="The rules the catalogue is built on."
            headingId="rules-heading"
            note="Each one costs money. That is how you know it is a rule and not a slogan."
          />
          <ol role="list" className="mt-14 grid gap-x-10 border-t border-ink md:grid-cols-2">
            {RULES.map((r) => (
              <li key={r.title} className="border-b border-hairline py-8 md:pr-8">
                <h3 className="t-h3">{r.title}</h3>
                <p className="mt-3 max-w-[48ch] text-[0.9375rem] leading-relaxed text-graphite">{r.body}</p>
                <Link
                  href={r.link.href}
                  className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-medium no-underline transition-colors duration-150 hover:text-sun"
                >
                  {r.link.label}
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                    <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── The bench ──────────────────────────────────────────────── */}
      <section aria-labelledby="bench-heading" className="border-y border-hairline bg-paper py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow="The bench — who ran the column"
            heading="The initials on your certificate."
            headingId="bench-heading"
            note="The analyst field on every certificate carries one of these three sets of initials."
          />
          <ul role="list" className="mt-14 grid gap-px border-t border-ink sm:grid-cols-3">
            {BENCH.map((p) => {
              const entries = byDate.filter((post) => post.author === p.name);
              const latest = entries[0];
              return (
                <li key={p.name} className="flex flex-col pt-8 sm:pr-8">
                  <span
                    aria-hidden="true"
                    className="t-data grid h-14 w-14 place-items-center rounded-full bg-sun text-[0.8125rem] font-medium tracking-[0.04em] text-paper"
                  >
                    {p.initials}
                  </span>
                  <h3 className="t-h3 mt-5">{p.name}</h3>
                  <p className="t-label mt-1.5 text-graphite">{p.focus}</p>
                  <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-relaxed text-graphite">{p.about}</p>
                  {latest && (
                    <p className="mt-5 border-t border-hairline pt-4 text-[0.875rem]">
                      <span className="t-data text-[0.75rem] text-graphite">
                        {entries.length} journal {entries.length === 1 ? "entry" : "entries"} · latest{" "}
                        {longDate(latest.date)}
                      </span>
                      <Link
                        href={`/blog/${latest.slug}`}
                        className="mt-1.5 block leading-snug no-underline transition-colors duration-150 hover:text-sun"
                      >
                        {latest.title}
                      </Link>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Where ──────────────────────────────────────────────────── */}
      <section aria-labelledby="where-heading" className="py-24 md:py-32">
        <div className="shell">
          <div className="grid12 gap-y-10">
            <div className="col-span-12 lg:col-span-5">
              <p className="rail-label">Where we are</p>
              <h2 id="where-heading" className="t-h2 mt-6 max-w-[14ch]">
                Reno, Nevada, at minus twenty.
              </h2>
              <p className="t-data mt-6 text-[0.875rem] leading-relaxed">
                Red Sky Biosciences LLC
                <br />
                1140 Ferrier Street, Unit 4
                <br />
                Reno, Nevada 89502
              </p>
              <p className="t-data mt-4 text-[0.875rem] leading-relaxed text-graphite">
                lab@redskybio.com · +1 775 555 0143
              </p>
            </div>
            <ul role="list" className="col-span-12 border-t border-ink lg:col-span-6 lg:col-start-7">
              {[
                { label: "How every lot is tested", href: "/testing" },
                { label: "Handling, from the freezer to your bench", href: "/handling" },
                { label: "Look up a certificate", href: "/certificates" },
                { label: "Client stories", href: "/stories" },
                { label: "Contact the technical team", href: "/contact" },
              ].map((l) => (
                <li key={l.href} className="border-b border-hairline">
                  <Link
                    href={l.href}
                    className="group flex items-center justify-between gap-4 py-5 no-underline transition-colors duration-150 hover:text-sun"
                  >
                    <span className="t-h3">{l.label}</span>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true" className="shrink-0 text-graphite group-hover:text-sun">
                      <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
