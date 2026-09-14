import type { ReleasedItem } from "./catalog";

/**
 * The certificate of analysis for a lot. Formulas, masses and sequences are
 * real; the release measurements are sample data derived deterministically
 * from the lot, so a given lot always reports the same certificate.
 */

type Override = {
  salt?: string;
  appearance?: string;
  sequence?: string;
};

// Only sequences we can state without guessing are listed.
const OVERRIDES: Record<string, Override> = {
  "bpc-157": { sequence: "GEPPPGKPADDAGLV" },
  "tb-500": {
    sequence: "SDKPDMAEIEKFDKSKLKKTETQEKNPLPSKETIEQEKQAGES",
  },
  "ghk-cu": {
    sequence: "GHK · Cu(II) 1:1 complex",
    salt: "Acetate, copper complex",
    appearance: "Deep blue lyophilized powder",
  },
  kpv: { sequence: "KPV" },
  ipamorelin: { sequence: "Aib-His-D-2-Nal-D-Phe-Lys-NH2" },
  "ghrp-2": { sequence: "D-Ala-D-2-Nal-Ala-Trp-D-Phe-Lys-NH2" },
  "ghrp-6": { sequence: "His-D-Trp-Ala-Trp-D-Phe-Lys-NH2" },
  hexarelin: { sequence: "His-D-2-Me-Trp-Ala-Trp-D-Phe-Lys-NH2" },
  sermorelin: {
    sequence: "YADAIFTNSYRKVLGQLSARKLLQDIMSR-NH2",
  },
  semax: { sequence: "MEHFPGP" },
  selank: { sequence: "TKPRPGP" },
  dsip: { sequence: "WAGGDASGE" },
  pinealon: { sequence: "EDR" },
  vilon: { sequence: "KE" },
  epithalon: { sequence: "AEDG" },
  "thymosin-alpha-1": {
    sequence: "Ac-SDAAVDTSSEITTKDLKEKKEVVEEAEN",
  },
  "ll-37": {
    sequence: "LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTES",
  },
  glutathione: {
    sequence: "γ-Glu-Cys-Gly",
    salt: "Free acid",
    appearance: "White crystalline powder",
  },
  "kisspeptin-10": { sequence: "YNWNSFGLRF-NH2" },
  "melanotan-ii": {
    sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-NH2",
  },
  "pt-141": {
    sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
  },
  "mots-c": { sequence: "MRWQEMGYIFYPRKLR" },
  nad: {
    salt: "Free acid",
    appearance: "White to off-white crystalline powder",
  },
};

const ANALYSTS = ["J.R.", "M.B.", "P.A."];

/** Fixed before any lot exists, so an unreleased sequence can state it too. */
export const METHOD = "RP-HPLC, C18, gradient, UV 214 nm";

function seeded(item: ReleasedItem) {
  const n = Math.round(item.retention * 1000 + item.purity * 100);
  return (k: number) => {
    const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
}

export type Coa = {
  method: string;
  purity: string;
  retention: string;
  observed: string;
  theoretical: string;
  delta: string;
  salt: string;
  appearance: string;
  water: string;
  analyst: string;
  largestImpurity: string;
};

export function coaFor(item: ReleasedItem): Coa {
  const r = seeded(item);
  const o = OVERRIDES[item.slug] ?? {};

  const observed = Number(item.mass);
  // Theoretical sits a hundredth or two from observed, as it does in practice.
  const drift = (Math.round(r(1) * 4) - 2) / 100;
  const theoretical = observed + drift;

  const shortfall = 100 - item.purity;
  const largest = Math.max(0.05, shortfall * (0.45 + r(2) * 0.3));

  return {
    method: METHOD,
    purity: `${item.purity.toFixed(2)}%`,
    retention: `${item.retention.toFixed(1)} min`,
    observed: `${observed.toFixed(2)} Da`,
    theoretical: `${theoretical.toFixed(2)} Da`,
    delta: `${Math.abs(drift).toFixed(2)} Da`,
    salt: o.salt ?? "Trifluoroacetate",
    appearance: o.appearance ?? DEFAULT_APPEARANCE,
    water: `${(2.4 + r(3) * 3.4).toFixed(1)}%`,
    analyst: ANALYSTS[Math.floor(r(4) * ANALYSTS.length)],
    largestImpurity: `${largest.toFixed(2)}% at ${(item.retention - 0.4 - r(5) * 1.4).toFixed(1)} min`,
  };
}

export const sequenceFor = (slug: string) => OVERRIDES[slug]?.sequence;

const DEFAULT_APPEARANCE = "White to off-white lyophilized powder";

/** Known before release, so an announced sequence can print it on its label. */
export const appearanceFor = (item: { slug: string }) =>
  (OVERRIDES[item.slug]?.appearance ?? DEFAULT_APPEARANCE).toLowerCase();
