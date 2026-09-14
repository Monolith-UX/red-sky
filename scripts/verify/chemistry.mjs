// Recomputes every catalogue formula and average molecular weight from its sequence.
import { readFileSync } from "node:fs";

const AVG = { C: 12.0107, H: 1.00794, N: 14.0067, O: 15.9994, S: 32.065, P: 30.973762, Cu: 63.546 };

// Free amino acids (residue formula = this minus H2O per peptide bond).
const R = {
  G: "C2H5NO2", A: "C3H7NO2", S: "C3H7NO3", P: "C5H9NO2", V: "C5H11NO2", T: "C4H9NO3",
  C: "C3H7NO2S", L: "C6H13NO2", I: "C6H13NO2", N: "C4H8N2O3", D: "C4H7NO4", Q: "C5H10N2O3",
  K: "C6H14N2O2", E: "C5H9NO4", M: "C5H11NO2S", H: "C6H9N3O2", F: "C9H11NO2", R: "C6H14N4O2",
  Y: "C9H11NO3", W: "C11H12N2O2",
  Aib: "C4H9NO2", Nal: "C13H13NO2", MeTrp: "C12H14N2O2", Nle: "C6H13NO2",
};

const parse = (f) => {
  const out = {};
  for (const [, el, n] of f.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[el] = (out[el] ?? 0) + (n ? +n : 1);
  return out;
};
const add = (a, b, k = 1) => {
  const o = { ...a };
  for (const [el, n] of Object.entries(b)) o[el] = (o[el] ?? 0) + k * n;
  return o;
};
const fmt = (f) =>
  ["C", "H", "Cu", "N", "O", "P", "S"].filter((e) => f[e]).map((e) => e + (f[e] > 1 ? f[e] : "")).join("");
const mw = (f) => Object.entries(f).reduce((s, [e, n]) => s + n * AVG[e], 0);

/** residues: array of residue keys; mods: formula deltas */
function peptide(residues, mods = []) {
  let f = {};
  for (const r of residues) f = add(f, parse(R[r]));
  f = add(f, parse("H2O"), -(residues.length - 1));
  for (const m of mods) f = add(f, m.f, m.k);
  return f;
}
const seq = (s) => [...s];
const ACETYL = { f: parse("C2H2O"), k: 1 };
const AMIDE = { f: { N: 1, H: 1, O: -1 }, k: 1 };
const DISULFIDE = { f: parse("H2"), k: -1 };
const LACTAM = { f: parse("H2O"), k: -1 };
const HEXENOYL = { f: parse("C6H8O"), k: 1 };
const CU = { f: { Cu: 1, H: -2 }, k: 1 };

const computed = {
  "bpc-157": peptide(seq("GEPPPGKPADDAGLV")),
  "tb-500": peptide(seq("SDKPDMAEIEKFDKSKLKKTETQEKNPLPSKETIEQEKQAGES"), [ACETYL]),
  "ghk-cu": peptide(seq("GHK"), [CU]),
  kpv: peptide(seq("KPV")),
  ipamorelin: peptide(["Aib", "H", "Nal", "F", "K"], [AMIDE]),
  "cjc-1295-no-dac": peptide(seq("YADAIFTQSYRKVLAQLSARKLLQDILSR"), [AMIDE]),
  hexarelin: peptide(["H", "MeTrp", "A", "W", "F", "K"], [AMIDE]),
  "ghrp-2": peptide(["A", "Nal", "A", "W", "F", "K"], [AMIDE]),
  "ghrp-6": peptide(seq("HWAWFK"), [AMIDE]),
  sermorelin: peptide(seq("YADAIFTNSYRKVLGQLSARKLLQDIMSR"), [AMIDE]),
  tesamorelin: peptide(seq("YADAIFTNSYRKVLGQLSARKLLQDIMSRQQGESNQERGARARL"), [AMIDE, HEXENOYL]),
  "aod-9604": peptide(seq("YLRIVQCRSVEGSCGF"), [DISULFIDE]),
  "mots-c": peptide(seq("MRWQEMGYIFYPRKLR")),
  nad: parse("C21H27N7O14P2"),
  semax: peptide(seq("MEHFPGP")),
  selank: peptide(seq("TKPRPGP")),
  dsip: peptide(seq("WAGGDASGE")),
  epithalon: peptide(seq("AEDG")),
  "thymosin-alpha-1": peptide(seq("SDAAVDTSSEITTKDLKEKKEVVEEAEN"), [ACETYL]),
  "ll-37": peptide(seq("LLGDFFRKSKEKIGKEFKRIVQRIKDFLRNLVPRTES")),
  glutathione: peptide(seq("ECG")),
  "kisspeptin-10": peptide(seq("YNWNSFGLRF"), [AMIDE]),
  "melanotan-ii": peptide(["Nle", "D", "H", "F", "R", "W", "K"], [ACETYL, AMIDE, LACTAM]),
  "pt-141": peptide(["Nle", "D", "H", "F", "R", "W", "K"], [ACETYL, LACTAM]),
};

const src = readFileSync(new URL("../../src/lib/catalog.ts", import.meta.url), "utf8");
const entries = [...src.matchAll(/slug: "([^"]+)",[\s\S]*?formula: "([^"]+)",\s*mass: "([^"]+)"/g)];

let bad = 0;
for (const [, slug, formula, mass] of entries) {
  const f = computed[slug];
  if (!f) { console.log(`?  ${slug.padEnd(18)} no sequence to check`); continue; }
  const cf = fmt(f), cm = mw(f);
  const fOk = cf === formula, mOk = Math.abs(cm - Number(mass)) < 0.2;
  if (!fOk || !mOk) bad++;
  console.log(`${fOk && mOk ? "ok" : "XX"} ${slug.padEnd(18)} listed ${formula.padEnd(18)} ${mass.padStart(8)} | computed ${cf.padEnd(18)} ${cm.toFixed(2).padStart(8)}`);
}
console.log(`\n${entries.length} entries, ${bad} mismatches`);
