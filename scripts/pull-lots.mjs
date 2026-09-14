// Runs before `next build` (npm "prebuild"). On Netlify, pulls the lots saved in /admin
// from Supabase into src/lib/lots.json, which catalog.ts lays over the sample lots.
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
