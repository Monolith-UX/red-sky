type SlideBase = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  metric: string;
  metricLabel: string;
  readingCaption: string;
};

/** Slides 1-3 read an instrument. Slide 4 reads a product through the same slot. */
export type Slide = SlideBase &
  (
    | {
        kind: "reading";
        reading: "hplc" | "ms" | "coldchain";
        rulerMarks: string[];
      }
    | {
        kind: "image";
        src: string;
        alt: string;
        stack: { name: string; purity: string }[];
      }
  );

export const slides: Slide[] = [
  {
    id: "purity",
    kind: "reading",
    eyebrow: "Assay — RP-HPLC / UV 214 nm",
    heading: "Purity you can read off the chromatogram.",
    body: "Every lot is assayed by reverse-phase HPLC before it leaves the freezer. The trace, the integration and the operator's initials ship with the vial.",
    metric: "99.47%",
    metricLabel: "Area purity · lot RS-2601-B",
    reading: "hplc",
    readingCaption: "BPC-157 · retention 12.4 min · single principal peak",
    rulerMarks: ["0", "8", "16", "24 min"],
  },
  {
    id: "identity",
    kind: "reading",
    eyebrow: "Identity — ESI-MS / positive mode",
    heading: "The molecule is the one on the label.",
    body: "Mass spectrometry confirms the monoisotopic mass of every sequence we sell, observed against theoretical, to two decimal places.",
    metric: "1419.53 Da",
    metricLabel: "Observed · theoretical 1419.55",
    reading: "ms",
    readingCaption: "C62H98N16O22 · [M+H]+ and [M+2H]2+ resolved",
    rulerMarks: ["400", "900", "1400", "1900 m/z"],
  },
  {
    id: "integrity",
    kind: "reading",
    eyebrow: "Handling — cold chain / continuous",
    heading: "Lyophilized cold, shipped cold, logged the whole way.",
    body: "Vials leave the freezer at −20 °C and travel on gel packs with a temperature logger in the box. If the chain breaks, you see it before you open it.",
    metric: "−20 °C",
    metricLabel: "Unbroken · 412 shipments YTD",
    reading: "coldchain",
    readingCaption: "Pack-out to delivery · 61 h · no excursion above −14 °C",
    rulerMarks: ["0", "20", "40", "61 h"],
  },
  {
    id: "stack",
    kind: "image",
    eyebrow: "New — stack RS-WV / BPC-157 + TB-500",
    heading: "Introducing the Wolverine Stack",
    body: "Our two most-ordered sequences, released as a matched lot pair. Both assayed the same week, both carried on the same cold chain, both certificates in the same envelope.",
    metric: "$96.00",
    metricLabel: "Stack price · $14.00 below separate",
    readingCaption: "Lot pair RS-2601-B / RS-2559-A · 5 mg each · ships same day",
    src: "/img/wolverine-stack.jpg",
    alt: "Wolverine Stack release artwork.",
    stack: [
      { name: "BPC-157", purity: "99.47%" },
      { name: "TB-500", purity: "99.12%" },
    ],
  },
];

export const assurances = [
  { value: "≥ 99%", label: "Area purity floor" },
  { value: "2 of 2", label: "HPLC and ESI-MS, every lot" },
  { value: "100%", label: "Certificates published" },
  { value: "−20 °C", label: "Cold chain, door to door" },
];

export const method = [
  { step: "01", title: "Synthesis", body: "Solid-phase, Fmoc chemistry, then preparative RP-HPLC to strip the deletion sequences." },
  { step: "02", title: "Assay", body: "Analytical HPLC at 214 nm. Area purity recorded to two decimals against the released trace." },
  { step: "03", title: "Identity", body: "ESI-MS in positive mode. Observed monoisotopic mass compared with theoretical before release." },
  { step: "04", title: "Release", body: "Lyophilized under nitrogen, sealed, lot-stamped, logged and returned to −20 °C storage." },
];

export const testimonials = [
  {
    quote:
      "We re-ran three lots on our own column before switching suppliers. All three came back within 0.2% of the certificate. That has not been our experience elsewhere.",
    name: "Analytical chemist",
    detail: "Contract research laboratory, Massachusetts",
  },
  {
    quote:
      "The temperature logger in the box is the detail that sold me. I have opened too many warm boxes.",
    name: "Laboratory manager",
    detail: "University research group",
  },
  {
    quote:
      "Formula, lot number and the actual chromatogram, all on the product page. I never have to email anyone to find out what I am buying.",
    name: "Independent researcher",
    detail: "Boulder, Colorado",
  },
];

export type NavItem = { label: string; href: string; match?: string };

export const nav: NavItem[] = [
  { label: "Catalog", href: "/catalog", match: "/catalog" },
  { label: "Testing", href: "/#method" },
  { label: "Handling", href: "/#method" },
  { label: "Journal", href: "/blog?category=release-notes" },
  { label: "Blog", href: "/blog", match: "/blog" },
  { label: "About Us", href: "/#attestation" },
  { label: "Contact", href: "/#newsletter" },
];
