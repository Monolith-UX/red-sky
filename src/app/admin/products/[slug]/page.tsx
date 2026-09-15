import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductStatus } from "@/components/admin/product-controls";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { StaffOnly } from "@/components/admin/staff-only";
import { SectionHeader } from "@/components/section-header";
import { staffTime } from "@/lib/lots";
import { currentAdmin } from "@/lib/server/admin";
import { currentUser } from "@/lib/server/auth";
import { getProducts, productInUse } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Edit a product — Red Sky staff",
  robots: { index: false, follow: false },
};

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ slug }, { created }] = await Promise.all([params, searchParams]);
  if (!(await currentUser())) redirect(`/account?next=/admin/products/${slug}`);
  if (!(await currentAdmin())) return <StaffOnly />;

  const product = (await getProducts())[slug];
  if (!product) notFound();
  const inUse = await productInUse(slug);

  return (
    <>
      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-10 pt-12 md:pb-14 md:pt-16">
          <Link href="/admin/products" className="text-[0.8125rem] text-graphite no-underline hover:text-ink">
            ← All products
          </Link>
          <p className="rail-label mt-8">Product — {product.archived ? "removed from the site" : "in the catalogue"}</p>
          <h1 className="t-display mt-7">{product.name}</h1>
          <p className="t-data mt-4 text-[0.875rem] text-graphite">
            /catalog/{product.slug} · saved {staffTime(product.updated)} ET by {product.updatedBy}
          </p>
          {created && (
            <p role="status" className="mt-6 max-w-[62ch] border-l-2 border-ink pl-4 text-[0.9375rem]">
              Added as Coming soon. Add photos below, and release its first lot on the{" "}
              <Link href={`/admin/lots/${product.slug}`} className="decoration-sun underline-offset-4">
                lot page
              </Link>{" "}
              when it clears.
            </p>
          )}
        </div>
      </section>

      <div className="shell space-y-20 py-12 md:py-16">
        <section aria-labelledby="details-heading" className="max-w-[56rem]">
          <SectionHeader eyebrow="Details — what the catalogue prints" heading="The product." headingId="details-heading" />
          <div className="mt-10">
            <ProductForm original={product.slug} values={product} />
          </div>
          <p className="mt-6 text-[0.875rem] text-graphite">
            Stock, price, the lot and its certificate are on the{" "}
            <Link href={`/admin/lots/${product.slug}`} className="text-ink decoration-sun underline-offset-4">
              lot page
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="photos-heading">
          <SectionHeader
            eyebrow="Photos — the first is the main one"
            heading="Images."
            headingId="photos-heading"
            note="Shown on the product page, and the main one on catalogue cards."
          />
          <div className="mt-10">
            <ProductImages slug={product.slug} images={product.images} />
          </div>
        </section>

        <section aria-labelledby="status-heading" className="max-w-[56rem]">
          <SectionHeader eyebrow="Status — on the site or not" heading="Remove or delete." headingId="status-heading" />
          <div className="mt-10">
            <ProductStatus slug={product.slug} name={product.name} archived={product.archived} deletable={!inUse} />
          </div>
        </section>
      </div>
    </>
  );
}
