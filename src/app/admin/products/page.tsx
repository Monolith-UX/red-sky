import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImportCatalogue, MoveProduct } from "@/components/admin/product-controls";
import { StaffOnly } from "@/components/admin/staff-only";
import { STOCK_LABEL, builtProducts, classLabel, money, seedCatalogue } from "@/lib/catalog";
import { imagePath, type ProductRecord } from "@/lib/products";
import { staffTime } from "@/lib/lots";
import { currentAdmin } from "@/lib/server/admin";
import { currentUser } from "@/lib/server/auth";
import { getLots, getProducts } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Products — Red Sky staff",
  robots: { index: false, follow: false },
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ deleted?: string | string[]; imported?: string | string[] }> }) {
  const { deleted, imported } = await searchParams;
  if (!(await currentUser())) redirect("/account?next=/admin/products");
  if (!(await currentAdmin())) return <StaffOnly />;

  const [products, lots] = await Promise.all([getProducts(), getLots()]);
  const list = Object.values(products).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const live = (p: ProductRecord) => builtProducts[p.slug]?.updated === p.updated;

  return (
    <>
      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-10 pt-12 md:pb-14 md:pt-16">
          <Link href="/admin" className="text-[0.8125rem] text-graphite no-underline hover:text-ink">
            ← Staff
          </Link>
          <p className="rail-label mt-8">Products — the catalogue</p>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-6">
            <h1 className="t-display max-w-[14ch]">What the shop sells.</h1>
            {list.length > 0 && (
              <Link href="/admin/products/new" className="btn btn-primary">
                Add a product
              </Link>
            )}
          </div>
          <p className="t-lead mt-7 max-w-[58ch]">
            Names, formulas, classes and photos. Each product’s lot — stock, price and certificate —
            is on its lot page. Changes go live when the site rebuilds.
          </p>
        </div>
      </section>

      <div className="shell py-12 md:py-16">
        {typeof imported === "string" && /^\d+$/.test(imported) && (
          <p role="status" className="mb-8 border-l-2 border-ink pl-4 text-[0.9375rem]">
            {imported} products copied into the store. The site is unchanged until you edit, add or remove one.
          </p>
        )}
        {typeof deleted === "string" && (
          <p role="status" className="mb-8 border-l-2 border-ink pl-4 text-[0.9375rem]">
            {deleted} was deleted, with its lot and photos.
          </p>
        )}

        {list.length === 0 ? (
          <div className="max-w-[60ch] border-y border-hairline py-10">
            <h2 className="t-h3">First, copy the catalogue in.</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              The {seedCatalogue.length} products on the site today are written in its code. Copying
              them into the store makes them editable here. Nothing on the site changes until you save
              an edit, add a product or remove one.
            </p>
            <div className="mt-6">
              <ImportCatalogue count={seedCatalogue.length} />
            </div>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-ink">
                  {["Order", "", "Product", "Class", "On the shelf", "Status", ""].map((h, i) => (
                    <th key={i} scope="col" className="t-label py-2.5 pr-4 font-normal text-graphite">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => {
                  const lot = lots[p.slug];
                  const stock = lot?.stock ?? p.stock;
                  const main = p.images[0];
                  return (
                    <tr key={p.slug} className={`border-b border-hairline ${p.archived ? "text-graphite" : ""}`}>
                      <td className="py-2.5 pr-4">
                        <MoveProduct slug={p.slug} name={p.name} first={i === 0} last={i === list.length - 1} />
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="relative block h-12 w-12 overflow-hidden border border-hairline bg-white">
                          {main ? (
                            // eslint-disable-next-line @next/next/no-img-element -- our own route
                            <img src={imagePath(p.slug, main)} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="t-data grid h-full place-items-center text-[0.625rem] text-graphite">vial</span>
                          )}
                        </span>
                      </td>
                      <th scope="row" className="py-2.5 pr-4 font-medium">
                        <Link href={`/admin/products/${p.slug}`} className="no-underline hover:text-sun">
                          {p.name}
                        </Link>
                        <span className="t-data block text-[0.75rem] font-normal text-graphite">
                          {p.formula} · {p.mass} Da
                        </span>
                      </th>
                      <td className="py-2.5 pr-4">{classLabel(p.klass)}</td>
                      <td className="py-2.5 pr-4">
                        {STOCK_LABEL[stock]}
                        <span className="t-data block text-[0.75rem] text-graphite">
                          {money(lot?.price ?? p.price)} · {lot?.lot ?? p.lot ?? "no lot"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-[0.8125rem] leading-snug">
                        {p.archived ? "Removed from the site" : "In the catalogue"}
                        <span className="block text-graphite">
                          {live(p) ? "Live" : "Waiting for rebuild"} · {staffTime(p.updated)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <Link href={`/admin/products/${p.slug}`} className="text-[0.8125rem] decoration-sun underline-offset-4">
                          Edit<span className="visually-hidden"> {p.name}</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
