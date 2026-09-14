import type { StockState } from "./catalog";
import { clean } from "./forms";

/**
 * A lot as staff record it in /admin: what is on the shelf, at what price,
 * and the measurements its certificate reports. Sequence facts — name,
 * formula, average mass, class — stay in `catalog.ts`; this is everything
 * that changes from one lot to the next.
 *
 * Saved rows live in the store (Supabase in production). At build time on
 * Netlify, `scripts/pull-lots.mjs` writes them to `lots.json`, and
 * `catalog.ts` lays them over the sequences. A sequence with no row keeps
 * the sample values written in code.
 */
export type LotRecord = {
  slug: string;
  stock: StockState;
  price: number;
  fill: string;
  lot: string | null;
  purity: number | null;
  released: string | null;
  expected: string | null;
  retention: number | null;
  /** Measured, in Da. The theoretical figure comes from the formula. */
  observedMass: number | null;
  water: number | null;
  /** As the certificate prints it, e.g. "0.14% at 1.7 min". */
  largestImpurity: string | null;
  analyst: string | null;
  salt: string | null;
  appearance: string | null;
  /** Store path of the certificate PDF, if one has been uploaded. */
  certificate: string | null;
  /** Figures are placeholders, not a real release. */
  sample: boolean;
  updated: string;
  updatedBy: string;
};

/** Times on staff pages, in the lab's own time zone: "Sep 14, 06:45 PM". */
export const staffTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });

export const STOCK_STATES: { value: StockState; label: string }[] = [
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
  { value: "made-to-order", label: "Made to order" },
  { value: "upcoming", label: "Upcoming — no lot yet" },
];

const isStock = (v: unknown): v is StockState => STOCK_STATES.some((s) => s.value === v);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function num(v: FormDataEntryValue | null, min: number, max: number) {
  const s = clean(v, 20);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= min && n <= max ? n : NaN;
}

function day(v: FormDataEntryValue | null) {
  const s = clean(v, 10);
  if (!s) return null;
  return DATE.test(s) && !Number.isNaN(Date.parse(s)) ? s : "invalid";
}

/**
 * Reads and checks the admin form. Returns the record, or the first problem
 * in words staff can act on. A released lot needs its number, purity and
 * release date; an upcoming one needs an expected date and nothing else.
 */
export function readLotForm(
  slug: string,
  form: FormData,
  actor: string,
): { lot: Omit<LotRecord, "certificate" | "updated"> } | { error: string } {
  const stock = form.get("stock");
  if (!isStock(stock)) return { error: "Choose a stock state." };

  const price = num(form.get("price"), 0, 100000);
  if (price === null || Number.isNaN(price)) return { error: "Enter the price per vial in dollars, e.g. 48 or 48.50." };

  const fill = clean(form.get("fill"), 20);
  if (!fill) return { error: "Enter the fill per vial, e.g. 5 mg." };

  const expected = day(form.get("expected"));
  if (expected === "invalid") return { error: "The expected date must be a date." };

  const fields = {
    slug,
    stock,
    price,
    fill,
    expected,
    sample: form.get("sample") === "on",
    updatedBy: actor,
  };

  if (stock === "upcoming") {
    if (!expected) return { error: "An upcoming sequence needs the date its first lot is expected." };
    return {
      lot: {
        ...fields,
        lot: null,
        purity: null,
        released: null,
        retention: null,
        observedMass: null,
        water: null,
        largestImpurity: null,
        analyst: null,
        salt: null,
        appearance: null,
      },
    };
  }

  const lot = clean(form.get("lot"), 24).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(lot)) return { error: "Enter the lot number as printed on the vial, e.g. RS-2604-C." };

  const purity = num(form.get("purity"), 0, 100);
  if (purity === null || Number.isNaN(purity)) return { error: "Enter the area purity as a percentage between 0 and 100." };

  const released = day(form.get("released"));
  if (!released || released === "invalid") return { error: "Enter the date the lot was released." };

  const retention = num(form.get("retention"), 0, 120);
  if (Number.isNaN(retention)) return { error: "Retention is in minutes, between 0 and 120." };
  const observedMass = num(form.get("observedMass"), 0, 100000);
  if (Number.isNaN(observedMass)) return { error: "Observed mass is in daltons." };
  const water = num(form.get("water"), 0, 100);
  if (Number.isNaN(water)) return { error: "Water content is a percentage between 0 and 100." };

  const largestImpurity = clean(form.get("largestImpurity"), 60) || null;
  const analyst = clean(form.get("analyst"), 12) || null;

  // A blank figure would be filled with a generated sample value on the site,
  // so a real lot must state every one; only a lot marked sample may leave gaps.
  if (!fields.sample) {
    const missing = [
      [retention, "retention time"],
      [observedMass, "observed mass"],
      [water, "water content"],
      [largestImpurity, "largest impurity"],
      [analyst, "analyst's initials"],
    ].find(([v]) => v === null);
    if (missing) {
      return { error: `Enter the ${missing[1]} from the certificate, or tick "These figures are sample data".` };
    }
  }

  return {
    lot: {
      ...fields,
      lot,
      purity: Math.round(purity * 100) / 100,
      released,
      retention,
      observedMass,
      water,
      largestImpurity,
      analyst,
      salt: clean(form.get("salt"), 60) || null,
      appearance: clean(form.get("appearance"), 80) || null,
    },
  };
}
