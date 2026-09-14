import type { Metadata } from "next";
import { SessionSync } from "@/components/account/account-sections";
import { CartView } from "@/components/store/cart-view";
import { currentUser, readOwner } from "@/lib/server/auth";
import { getCart } from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Your cart — Red Sky",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const [user, owner] = await Promise.all([currentUser(), readOwner()]);
  const cart = await getCart(owner);

  return (
    <>
      <SessionSync signedIn={!!user} />

      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-10 pt-12 md:pb-12 md:pt-16">
          <div className="grid12 gap-y-6">
            <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5">
              Cart — review and place the order
            </p>
            <div className="col-span-12 lg:col-span-8">
              <h1 className="t-display max-w-[15ch]">Your cart</h1>
              <p className="t-lead mt-6 max-w-[54ch]">
                Each line ships once or every month — switch it here. Every vial leaves the freezer
                at −20 °C with a temperature logger in the box.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="shell py-12 md:py-16">
        <CartView initial={cart} signedIn={!!user} />
      </div>
    </>
  );
}
