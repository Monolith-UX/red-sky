import type { Metadata } from "next";
import { PageMasthead } from "@/components/page-masthead";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { CLASSES, catalogue } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catalogue — Red Sky",
  description:
    "Every sequence Red Sky holds, with its lot number, area purity, retention time and released chromatogram.",
};

export default function CatalogPage() {
  const floor = Math.min(...catalogue.map((c) => c.purity));

  return (
    <>
      <PageMasthead
        eyebrow="Catalogue — every lot on the shelf"
        heading="Nothing here ships without its trace."
        lead="Each card carries the lot number, the area purity and the chromatogram that lot actually produced. Filter by class or availability; the numbers are the ones on the certificate."
        stats={[
          { label: "Sequences", value: String(catalogue.length) },
          { label: "Classes", value: String(CLASSES.length) },
          { label: "Lowest purity held", value: `${floor.toFixed(2)}%` },
        ]}
      />

      <section className="shell pb-24 pt-4 md:pb-32">
        <CatalogBrowser />
      </section>
    </>
  );
}
