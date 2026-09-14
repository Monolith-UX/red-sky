import { method } from "@/lib/content";
import { SectionHeader } from "./section-header";

export function MethodSection() {
  return (
    <section
      id="method"
      className="scroll-mt-24 border-y border-hairline bg-paper py-24 md:py-32"
    >
      <div className="shell">
        <SectionHeader
          eyebrow="Method — release criteria"
          heading="Four checks stand between synthesis and your bench."
          note="A lot that misses any one of them is destroyed, not discounted."
        />

        <ol
          role="list"
          className="mt-16 grid gap-px border-t border-hairline sm:grid-cols-2 lg:grid-cols-4"
        >
          {method.map((m) => (
            <li key={m.step} className="relative pt-7 sm:pr-8">
              <span
                aria-hidden="true"
                className="absolute -top-[4px] left-0 h-[7px] w-[7px] rounded-full bg-sun"
              />
              <p className="t-data text-[0.75rem] text-graphite">{m.step}</p>
              <h3 className="t-h3 mt-3">{m.title}</h3>
              <p className="mt-3 max-w-[30ch] text-[0.9375rem] leading-relaxed text-graphite">
                {m.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
