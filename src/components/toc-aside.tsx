"use client";

import { useEffect, useState, type ReactNode } from "react";

export type TocItem = { id: string; label: string };

/**
 * Sticky contents rail. Anchored to the top of the content section and held
 * there while the body scrolls under it, with the current section marked.
 */
export function TocAside({
  items,
  children,
  label = "On this page",
}: {
  items: TocItem[];
  children?: ReactNode;
  label?: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const showing = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (showing[0]) setActive(showing[0].target.id);
      },
      { rootMargin: "-88px 0px -62% 0px", threshold: 0 },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [items]);

  return (
    <aside className="lg:sticky lg:top-24">
      {/* A contents list below the article is noise on a phone — the meta and
          related blocks below still show. */}
      {items.length > 0 && (
        <nav aria-label={label} className="hidden lg:block">
          <p className="t-label border-b border-hairline pb-3 text-graphite">{label}</p>
          <ul role="list" className="mt-3">
            {items.map((item) => {
              const on = item.id === active;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={on ? "true" : undefined}
                    className={`flex items-start gap-2.5 py-2 text-[0.8125rem] leading-snug no-underline transition-colors duration-150 ${
                      on ? "text-ink" : "text-graphite hover:text-ink"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[0.45em] h-[0.375rem] w-[0.375rem] shrink-0 rounded-full transition-colors duration-150 ${
                        on ? "bg-sun" : "bg-transparent"
                      }`}
                    />
                    <span className={on ? "font-medium" : ""}>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {children}
    </aside>
  );
}
