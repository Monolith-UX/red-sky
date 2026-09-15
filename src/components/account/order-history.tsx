import Link from "next/link";
import { dayLabel, type PlacedOrder } from "@/lib/account";
import { money, nameOf, shortDate } from "@/lib/catalog";

/** Every order placed from the account, newest first, at the prices it was placed at. */
export function OrderHistory({ orders }: { orders: PlacedOrder[] }) {
  if (!orders.length) {
    return (
      <p className="border-y border-hairline py-8 text-[0.9375rem] leading-relaxed text-graphite">
        No orders yet. Orders placed from this account are listed here with their reference, what
        shipped once, and what opened a standing order.
      </p>
    );
  }

  return (
    <ul role="list" className="border-t border-ink">
      {orders.map((o) => {
        const once = o.lines.filter((l) => l.plan === "once");
        const monthly = o.lines.filter((l) => l.plan === "monthly");
        const describe = (ls: typeof o.lines) =>
          ls.map((l) => `${l.quantity} × ${nameOf(l.slug)}`).join(", ");
        return (
          <li key={o.ref} className="grid grid-cols-1 gap-x-6 gap-y-3 border-b border-hairline py-6 md:grid-cols-[12rem_minmax(0,1fr)_auto]">
            <div>
              <p className="t-data text-[0.875rem] font-medium">{o.ref}</p>
              <p className="t-data mt-1 text-[0.75rem] text-graphite">{shortDate(o.placed.slice(0, 10))}</p>
            </div>
            <div className="text-[0.9375rem] leading-relaxed">
              {once.length > 0 && (
                <p>
                  <span className="t-label mr-2 text-graphite">Once</span>
                  {describe(once)}
                </p>
              )}
              {monthly.length > 0 && (
                <p className={once.length ? "mt-1" : ""}>
                  <span className="t-label mr-2 text-graphite">Monthly</span>
                  {describe(monthly)}
                  {o.weekday && (
                    <span className="text-graphite"> · first {dayLabel(o.weekday)} of each month</span>
                  )}
                </p>
              )}
              {o.address && (
                <p className="mt-1 text-[0.8125rem] text-graphite">
                  To {o.address.recipient}, {o.address.city}, {o.address.region}
                </p>
              )}
            </div>
            <div className="md:text-right">
              {o.totals ? (
                <>
                  <p className="t-data text-[1rem] font-medium">{money(o.totals.today)}</p>
                  {o.totals.saving > 0 && (
                    <p className="t-data text-[0.6875rem] text-graphite">incl. {money(o.totals.saving)} saving</p>
                  )}
                </>
              ) : (
                <p className="t-data text-[0.8125rem] text-graphite">—</p>
              )}
            </div>
          </li>
        );
      })}
      <li className="pt-4">
        <p className="text-[0.8125rem] text-graphite">
          Something wrong with an order?{" "}
          <Link href="/contact?topic=order" className="text-ink decoration-sun underline-offset-4">
            Write to the team
          </Link>{" "}
          with its reference.
        </p>
      </li>
    </ul>
  );
}
