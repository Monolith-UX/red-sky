import { STOCK_LABEL, type CatalogItem } from "./catalog";
import { coaFor } from "./coa";
import type { Faq } from "./faqs";

/**
 * Built from the lot's own release data rather than hand-written per product,
 * so every answer stays true when a new lot is released. Anything genuinely
 * specific to one sequence is added from EXTRA below.
 */

const LEAD: Record<CatalogItem["stock"], string> = {
  in: "It is in stock. Orders placed before 14:00 Eastern ship the same business day.",
  low: "Fewer than ten vials remain on this lot, but it is in stock and ships the same business day on orders placed before 14:00 Eastern.",
  "made-to-order":
    "This one is synthesized to order rather than held on the shelf. Expect ten to fifteen business days from order to dispatch, and you will get the certificate for your own lot rather than a shared one.",
};

const EXTRA: Record<string, Faq[]> = {
  "ghk-cu": [
    {
      q: "Why is the powder blue?",
      a: "The colour comes from the copper centre in the complex, not from anything about the grade. Apparent shade varies with fill depth and cake density, so two vials from the same lot can look different. Read the certificate rather than the glass.",
    },
  ],
  nad: [
    {
      q: "NAD+ is not a peptide. Why is it in a peptide catalogue?",
      a: "Because the same benches order it. It is a dinucleotide coenzyme, supplied as the free acid, and it is released against the same analytical standard as everything else here: HPLC purity, mass confirmation and a published certificate.",
    },
  ],
  glutathione: [
    {
      q: "Is this the reduced or the oxidized form?",
      a: "Reduced glutathione, GSH, supplied as the free acid. The thiol is the reactive part and it oxidises on exposure to air, so keep vials sealed and cold and reconstitute immediately before use.",
    },
  ],
  "bpc-157": [
    {
      q: "Is this the arginate salt or the acetate?",
      a: "The catalogue lot is a trifluoroacetate salt, which is what comes off preparative RP-HPLC. The salt form is stated on every certificate because it changes the mass you weigh out. Other salt forms are available as a custom synthesis.",
    },
  ],
  "tb-500": [
    {
      q: "Is this full-length thymosin beta-4 or the active fragment?",
      a: "The catalogue lot is the full 43-residue sequence, which is why the mass is 4963.44 Da rather than the smaller figure quoted for fragment preparations. The sequence is printed on the certificate so you can check which one you have.",
    },
  ],
};

export function productFaqs(item: CatalogItem): Faq[] {
  const coa = coaFor(item);
  const appearance = coa.appearance.replace(/^./, (c) => c.toLowerCase());

  const base: Faq[] = [
    {
      q: `What purity is the current ${item.name} lot?`,
      a: `Lot ${item.lot} assayed at ${coa.purity} area purity by reverse-phase HPLC at 214 nm, with the principal peak at ${coa.retention}. The released chromatogram is shown on this page, and the integration report ships with the vial.`,
    },
    {
      q: "What is the largest impurity in this lot?",
      a: `${coa.largestImpurity}. Impurities eluting just before the main peak are typically deletion sequences; those just after are more often oxidation products. Both are marked on the released trace.`,
    },
    {
      q: `Does ${coa.purity} mean the vial is ${coa.purity} peptide by weight?`,
      a: `No. Area purity counts UV-absorbing material only, so water, counterions and salts are invisible to it. This lot is supplied as ${coa.salt.toLowerCase()} with a measured water content of ${coa.water}, which means net peptide content sits below the area purity figure. We will send the net figure for this lot on request.`,
    },
    {
      q: `How should I store and reconstitute ${item.name}?`,
      a: `It leaves us as ${appearance}. Hold sealed vials at −20 °C and out of light. Bring a vial to room temperature before breaking the seal so nothing condenses onto the cake, then run diluent slowly down the inside wall and swirl rather than shake — foaming costs you material at the air-water interface.`,
    },
    {
      q: "How quickly does it ship, and can I order a different fill?",
      a: `${LEAD[item.stock]} The catalogue fill is ${item.fill} per vial; other fills, bulk quantities and custom synthesis are quoted within one business day at lab@redskybio.com.`,
    },
    {
      q: `Can you advise on how to use ${item.name}?`,
      a: `No. ${item.name} is sold for in-vitro laboratory research only. It is not a drug, and we do not give dosing, medical or veterinary guidance of any kind. We are glad to help with solubility, handling, reconstitution and anything on the certificate.`,
    },
  ];

  return [...base, ...(EXTRA[item.slug] ?? [])];
}
