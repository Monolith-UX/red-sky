import Link from "next/link";
import { Prose } from "@/components/prose";
import { TocAside, type TocItem } from "@/components/toc-aside";
import { headingId } from "@/lib/faqs";
import { policies, policyList, type PolicySlug } from "@/lib/legal";
import { longDate } from "@/lib/posts";

export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const policy = policies[slug];
  const toc: TocItem[] = policy.body
    .filter((b) => b.t === "h2")
    .map((b) => ({ id: headingId(b.text), label: b.text }));

  return (
    <article className="bg-paper">
      {/* ── Masthead ───────────────────────────────────────────────── */}
      <header className="shell pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="grid12 gap-y-6">
          <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5">
            {policy.eyebrow}
          </p>

          <div className="col-span-12 lg:col-span-9">
            <h1 className="t-display max-w-[15ch]">{policy.title}</h1>
            <p className="t-lead mt-7 max-w-[54ch]">{policy.standfirst}</p>
            <p className="t-data mt-8 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-graphite">
              <span className="dot" aria-hidden="true" />
              Last updated{" "}
              <time dateTime={policy.updated}>{longDate(policy.updated)}</time>
            </p>
          </div>
        </div>
      </header>

      {/* ── Body and rail ──────────────────────────────────────────── */}
      <div className="shell border-t border-hairline py-14 md:py-16">
        <div className="grid12 gap-y-14">
          <div className="col-span-12 text-[1.0625rem] leading-[1.75] lg:col-span-8">
            <Prose blocks={policy.body} />

            <p className="mt-14 border-t border-hairline pt-6 text-[0.8125rem] leading-relaxed text-graphite">
              This document is a working draft written to describe how the site and
              the business actually behave. It is not legal advice and has not been
              reviewed by counsel.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-3 lg:col-start-10">
            <TocAside items={toc}>
              <div className="border-t border-hairline pt-4 lg:mt-10">
                <p className="t-label text-graphite">Other policies</p>
                <ul role="list" className="mt-3 space-y-2.5">
                  {policyList
                    .filter((p) => p.slug !== policy.slug)
                    .map((p) => (
                      <li key={p.slug}>
                        <Link
                          href={`/${p.slug}`}
                          className="block text-[0.875rem] leading-snug no-underline transition-colors duration-150 hover:text-sun"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="mt-8 border-t border-hairline pt-4">
                <p className="t-label text-graphite">Ask a person</p>
                <p className="t-data mt-3 text-[0.8125rem] leading-relaxed">
                  privacy@redskybio.com
                  <br />
                  access@redskybio.com
                  <br />
                  lab@redskybio.com
                </p>
              </div>
            </TocAside>
          </div>
        </div>
      </div>
    </article>
  );
}
