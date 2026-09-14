import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { Prose } from "@/components/prose";
import { TocAside, type TocItem } from "@/components/toc-aside";
import { Faqs } from "@/components/faqs";
import { MobileToc } from "@/components/mobile-toc";
import { faqsFor, headingId } from "@/lib/faqs";
import { byDate, categoryLabel, getPost, longDate, posts } from "@/lib/posts";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Entry not found — Red Sky" };
  return {
    title: `${post.title} — Red Sky Journal`,
    description: post.standfirst,
  };
}

export default async function EntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const faqs = faqsFor(slug);
  const i = byDate.findIndex((p) => p.slug === slug);
  const newer = i > 0 ? byDate[i - 1] : null;
  const older = i < byDate.length - 1 ? byDate[i + 1] : null;

  const related = byDate
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  const toc: TocItem[] = [
    ...post.body
      .filter((b) => b.t === "h2")
      .map((b) => ({ id: headingId(b.text), label: b.text })),
    ...(faqs.length ? [{ id: "questions", label: "Questions on this entry" }] : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.standfirst,
        datePublished: post.date,
        author: { "@type": "Person", name: post.author },
        publisher: { "@type": "Organization", name: "Red Sky Biosciences" },
        articleSection: categoryLabel(post.category),
      },
      ...(faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <article className="bg-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Masthead ───────────────────────────────────────────────── */}
      <header className="shell pb-10 pt-12 md:pb-14 md:pt-16">
        <Link
          href="/blog"
          className="inline-flex h-11 items-center gap-2.5 text-[0.8125rem] text-graphite no-underline transition-colors duration-150 hover:text-ink"
        >
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
            <path d="M16 5H2M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          All entries
        </Link>

        <div className="grid12 mt-6 gap-y-6">
          <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5">
            № {String(post.no).padStart(3, "0")} — {categoryLabel(post.category)}
          </p>

          <div className="col-span-12 lg:col-span-9">
            <ViewTransition
              name={`post-title-${post.slug}`}
              share="text-morph"
              default="none"
            >
              <h1 className="t-display max-w-[17ch]">{post.title}</h1>
            </ViewTransition>

            <p className="t-lead mt-7 max-w-[54ch]">{post.standfirst}</p>

            <p className="t-data mt-8 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-graphite">
              <span className="dot" aria-hidden="true" />
              {post.author}
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{longDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              {post.minutes} min read
            </p>
          </div>
        </div>
      </header>

      {/* ── Body and rail ──────────────────────────────────────────── */}
      <div className="shell border-t border-hairline py-14 md:py-16">
        <div className="grid12 gap-y-14">
          <div className="col-span-12 text-[1.0625rem] leading-[1.75] lg:col-span-8">
            <MobileToc items={toc} />
            <Prose blocks={post.body} />

            <div className="mt-16">
              <Faqs items={faqs} heading="Questions on this entry" />
            </div>

            <p className="mt-14 border-t border-hairline pt-6 text-[0.8125rem] leading-relaxed text-graphite">
              <strong className="font-medium text-ink">Research use only.</strong>{" "}
              Nothing in the Red Sky journal is guidance for human or veterinary use.
              Questions about handling or reconstitution go to lab@redskybio.com.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-3 lg:col-start-10">
            <TocAside items={toc}>
              <dl className="border-t border-hairline pt-4 text-[0.8125rem] lg:mt-10">
                <dt className="t-label text-graphite">Filed under</dt>
                <dd className="mt-1.5">
                  <Link
                    href={`/blog?category=${post.category}`}
                    className="decoration-sun underline-offset-4"
                  >
                    {categoryLabel(post.category)}
                  </Link>
                </dd>

                <dt className="t-label mt-5 text-graphite">Written by</dt>
                <dd className="mt-1.5">{post.author}</dd>

                <dt className="t-label mt-5 text-graphite">Entry</dt>
                <dd className="t-data mt-1.5">№ {String(post.no).padStart(3, "0")}</dd>
              </dl>

              {related.length > 0 && (
                <div className="mt-8 border-t border-hairline pt-4">
                  <p className="t-label text-graphite">
                    More in {categoryLabel(post.category)}
                  </p>
                  <ul role="list" className="mt-3 space-y-3">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/blog/${r.slug}`}
                          className="block text-[0.875rem] leading-snug no-underline transition-colors duration-150 hover:text-sun"
                        >
                          {r.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TocAside>
          </div>
        </div>
      </div>

      {/* ── Neighbours ─────────────────────────────────────────────── */}
      <nav aria-label="More entries" className="border-t border-hairline bg-bench">
        <div className="shell grid gap-px py-4 sm:grid-cols-2">
          {[
            { post: older, dir: "Earlier entry", align: "" },
            { post: newer, dir: "Later entry", align: "sm:text-right sm:items-end" },
          ].map(({ post: p, dir, align }) =>
            p ? (
              <Link
                key={dir}
                href={`/blog/${p.slug}`}
                className={`group flex flex-col gap-2 px-1 py-7 no-underline sm:px-6 ${align}`}
              >
                <span className="t-label text-graphite">{dir}</span>
                <span className="t-h3 max-w-[24ch] transition-colors duration-150 group-hover:text-sun">
                  {p.title}
                </span>
                <span className="t-data text-[0.6875rem] text-graphite">
                  № {String(p.no).padStart(3, "0")} · {longDate(p.date)}
                </span>
              </Link>
            ) : (
              <span key={dir} />
            ),
          )}
        </div>
      </nav>
    </article>
  );
}
