import type { Metadata } from "next";
import Link from "next/link";
import { PageMasthead } from "@/components/page-masthead";
import { Reading, Ruler } from "@/components/reading";
import { SectionHeader } from "@/components/section-header";

export const metadata: Metadata = {
  title: "Handling — Red Sky",
  description:
    "From the courier to the column: reading the temperature logger, storage at −20 °C, the cake, reconstitution and aliquoting.",
};

/**
 * In the order a vial meets them. Everything here is the journal's handling
 * guidance and the terms' replacement rules, gathered on one page.
 */
const STEPS = [
  {
    id: "arrival",
    title: "When the box arrives",
    lead: "Read the temperature logger before you open anything.",
    points: [
      "If the readout shows an excursion, do not open the vial. Photograph the readout and send it with the lot number, and a replacement ships the same day.",
      "Name a recipient who is physically in the building. Reception desks are the most common place a shipment stalls, because nobody there knows the box is cold.",
      "Avoid Friday afternoon delivery unless someone has agreed to be there — it carries roughly four times the excursion rate of any other slot.",
    ],
  },
  {
    id: "storage",
    title: "Storage",
    lead: "Hold sealed vials at −20 °C, out of light, until the day you use them.",
    points: [
      "Gel packs buy hours, not a day. A box on a summer loading dock warms faster than most people expect.",
      "Standing orders dispatch on a Monday, Tuesday or Wednesday only, so nothing sits in a depot over a weekend.",
    ],
  },
  {
    id: "cake",
    title: "Read the cake",
    lead: "The powder in the bottom of the vial is a record of how the drying cycle went.",
    points: [
      "A good cake fills roughly the frozen volume, is uniform and matte, and dissolves quickly and evenly.",
      "Collapse — a dense glassy disc — means the product warmed during drying, and residual moisture is usually higher. Check the water content on the certificate.",
      "A vial that arrives visibly wrong is a vial we replace without an argument.",
    ],
  },
  {
    id: "opening",
    title: "Before the seal comes off",
    lead: "Let the vial reach room temperature while it is still sealed.",
    points: [
      "A vial opened cold pulls in humid air and water condenses onto the cake — the fastest way to start hydrolysis in material you were about to put back in the freezer.",
    ],
  },
  {
    id: "reconstitution",
    title: "Reconstitution",
    lead: "Most losses at this step are mechanical, not chemical.",
    points: [
      "Run the diluent slowly down the inside wall. Do not aim it at the cake: the jet shears the material and drives foaming.",
      "Swirl gently, or leave it to stand. Never shake or vortex — peptides denature and aggregate at the air-water interface that foam creates.",
      "Which diluent to use depends on the sequence and on your protocol, which is a decision for your lab rather than for us.",
    ],
  },
  {
    id: "afterwards",
    title: "Afterwards",
    lead: "Aliquot into single-use volumes before anything goes back in the freezer.",
    points: [
      "Repeated freeze-thaw cycles cost more material than any other routine step, and the loss is silent: the solution looks the same every time.",
      "Label every aliquot with the lot number, so a result can be traced to its certificate a year later.",
    ],
  },
];

export default function HandlingPage() {
  return (
    <>
      <PageMasthead
        eyebrow="Handling — from the freezer to your bench"
        heading="Most losses happen after the seal comes off."
        lead="Every lot is assayed before it leaves us. What happens between the courier and the column decides whether the vial still matches its certificate when you use it."
        stats={[
          { label: "Stored and shipped at", value: "−20 °C" },
          { label: "Shipments logged this year", value: "412" },
          { label: "Same-day dispatch", value: "Before 14:00 ET" },
        ]}
      />

      <section aria-labelledby="steps-heading" className="py-24 md:py-32">
        <div className="shell">
          <SectionHeader
            eyebrow="In order — six moments that decide the result"
            heading="What to do, from the doorstep to the aliquot."
            headingId="steps-heading"
            note="None of it is sophisticated. All of it moves the result more than better packaging does."
          />

          <ol role="list" className="mt-14 border-t border-ink">
            {STEPS.map((s, i) => (
              <li key={s.id} id={s.id} className="grid12 scroll-mt-24 gap-y-5 border-b border-hairline py-10">
                <div className="col-span-12 md:col-span-4">
                  <p className="t-data text-[0.75rem] text-graphite">
                    {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                  </p>
                  <h3 className="t-h2 mt-2 max-w-[12ch] text-[clamp(1.75rem,2.6vw,2.25rem)]">{s.title}</h3>
                </div>
                <div className="col-span-12 md:col-span-7 md:col-start-6">
                  <p className="text-[1.1875rem] font-medium leading-snug">{s.lead}</p>
                  <ul role="list" className="mt-5 space-y-3.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex gap-4 text-[1rem] leading-relaxed text-graphite">
                        <span className="dot mt-[0.6em]" aria-hidden="true" />
                        <span className="max-w-[62ch]">{p}</span>
                      </li>
                    ))}
                  </ul>
                  {s.id === "arrival" && (
                    <figure className="mt-8 max-w-[34rem] border-t border-hairline pt-6">
                      <Reading
                        reading="coldchain"
                        drawKey={0}
                        alt="A shipment's temperature log: a fast drop from ambient to minus twenty degrees Celsius at pack-out, flat for the journey, then a small bump on delivery."
                      />
                      <div className="mt-3">
                        <Ruler marks={["0", "20", "40", "61 h"]} />
                      </div>
                      <figcaption className="t-data mt-3 text-[0.75rem] text-graphite">
                        A logger readout · pack-out to delivery · the bump at the end is the doorstep
                      </figcaption>
                    </figure>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="grid12 mt-16 gap-y-8">
            <p className="col-span-12 max-w-[70ch] border-t border-hairline pt-6 text-[0.875rem] leading-relaxed text-graphite lg:col-span-7">
              <strong className="font-medium text-ink">Research use only.</strong> Everything here is
              handling for in-vitro laboratory work. Nothing on this page is guidance for use in people
              or animals, and we do not answer questions framed that way.
            </p>
            <div className="col-span-12 flex flex-col gap-2.5 sm:flex-row sm:gap-3 lg:col-span-4 lg:col-start-9 lg:justify-end">
              <Link href="/blog?category=handling" className="btn btn-ghost">
                Handling notes
              </Link>
              <Link href="/contact?topic=handling" className="btn btn-primary">
                Ask the team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
