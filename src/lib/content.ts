import { canOrder, catalogue, getItem, released, shortDate } from "./catalog";
import { traceFor } from "./trace";

type SlideBase = {
  id: string;
  eyebrow: string;
  heading: string;
  body: string;
  metric: string;
  metricLabel: string;
  readingCaption: string;
  /** A link, or — when `add` lists sequences — a button that puts them in the cart. */
  actions: { label: string; href: string; add?: string[] }[];
};

/**
 * A slide reads an instrument through the window, or — for a release — shows
 * the lots themselves standing in it. `trace` swaps the drawn reading for a
 * trace drawn from a real lot's own retention and purity.
 */
export type Slide = SlideBase &
  (
    | {
        kind: "reading";
        reading: "hplc" | "ms" | "coldchain";
        rulerMarks: string[];
        trace?: string;
        alt?: string;
      }
    | {
        kind: "stack";
        /** Catalogue slugs; names, purities and vial labels come from the lots. */
        lots: string[];
        alt: string;
      }
  );

/** A lot's trace in the hero window's 620 × 380 frame. */
const windowTrace = (retention: number, purity: number) =>
  traceFor(retention, purity, { x: 0, w: 620, top: 60, base: 300 });

const HOME_ACTIONS = [
  { label: "Browse the catalog", href: "#catalog" },
  { label: "See a certificate", href: "/catalog/bpc-157#certificate" },
];

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
    actions: HOME_ACTIONS,
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
    actions: HOME_ACTIONS,
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
    actions: HOME_ACTIONS,
  },
  {
    id: "stack",
    kind: "stack",
    eyebrow: "New — stack RS-WV / BPC-157 + TB-500",
    heading: "Introducing the Wolverine Stack",
    body: "Our two most-ordered sequences, released as a matched lot pair. Both assayed the same week, both carried on the same cold chain, both certificates in the same envelope.",
    metric: "$96.00",
    metricLabel: "Stack price · $14.00 below separate",
    readingCaption: "Lot pair RS-2601-B / RS-2559-A · 5 mg each · ships same day",
    lots: ["bpc-157", "tb-500"],
    alt: "The two vials of the Wolverine Stack, BPC-157 lot RS-2601-B and TB-500 lot RS-2559-A, standing in the Red Sky disc.",
    actions: [
      { label: "Add the stack · $96.00", href: "/cart", add: ["bpc-157", "tb-500"] },
      { label: "Both certificates", href: "/certificates" },
    ],
  },
];

/* ── Catalogue hero ────────────────────────────────────────────────── */

// Held on the shelf: made-to-order lots are synthesized per order, so they do not count.
const onShelf = released.filter((c) => canOrder(c) && c.stock !== "made-to-order");
const floorLot = onShelf.reduce((lo, c) => (c.purity < lo.purity ? c : lo));
const newest = [...released].sort((a, b) => b.released.localeCompare(a.released))[0];
const announced = catalogue.flatMap((c) => (c.stock === "upcoming" ? [c] : []));

/**
 * Three readings for the catalogue masthead, all computed from the lots so
 * they stay true as lots change: the floor of what is on the shelf, the most
 * recent release, and what has been announced but not yet released.
 */
export const catalogSlides: Slide[] = [
  {
    id: "floor",
    kind: "reading",
    eyebrow: "Catalogue — every lot on the shelf",
    heading: "Nothing here ships without its trace.",
    body: "Each card carries the lot number, the area purity and a trace drawn from its certificate. Filter by class or availability; the numbers are the ones on the certificate.",
    metric: `${floorLot.purity.toFixed(2)}%`,
    metricLabel: `Lowest purity on the shelf · ${floorLot.name}`,
    reading: "hplc",
    trace: windowTrace(floorLot.retention, floorLot.purity),
    alt: `Chromatogram for ${floorLot.name} lot ${floorLot.lot}: one principal peak at ${floorLot.retention} minutes, ${floorLot.purity.toFixed(2)} percent of total area — the lowest purity of any lot on sale.`,
    readingCaption: `${floorLot.name} · lot ${floorLot.lot} · retention ${floorLot.retention.toFixed(1)} min · the floor, not the average`,
    rulerMarks: ["0", "8", "16", "24 min"],
    actions: [
      { label: `Browse all ${catalogue.length}`, href: "#browse" },
      { label: "How every lot is tested", href: "/testing" },
    ],
  },
  {
    id: "newest",
    kind: "reading",
    eyebrow: `Newest lot — ${newest.name} / ${newest.lot}`,
    heading: "On the shelf the day its certificate is.",
    body: `${newest.name} lot ${newest.lot} cleared release on ${shortDate(newest.released)} at ${newest.purity.toFixed(2)}% area purity. Its certificate went up the same day, and so did its card below.`,
    metric: `${newest.purity.toFixed(2)}%`,
    metricLabel: `Area purity · released ${shortDate(newest.released)}`,
    reading: "hplc",
    trace: windowTrace(newest.retention, newest.purity),
    alt: `Chromatogram for ${newest.name} lot ${newest.lot}: one principal peak at ${newest.retention} minutes, ${newest.purity.toFixed(2)} percent of total area.`,
    readingCaption: `${newest.formula} · retention ${newest.retention.toFixed(1)} min · ${newest.fill} per vial`,
    rulerMarks: ["0", "8", "16", "24 min"],
    actions: [
      { label: `Read its certificate`, href: `/catalog/${newest.slug}#certificate` },
      { label: "Browse the catalogue", href: "#browse" },
    ],
  },
  ...(announced.length
    ? [
        {
          id: "announced",
          kind: "reading" as const,
          eyebrow: `Coming soon — ${announced.map((a) => a.name).join(" and ")}`,
          heading: "On the list before it is on the shelf.",
          body: "Nothing announced can be ordered until its first lot clears release. Join a waitlist and you get one email, the day the certificate goes up.",
          metric: shortDate(announced[0].expected).replace(/, \d{4}$/, ""),
          metricLabel: `${announced[0].name} · first lot expected`,
          reading: "ms" as const,
          readingCaption: `${announced
            .map((a) => `${a.name} ${shortDate(a.expected).replace(/, \d{4}$/, "")}`)
            .join(" · ")} · tandem MS on first production`,
          rulerMarks: ["400", "900", "1400", "1900 m/z"],
          actions: [
            { label: "Join the waitlist", href: `/catalog/${announced[0].slug}` },
            { label: "Custom synthesis", href: "/contact?topic=synthesis" },
          ],
        },
      ]
    : []),
];

/** Resolves a stack's slugs to released lots, dropping anything not on record. */
export const stackLots = (slugs: string[]) =>
  slugs.flatMap((s) => {
    const item = getItem(s);
    return item && item.purity !== null ? [item] : [];
  });

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

export type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  /**
   * True only for a real customer's words, used with their written consent.
   * Endorsements attributed to people who do not exist are what the FTC's
   * 2024 rule on fake reviews and testimonials prohibits, so nothing unverified
   * renders — the section shows `verification` below instead.
   */
  verified: boolean;
};

// Placeholder copy from the first build. Replace with consented quotes and set verified.
export const testimonials: Testimonial[] = [
  {
    quote:
      "We re-ran three lots on our own column before switching suppliers. All three came back within 0.2% of the certificate. That has not been our experience elsewhere.",
    name: "Analytical chemist",
    detail: "Contract research laboratory, Massachusetts",
    verified: false,
  },
  {
    quote:
      "The temperature logger in the box is the detail that sold me. I have opened too many warm boxes.",
    name: "Laboratory manager",
    detail: "University research group",
    verified: false,
  },
  {
    quote:
      "Formula, lot number and the actual chromatogram, all on the product page. I never have to email anyone to find out what I am buying.",
    name: "Independent researcher",
    detail: "Boulder, Colorado",
    verified: false,
  },
];

/**
 * What stands in the attestation slot until real testimonials exist: the
 * invitation to check the work, made only of commitments the terms and the
 * journal already make.
 */
export const verification = [
  {
    title: "Raw data on request",
    body: "Ask by lot number and we send the integration report and the raw chromatogram file, so you can compare like with like on your own instrument.",
  },
  {
    title: "Fourteen days to challenge a lot",
    body: "If a lot does not meet its certificate, tell us within fourteen days of delivery and we replace it or refund it in full.",
  },
  {
    title: "Failed lots are published",
    body: "A lot that misses release is destroyed, and the miss goes into the monthly release notes with the trace and the cause.",
  },
];

export type NavItem = { label: string; href: string; match?: string };

/** One destination per label, in the order the header reads them. */
export const nav: NavItem[] = [
  { label: "About Us", href: "/about", match: "/about" },
  { label: "Catalog", href: "/catalog", match: "/catalog" },
  { label: "Testing", href: "/testing", match: "/testing" },
  { label: "Handling", href: "/handling", match: "/handling" },
  { label: "Client Stories", href: "/stories", match: "/stories" },
  { label: "Blog", href: "/blog", match: "/blog" },
  { label: "Contact", href: "/contact", match: "/contact" },
];
