/**
 * One header shape for every section: the eyebrow sits directly above the
 * heading in column one, with its rule trailing off; an optional note hangs
 * bottom-right so the block stays asymmetric rather than centred.
 */
export function SectionHeader({
  eyebrow,
  heading,
  headingId,
  note,
}: {
  eyebrow: string;
  heading: string;
  headingId?: string;
  note?: string;
}) {
  return (
    <div className="grid12 gap-y-5 lg:grid-rows-[auto_auto] lg:gap-y-7">
      <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5 lg:col-start-1 lg:row-start-1">
        {eyebrow}
      </p>

      <h2
        id={headingId}
        className="t-h2 col-span-12 max-w-[18ch] lg:col-span-7 lg:col-start-1 lg:row-start-2"
      >
        {heading}
      </h2>

      {note && (
        <p className="col-span-12 max-w-[34ch] text-[0.875rem] leading-relaxed text-graphite lg:col-span-3 lg:col-start-10 lg:row-start-2 lg:self-end lg:text-right">
          {note}
        </p>
      )}
    </div>
  );
}
