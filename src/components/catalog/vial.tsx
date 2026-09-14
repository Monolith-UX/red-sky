import type { CatalogItem } from "@/lib/catalog";
import { appearanceFor } from "@/lib/coa";
import { traceFor } from "@/lib/trace";

/**
 * One photographed vial with a blank paper label, and a label printed onto it
 * per sequence: name, formula, fill, lot and the lot's own trace. The ink is
 * multiplied into the photograph, so it takes the label's cylindrical shading
 * instead of floating on top of it.
 *
 * Coordinates are in the photograph's 1000 × 1000 frame. The paper runs
 * x 321–676, y 361–764; print stays inside x 364–634, clear of the curve.
 */

const L = 364;
const R = 634;
const INK = "#14161a";
const SOFT = "#3b4049";

const mono = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" } as const;
const display = { fontFamily: "var(--font-display)" } as const;

/** Newsreader sets at roughly half an em per character; wrap before it runs off the paper. */
function nameLines(name: string): { lines: string[]; size: number } {
  const width = (s: string, size: number) => s.length * 0.5 * size;
  if (width(name, 50) <= R - L) return { lines: [name], size: 50 };
  if (width(name, 42) <= R - L || !name.includes(" ")) return { lines: [name], size: 42 };
  const mid = name.length / 2;
  const spaces = [...name.matchAll(/ /g)].map((m) => m.index ?? 0);
  const at = spaces.reduce((best, i) => (Math.abs(i - mid) < Math.abs(best - mid) ? i : best));
  return { lines: [name.slice(0, at), name.slice(at + 1)], size: 42 };
}

export function Vial({ item, className = "" }: { item: CatalogItem; className?: string }) {
  const { lines, size } = nameLines(item.name);
  const nameBase = lines.length === 1 ? 480 : 466;
  const formulaBase = nameBase + (lines.length - 1) * 44 + 34;
  const form = appearanceFor(item).includes("crystalline") ? "CRYSTALLINE" : "LYOPHILIZED";

  return (
    <svg
      viewBox="0 0 1000 1000"
      role="img"
      aria-label={`Sealed vial of ${form.toLowerCase()} ${item.name}, ${item.fill}${
        item.lot ? `, lot ${item.lot}` : ", before its first lot"
      }.`}
      className={`block ${className}`}
      style={{ isolation: "isolate" }}
    >
      <image href="/img/vial.webp" width="1000" height="1000" />

      <g style={{ mixBlendMode: "multiply" }}>
        {/* maker */}
        <circle cx={L + 7} cy={392} r={6.5} fill="var(--color-sun)" />
        <text x={L + 22} y={398} fontSize={16} fontWeight={600} letterSpacing={3.2} fill={INK} style={{ fontFamily: "var(--font-sans)" }}>
          RED SKY
        </text>
        <text x={R} y={398} fontSize={11} letterSpacing={1.6} fill={SOFT} textAnchor="end" style={mono}>
          {item.fill.toUpperCase()}
        </text>
        <line x1={L} y1={414} x2={R} y2={414} stroke={INK} strokeWidth={1.4} />

        {/* the sequence */}
        {lines.map((line, i) => (
          <text key={line} x={L} y={nameBase + i * 44} fontSize={size} letterSpacing={-1} fill={INK} style={display}>
            {line}
          </text>
        ))}
        <text x={L} y={formulaBase} fontSize={15} fill={SOFT} style={mono}>
          {item.formula}
        </text>

        {/* the lot's own trace, or the absence of one */}
        {item.purity !== null ? (
          <path
            d={traceFor(item.retention, item.purity, { x: L, w: R - L, top: 572, base: 628 })}
            fill="none"
            stroke={INK}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        ) : (
          <>
            <line x1={L} y1={628} x2={R} y2={628} stroke={SOFT} strokeWidth={1.4} strokeDasharray="4 6" />
            <text x={(L + R) / 2} y={612} fontSize={11} letterSpacing={1.6} fill={SOFT} textAnchor="middle" style={mono}>
              ASSAY PENDING
            </text>
          </>
        )}

        <line x1={L} y1={648} x2={R} y2={648} stroke={INK} strokeWidth={1.4} />

        {/* fill, lot, and the restriction */}
        <text x={L} y={690} fontSize={30} fontWeight={500} letterSpacing={-0.6} fill={INK} style={mono}>
          {item.fill}
        </text>
        <text x={R} y={686} fontSize={11} letterSpacing={1.6} fill={SOFT} textAnchor="end" style={mono}>
          {form}
        </text>
        <text x={L} y={718} fontSize={13} letterSpacing={1.4} fill={INK} style={mono}>
          {item.lot ? `LOT ${item.lot}` : "LOT PENDING RELEASE"}
        </text>
        <text x={R} y={718} fontSize={13} letterSpacing={0.6} fill={INK} textAnchor="end" style={mono}>
          −20 °C
        </text>
        <text x={L} y={745} fontSize={9.5} letterSpacing={1.3} fill={SOFT} style={mono}>
          FOR IN-VITRO RESEARCH USE ONLY
        </text>
      </g>
    </svg>
  );
}
