import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faqs } from "@/components/faqs";
import { LotTrace } from "@/components/catalog/lot-trace";
import { SectionHeader } from "@/components/section-header";
import {
  STOCK_LABEL,
  catalogue,
  classLabel,
  money,
  shortDate,
} from "@/lib/catalog";
import { coaFor, sequenceFor } from "@/lib/coa";
import { productFaqs } from "@/lib/product-faqs";

export function generateStaticParams() {
  return catalogue.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = catalogue.find((c) => c.slug === slug);
  if (!item) return { title: "Sequence not found — Red Sky" };
  return {
    title: `${item.name} — Red Sky`,
    description: `${item.name}, ${item.formula}, ${item.fill} per vial. Lot ${item.lot} released at ${item.purity.toFixed(2)}% area purity by RP-HPLC.`,
  };
}

const SHIPS: Record<string, string> = {
  in: "Ships the same business day on orders before 14:00 ET.",
  low: "Fewer than ten vials left on this lot. Ships the same business day.",
  "made-to-order": "Synthesized to order. Typically 10 to 15 business days.",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = catalogue.find((c) => c.slug === slug);
  if (!item) notFound();

  const coa = coaFor(item);
  const sequence = sequenceFor(item.slug);
  const faqs = productFaqs(item);
  const related = catalogue
    .filter((c) => c.klass === item.klass && c.slug !== item.slug)
    .slice(0, 3);

  const certificate: [string, string][] = [
    ["Lot number", item.lot],
    ["Date of analysis", shortDate(item.released)],
    ["Method", coa.method],
    ["Area purity", coa.purity],
    ["Retention time", coa.retention],
    ["Largest single impurity", coa.largestImpurity],
    ["Observed mass", coa.observed],
    ["Theoretical mass", coa.theoretical],
    ["Mass difference", coa.delta],
    ["Molecular formula", item.formula],
    ["Salt form", coa.salt],
    ["Appearance", coa.appearance],
    ["Water content (Karl Fischer)", coa.water],
    ["Analyst", coa.analyst],
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: item.name,
        description: item.note,
        sku: item.lot,
        category: classLabel(item.klass),
        brand: { "@type": "Brand", name: "Red Sky" },
        offers: {
          "@type": "Offer",
          price: item.price.toFixed(2),
          priceCurrency: "USD",
          availability:
            item.stock === "made-to-order"
              ? "https://schema.org/PreOrder"
              : "https://schema.org/InStock",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <article className="pb-24 md:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="border-b border-hairline">
        <div className="shell">
          <ol
            role="list"
            className="t-data flex flex-wrap items-center gap-x-2 py-3 text-[0.75rem] text-graphite"
          >
            <li>
              <Link href="/catalog" className="no-underline hover:text-ink">
                Catalogue
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/catalog"
                className="no-underline hover:text-ink"
              >
                {classLabel(item.klass)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {item.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* ── Product ────────────────────────────────────────────────── */}
      <div className="shell pt-10 md:pt-14">
        <div className="grid12 gap-y-10">
          {/* Specimen */}
          <div className="col-span-12 lg:col-span-6">
            <div className="border border-hairline bg-white">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/img/vial-placeholder.jpg"
                  alt={`Sealed vial of lyophilized ${item.name}, ${item.fill} fill.`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 92vw"
                  className="object-contain p-6"
                />
              </div>
            </div>

            <div className="mt-5">
              <LotTrace
                retention={item.retention}
                purity={item.purity}
                lot={item.lot}
              />
            </div>
          </div>

          {/* Order */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <p className="rail-label">{classLabel(item.klass)}</p>

            <h1 className="t-display mt-6 max-w-[11ch] text-[clamp(2.5rem,4.4vw,3.75rem)] leading-[1.02]">
              {item.name}
            </h1>

            <p className="t-data mt-4 text-[0.875rem] text-graphite">
              {item.formula} · {item.mass} Da
            </p>
            <p className="t-body mt-5 text-[0.9375rem]">{item.note}</p>

            {/* The argument */}
            <div className="mt-8 flex items-end justify-between gap-6 border-y border-ink py-5">
              <span className="t-label pb-1.5 text-graphite">Area purity</span>
              <span className="t-metric text-[clamp(2rem,3vw,2.75rem)]">
                {item.purity.toFixed(2)}%
              </span>
            </div>

            <dl className="mt-6 text-[0.875rem]">
              {[
                ["Fill", `${item.fill} per vial`],
                ["Lot", item.lot],
                ["Released", shortDate(item.released)],
                ["Availability", STOCK_LABEL[item.stock]],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-4 border-b border-hairline py-2.5"
                >
                  <dt className="text-graphite">{k}</dt>
                  <dd className="t-data font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="t-data mt-6 text-[1.75rem] font-medium">{money(item.price)}</p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <button type="button" className="btn btn-primary flex-1">
                Add to cart
              </button>
              <a href="#certificate" className="btn btn-ghost flex-1">
                Read the certificate
              </a>
            </div>

            <p className="mt-4 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-graphite">
              <span className="dot mt-[0.55em]" aria-hidden="true" />
              {SHIPS[item.stock]} Vials leave the freezer at −20 °C with a temperature
              logger in the box.
            </p>
          </div>
        </div>
      </div>

      {/* ── Certificate ────────────────────────────────────────────── */}
      <section
        id="certificate"
        aria-labelledby="coa-heading"
        className="scroll-mt-24 pt-20 md:pt-28"
      >
        <div className="shell">
          <SectionHeader
            eyebrow={`Certificate of analysis — lot ${item.lot}`}
            heading="The numbers a stranger could argue with."
            headingId="coa-heading"
            note="Printed and shipped with the vial. Also downloadable as a signed PDF."
          />

          <div className="mt-12 border border-hairline bg-paper">
            <dl className="grid grid-cols-1 md:grid-cols-2">
              {certificate.map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-hairline px-5 py-3.5 md:px-7 ${
                    i < certificate.length - (certificate.length % 2 === 0 ? 2 : 1)
                      ? "border-b"
                      : ""
                  } ${i % 2 === 0 ? "md:border-r" : ""}`}
                >
                  <dt className="text-[0.875rem] text-graphite">{k}</dt>
                  <dd className="t-data text-[0.875rem] font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {sequence && (
              <div className="border-t border-hairline px-5 py-4 md:px-7">
                <p className="t-label text-graphite">Sequence</p>
                <p className="t-data mt-2 break-all text-[0.8125rem] leading-relaxed">
                  {sequence}
                </p>
              </div>
            )}

            <p className="border-t border-hairline px-5 py-4 text-[0.8125rem] leading-relaxed text-graphite md:px-7">
              Area purity is measured at 214 nm and reports UV-absorbing material only.
              It is not net peptide content —{" "}
              <Link
                href="/blog/what-99-percent-purity-means"
                className="decoration-sun underline-offset-4"
              >
                the difference is explained here
              </Link>
              . Net peptide content for this lot is available on request.
            </p>
          </div>
        </div>
      </section>

      {/* ── Handling ───────────────────────────────────────────────── */}
      <section
        aria-labelledby="handling-heading"
        className="pt-20 md:pt-28"
      >
        <div className="shell">
          <SectionHeader
            eyebrow="Handling — storage and reconstitution"
            heading="Most losses happen after the seal comes off."
            headingId="handling-heading"
          />

          <ul role="list" className="mt-12 grid gap-px border-t border-hairline sm:grid-cols-3">
            {[
              {
                t: "Storage",
                b: `Hold sealed vials at −20 °C, out of light. ${coa.appearance.replace(/^./, (c) => c.toLowerCase())} at time of release.`,
              },
              {
                t: "Before opening",
                b: "Bring the vial to room temperature while it is still sealed, so nothing condenses onto the cake.",
              },
              {
                t: "Reconstitution",
                b: "Run diluent slowly down the vial wall. Swirl, never shake — foaming denatures peptide at the air-water interface.",
              },
            ].map((s) => (
              <li key={s.t} className="relative pt-7 sm:pr-8">
                <span
                  aria-hidden="true"
                  className="absolute -top-[4px] left-0 h-[7px] w-[7px] rounded-full bg-sun"
                />
                <h3 className="t-h3">{s.t}</h3>
                <p className="mt-3 max-w-[32ch] text-[0.9375rem] leading-relaxed text-graphite">
                  {s.b}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-10 max-w-[70ch] border-t border-hairline pt-6 text-[0.8125rem] leading-relaxed text-graphite">
            <strong className="font-medium text-ink">Research use only.</strong> This
            product is sold for in-vitro laboratory research. It is not a drug, food or
            cosmetic, is not for human or veterinary consumption, and is not for
            diagnostic or therapeutic use of any kind.
          </p>
        </div>
      </section>

      {/* ── Questions ──────────────────────────────────────────────── */}
      <section className="pt-20 md:pt-28">
        <div className="shell">
          <SectionHeader
            eyebrow={`Questions — ${item.name}`}
            heading="What buyers ask before they order this one."
            note="Anything outside this goes to lab@redskybio.com, answered within a business day."
          />
          <div className="mt-12 max-w-[64rem]">
            <Faqs items={faqs} heading={`About ${item.name}`} id="product-questions" />
          </div>
        </div>
      </section>

      {/* ── Related ────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="pt-20 md:pt-28">
          <div className="shell">
            <SectionHeader
              eyebrow={`Same class — ${classLabel(item.klass)}`}
              heading="Filed alongside it."
              headingId="related-heading"
            />

            <ul role="list" className="mt-10 border-t border-ink">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/catalog/${r.slug}`}
                    className="group relative grid grid-cols-1 items-center gap-x-4 gap-y-2 border-b border-hairline py-6 no-underline transition-colors duration-150 hover:bg-paper md:grid-cols-[minmax(0,1fr)_7rem_6rem_2rem]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-sun transition-transform duration-200 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
                    />
                    <span className="md:pl-5">
                      <span className="t-h3 block">{r.name}</span>
                      <span className="t-data mt-1 block text-[0.75rem] text-graphite">
                        {r.formula} · lot {r.lot}
                      </span>
                    </span>
                    <span className="t-data text-[0.9375rem] md:text-right">
                      {r.purity.toFixed(2)}%
                    </span>
                    <span className="t-data text-[0.9375rem] font-medium md:text-right">
                      {money(r.price)}
                    </span>
                    <span className="hidden justify-self-end text-graphite transition-colors duration-150 group-hover:text-sun md:block">
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                        <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/catalog"
              className="mt-8 inline-flex h-11 items-center gap-2.5 text-[0.875rem] font-medium no-underline transition-colors duration-150 hover:text-sun"
            >
              Back to the full catalogue
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </Link>
          </div>
        </section>
      )}
    </article>
  );
}
