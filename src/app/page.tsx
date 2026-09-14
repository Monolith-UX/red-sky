import { HeroCarousel } from "@/components/hero-carousel";
import { AssuranceStrip } from "@/components/assurance-strip";
import { CatalogSection } from "@/components/catalog-section";
import { MethodSection } from "@/components/method-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { Newsletter } from "@/components/newsletter";
import { slides } from "@/lib/content";

export default function Home() {
  return (
    <>
      <HeroCarousel slides={slides} label="What every Red Sky lot is released against" />
      <AssuranceStrip />
      <CatalogSection />
      <MethodSection />
      <TestimonialsSection />
      <Newsletter />
    </>
  );
}
