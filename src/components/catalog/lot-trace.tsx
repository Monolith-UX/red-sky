import { TRACE_H, TRACE_W, traceFor } from "@/lib/trace";

/** The card sparkline and this plot draw the same path — same lot, same data. */
export function LotTrace({
  retention,
  purity,
  lot,
}: {
  retention: number;
  purity: number;
  lot: string;
}) {
  const d = traceFor(retention, purity);
  const marks = ["0", "8", "16", "24 min"];

  return (
    <figure className="border border-hairline bg-paper p-5 md:p-6">
      <figcaption className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3">
        <span className="t-label text-graphite">Trace drawn from the certificate</span>
        <span className="t-data text-[0.6875rem] text-graphite">{lot}</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${TRACE_W} ${TRACE_H}`}
        className="mt-5 block h-40 w-full md:h-48"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Chromatogram for lot ${lot}: one principal peak at ${retention} minutes, ${purity.toFixed(2)} percent of total area.`}
      >
        <path
          d={d}
          fill="none"
          stroke="var(--color-sun)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="mt-1 flex h-2 items-start justify-between border-t border-graphite/70">
        {Array.from({ length: 25 }, (_, i) => (
          <span
            key={i}
            className={`w-px bg-graphite/70 ${i % 8 === 0 ? "h-2" : "h-1"}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {marks.map((m) => (
          <span key={m} className="t-data text-[0.625rem] tracking-[0.06em] text-graphite">
            {m}
          </span>
        ))}
      </div>

      <p className="t-data mt-4 border-t border-hairline pt-3 text-[0.6875rem] leading-relaxed text-graphite">
        RP-HPLC · C18 · UV 214 nm · retention {retention.toFixed(1)} min
      </p>
    </figure>
  );
}
