import { HeroCarousel } from "@/components/hero-carousel";
import { AssuranceStrip } from "@/components/assurance-strip";
import { CatalogSection } from "@/components/catalog-section";
import { MethodSection } from "@/components/method-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { Newsletter } from "@/components/newsletter";

export default function Home() {
  return (
    <>
      <HeroCarousel />
      <AssuranceStrip />
      <CatalogSection />
      <MethodSection />
      <TestimonialsSection />
      <Newsletter />
    </>
  );
}
