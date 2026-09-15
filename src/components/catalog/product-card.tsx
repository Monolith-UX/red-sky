import Link from "next/link";
import {
  type CatalogItem,
  STOCK_LABEL,
  canOrder,
  classLabel,
  money,
  shortDate,
  waitingFor,
} from "@/lib/catalog";
import { imagePath } from "@/lib/products";
import { TRACE_H, TRACE_W, traceFor } from "@/lib/trace";
import { AddToCartButton } from "@/components/store/add-to-cart";
import { ProductActions } from "@/components/store/product-actions";
import { WaitlistControl } from "@/components/store/waitlist";
import { Vial } from "./vial";

export function ProductCard({ item }: { item: CatalogItem }) {
  const released = item.purity !== null;

  return (
    <article className="group relative flex h-full flex-col border border-hairline bg-paper transition-colors duration-150 focus-within:border-graphite hover:border-graphite">
      {/* Identity strip */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="t-label truncate text-graphite">{classLabel(item.klass)}</span>
        <span className="t-data shrink-0 text-[0.6875rem] text-graphite">
          {item.lot ?? "No lot yet"}
        </span>
      </div>

      {/* The vial */}
      <div className="relative aspect-[5/4] w-full bg-white">
        {item.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own route, versioned for caching
          <img
            src={imagePath(item.slug, item.images[0])}
            alt={item.images[0].alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-3"
          />
        ) : (
          <Vial item={item} className="absolute inset-0 h-full w-full p-3" />
        )}
        {item.stock !== "in" && (
          <span className="t-label absolute left-3 top-3 bg-ink px-2 py-1 text-paper">
            {STOCK_LABEL[item.stock]}
          </span>
        )}
        <span className="absolute right-1 top-1 z-20">
          <ProductActions item={item} />
        </span>
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
            {released ? `${item.purity.toFixed(2)}%` : <span className="text-graphite">Pending</span>}
          </span>
        </div>
        <p className="t-data mt-1 truncate text-[0.6875rem] text-graphite">
          {item.formula} · {item.mass} Da
        </p>

        <svg
          viewBox={`0 0 ${TRACE_W} ${TRACE_H}`}
          className="mt-2 block w-full"
          role="img"
          aria-label={
            released
              ? `Chromatogram for lot ${item.lot}: one principal peak at ${item.retention} minutes.`
              : `No chromatogram yet: ${item.name} has not been released.`
          }
        >
          {released ? (
            <path
              d={traceFor(item.retention, item.purity)}
              fill="none"
              stroke="var(--color-sun)"
              strokeWidth="1.2"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <line
              x1="0"
              y1={TRACE_H - 9}
              x2={TRACE_W}
              y2={TRACE_H - 9}
              stroke="var(--color-graphite)"
              strokeWidth="1"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
            />
          )}
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
        <p className="t-data -mt-0.5 truncate text-[0.625rem] text-graphite">
          {item.released === null
            ? `Assay pending · ${waitingFor(item).toLowerCase()}`
            : item.stock === "out"
              ? `Last lot ${shortDate(item.released)} · ${waitingFor(item).toLowerCase()}`
              : `RP-HPLC · ${item.retention.toFixed(1)} min · released ${shortDate(item.released)}`}
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
          {canOrder(item) ? <AddToCartButton item={item} /> : <WaitlistControl item={item} />}
        </div>
      </div>
    </article>
  );
}
