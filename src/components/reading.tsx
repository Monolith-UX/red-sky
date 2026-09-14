/**
 * The signature: a hinomaru disc that behaves like an instrument window.
 * The same trace is painted twice — ink on the bench, paper-white inside the
 * disc — so the circle reads as an aperture rather than an ornament.
 */

const DISC = { cx: 352, cy: 178, r: 166 };

const MS_STICKS: [number, number][] = [
  [55, 262],
  [96, 235],
  [140, 281],
  [186, 215],
  [232, 290],
  [268, 144],
  [288, 248],
  [330, 50],
  [350, 110],
  [370, 179],
  [390, 252],
  [430, 225],
  [472, 277],
  [516, 255],
  [560, 286],
];

const TRACES = {
  hplc: "M0,300 C40,299 70,301 100,300 C118,300 128,297 140,290 C147,282 154,284 160,292 C166,299 172,300 182,300 C210,301 240,299 262,300 C272,300 280,297 288,287 C294,244 300,100 312,60 C318,47 326,47 332,62 C344,112 350,252 358,290 C364,299 372,301 382,300 C402,300 418,301 436,300 C446,300 452,292 458,282 C462,276 468,276 472,284 C478,294 486,300 498,300 C530,301 570,299 620,300",
  ms: MS_STICKS.reduce(
    (d, [x, y]) => `${d} L${x},300 L${x},${y} L${x},300`,
    "M0,300",
  ).concat(" L620,300"),
  coldchain:
    "M0,88 C60,88 130,87 200,89 C240,90 268,92 284,98 C300,106 312,146 324,198 C334,240 344,274 362,284 C380,292 406,289 436,289 C466,289 492,290 516,289 C532,288 542,282 552,280 C562,279 570,286 580,290 C594,294 606,291 620,290",
} as const;

export type ReadingKind = keyof typeof TRACES;

const ALT: Record<ReadingKind, string> = {
  hplc: "HPLC chromatogram: one dominant peak with negligible impurity peaks either side of it.",
  ms: "Mass spectrum stick plot: one dominant base peak with a resolved isotope cluster beside it.",
  coldchain:
    "Temperature log: a fast drop from ambient to minus twenty degrees Celsius, then flat for the length of the shipment.",
};

export function Reading({
  reading,
  drawKey,
  inverted = false,
}: {
  reading: ReadingKind;
  drawKey: number;
  /** On the sun field the disc is paper and the trace reads red inside it. */
  inverted?: boolean;
}) {
  const clip = `disc-${reading}`;
  const d = TRACES[reading];
  const onField = inverted ? "#fff" : "var(--color-ink)";
  const discFill = inverted ? "var(--color-paper)" : "var(--color-sun)";
  const inDisc = inverted ? "var(--color-sun)" : "#fff";

  return (
    <svg viewBox="0 0 620 380" role="img" aria-label={ALT[reading]} className="block w-full">
      <defs>
        <clipPath id={clip}>
          <circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} />
        </clipPath>
      </defs>

      {/* The trace, on the bench */}
      <path
        key={`ink-${drawKey}`}
        d={d}
        fill="none"
        stroke={onField}
        strokeWidth={inverted ? 2 : 1.6}
        strokeLinejoin="round"
        pathLength={1}
        className="trace-draw"
      />

      {/* The window */}
      <circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} fill={discFill} />

      {/* The same trace, lit */}
      <g clipPath={`url(#${clip})`}>
        {reading === "coldchain" && (
          <line
            x1={DISC.cx - DISC.r}
            y1="262"
            x2={DISC.cx + DISC.r}
            y2="262"
            stroke={inDisc}
            strokeWidth="1"
            strokeDasharray="3 6"
            opacity="0.45"
          />
        )}
        <path
          key={`lit-${drawKey}`}
          d={d}
          fill="none"
          stroke={inDisc}
          strokeWidth="2.1"
          strokeLinejoin="round"
          pathLength={1}
          className="trace-draw"
        />
      </g>
    </svg>
  );
}

/** Instrument ruler, set in HTML so the numerals stay tabular. */
export function Ruler({
  marks,
  inverted = false,
}: {
  marks: readonly string[];
  inverted?: boolean;
}) {
  const line = inverted ? "bg-white/45" : "bg-graphite/70";
  return (
    <div>
      <div
        className={`flex h-2.5 items-start justify-between border-t ${
          inverted ? "border-white/45" : "border-graphite/70"
        }`}
      >
        {Array.from({ length: 25 }, (_, i) => (
          <span key={i} className={`w-px ${line} ${i % 8 === 0 ? "h-2.5" : "h-1.5"}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {marks.map((m) => (
          <span
            key={m}
            className={`t-data text-[0.6875rem] tracking-[0.06em] ${
              inverted ? "text-[var(--color-on-sun)]" : "text-graphite"
            }`}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
