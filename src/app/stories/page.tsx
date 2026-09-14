import type { Metadata } from "next";
import { connection } from "next/server";
import { PageMasthead } from "@/components/page-masthead";
import { SectionHeader } from "@/components/section-header";
import { StoryCard, StoryTemplate } from "@/components/stories/story-card";
import { StoryForm } from "@/components/stories/story-form";
import { authorDefaults } from "@/lib/server/moderation";
import { storiesWith } from "@/lib/server/store";
import { WE_DO_NOT, WE_PUBLISH } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Client stories — Red Sky",
  description:
    "Researchers on their own laboratory work with Red Sky material: what they set out to do, what they used and what changed. Read before publishing; none describe use in people or animals.",
};

export default async function StoriesPage() {
  // Stories are approved at any time, so this page reads them per request.
  await connection();
  const [published, defaults] = await Promise.all([storiesWith("published"), authorDefaults()]);
  const verified = published.filter((s) => s.verifiedOrder).length;
  const [lead, ...rest] = published;

  return (
    <>
      <PageMasthead
        eyebrow="Client stories — from the bench"
        heading="Research, told by the labs doing it."
        lead="Researchers on what they set out to measure, what they used, and how the work moved — including when a lot did not behave. A person reads every story before it appears, and none describe use in people or animals."
        stats={
          published.length
            ? [
                { label: "Stories published", value: String(published.length) },
                { label: "From verified orders", value: String(verified) },
              ]
            : undefined
        }
      />

      {/* ── Stories ────────────────────────────────────────────────── */}
      <section aria-labelledby="stories-heading" className="py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow={published.length ? `Stories — ${published.length} published` : "Stories — the first are in review"}
            heading={published.length ? "In their words, not ours." : "Nothing here is written by us."}
            headingId="stories-heading"
            note="Stories tied to an order placed from the author's account carry a verified order mark."
          />

          {published.length ? (
            <div className="mt-14 grid gap-x-12 gap-y-16 md:grid-cols-2">
              <div className="md:col-span-2">
                <StoryCard story={lead} wide />
              </div>
              {rest.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          ) : (
            <div className="grid12 mt-14 gap-y-10">
              <div className="col-span-12 lg:col-span-5">
                <p className="t-lead">
                  No story is published until the person who wrote it has confirmed it, and we will not
                  fill the page in the meantime with quotes nobody said.
                </p>
                <p className="mt-5 max-w-[44ch] text-[0.9375rem] leading-relaxed text-graphite">
                  The template beside this shows how a story is set once it is approved. If your lab has
                  one, the form below is where it starts.
                </p>
                <a href="#share" className="btn btn-primary mt-8">
                  Tell us about your work
                </a>
              </div>
              <div className="col-span-12 lg:col-span-6 lg:col-start-7">
                <StoryTemplate />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Share ──────────────────────────────────────────────────── */}
      <section id="share" aria-labelledby="share-heading" className="scroll-mt-20 border-t border-hairline bg-paper py-24 md:py-32">
        <div className="shell">
          <div className="grid12 gap-y-14">
            <div className="col-span-12 lg:col-span-5">
              <p className="rail-label">Share a story — for review</p>
              <h2 id="share-heading" className="t-h2 mt-6 max-w-[14ch]">
                Tell us what the work needed, and what it got.
              </h2>

              <div className="mt-10 border-t border-ink pt-6">
                <h3 className="text-[1.0625rem] font-medium">What we publish</h3>
                <ul role="list" className="mt-4 space-y-3">
                  {WE_PUBLISH.map((w) => (
                    <li key={w} className="flex gap-3.5 text-[0.9375rem] leading-relaxed">
                      <span className="dot mt-[0.6em]" aria-hidden="true" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 border-t border-hairline pt-6">
                <h3 className="text-[1.0625rem] font-medium">What we do not</h3>
                <ul role="list" className="mt-4 space-y-3">
                  {WE_DO_NOT.map((w) => (
                    <li key={w} className="flex gap-3.5 text-[0.9375rem] leading-relaxed text-graphite">
                      <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full border border-graphite" />
                      {w}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[0.8125rem] leading-relaxed text-graphite">
                  Everything Red Sky sells is for in-vitro laboratory research. A story that describes
                  anything else is not published, whoever sends it.
                </p>
              </div>
            </div>

            <div className="col-span-12 border border-hairline bg-bench/40 p-6 sm:p-8 lg:col-span-6 lg:col-start-7">
              <StoryForm defaults={defaults} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
