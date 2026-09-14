"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ViewTransition, startTransition, useMemo, useState } from "react";
import {
  CATEGORIES,
  type CategoryKey,
  type Post,
  byDate,
  categoryLabel,
  longDate,
} from "@/lib/posts";
import { PostThumb } from "./post-thumb";

const isCategory = (v: string | null): v is CategoryKey =>
  !!v && CATEGORIES.some((c) => c.key === v);

function Stamp({ post }: { post: Post }) {
  return (
    <p className="t-data flex flex-wrap items-center gap-x-2 text-[0.6875rem] text-graphite">
      <span className="t-label">{categoryLabel(post.category)}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={post.date}>{longDate(post.date)}</time>
      <span aria-hidden="true">·</span>
      {post.minutes} min
    </p>
  );
}

function PostCard({ post, wide = false }: { post: Post; wide?: boolean }) {
  return (
    <article
      className="group relative flex h-full flex-col border border-hairline bg-paper transition-colors duration-150 focus-within:border-graphite hover:border-graphite"
    >
      <PostThumb
        category={post.category}
        no={post.no}
        className="aspect-[16/9] w-full shrink-0"
      />

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <Stamp post={post} />

        <ViewTransition
          name={`post-title-${post.slug}`}
          share="text-morph"
          default="none"
        >
          <h3
            className={`mt-3 ${
              wide ? "t-h2 max-w-[16ch] text-[clamp(1.75rem,2.4vw,2.25rem)]" : "t-h3"
            }`}
          >
            <Link
              href={`/blog/${post.slug}`}
              className="no-underline after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          </h3>
        </ViewTransition>

        <p
          className={`mt-3 text-graphite ${
            wide ? "max-w-[46ch] text-[1.0625rem] leading-relaxed" : "text-[0.9375rem] leading-relaxed"
          }`}
        >
          {post.standfirst}
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-hairline pt-4 md:pt-5">
          <span className="t-data text-[0.75rem] text-graphite">
            {post.author}
          </span>
          <span className="text-graphite transition-colors duration-150 group-hover:text-sun">
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
              <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}

export function JournalIndex() {
  const params = useSearchParams();
  const initial = params.get("category");
  const [filter, setFilter] = useState<CategoryKey | "all">(
    isCategory(initial) ? initial : "all",
  );

  const entries = useMemo(() => {
    if (filter !== "all") return byDate.filter((p) => p.category === filter);
    const lead = byDate.find((p) => p.featured);
    return lead ? [lead, ...byDate.filter((p) => p.slug !== lead.slug)] : byDate;
  }, [filter]);

  const select = (key: CategoryKey | "all") => startTransition(() => setFilter(key));

  return (
    <div className="shell pb-24 pt-14 md:pb-32 md:pt-16">
      {/* ── Filter ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-ink pb-3">
        <ul role="list" className="-ml-3 flex flex-wrap items-center">
          {([{ key: "all", label: "All entries" }, ...CATEGORIES] as const).map((c) => {
            const on = filter === c.key;
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => select(c.key as CategoryKey | "all")}
                  aria-pressed={on}
                  className={`flex h-11 items-center px-3 text-[0.875rem] transition-colors duration-150 ${
                    on ? "font-medium text-ink" : "text-graphite hover:text-ink"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {on && <span className="dot" aria-hidden="true" />}
                    {c.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p aria-live="polite" className="t-data pr-1 text-[0.8125rem] text-graphite">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <p className="t-h3 border-b border-hairline py-20 text-center">
          Nothing filed under that heading yet.
        </p>
      ) : (
        <ul
          role="list"
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {entries.map((post, i) => (
            <ViewTransition key={post.slug} enter="card-in" exit="card-out">
              <li
                className={filter === "all" && i === 0 ? "sm:col-span-2" : ""}
              >
                <PostCard post={post} wide={filter === "all" && i === 0} />
              </li>
            </ViewTransition>
          ))}
        </ul>
      )}
    </div>
  );
}
