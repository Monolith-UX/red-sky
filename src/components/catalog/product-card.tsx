import Image from "next/image";
import Link from "next/link";
import {
  type CatalogItem,
  STOCK_LABEL,
  classLabel,
  money,
  shortDate,
} from "@/lib/catalog";
import { TRACE_H, TRACE_W, traceFor } from "@/lib/trace";

export function ProductCard({ item }: { item: CatalogItem }) {
  const d = traceFor(item.retention, item.purity);

  return (
    <article className="group relative flex flex-col border border-hairline bg-paper transition-colors duration-150 focus-within:border-graphite hover:border-graphite">
      {/* Identity strip */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="t-label truncate text-graphite">{classLabel(item.klass)}</span>
        <span className="t-data shrink-0 text-[0.6875rem] text-graphite">{item.lot}</span>
      </div>

      {/* The vial */}
      <div className="relative aspect-[5/4] w-full bg-white">
        <Image
          src="/img/vial-placeholder.jpg"
          alt={`Sealed vial of lyophilized ${item.name}.`}
          fill
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 40vw, 90vw"
          className="object-contain p-3"
        />
        {item.stock !== "in" && (
          <span className="t-label absolute left-3 top-3 bg-ink px-2 py-1 text-paper">
            {STOCK_LABEL[item.stock]}
          </span>
        )}
      </div>

      {/* Reading */}
      <div className="border-y border-hairline px-4 pb-2 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="t-h3 min-w-0 text-[1.25rem] leading-tight">
            <Link
              href={`/catalog/${item.slug}`}
              className="no-underline after:absolute after:inset-0 after:content-['']"
            >
              {item.name}
            </Link>
          </h3>
          <span className="t-data shrink-0 text-[0.9375rem] font-medium tabular-nums">
            {item.purity.toFixed(2)}%
          </span>
        </div>
        <p className="t-data mt-1 truncate text-[0.6875rem] text-graphite">
          {item.formula} · {item.mass} Da
        </p>

        <svg
          viewBox={`0 0 ${TRACE_W} ${TRACE_H}`}
          className="mt-2 block w-full"
          role="img"
          aria-label={`Chromatogram for lot ${item.lot}: one principal peak at ${item.retention} minutes.`}
        >
          <path
            d={d}
            fill="none"
            stroke="var(--color-sun)"
            strokeWidth="1.2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="0"
            y1={TRACE_H - 2}
            x2={TRACE_W}
            y2={TRACE_H - 2}
            stroke="var(--color-hairline)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <p className="t-data -mt-0.5 text-[0.625rem] text-graphite">
          RP-HPLC · {item.retention.toFixed(1)} min · released {shortDate(item.released)}
        </p>
      </div>

      {/* Order */}
      <div className="flex flex-1 flex-col justify-end px-4 pb-4 pt-3">
        <p className="text-[0.8125rem] leading-relaxed text-graphite">{item.note}</p>

        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
            <span className="t-label text-graphite">{item.fill} / vial</span>
            <span className="t-data text-[1.125rem] font-medium">
              {money(item.price)}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-primary relative z-10 mt-3 min-h-[2.75rem] w-full"
          >
            Add to cart
            <span className="visually-hidden">
              {" "}
              — {item.name}, {item.fill}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
