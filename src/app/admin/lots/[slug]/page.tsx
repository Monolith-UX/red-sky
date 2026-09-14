import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LotForm, type LotDefaults } from "@/components/admin/lot-form";
import { StaffOnly } from "@/components/admin/staff-only";
import { classLabel, seedCatalogue } from "@/lib/catalog";
import { sequenceFor } from "@/lib/coa";
import { currentAdmin } from "@/lib/server/admin";
import { currentUser } from "@/lib/server/auth";
import { getLots } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Edit a lot — Red Sky staff",
  robots: { index: false, follow: false },
};

export default async function EditLot({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await currentUser())) redirect(`/account?next=/admin/lots/${slug}`);
  if (!(await currentAdmin())) return <StaffOnly />;

  const seed = seedCatalogue.find((c) => c.slug === slug);
  if (!seed) notFound();
  const row = (await getLots())[slug];

  // A saved row is edited as it stands. The sample lot in code offers its shelf
  // values but no certificate figures, so a real release has to state its own.
  const defaults: LotDefaults = row
    ? { ...row, certificateUrl: row.certificate && row.lot ? `/api/certificate/${encodeURIComponent(row.lot)}` : null }
    : {
        slug,
        stock: seed.stock,
        price: seed.price,
        fill: seed.fill,
        lot: seed.lot,
        purity: seed.purity,
        released: seed.released,
        expected: seed.expected ?? null,
        retention: seed.retention,
        observedMass: null,
        water: null,
        largestImpurity: null,
        analyst: null,
        salt: null,
        appearance: null,
        sample: true,
        certificateUrl: null,
      };

  return (
    <>
      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-10 pt-12 md:pb-14 md:pt-16">
          <Link href="/admin#lots" className="text-[0.8125rem] text-graphite no-underline hover:text-ink">
            ← All lots
          </Link>
          <p className="rail-label mt-8">Lot — {classLabel(seed.klass)}</p>
          <h1 className="t-display mt-7">{seed.name}</h1>
          <p className="t-data mt-4 text-[0.875rem] text-graphite">
            {seed.formula} · {seed.mass} Da average (theoretical)
            {sequenceFor(slug) && ` · ${sequenceFor(slug)}`}
          </p>
          <p className="mt-5 max-w-[62ch] text-[0.9375rem] leading-relaxed text-graphite">
            {row
              ? `Saved ${new Date(row.updated).toUTCString().slice(5, 22)} UTC by ${row.updatedBy}${row.sample ? ", marked as sample data" : ""}.`
              : "Not saved yet: the site shows the sample lot written in code. Enter the real release and its certificate figures, or keep it marked as sample."}
          </p>
        </div>
      </section>
      <div className="shell py-12 md:py-16">
        <div className="max-w-[56rem]">
          <LotForm slug={slug} defaults={defaults} saved={!!row} />
        </div>
      </div>
    </>
  );
}
