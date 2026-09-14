import { testimonials } from "@/lib/content";
import { SectionHeader } from "./section-header";

export function TestimonialsSection() {
  const [lead, ...rest] = testimonials;

  return (
    <section
      id="attestation"
      aria-labelledby="attestation-heading"
      className="scroll-mt-24 py-24 md:py-32"
    >
      <div className="shell">
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
      </div>
    </section>
  );
}
