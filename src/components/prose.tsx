import type { Block } from "@/lib/posts";
import { headingId } from "@/lib/faqs";

/** One renderer for journal entries and policy pages alike. */
export function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === "h2") {
          return (
            <h2
              key={i}
              id={headingId(b.text)}
              className="t-h3 mt-12 max-w-[26ch] scroll-mt-24 first:mt-0"
            >
              {b.text}
            </h2>
          );
        }
        if (b.t === "quote") {
          return (
            <blockquote key={i} className="my-10 border-l-2 border-sun pl-6 md:pl-8">
              <p className="t-quote max-w-[30ch]">{b.text}</p>
            </blockquote>
          );
        }
        if (b.t === "list") {
          return (
            <ul key={i} role="list" className="mt-6 space-y-3.5">
              {b.items.map((item) => (
                <li key={item} className="flex gap-4">
                  <span className="dot mt-[0.6em]" aria-hidden="true" />
                  <span className="max-w-[64ch]">{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="mt-6 max-w-[66ch] text-pretty first:mt-0">
            {b.text}
          </p>
        );
      })}
    </>
  );
}
