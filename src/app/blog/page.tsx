import type { Metadata } from "next";
import { Suspense } from "react";
import { PageMasthead } from "@/components/page-masthead";
import { JournalIndex } from "@/components/blog/journal-index";
import { byDate, longDate, posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Journal — Red Sky",
  description:
    "Method notes, analysis explainers and lot release notes from the Red Sky bench.",
};

export default function BlogPage() {
  const authors = new Set(posts.map((p) => p.author)).size;

  return (
    <>
      <PageMasthead
        eyebrow="Journal — notes from the bench"
        heading="Working notes, not marketing."
        lead="What we measure, how we measure it, and what every released lot came back at. Written by the people who ran the column."
        stats={[
          { label: "Entries", value: String(posts.length) },
          { label: "Contributors", value: String(authors) },
          { label: "Latest", value: longDate(byDate[0].date) },
        ]}
      />

      <Suspense
        fallback={
          <div className="shell py-24">
            <p className="t-data text-[0.8125rem] text-graphite">Loading entries…</p>
          </div>
        }
      >
        <JournalIndex />
      </Suspense>
    </>
  );
}
