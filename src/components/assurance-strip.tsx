import { assurances } from "@/lib/content";

export function AssuranceStrip() {
  return (
    <section aria-label="Release criteria at a glance" className="border-y border-hairline bg-paper">
      <div className="shell">
        <ul
          role="list"
          className="grid grid-cols-2 divide-hairline md:grid-cols-4 md:divide-x"
        >
          {assurances.map((item, i) => (
            <li
              key={item.label}
              className={`flex items-baseline gap-3 py-6 md:px-8 ${
                i === 0 ? "md:pl-0" : ""
              } ${i < 2 ? "border-b border-hairline md:border-b-0" : ""} ${
                i % 2 === 1 ? "pl-6 md:pl-8" : ""
              }`}
            >
              <span className="dot translate-y-[-0.3em]" aria-hidden="true" />
              <span>
                <span className="t-data block text-[1.0625rem] font-medium">
                  {item.value}
                </span>
                <span className="mt-1 block text-[0.8125rem] leading-snug text-graphite">
                  {item.label}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
