/**
 * Every page opens on the red field. The homepage's is tall and carries the
 * carousel; a subpage gets this short version, so the masthead reads as one
 * system rather than two.
 *
 * Keeps `id="hero"` because the site header watches for it to decide when to
 * stop riding the red and go bench grey.
 */
export function PageMasthead({
  eyebrow,
  heading,
  lead,
  stats,
}: {
  eyebrow: string;
  heading: string;
  lead?: string;
  stats?: { value: string; label: string }[];
}) {
  return (
    <section
      id="hero"
      className="sun-field on-sun -mt-16 pb-14 pt-[5.5rem] md:-mt-[4.5rem] md:pb-16 md:pt-[7.5rem]"
    >
      <div className="shell">
        <div className="grid12 gap-y-9">
          <div className="col-span-12 lg:col-span-7">
            <p className="rail-label mb-7 md:mb-9">{eyebrow}</p>
            <h1 className="t-display max-w-[15ch]">{heading}</h1>
            {lead && <p className="t-lead mt-6 md:mt-7">{lead}</p>}
          </div>

          {stats && (
            <dl className="col-span-12 self-end lg:col-span-4 lg:col-start-9">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-baseline justify-between gap-4 border-hairline py-3 ${
                    i === 0 ? "border-t" : ""
                  } border-b`}
                >
                  <dt className="t-label text-[var(--color-on-sun)]">{s.label}</dt>
                  <dd className="t-data text-[1.0625rem] font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
