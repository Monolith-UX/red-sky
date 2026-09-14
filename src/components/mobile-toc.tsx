import type { TocItem } from "./toc-aside";

/**
 * The contents rail is a desktop luxury; below it there is no room beside the
 * text, and a list after the article is noise. On narrow screens the contents
 * sit above the body instead, closed until asked for — native <details>, so it
 * works without a line of script.
 */
export function MobileToc({ items, label = "On this page" }: { items: TocItem[]; label?: string }) {
  if (items.length < 2) return null;

  return (
    <details className="group mb-10 border-y border-ink lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="t-label text-graphite">
          {label} · <span className="t-data">{items.length}</span> sections
        </span>
        <svg
          width="13"
          height="8"
          viewBox="0 0 13 8"
          fill="none"
          aria-hidden="true"
          className="shrink-0 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M1 1l5.5 5.5L12 1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </summary>
      <ol role="list" className="border-t border-hairline pb-2 pt-1">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="flex items-baseline gap-3 py-2.5 text-[0.9375rem] leading-snug no-underline"
            >
              <span className="t-data w-5 shrink-0 text-[0.75rem] text-graphite">
                {String(i + 1).padStart(2, "0")}
              </span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
