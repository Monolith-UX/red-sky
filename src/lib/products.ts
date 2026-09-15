import type { CatalogItem, ClassKey, StockState } from "./catalog";
import { CLASSES } from "./catalog";
import { clean } from "./forms";

/**
 * A product as staff manage it in /admin/products: the sequence's own facts
 * (name, formula, average mass, class, amino-acid sequence, salt form,
 * appearance) and its images, plus the shelf values it starts with. The lot
 * on the shelf is edited separately (`lots.ts`) and laid over these.
 *
 * Saved rows live in the store. At build time on Netlify they are written to
 * `products.json`; once there is at least one, the catalogue is built from
 * them rather than from the sample products written in `catalog.ts`.
 */

export type ProductImage = { id: string; type: ImageType; alt: string; version: number };
export type ImageType = "image/png" | "image/jpeg" | "image/webp";

export type ProductRecord = {
  slug: string;
  name: string;
  formula: string;
  /** Average molecular weight in Da, as text so it prints exactly as entered. */
  mass: string;
  klass: ClassKey;
  note: string;
  sequence: string | null;
  salt: string | null;
  appearance: string | null;
  images: ProductImage[];
  /** Shelf values the product starts with; a saved lot replaces them. */
  stock: StockState;
  price: number;
  fill: string;
  retention: number;
  lot: string | null;
  purity: number | null;
  released: string | null;
  expected: string | null;
  position: number;
  /** Removed from the site, kept so past orders still name it. */
  archived: boolean;
  updated: string;
  updatedBy: string;
};

export const MAX_IMAGES = 8;
export const IMAGE_LIMIT = 4 * 1024 * 1024;

export const imagePath = (slug: string, img: Pick<ProductImage, "id" | "version">) =>
  `/api/product-image/${slug}/${img.id}?v=${img.version}`;

/* ── Molecular weight ──────────────────────────────────────── */

/** IUPAC standard atomic weights, the same table scripts/verify/chemistry.mjs checks against. */
const AVG: Record<string, number> = {
  C: 12.0107, H: 1.00794, N: 14.0067, O: 15.9994, S: 32.065, P: 30.973762, Cu: 63.546,
  Na: 22.98977, Cl: 35.453, F: 18.998403, Br: 79.904, I: 126.90447, Zn: 65.38, Mg: 24.305, K: 39.0983,
};

/** Average molecular weight from a Hill formula, or null if it names an unknown element. */
export function averageMass(formula: string): number | null {
  if (!/^([A-Z][a-z]?\d*)+$/.test(formula)) return null;
  let total = 0;
  for (const [, el, n] of formula.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    if (!(el in AVG)) return null;
    total += AVG[el] * (n ? Number(n) : 1);
  }
  return total;
}

/* ── The catalogue item a row becomes ──────────────────────── */

export function productToItem(p: ProductRecord): CatalogItem {
  const base = {
    slug: p.slug,
    name: p.name,
    formula: p.formula,
    mass: p.mass,
    klass: p.klass,
    fill: p.fill,
    price: p.price,
    retention: p.retention,
    note: p.note,
    sequence: p.sequence,
    salt: p.salt,
    appearance: p.appearance,
    images: p.images,
  };
  if (p.stock === "upcoming" || p.lot === null || p.purity === null || p.released === null) {
    return { ...base, stock: "upcoming", purity: null, lot: null, released: null, expected: p.expected ?? "" };
  }
  return { ...base, stock: p.stock, purity: p.purity, lot: p.lot, released: p.released, expected: p.expected ?? undefined };
}

/* ── The staff form ────────────────────────────────────────── */

const isClass = (v: unknown): v is ClassKey => CLASSES.some((c) => c.key === v);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "Tesamorelin (acetate)" → "tesamorelin-acetate". */
export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export type ProductFields = Pick<
  ProductRecord,
  "slug" | "name" | "formula" | "mass" | "klass" | "note" | "sequence" | "salt" | "appearance"
> & { start?: { price: number; fill: string; expected: string } };

/**
 * Reads the product form. A new product also states what it starts with on
 * the shelf — a price, a fill and the date its first lot is expected — and
 * appears as "Coming soon" until a lot is released for it.
 */
export function readProductForm(form: FormData, isNew: boolean): { product: ProductFields } | { error: string } {
  const name = clean(form.get("name"), 60);
  if (!name) return { error: "Enter the product name as it should appear in the catalogue." };

  const slug = isNew ? clean(form.get("slug"), 60).toLowerCase() || slugify(name) : clean(form.get("slug"), 60);
  if (!SLUG.test(slug)) return { error: "The web address may use lowercase letters, numbers and single hyphens only." };

  const formula = clean(form.get("formula"), 60).replace(/\s+/g, "");
  const computed = averageMass(formula);
  if (computed === null) return { error: "Enter the molecular formula in Hill notation, e.g. C62H98N16O22." };

  const massText = clean(form.get("mass"), 12);
  const mass = Number(massText);
  if (!massText || !Number.isFinite(mass) || mass <= 0) return { error: "Enter the average molecular weight in daltons." };
  // The same tolerance the chemistry script allows: a rounding difference, not a different molecule.
  if (Math.abs(mass - computed) > 0.1) {
    return { error: `That formula weighs ${computed.toFixed(2)} Da on average, not ${mass.toFixed(2)}. Check the formula or the mass.` };
  }

  const klass = form.get("klass");
  if (!isClass(klass)) return { error: "Choose the catalogue class." };

  const note = clean(form.get("note"), 200);
  if (!note) return { error: "Add a one-line note, e.g. what the sequence is derived from." };

  const product: ProductFields = {
    slug,
    name,
    formula,
    mass: mass.toFixed(2),
    klass,
    note,
    sequence: clean(form.get("sequence"), 200) || null,
    salt: clean(form.get("salt"), 60) || null,
    appearance: clean(form.get("appearance"), 80) || null,
  };

  if (isNew) {
    const price = Number(clean(form.get("price"), 12));
    if (!Number.isFinite(price) || price <= 0) return { error: "Enter the price per vial in dollars." };
    const fill = clean(form.get("fill"), 20);
    if (!fill) return { error: "Enter the fill per vial, e.g. 5 mg." };
    const expected = clean(form.get("expected"), 10);
    if (!DATE.test(expected) || Number.isNaN(Date.parse(expected))) {
      return { error: "Enter the date the first lot is expected. It shows as Coming soon until then." };
    }
    product.start = { price: Math.round(price * 100) / 100, fill, expected };
  }

  return { product };
}
