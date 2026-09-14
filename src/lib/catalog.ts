/**
 * The catalogue. Molecular formulas and average molecular weights are real,
 * and each one has been recomputed from its sequence. The lots, purities,
 * prices and dates written here are sample data; lots saved in /admin
 * replace them at build time (see `withLot` and `lib/lots.ts`).
 */

import lotRows from "./lots.json";
import type { LotRecord } from "./lots";

export type StockState = "in" | "low" | "out" | "made-to-order" | "upcoming";

type Base = {
  slug: string;
  name: string;
  formula: string;
  /** Average molecular weight, in Da. */
  mass: string;
  klass: ClassKey;
  fill: string;
  price: number;
  /** Retention time in minutes — also seeds the trace, so every card differs. */
  retention: number;
  note: string;
};

/** A sequence with at least one released lot, whether or not any is left. */
export type ReleasedItem = Base & {
  stock: "in" | "low" | "out" | "made-to-order";
  purity: number;
  lot: string;
  released: string;
  /** When the next lot is expected, for a sequence that has sold through. */
  expected?: string;
  /** Certificate figures entered in /admin. Absent ones fall back to sample values (see coa.ts). */
  measured?: {
    observedMass: number | null;
    water: number | null;
    largestImpurity: string | null;
    analyst: string | null;
    salt: string | null;
    appearance: string | null;
    /** Uploaded certificate PDF. */
    certificate: string | null;
    sample: boolean;
  };
};

/** Announced but never released: no lot, no purity, and so no trace to draw. */
export type UpcomingItem = Base & {
  stock: "upcoming";
  purity: null;
  lot: null;
  released: null;
  expected: string;
};

export type CatalogItem = ReleasedItem | UpcomingItem;

export const CLASSES = [
  { key: "repair", label: "Repair and recovery" },
  { key: "secretagogue", label: "GH secretagogues" },
  { key: "metabolic", label: "Metabolic" },
  { key: "neuro", label: "Cognitive and neuro" },
  { key: "longevity", label: "Longevity and immune" },
  { key: "endocrine", label: "Endocrine and pigment" },
] as const;

export type ClassKey = (typeof CLASSES)[number]["key"];

export const classLabel = (k: ClassKey) =>
  CLASSES.find((c) => c.key === k)?.label ?? k;

export const STOCK_LABEL: Record<StockState, string> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
  "made-to-order": "Made to order",
  upcoming: "Coming soon",
};

export const isReleased = (item: CatalogItem): item is ReleasedItem =>
  item.stock !== "upcoming";

/** Stocked or synthesized to order: anything a cart can take today. */
export const canOrder = (item: CatalogItem) =>
  item.stock === "in" || item.stock === "low" || item.stock === "made-to-order";

/** Nothing to sell yet, so the order control becomes a waitlist. */
export const canWaitlist = (item: CatalogItem) =>
  item.stock === "out" || item.stock === "upcoming";

/** The sequences, with sample lots. Rows saved in /admin replace the lot fields (see below). */
const SEED: CatalogItem[] = [
  // ── Repair and recovery ──────────────────────────────────────────────
  {
    slug: "bpc-157",
    name: "BPC-157",
    formula: "C62H98N16O22",
    mass: "1419.53",
    klass: "repair",
    fill: "5 mg",
    price: 48,
    purity: 99.47,
    lot: "RS-2601-B",
    released: "2026-08-31",
    stock: "in",
    retention: 12.4,
    note: "Pentadecapeptide fragment of body protection compound.",
  },
  {
    slug: "tb-500",
    name: "TB-500",
    formula: "C212H350N56O78S",
    mass: "4963.44",
    klass: "repair",
    fill: "5 mg",
    price: 62,
    purity: 99.12,
    lot: "RS-2559-A",
    released: "2026-07-22",
    stock: "in",
    retention: 15.8,
    note: "Synthetic thymosin beta-4 active fragment.",
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    formula: "C14H22CuN6O4",
    mass: "401.91",
    klass: "repair",
    fill: "50 mg",
    price: 54,
    purity: 99.61,
    lot: "RS-2604-C",
    released: "2026-09-04",
    stock: "in",
    retention: 6.2,
    note: "Copper tripeptide-1. Ships as the blue lyophilized complex.",
  },
  {
    slug: "kpv",
    name: "KPV",
    formula: "C16H30N4O4",
    mass: "342.43",
    klass: "repair",
    fill: "10 mg",
    price: 38,
    purity: 99.55,
    lot: "RS-2597-A",
    released: "2026-08-19",
    stock: "in",
    retention: 5.1,
    note: "C-terminal tripeptide of alpha-MSH.",
  },

  // ── GH secretagogues ─────────────────────────────────────────────────
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    formula: "C38H49N9O5",
    mass: "711.85",
    klass: "secretagogue",
    fill: "5 mg",
    price: 41,
    purity: 99.24,
    lot: "RS-2588-A",
    released: "2026-08-08",
    stock: "in",
    retention: 9.7,
    note: "Selective pentapeptide secretagogue.",
  },
  {
    slug: "cjc-1295-no-dac",
    name: "CJC-1295 no DAC",
    formula: "C152H252N44O42",
    mass: "3367.94",
    klass: "secretagogue",
    fill: "5 mg",
    price: 57,
    purity: 99.35,
    lot: "RS-2571-D",
    released: "2026-07-30",
    stock: "in",
    retention: 14.1,
    note: "Modified GRF (1-29), no drug affinity complex.",
  },
  {
    slug: "hexarelin",
    name: "Hexarelin",
    formula: "C47H58N12O6",
    mass: "887.04",
    klass: "secretagogue",
    fill: "5 mg",
    price: 52,
    purity: 99.08,
    lot: "RS-2563-B",
    released: "2026-07-14",
    stock: "low",
    retention: 10.9,
    note: "Hexapeptide growth hormone releasing peptide.",
  },
  {
    slug: "ghrp-2",
    name: "GHRP-2",
    formula: "C45H55N9O6",
    mass: "817.97",
    klass: "secretagogue",
    fill: "5 mg",
    price: 39,
    purity: 99.31,
    lot: "RS-2592-C",
    released: "2026-08-12",
    stock: "in",
    retention: 11.3,
    note: "Pralmorelin. Hexapeptide secretagogue.",
  },
  {
    slug: "ghrp-6",
    name: "GHRP-6",
    formula: "C46H56N12O6",
    mass: "873.01",
    klass: "secretagogue",
    fill: "5 mg",
    price: 37,
    purity: 99.18,
    lot: "RS-2586-A",
    released: "2026-08-05",
    stock: "in",
    retention: 10.2,
    note: "Hexapeptide secretagogue, histidine-tryptophan series.",
  },
  {
    slug: "sermorelin",
    name: "Sermorelin",
    formula: "C149H246N44O42S",
    mass: "3357.88",
    klass: "secretagogue",
    fill: "5 mg",
    price: 68,
    purity: 99.02,
    lot: "RS-2548-B",
    released: "2026-06-26",
    stock: "out",
    expected: "2026-10-12",
    retention: 13.6,
    note: "GRF (1-29) amide.",
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    formula: "C221H366N72O67S",
    mass: "5135.86",
    klass: "secretagogue",
    fill: "5 mg",
    price: 124,
    purity: 99.09,
    lot: "RS-2577-A",
    released: "2026-08-01",
    stock: "made-to-order",
    retention: 16.4,
    note: "Trans-3-hexenoyl GRF (1-44) amide.",
  },

  // ── Metabolic ────────────────────────────────────────────────────────
  {
    slug: "aod-9604",
    name: "AOD-9604",
    formula: "C78H123N23O23S2",
    mass: "1815.08",
    klass: "metabolic",
    fill: "5 mg",
    price: 66,
    purity: 99.22,
    lot: "RS-2583-C",
    released: "2026-08-03",
    stock: "in",
    retention: 13.1,
    note: "hGH fragment 176-191.",
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    formula: "C101H152N28O22S2",
    mass: "2174.55",
    klass: "metabolic",
    fill: "10 mg",
    price: 89,
    purity: 99.44,
    lot: "RS-2599-B",
    released: "2026-08-25",
    stock: "in",
    retention: 14.8,
    note: "Mitochondrial-derived 16-residue peptide.",
  },
  {
    slug: "nad",
    name: "NAD+",
    formula: "C21H27N7O14P2",
    mass: "663.43",
    klass: "metabolic",
    fill: "500 mg",
    price: 96,
    purity: 99.68,
    lot: "RS-2606-A",
    released: "2026-09-08",
    stock: "in",
    retention: 3.4,
    note: "Beta-nicotinamide adenine dinucleotide, oxidized form.",
  },

  // ── Cognitive and neuro ──────────────────────────────────────────────
  {
    slug: "semax",
    name: "Semax",
    formula: "C37H51N9O10S",
    mass: "813.93",
    klass: "neuro",
    fill: "10 mg",
    price: 66,
    purity: 99.58,
    lot: "RS-2596-B",
    released: "2026-08-17",
    stock: "in",
    retention: 7.9,
    note: "ACTH (4-10) analogue with a proline-glycine-proline tail.",
  },
  {
    slug: "selank",
    name: "Selank",
    formula: "C33H57N11O9",
    mass: "751.88",
    klass: "neuro",
    fill: "10 mg",
    price: 62,
    purity: 99.49,
    lot: "RS-2594-A",
    released: "2026-08-15",
    stock: "in",
    retention: 7.1,
    note: "Tuftsin analogue.",
  },
  {
    slug: "dsip",
    name: "DSIP",
    formula: "C35H48N10O15",
    mass: "848.82",
    klass: "neuro",
    fill: "5 mg",
    price: 44,
    purity: 99.16,
    lot: "RS-2569-C",
    released: "2026-07-28",
    stock: "low",
    retention: 8.6,
    note: "Delta sleep-inducing nonapeptide.",
  },
  {
    slug: "pinealon",
    name: "Pinealon",
    formula: "C15H26N6O8",
    mass: "418.40",
    klass: "neuro",
    fill: "10 mg",
    price: 46,
    purity: null,
    lot: null,
    released: null,
    stock: "upcoming",
    expected: "2026-10-20",
    retention: 3.9,
    note: "Glu-Asp-Arg tripeptide.",
  },

  // ── Longevity and immune ─────────────────────────────────────────────
  {
    slug: "epithalon",
    name: "Epithalon",
    formula: "C14H22N4O9",
    mass: "390.35",
    klass: "longevity",
    fill: "10 mg",
    price: 43,
    purity: 99.62,
    lot: "RS-2602-A",
    released: "2026-09-01",
    stock: "in",
    retention: 4.3,
    note: "Ala-Glu-Asp-Gly tetrapeptide.",
  },
  {
    slug: "thymosin-alpha-1",
    name: "Thymosin alpha-1",
    formula: "C129H215N33O55",
    mass: "3108.31",
    klass: "longevity",
    fill: "5 mg",
    price: 92,
    purity: 99.27,
    lot: "RS-2581-B",
    released: "2026-08-02",
    stock: "in",
    retention: 12.9,
    note: "28-residue acetylated peptide.",
  },
  {
    slug: "ll-37",
    name: "LL-37",
    formula: "C205H340N60O53",
    mass: "4493.26",
    klass: "longevity",
    fill: "5 mg",
    price: 118,
    purity: 99.05,
    lot: "RS-2554-A",
    released: "2026-07-06",
    stock: "made-to-order",
    retention: 17.2,
    note: "Human cathelicidin antimicrobial peptide.",
  },
  {
    slug: "glutathione",
    name: "Glutathione",
    formula: "C10H17N3O6S",
    mass: "307.32",
    klass: "longevity",
    fill: "600 mg",
    price: 58,
    purity: 99.71,
    lot: "RS-2607-C",
    released: "2026-09-09",
    stock: "in",
    retention: 2.8,
    note: "Reduced form. Tripeptide thiol.",
  },
  {
    slug: "vilon",
    name: "Vilon",
    formula: "C11H21N3O5",
    mass: "275.30",
    klass: "longevity",
    fill: "10 mg",
    price: 39,
    purity: null,
    lot: null,
    released: null,
    stock: "upcoming",
    expected: "2026-11-10",
    retention: 2.2,
    note: "Lys-Glu dipeptide.",
  },

  // ── Endocrine and pigment ────────────────────────────────────────────
  {
    slug: "kisspeptin-10",
    name: "Kisspeptin-10",
    formula: "C63H83N17O14",
    mass: "1302.45",
    klass: "endocrine",
    fill: "5 mg",
    price: 74,
    purity: 99.33,
    lot: "RS-2590-A",
    released: "2026-08-10",
    stock: "in",
    retention: 11.8,
    note: "KISS1 (112-121) decapeptide amide.",
  },
  {
    slug: "melanotan-ii",
    name: "Melanotan II",
    formula: "C50H69N15O9",
    mass: "1024.18",
    klass: "endocrine",
    fill: "10 mg",
    price: 51,
    purity: 99.41,
    lot: "RS-2603-B",
    released: "2026-09-02",
    stock: "in",
    retention: 9.1,
    note: "Cyclic lactam alpha-MSH analogue.",
  },
  {
    slug: "pt-141",
    name: "PT-141",
    formula: "C50H68N14O10",
    mass: "1025.18",
    klass: "endocrine",
    fill: "10 mg",
    price: 69,
    purity: 99.29,
    lot: "RS-2598-D",
    released: "2026-08-21",
    stock: "in",
    retention: 9.4,
    note: "Bremelanotide. Melanocortin receptor agonist.",
  },
];

/**
 * Lays a saved lot over its sequence. The row decides stock, price, fill and
 * the lot itself; the sequence's formula, mass and class never change here.
 */
function withLot(item: CatalogItem, row: LotRecord | undefined): CatalogItem {
  if (!row) return item;
  const base = { ...item, price: row.price, fill: row.fill, retention: row.retention ?? item.retention };
  if (row.stock === "upcoming") {
    return { ...base, stock: "upcoming", purity: null, lot: null, released: null, expected: row.expected ?? item.expected ?? "" };
  }
  return {
    ...base,
    stock: row.stock,
    purity: row.purity!,
    lot: row.lot!,
    released: row.released!,
    expected: row.expected ?? undefined,
    measured: {
      observedMass: row.observedMass,
      water: row.water,
      largestImpurity: row.largestImpurity,
      analyst: row.analyst,
      salt: row.salt,
      appearance: row.appearance,
      certificate: row.certificate,
      sample: row.sample,
    },
  };
}

// Written at build time on Netlify by scripts/pull-lots.mjs; `{}` in the repository.
const LOTS = lotRows as Record<string, LotRecord>;

export const catalogue: CatalogItem[] = SEED.map((item) => withLot(item, LOTS[item.slug]));

/** The sequences as written in code, before any saved lot — for /admin to compare against. */
export const seedCatalogue = SEED;

/** The saved lots this build was made with, so /admin can tell which saves are live yet. */
export const builtLots = LOTS;

/** Every sequence with a lot on record — the ones that have a certificate. */
export const released = catalogue.filter(isReleased);

/** What a waitlist is waiting for, in one line. */
export function waitingFor(item: CatalogItem) {
  if (item.stock === "upcoming") return `First lot expected ${shortDate(item.expected)}`;
  return item.expected ? `Next lot expected ${shortDate(item.expected)}` : "Next lot in synthesis";
}

export const getItem = (slug: string) => catalogue.find((c) => c.slug === slug);

export const SORTS = [
  { key: "name", label: "Name" },
  { key: "purity", label: "Purity" },
  { key: "price", label: "Price" },
  { key: "released", label: "Newest lot" },
] as const;

export type SortKey = (typeof SORTS)[number]["key"];

export const money = (n: number) =>
  `$${n.toFixed(2)}`;

export const shortDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
