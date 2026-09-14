import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "./section-header";
import { catalogue, money, shortDate } from "@/lib/catalog";

export function CatalogSection() {
  const featured = catalogue.find((c) => c.slug === "bpc-157") ?? catalogue[0];
  const rest = catalogue.filter((c) => c.slug !== featured.slug).slice(0, 5);

  return (
    <section id="catalog" className="scroll-mt-24 py-24 md:py-32">
      <div className="shell">
        <SectionHeader
          eyebrow="Catalog — current lots"
          heading="Six sequences, each with its trace attached."
          note="Prices per vial. Lots released weekly."
        />

        <div className="grid12 mt-14 gap-y-10">
          {/* Feature lot */}
          <article className="col-span-12 flex flex-col border border-hairline bg-paper lg:col-span-4">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-3">
              <span className="t-label text-graphite">Current lot</span>
              <span className="t-data text-[0.75rem] text-graphite">{featured.lot}</span>
            </div>

            <div className="relative aspect-[4/3] w-full bg-white">
              <Image
                src="/img/vial-placeholder.jpg"
                alt={`Sealed vial of lyophilized ${featured.name}.`}
                fill
                sizes="(min-width: 1024px) 30vw, 92vw"
                className="object-contain p-4"
              />
            </div>

            <div className="flex flex-1 flex-col px-6 pb-7 pt-6">
              <h3 className="t-h3">
                <Link href={`/catalog/${featured.slug}`} className="no-underline">
                  {featured.name}
                </Link>
              </h3>
              <p className="t-data mt-1.5 text-[0.8125rem] text-graphite">
                {featured.formula} · {featured.mass} Da
              </p>

              <dl className="mt-6 border-t border-hairline text-[0.8125rem]">
                {[
                  ["Area purity", `${featured.purity.toFixed(2)}%`],
                  ["Fill", `${featured.fill} / vial`],
                  ["Released", shortDate(featured.released)],
                  ["Price", money(featured.price)],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between border-b border-hairline py-2.5"
                  >
                    <dt className="text-graphite">{k}</dt>
                    <dd className="t-data font-medium">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-col gap-2">
                <button type="button" className="btn btn-primary w-full">
                  Add to cart
                </button>
                <Link
                  href={`/catalog/${featured.slug}`}
                  className="btn btn-ghost w-full"
                >
                  Read the certificate
                </Link>
              </div>
            </div>
          </article>

          {/* Specimen index */}
          <div className="col-span-12 lg:col-span-8">
            <div
              className="hidden grid-cols-[minmax(0,1fr)_7rem_5rem_6rem_2rem] items-end gap-4 border-b border-ink pb-2.5 md:grid"
              aria-hidden="true"
            >
              <span className="t-label text-graphite">Sequence</span>
              <span className="t-label text-right text-graphite">Purity</span>
              <span className="t-label text-right text-graphite">Fill</span>
              <span className="t-label text-right text-graphite">Price</span>
              <span />
            </div>

            <ul role="list">
              {rest.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/catalog/${p.slug}`}
                    className="group relative grid grid-cols-1 gap-x-4 gap-y-3 border-b border-hairline py-6 no-underline transition-colors duration-150 hover:bg-paper md:grid-cols-[minmax(0,1fr)_7rem_5rem_6rem_2rem] md:items-center"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 h-full w-[3px] origin-top scale-y-0 bg-sun transition-transform duration-200 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
                    />
                    <span className="md:pl-5">
                      <span className="t-h3 block">{p.name}</span>
                      <span className="t-data mt-1 block text-[0.75rem] text-graphite">
                        {p.formula} · {p.mass} Da · lot {p.lot}
                      </span>
                    </span>

                    <span className="t-data flex items-baseline justify-between text-[0.9375rem] md:block md:text-right">
                      <span className="t-label text-graphite md:hidden">Purity</span>
                      {p.purity.toFixed(2)}%
                    </span>
                    <span className="t-data flex items-baseline justify-between text-[0.9375rem] text-graphite md:block md:text-right">
                      <span className="t-label md:hidden">Fill</span>
                      {p.fill}
                    </span>
                    <span className="t-data flex items-baseline justify-between text-[0.9375rem] font-medium md:block md:text-right">
                      <span className="t-label text-graphite md:hidden">Price</span>
                      {money(p.price)}
                    </span>

                    <span className="hidden justify-self-end text-graphite transition-colors duration-150 group-hover:text-sun md:block">
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                        <path
                          d="M0 5h14M10 1l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className="text-[0.8125rem] text-graphite">
                Bulk and custom synthesis quoted within one business day.
              </p>
              <Link
                href="/catalog"
                className="shrink-0 py-1.5 text-[0.8125rem] font-medium decoration-sun underline-offset-4 hover:decoration-2"
              >
                All {catalogue.length} sequences
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
