import Link from "next/link";
import { getItem, shortDate } from "@/lib/catalog";
import { initialsOf, type Story } from "@/lib/stories";

/** A published story, set like a signed note: what was used, the work, what changed, who. */
export function StoryCard({ story, wide = false }: { story: Story; wide?: boolean }) {
  const items = story.slugs.flatMap((s) => {
    const item = getItem(s);
    return item ? [item] : [];
  });

  return (
    <article className="flex h-full flex-col border-t border-ink pt-7">
      <p className="t-label flex flex-wrap items-center gap-x-2 gap-y-1 text-graphite">
        {items.map((item, i) => (
          <span key={item.slug}>
            <Link href={`/catalog/${item.slug}`} className="no-underline hover:text-sun">
              {item.name}
            </Link>
            {i < items.length - 1 && " +"}
          </span>
        ))}
        {story.lot && <span className="t-data normal-case tracking-normal">· lot {story.lot}</span>}
      </p>

      <h3 className={`mt-4 ${wide ? "t-h2 max-w-[18ch] text-[clamp(1.875rem,2.8vw,2.5rem)]" : "t-h3"}`}>
        {story.title}
      </h3>

      <p className={`mt-5 whitespace-pre-line leading-relaxed ${wide ? "max-w-[62ch] text-[1.125rem]" : "text-[1rem]"}`}>
        {story.story}
      </p>

      <div className="mt-6 border-t border-hairline pt-4">
        <p className="t-label text-graphite">What changed</p>
        <p className="mt-1.5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-graphite">{story.outcome}</p>
      </div>

      <footer className="mt-auto flex items-center gap-3.5 pt-7">
        <span
          aria-hidden="true"
          className="t-data grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-[0.75rem] text-paper"
        >
          {initialsOf(story.name)}
        </span>
        <span className="min-w-0 text-[0.875rem] leading-snug">
          <span className="block font-medium">{story.name}</span>
          <span className="block text-graphite">
            {[story.role, story.organisation, story.location].filter(Boolean).join(", ")}
          </span>
        </span>
        <span className="ml-auto flex shrink-0 flex-col items-end gap-1 text-right">
          {story.verifiedOrder && (
            <span className="t-label flex items-center gap-1.5 text-ink">
              <span className="dot" aria-hidden="true" />
              Verified order
            </span>
          )}
          {story.published && (
            <time dateTime={story.published} className="t-data text-[0.6875rem] text-graphite">
              {shortDate(story.published.slice(0, 10))}
            </time>
          )}
        </span>
      </footer>
    </article>
  );
}

/** Shown in place of stories until the first is approved: the shape of one, clearly empty. */
export function StoryTemplate() {
  return (
    <figure className="border border-dashed border-graphite/60 p-6 md:p-8" aria-label="Template: how a published story is set">
      <figcaption className="t-label flex items-center justify-between gap-4 border-b border-hairline pb-3 text-graphite">
        <span>Template — how a published story is set</span>
        <span className="t-data normal-case tracking-normal">not a real story</span>
      </figcaption>
      <div className="text-graphite">
        <p className="t-label mt-6">[Sequence] · lot [RS-0000-X]</p>
        <p className="t-h2 mt-4 max-w-[18ch] text-[clamp(1.75rem,2.6vw,2.25rem)] text-graphite/80">[A title in a few words]</p>
        <p className="mt-5 max-w-[60ch] text-[1.0625rem] leading-relaxed">
          [What you set out to measure or make, what you used, and what happened — including anything that
          did not go to plan.]
        </p>
        <div className="mt-6 border-t border-hairline pt-4">
          <p className="t-label">What changed</p>
          <p className="mt-1.5 text-[0.9375rem]">[How the research moved.]</p>
        </div>
        <p className="mt-7 flex flex-wrap items-center gap-3.5 text-[0.875rem]">
          <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full border border-dashed border-graphite/60 t-data text-[0.75rem]">
            [·]
          </span>
          <span>[Name] · [Role], [Organisation]</span>
          <span className="t-label ml-auto">[Verified order]</span>
        </p>
      </div>
    </figure>
  );
}
