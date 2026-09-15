import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { StaffOnly } from "@/components/admin/staff-only";
import { currentAdmin } from "@/lib/server/admin";
import { currentUser } from "@/lib/server/auth";
import { getProducts } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Add a product — Red Sky staff",
  robots: { index: false, follow: false },
};

export default async function NewProduct() {
  if (!(await currentUser())) redirect("/account?next=/admin/products/new");
  if (!(await currentAdmin())) return <StaffOnly />;
  // Adding before the catalogue is copied in would replace the whole catalogue with one product.
  if (!Object.keys(await getProducts()).length) redirect("/admin/products");

  return (
    <>
      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-10 pt-12 md:pb-14 md:pt-16">
          <Link href="/admin/products" className="text-[0.8125rem] text-graphite no-underline hover:text-ink">
            ← All products
          </Link>
          <p className="rail-label mt-8">Products — new</p>
          <h1 className="t-display mt-7">Add a product.</h1>
          <p className="mt-5 max-w-[62ch] text-[0.9375rem] leading-relaxed text-graphite">
            It appears as Coming soon, with a waitlist, until its first lot is released. Photos can be
            added once it is saved.
          </p>
        </div>
      </section>
      <div className="shell py-12 md:py-16">
        <div className="max-w-[56rem]">
          <ProductForm original={null} values={null} />
        </div>
      </div>
    </>
  );
}
