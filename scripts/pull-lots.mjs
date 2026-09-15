// Runs before `next build` (npm "prebuild"). On Netlify, pulls the lots and products saved
// in /admin from Supabase into src/lib/lots.json and src/lib/products.json, which catalog.ts
// builds the catalogue from.
//
// Elsewhere it does nothing and the repository's `{}` stands, so local builds show the
// sample catalogue. `node scripts/pull-lots.mjs --force` pulls locally too (it changes a
// tracked file; don't commit the result).
//
// On Netlify a failed pull fails the build, so the live site keeps its last good
// catalogue instead of quietly reverting to sample data.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../src/lib/lots.json", import.meta.url));
const PRODUCTS_OUT = fileURLToPath(new URL("../src/lib/products.json", import.meta.url));
const force = process.argv.includes("--force");

if (process.env.NETLIFY !== "true" && !force) {
  console.log("pull-lots: not a Netlify build; keeping src/lib/lots.json as it is.");
  process.exit(0);
}
if (force) {
  try { process.loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url))); } catch {}
}

const url = process.env.SUPABASE_URL?.trim().replace(/\/(rest\/v1\/?)?$/, "");
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error("pull-lots: SUPABASE_URL and SUPABASE_SECRET_KEY must be available to builds.");
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const db = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await db.from("lots").select();
if (error) {
  console.error(`pull-lots: ${error.message}`);
  process.exit(1);
}

const num = (v) => (v === null ? null : Number(v));
const lots = Object.fromEntries(
  data.map((r) => [
    r.slug,
    {
      slug: r.slug,
      stock: r.stock,
      price: Number(r.price),
      fill: r.fill,
      lot: r.lot,
      purity: num(r.purity),
      released: r.released,
      expected: r.expected,
      retention: num(r.retention),
      observedMass: num(r.observed_mass),
      water: num(r.water),
      largestImpurity: r.largest_impurity,
      analyst: r.analyst,
      salt: r.salt,
      appearance: r.appearance,
      certificate: r.certificate,
      sample: r.sample,
      updated: new Date(r.updated).toISOString(),
      updatedBy: r.updated_by,
    },
  ]),
);

writeFileSync(OUT, JSON.stringify(lots, null, 2) + "\n");
console.log(`pull-lots: ${data.length} saved lot${data.length === 1 ? "" : "s"} written to src/lib/lots.json.`);

// Products, the same way: once any exist, the catalogue is built from them.
const products = await db.from("products").select();
// Before the products migration is run the table does not exist: build from the sample products.
if (products.error?.code === "PGRST205") {
  writeFileSync(PRODUCTS_OUT, "{}\n");
  console.warn("pull-lots: no products table yet (run supabase/migrations/20260917000000_products.sql); using the sample products.");
  process.exit(0);
}
if (products.error) {
  console.error(`pull-lots: products: ${products.error.message}`);
  process.exit(1);
}
const rows = Object.fromEntries(
  products.data.map((r) => [
    r.slug,
    {
      slug: r.slug,
      name: r.name,
      formula: r.formula,
      mass: r.mass,
      klass: r.klass,
      note: r.note,
      sequence: r.sequence,
      salt: r.salt,
      appearance: r.appearance,
      images: r.images ?? [],
      stock: r.stock,
      price: Number(r.price),
      fill: r.fill,
      retention: Number(r.retention),
      lot: r.lot,
      purity: num(r.purity),
      released: r.released,
      expected: r.expected,
      position: r.position,
      archived: r.archived,
      updated: new Date(r.updated).toISOString(),
      updatedBy: r.updated_by,
    },
  ]),
);
writeFileSync(PRODUCTS_OUT, JSON.stringify(rows, null, 2) + "\n");
console.log(`pull-lots: ${products.data.length} saved product${products.data.length === 1 ? "" : "s"} written to src/lib/products.json.`);
