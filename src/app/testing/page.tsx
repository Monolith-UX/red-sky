import type { Metadata } from "next";
import Link from "next/link";
import { LotTrace } from "@/components/catalog/lot-trace";
import { PageMasthead } from "@/components/page-masthead";
import { SectionHeader } from "@/components/section-header";
import { money, released, shortDate } from "@/lib/catalog";
import { METHOD, coaFor } from "@/lib/coa";
import { verification } from "@/lib/content";

export const metadata: Metadata = {
  title: "Testing — Red Sky",
  description:
    "The four checks every Red Sky lot clears before release: synthesis, RP-HPLC purity, ESI-MS identity and release under record.",
};

/** What each check does, what it tells you, and — as plainly — what it cannot. */
const CHECKS = [
  {
    step: "01",
    title: "Synthesis",
    does: "Solid-phase synthesis with Fmoc chemistry builds the chain in a known order. Preparative RP-HPLC then strips out the deletion sequences and truncations that every synthesis leaves behind.",
    tells: "The failure modes are known ones — missing residues and short chains — and both change the mass, which the third check measures.",
    cannot: "A synthesis record proves nothing about the vial on its own. That is what the next three checks are for.",
  },
  {
    step: "02",
    title: "Assay",
    does: `Analytical ${METHOD}. The principal peak is integrated against everything else that elutes, and area purity is recorded to two decimals beside the trace it came from.`,
    tells: "How much of the UV-absorbing material is the sequence you ordered, and how much is deletion sequences, truncations and oxidation products.",
    cannot: "Water, counterions and salts do not absorb at 214 nm, so area purity is not net peptide content. That figure comes from amino acid analysis, on request.",
  },
  {
    step: "03",
    title: "Identity",
    does: "Electrospray mass spectrometry in positive mode. Observed mass is compared with theoretical before release, and tandem MS runs on the first production of any new sequence and on any lot whose trace looks unusual.",
    tells: "That the molecule has the mass of the sequence on the label, normally to within a hundredth or two of a Dalton.",
    cannot: "Mass is a sum, not an order. Two residues swapped, or leucine for isoleucine, give exactly the same mass.",
  },
  {
    step: "04",
    title: "Release",
    does: "Lyophilized under nitrogen, water content measured by Karl Fischer, stoppered and crimp-sealed, lot-stamped, logged, and returned to −20 °C storage until it ships.",
    tells: "That the vial in your hand is tied to one lot, one certificate and one freezer record, years later if needed.",
    cannot: "The cake's appearance records how the drying went, not how pure the material is. Read the certificate, not the glass.",
  },
];

export default function TestingPage() {
  const specimen = [...released].sort((a, b) => b.released.localeCompare(a.released))[0];
  const coa = coaFor(specimen);

  return (
    <>
      <PageMasthead
        eyebrow="Testing — release criteria"
        heading="Four checks between synthesis and your bench."
        lead="A lot ships only once it has cleared all four, and the number each one produced is printed on its certificate beside the chromatogram it came from."
        stats={[
          { label: "Purity floor", value: "99.00%" },
          { label: "Purity method", value: "RP-HPLC · 214 nm" },
          { label: "Identity method", value: "ESI-MS" },
        ]}
      />

      {/* ── The four checks ────────────────────────────────────────── */}
      <section aria-labelledby="checks-heading" className="py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow="The checks — in the order they run"
            heading="What each one proves, and what it does not."
            headingId="checks-heading"
            note="Every test answers a narrow question. The honest part is saying which."
          />

          <ol role="list" className="mt-14 border-t border-ink">
            {CHECKS.map((c) => (
              <li key={c.step} className="grid12 gap-y-5 border-b border-hairline py-10">
                <div className="col-span-12 md:col-span-3">
                  <p className="t-data text-[0.75rem] text-graphite">{c.step}</p>
                  <h3 className="t-h2 mt-2 text-[clamp(1.75rem,2.6vw,2.25rem)]">{c.title}</h3>
                </div>
                <p className="col-span-12 max-w-[46ch] text-[1.0625rem] leading-relaxed md:col-span-4">
                  {c.does}
                </p>
                <dl className="col-span-12 grid gap-5 text-[0.9375rem] leading-relaxed md:col-span-4 md:col-start-9">
                  <div>
                    <dt className="t-label text-graphite">Tells you</dt>
                    <dd className="mt-1.5">{c.tells}</dd>
                  </div>
                  <div className="border-t border-hairline pt-4">
                    <dt className="t-label text-graphite">Cannot tell you</dt>
                    <dd className="mt-1.5 text-graphite">{c.cannot}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── A lot, end to end ──────────────────────────────────────── */}
      <section aria-labelledby="specimen-heading" className="border-y border-hairline bg-paper py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow={`One lot, end to end — ${specimen.name} / ${specimen.lot}`}
            heading="The newest release, read as it was released."
            headingId="specimen-heading"
          />
          <div className="grid12 mt-14 gap-y-10">
            <div className="col-span-12 lg:col-span-7">
              <LotTrace retention={specimen.retention} purity={specimen.purity} lot={specimen.lot} />
            </div>
            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <dl className="border-t border-ink text-[0.875rem]">
                {[
                  ["Released", shortDate(specimen.released)],
                  ["Area purity", coa.purity],
                  ["Largest impurity", coa.largestImpurity],
                  ["Observed mass", coa.observed],
                  ["Theoretical mass", coa.theoretical],
                  ["Water content", coa.water],
                  ["Analyst", coa.analyst],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-hairline py-3">
                    <dt className="text-graphite">{k}</dt>
                    <dd className="t-data font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href={`/catalog/${specimen.slug}#certificate`} className="btn btn-ghost mt-6 w-full">
                All fourteen fields · {money(specimen.price)} a vial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── The floor ──────────────────────────────────────────────── */}
      <section aria-labelledby="floor-heading" className="py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow="The floor — 99.00% or destroyed"
            heading="What happens to a lot that misses."
            headingId="floor-heading"
          />
          <div className="grid12 mt-14 gap-y-10">
            <blockquote className="col-span-12 border-t border-ink pt-8 lg:col-span-6">
              <p className="t-quote max-w-[26ch]">
                A purity floor only does its job if there is no version of the product that sits below it.
              </p>
            </blockquote>
            <div className="col-span-12 space-y-5 text-[1.0625rem] leading-relaxed lg:col-span-5 lg:col-start-8">
              <p>
                In August, eleven lots cleared release and one did not. A Hexarelin batch assayed at
                97.9% and was destroyed on 18 August: the trace showed a resolved impurity at 10.1
                minutes carrying 1.6% of area, and the mass came back sixteen Daltons high — consistent
                with oxidation at the tryptophan.
              </p>
              <p className="text-graphite">
                The synthesis was repeated with fresh scavenger. The replacement lot cleared at 99.08%,
                and both the miss and the replacement are in the release notes.
              </p>
              <Link
                href="/blog/august-releases"
                className="inline-flex items-center gap-2 text-[0.9375rem] font-medium no-underline transition-colors duration-150 hover:text-sun"
              >
                Read the August release notes
                <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                  <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Check it yourself ──────────────────────────────────────── */}
      <section aria-labelledby="yourself-heading" className="border-t border-hairline pb-24 pt-20 md:pb-32">
        <div className="shell">
          <SectionHeader
            eyebrow="Check it yourself"
            heading="Every number here is one you can argue with."
            headingId="yourself-heading"
          />
          <ul role="list" className="mt-12 grid gap-px border-t border-ink sm:grid-cols-3">
            {verification.map((v) => (
              <li key={v.title} className="pt-7 sm:pr-8">
                <h3 className="text-[1.0625rem] font-medium">{v.title}</h3>
                <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-relaxed text-graphite">{v.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
            <Link href="/certificates" className="btn btn-primary">
              Look up a certificate
            </Link>
            <Link href="/contact?topic=lot" className="btn btn-ghost">
              Ask for a lot&apos;s raw data
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
