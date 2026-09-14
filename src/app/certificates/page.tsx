import type { Metadata } from "next";
import { CertificateLookup } from "@/components/catalog/certificate-lookup";
import { PageMasthead } from "@/components/page-masthead";
import { catalogue, released, shortDate } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Certificates of analysis — Red Sky",
  description:
    "Look up any Red Sky certificate of analysis by lot number, sequence or formula. Every published lot, newest first.",
};

export default function CertificatesPage() {
  const newest = released.reduce((a, b) => (b.released > a.released ? b : a));
  const pending = catalogue.length - released.length;

  return (
    <>
      <PageMasthead
        eyebrow="Certificates — every lot on record"
        heading="Look a lot up by the number on the vial."
        lead="Every certificate we have published, searchable by lot number, sequence or formula. Each one opens on its lot page with the released chromatogram and all fourteen fields."
        stats={[
          { label: "Published", value: String(released.length) },
          { label: "Newest", value: shortDate(newest.released) },
          { label: "Awaiting a first lot", value: String(pending) },
        ]}
      />
      <section aria-label="Certificate lookup" className="shell py-16 md:py-24">
        <CertificateLookup />
      </section>
    </>
  );
}
