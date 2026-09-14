/**
 * Every catalogue card carries its own chromatogram. The trace is derived
 * deterministically from the lot's retention time and purity, so no two
 * sequences draw the same curve and the same sequence always draws its own.
 */

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TRACE_W = 240;
export const TRACE_H = 64;
const BASE = 55;
const TOP = 7;

/**
 * Where a trace is drawn: its left edge and width, and the y of the peak apex
 * and of the baseline. The default is the card's 240 × 64 sparkline; larger
 * frames (the vial label, the hero window) get the same curve, only scaled.
 */
export type Frame = { x: number; w: number; top: number; base: number };
const CARD: Frame = { x: 0, w: TRACE_W, top: TOP, base: BASE };

type Peak = { mu: number; a: number; s: number };

export function traceFor(retention: number, purity: number, frame: Frame = CARD): string {
  const rnd = mulberry(Math.round(retention * 971 + purity * 137));
  const sy = (frame.base - frame.top) / (BASE - TOP);

  // The main peak sits where the sequence actually elutes, mapped into frame.
  const mu = 0.3 + ((retention % 7) / 7) * 0.4;
  const peaks: Peak[] = [
    { mu, a: BASE - TOP, s: 0.015 + rnd() * 0.009 },
  ];

  // Impurity peaks: the lower the purity, the more of them and the taller.
  const shortfall = Math.max(0, 100 - purity);
  const count = 1 + Math.floor(rnd() * 3);
  for (let i = 0; i < count; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const at = Math.min(0.95, Math.max(0.05, mu + side * (0.11 + rnd() * 0.32)));
    peaks.push({
      mu: at,
      a: (BASE - TOP) * (0.02 + shortfall * (0.05 + rnd() * 0.09)),
      s: 0.007 + rnd() * 0.006,
    });
  }

  const N = 96;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let y = BASE;
    for (const p of peaks) {
      y -= p.a * Math.exp(-((t - p.mu) ** 2) / (2 * p.s * p.s));
    }
    y += (rnd() - 0.5) * 0.7; // baseline noise
    const X = frame.x + t * frame.w;
    const Y = frame.top + (y - TOP) * sy;
    d += `${i === 0 ? "M" : "L"}${X.toFixed(1)},${Y.toFixed(1)}`;
  }
  return d;
}

/** A stick spectrum, the way a mass spec plots one. */
export function sticksFor(seed: number): string {
  const rnd = mulberry(seed * 7919 + 13);
  const base = BASE;
  let d = `M0,${base}`;
  const n = 13;
  const tall = 3 + Math.floor(rnd() * 5);
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.6) / n) * TRACE_W;
    const h = i === tall ? base - TOP : (base - TOP) * (0.12 + rnd() * 0.55);
    d += `L${x.toFixed(1)},${base}L${x.toFixed(1)},${(base - h).toFixed(1)}L${x.toFixed(1)},${base}`;
  }
  return d + `L${TRACE_W},${base}`;
}

/** A cold-chain log: ambient, a fast drop, then flat. */
export function curveFor(seed: number): string {
  const rnd = mulberry(seed * 4271 + 29);
  const top = TOP + rnd() * 6;
  const floor = BASE - 4;
  const mid = 0.34 + rnd() * 0.22;
  const N = 96;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // logistic drop, then a small handling bump near the end
    const drop = 1 / (1 + Math.exp(-(t - mid) * 22));
    let y = top + (floor - top) * drop;
    y -= 3.5 * Math.exp(-((t - 0.82) ** 2) / (2 * 0.02 ** 2));
    y += (rnd() - 0.5) * 0.6;
    d += `${i === 0 ? "M" : "L"}${(t * TRACE_W).toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}
