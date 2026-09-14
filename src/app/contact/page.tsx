import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { PageMasthead } from "@/components/page-masthead";
import { SectionHeader } from "@/components/section-header";
import { CHANNELS, EMAIL_LIVE } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact — Red Sky",
  description:
    "Write to the technical team about a lot, a certificate, handling or a custom synthesis. Replies within one business day.",
};

const BEFORE = [
  { label: "How to read a certificate of analysis", href: "/blog/how-to-read-a-coa" },
  { label: "Reconstitution without wrecking the peptide", href: "/blog/reconstitution" },
  { label: "The cold chain is mostly the last mile", href: "/blog/cold-chain-last-mile" },
  { label: "What a 99% purity claim actually means", href: "/blog/what-99-percent-purity-means" },
  { label: "Returns and replacements", href: "/terms#returns-and-replacements" },
  { label: "Standing orders and waitlists", href: "/account" },
];

export default function ContactPage() {
  return (
    <>
      <PageMasthead
        eyebrow="Contact — the people who ran the column"
        heading="Ask the bench, not a call centre."
        lead="The technical team answers within a business day. Send the lot number if it is about a vial, and the answer will come from that lot's own record."
        stats={[
          { label: "Replies", value: "1 business day" },
          { label: "Same-day dispatch", value: "Before 14:00 ET" },
          { label: "Telephone", value: "+1 775 555 0143" },
        ]}
      />

      <div className="shell py-20 md:py-28">
        <div className="grid12 gap-y-16">
          {/* ── Directory ──────────────────────────────────────────── */}
          <section aria-labelledby="channels-heading" className="col-span-12 lg:col-span-5">
            <p className="rail-label">Channels — write to the right desk</p>
            <h2 id="channels-heading" className="t-h2 mt-6 max-w-[14ch] text-[clamp(1.75rem,2.6vw,2.25rem)]">
              {EMAIL_LIVE ? "Three addresses" : "Three desks"}, each read by the people who answer it.
            </h2>

            <ul role="list" className="mt-10 border-t border-ink">
              {CHANNELS.map((c) => (
                <li key={c.key} className="border-b border-hairline py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="t-h3">{c.title}</h3>
                    <span className="t-label text-graphite">{c.reply}</span>
                  </div>
                  {EMAIL_LIVE ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="t-data mt-2 inline-block text-[0.9375rem] decoration-sun underline-offset-4"
                    >
                      {c.email}
                    </a>
                  ) : (
                    // A full load, so the form reads the topic from the address on mount.
                    <a
                      href={`/contact?topic=${c.key === "lab" ? "lot" : c.key}#message`}
                      className="mt-2 inline-block text-[0.9375rem] decoration-sun underline-offset-4"
                    >
                      Write through the form
                    </a>
                  )}
                  <p className="mt-2 max-w-[44ch] text-[0.875rem] leading-relaxed text-graphite">
                    {c.covers}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-8 grid gap-6 text-[0.875rem] sm:grid-cols-2">
              <div>
                <dt className="t-label text-graphite">Post</dt>
                <dd className="t-data mt-2 text-[0.8125rem] leading-relaxed">
                  Red Sky Biosciences LLC
                  <br />
                  1140 Ferrier Street, Unit 4
                  <br />
                  Reno, Nevada 89502
                </dd>
              </div>
              <div>
                <dt className="t-label text-graphite">Telephone</dt>
                <dd className="mt-2">
                  <a href="tel:+17755550143" className="t-data text-[0.8125rem] no-underline hover:text-sun">
                    +1 775 555 0143
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-10 border-t border-ink pt-6">
              <p className="font-medium">What we will not answer</p>
              <p className="mt-2 max-w-[48ch] text-[0.875rem] leading-relaxed text-graphite">
                Dosing, medical or veterinary questions, however they are framed. Everything we sell
                is for in-vitro laboratory research, and the{" "}
                <Link href="/terms" className="text-ink decoration-sun underline-offset-4">
                  terms of sale
                </Link>{" "}
                say so first.
              </p>
            </div>
          </section>

          {/* ── Form ───────────────────────────────────────────────── */}
          <section
            id="message"
            aria-labelledby="form-heading"
            className="col-span-12 scroll-mt-24 self-start border border-hairline bg-paper p-6 sm:p-8 lg:col-span-6 lg:col-start-7"
          >
            <h2 id="form-heading" className="t-h2 text-[clamp(1.75rem,2.6vw,2.25rem)]">
              Send a message
            </h2>
            <p className="mt-3 max-w-[48ch] text-[0.9375rem] leading-relaxed text-graphite">
              Choose what it is about and it goes straight to the desk that answers it.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </section>
        </div>

        {/* ── Before you write ─────────────────────────────────────── */}
        <section aria-labelledby="before-heading" className="mt-24 md:mt-32">
          <SectionHeader
            eyebrow="Before you write — answered already"
            heading="The questions that come in most."
            headingId="before-heading"
            note="Each one is a working note from the bench, not a help-centre article."
          />
          <ul role="list" className="mt-10 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
            {BEFORE.map((b) => (
              <li key={b.href} className="border-b border-hairline">
                <Link
                  href={b.href}
                  className="group flex h-full items-center justify-between gap-4 py-5 pr-6 no-underline transition-colors duration-150 hover:text-sun"
                >
                  <span className="text-[1rem] leading-snug">{b.label}</span>
                  <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true" className="shrink-0 text-graphite transition-colors duration-150 group-hover:text-sun">
                    <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
