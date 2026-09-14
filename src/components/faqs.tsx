import type { Faq } from "@/lib/faqs";

/**
 * Native <details> so the whole block is keyboard-operable and announced
 * correctly without a line of JavaScript.
 */
export function Faqs({
  items,
  heading,
  id = "questions",
}: {
  items: Faq[];
  heading: string;
  id?: string;
}) {
  if (!items.length) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className="scroll-mt-24" id={id}>
      <h2 id={`${id}-heading`} className="t-h3 border-b border-ink pb-3">
        {heading}
      </h2>

      <ul role="list">
        {items.map((f) => (
          <li key={f.q} className="border-b border-hairline">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-5 py-5 [&::-webkit-details-marker]:hidden">
                <span className="max-w-[52ch] text-[1.0625rem] font-medium leading-snug">
                  {f.q}
                </span>
                <span aria-hidden="true" className="relative mt-1.5 h-3 w-3 shrink-0 text-sun">
                  <span className="absolute left-0 top-[5px] h-[1.5px] w-3 bg-current" />
                  <span className="absolute left-[5px] top-0 h-3 w-[1.5px] bg-current transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="max-w-[64ch] pb-6 text-[0.9375rem] leading-relaxed text-graphite">
                {f.a}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
