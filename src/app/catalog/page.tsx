import type { Metadata } from "next";
import { HeroCarousel } from "@/components/hero-carousel";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { catalogSlides } from "@/lib/content";

export const metadata: Metadata = {
  title: "Catalogue — Red Sky",
  description:
    "Every sequence Red Sky holds, with its lot number, area purity, retention time and a trace drawn from its certificate.",
};

export default function CatalogPage() {
  return (
    <>
      <HeroCarousel slides={catalogSlides} label="The catalogue, read three ways" />

      <section id="browse" aria-label="All sequences" className="shell scroll-mt-20 pb-24 pt-4 md:pb-32">
        <CatalogBrowser />
      </section>
    </>
  );
}
