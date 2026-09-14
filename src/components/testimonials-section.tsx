import Link from "next/link";
import { testimonials, verification } from "@/lib/content";
import { SectionHeader } from "./section-header";

/**
 * Real, consented testimonials when there are any. Until then the slot argues
 * the same point without borrowed voices: here is how to check our work.
 */
export function TestimonialsSection() {
  const real = testimonials.filter((t) => t.verified);

  return (
    <section
      id="attestation"
      aria-labelledby="attestation-heading"
      className="scroll-mt-24 py-24 md:py-32"
    >
      <div className="shell">{real.length ? <Voices items={real} /> : <CheckOurWork />}</div>
    </section>
  );
}

function CheckOurWork() {
  return (
    <>
      <SectionHeader
        eyebrow="Attestation — check our work"
        heading="Do not take our word for it. Re-run the lot."
        headingId="attestation-heading"
        note="Every number on this site is one a stranger with a C18 column could argue with."
      />

      <div className="grid12 mt-14 gap-y-10">
        <p className="t-quote col-span-12 max-w-[26ch] border-t border-ink pt-8 lg:col-span-6">
          <span className="dot mb-7 block" aria-hidden="true" />
          A certificate is a claim. The trace, the method and the raw file are what let you test it.
        </p>

        <ol role="list" className="col-span-12 lg:col-span-5 lg:col-start-8">
          {verification.map((v) => (
            <li key={v.title} className="border-t border-hairline py-6">
              <h3 className="text-[1.0625rem] font-medium">{v.title}</h3>
              <p className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-graphite">{v.body}</p>
            </li>
          ))}
          <li className="border-t border-hairline pt-6">
            <Link
              href="/contact?topic=lot"
              className="inline-flex h-11 items-center gap-2.5 text-[0.875rem] font-medium no-underline transition-colors duration-150 hover:text-sun"
            >
              Ask for a lot&apos;s raw data
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </Link>
          </li>
        </ol>
      </div>
    </>
  );
}

function Voices({ items }: { items: typeof testimonials }) {
  const [lead, ...rest] = items;
  return (
    <>
      <SectionHeader
        eyebrow="Attestation — from the bench"
        heading="Checked by the people who bought it."
        headingId="attestation-heading"
        note="Notes from labs that re-ran our material on their own instruments."
      />

      <div className="grid12 mt-14 gap-y-10">
        <figure className="col-span-12 border-t border-ink pt-8 lg:col-span-7">
          <span className="dot mb-7 block" aria-hidden="true" />
          <blockquote className="t-quote max-w-[26ch]">{lead.quote}</blockquote>
          <figcaption className="mt-8 text-[0.8125rem]">
            <span className="font-medium">{lead.name}</span>
            <span className="mt-0.5 block text-graphite">{lead.detail}</span>
          </figcaption>
        </figure>

        <div className="col-span-12 flex flex-col gap-10 lg:col-span-4 lg:col-start-9">
          {rest.map((t) => (
            <figure key={t.name} className="border-t border-hairline pt-6">
              <blockquote className="text-[1.0625rem] leading-relaxed text-pretty">
                {t.quote}
              </blockquote>
              <figcaption className="mt-5 text-[0.8125rem]">
                <span className="font-medium">{t.name}</span>
                <span className="mt-0.5 block text-graphite">{t.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}
