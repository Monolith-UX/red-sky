import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Faqs } from "@/components/faqs";
import { LotTrace } from "@/components/catalog/lot-trace";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { Vial } from "@/components/catalog/vial";
import { SectionHeader } from "@/components/section-header";
import { PurchasePanel } from "@/components/store/add-to-cart";
import { ProductActions } from "@/components/store/product-actions";
import { WaitlistControl } from "@/components/store/waitlist";
import {
  type CatalogItem,
  STOCK_LABEL,
  canOrder,
  catalogue,
  classLabel,
  getItem,
  money,
  shortDate,
  waitingFor,
} from "@/lib/catalog";
import { METHOD, appearanceFor, coaFor, sequenceFor } from "@/lib/coa";
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
  const item = getItem(slug);
  if (!item) return { title: "Sequence not found — Red Sky" };
  return {
    title: `${item.name} — Red Sky`,
    description:
      item.purity === null
        ? `${item.name}, ${item.formula}, ${item.fill} per vial. Coming soon: first lot expected ${shortDate(item.expected)}. Join the waitlist.`
        : `${item.name}, ${item.formula}, ${item.fill} per vial. Lot ${item.lot} released at ${item.purity.toFixed(2)}% area purity by RP-HPLC.`,
  };
}

function shipping(item: CatalogItem) {
  switch (item.stock) {
    case "in":
      return "Ships the same business day on orders before 14:00 ET. Vials leave the freezer at −20 °C with a temperature logger in the box.";
    case "low":
      return "Fewer than ten vials left on this lot. Ships the same business day, at −20 °C with a temperature logger in the box.";
    case "made-to-order":
      return "Synthesized to order, typically 10 to 15 business days, with a certificate for your own lot.";
    case "out":
    case "upcoming":
      return `${waitingFor(item)}.`;
  }
}

const AVAILABILITY: Record<CatalogItem["stock"], string> = {
  in: "https://schema.org/InStock",
  low: "https://schema.org/LimitedAvailability",
  "made-to-order": "https://schema.org/MadeToOrder",
  out: "https://schema.org/OutOfStock",
  upcoming: "https://schema.org/OutOfStock",
};

const PENDING = "Pending release";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();

  const sequence = sequenceFor(item);
  const faqs = productFaqs(item);
  const appearance = appearanceFor(item);
  const related = catalogue
    .filter((c) => c.klass === item.klass && c.slug !== item.slug)
    .slice(0, 4);

  const certificatePdf = item.lot === null ? null : coaFor(item).certificate;

  // An announced sequence still has a method, a formula and a theoretical
  // mass; everything a lot would measure is marked as not yet measured.
  const certificate: [string, string][] =
    item.purity === null
      ? [
          ["Lot number", "Assigned at synthesis"],
          ["Date of analysis", PENDING],
          ["Method", METHOD],
          ["Area purity", PENDING],
          ["Observed mass", PENDING],
          ["Theoretical mass", `${item.mass} Da`],
          ["Molecular formula", item.formula],
          ["Water content (Karl Fischer)", PENDING],
        ]
      : (() => {
          const coa = coaFor(item);
          return [
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
        })();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: item.name,
        description: item.note,
        ...(item.lot ? { sku: item.lot } : {}),
        category: classLabel(item.klass),
        brand: { "@type": "Brand", name: "Red Sky" },
        offers: {
          "@type": "Offer",
          price: item.price.toFixed(2),
          priceCurrency: "USD",
          availability: AVAILABILITY[item.stock],
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
            <div className="relative border border-hairline bg-white">
              {item.images?.length ? (
                <ProductGallery item={item} />
              ) : (
                <div className="relative aspect-[4/3] w-full">
                  <Vial item={item} className="absolute inset-0 h-full w-full p-6" />
                </div>
              )}
              {item.stock !== "in" && (
                <span className="t-label absolute left-4 top-4 bg-ink px-2 py-1 text-paper">
                  {STOCK_LABEL[item.stock]}
                </span>
              )}
              <span className="absolute right-2 top-2 z-20">
                <ProductActions item={item} variant="detail" />
              </span>
            </div>

            <div className="mt-5">
              {item.purity !== null ? (
                <LotTrace
                  retention={item.retention}
                  purity={item.purity}
                  lot={item.lot}
                />
              ) : (
                <figure className="border border-hairline bg-paper p-5 md:p-6">
                  <figcaption className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
                    <span className="t-label text-graphite">Chromatogram</span>
                    <span className="t-data text-[0.6875rem] text-graphite">No lot yet</span>
                  </figcaption>
                  <div className="relative mt-5 grid h-40 place-items-center md:h-48">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-6 border-t border-dashed border-graphite/60"
                    />
                    <p className="t-data relative bg-paper px-3 text-[0.75rem] text-graphite">
                      Assay pending — the trace publishes with the first lot
                    </p>
                  </div>
                  <p className="t-data mt-4 border-t border-hairline pt-3 text-[0.6875rem] leading-relaxed text-graphite">
                    {METHOD} · {waitingFor(item).toLowerCase()}
                  </p>
                </figure>
              )}
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
              {item.purity !== null ? (
                <span className="t-metric text-[clamp(2rem,3vw,2.75rem)]">
                  {item.purity.toFixed(2)}%
                </span>
              ) : (
                <span className="t-data pb-1 text-[1.0625rem] text-graphite">
                  Measured at release
                </span>
              )}
            </div>

            <dl className="mt-6 text-[0.875rem]">
              {[
                ["Fill", `${item.fill} per vial`],
                ["Lot", item.lot ?? "Assigned at synthesis"],
                item.released === null
                  ? ["Expected", shortDate(item.expected)]
                  : [item.stock === "out" ? "Last released" : "Released", shortDate(item.released)],
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

            <p className="t-data mt-7 text-[1.75rem] font-medium leading-none">
              {money(item.price)}
              <span className="ml-2 text-[0.8125rem] font-normal text-graphite">per vial</span>
            </p>

            {canOrder(item) ? <PurchasePanel item={item} /> : <WaitlistControl item={item} variant="detail" />}

            <p className="mt-3 flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-graphite">
              <span className="dot mt-[0.55em]" aria-hidden="true" />
              <span>
                {shipping(item)}{" "}
                <a href="#certificate" className="whitespace-nowrap text-ink decoration-sun underline-offset-4">
                  {item.purity === null ? "What the certificate will show" : "Read the certificate"}
                </a>
              </span>
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
            eyebrow={
              item.lot === null
                ? "Certificate of analysis — first lot pending"
                : `Certificate of analysis — ${item.stock === "out" ? "last lot" : "lot"} ${item.lot}`
            }
            heading={
              item.lot === null
                ? "What we will measure before it ships."
                : "The numbers a stranger could argue with."
            }
            headingId="coa-heading"
            note={
              item.lot === null
                ? "Published the day the first lot clears release, and not before."
                : "Printed and shipped with the vial. The integration report is available on request."
            }
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
                  <dd
                    className={`t-data text-[0.875rem] ${
                      v === PENDING ? "text-graphite" : "font-medium"
                    }`}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            {certificatePdf && (
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline px-5 py-4 md:px-7">
                <p className="text-[0.875rem]">The signed certificate for lot {item.lot}, as issued.</p>
                <a href={certificatePdf} target="_blank" rel="noreferrer" className="btn btn-ghost">
                  Open the certificate (PDF)
                </a>
              </div>
            )}

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
              .{" "}
              {item.lot === null
                ? "Net peptide content will be available on request for every lot."
                : "Net peptide content for this lot is available on request."}
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
                b: `Hold sealed vials at −20 °C, out of light. Supplied as ${appearance}.`,
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
            heading={
              item.lot === null
                ? "What buyers ask before it is released."
                : "What buyers ask before they order this one."
            }
            note="Anything outside this goes through the contact page, answered within a business day."
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

            <ul
              role="list"
              className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {related.map((r) => (
                <li key={r.slug}>
                  <ProductCard item={r} />
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
