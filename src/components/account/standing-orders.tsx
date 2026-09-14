"use client";

import Link from "next/link";
import { useId, useOptimistic, useState, useTransition } from "react";
import { changeStandingOrder, type OrderChange } from "@/app/account/actions";
import { Vial } from "@/components/catalog/vial";
import { QuantityStepper } from "@/components/store/add-to-cart";
import {
  DISPATCH_DAYS,
  dispatchDate,
  nextDispatch,
  upcomingDispatch,
  type StandingOrder,
  type Weekday,
} from "@/lib/account";
import { canOrder, getItem, money } from "@/lib/catalog";
import { savingFor, stackSavings } from "@/lib/stacks";

/** The same rules the Server Action applies, so the row can move before the server answers. */
function preview(order: StandingOrder, change: OrderChange, today: string): StandingOrder {
  switch (change.kind) {
    case "pause":
      return { ...order, status: "paused" };
    case "resume":
      return { ...order, status: "active", nextDispatch: nextDispatch(order.weekday, today) };
    case "skip":
      return { ...order, nextDispatch: nextDispatch(order.weekday, upcomingDispatch(order, today)) };
    case "quantity":
      return { ...order, quantity: change.quantity };
    case "day":
      return { ...order, weekday: change.weekday, nextDispatch: nextDispatch(change.weekday, today) };
    default:
      return order;
  }
}

export function StandingOrders({ orders, today }: { orders: StandingOrder[]; today: string }) {
  if (!orders.length) {
    return (
      <div className="border-y border-hairline py-12">
        <p className="t-h3">No standing orders yet.</p>
        <p className="t-body mt-3 text-[0.9375rem]">
          Choose monthly auto-delivery on any sequence, or switch a line to monthly in the cart.
          Each one ships with the order, then on the first Monday, Tuesday or Wednesday of every
          month.
        </p>
        <Link href="/catalog" className="btn btn-ghost mt-6">
          Browse the catalogue
        </Link>
      </div>
    );
  }

  const active = orders.filter((o) => o.status === "active");
  const monthly =
    active.reduce((sum, o) => sum + (getItem(o.slug)?.price ?? 0) * o.quantity, 0) -
    savingFor(stackSavings(active.map((o) => ({ slug: o.slug, plan: "monthly" as const, quantity: o.quantity }))));
  const next = active.map((o) => upcomingDispatch(o, today)).sort()[0];

  return (
    <>
      <dl className="grid grid-cols-1 border-y border-ink sm:grid-cols-3">
        {[
          ["Active", `${active.length} of ${orders.length}`],
          ["Every month", money(monthly)],
          ["Next dispatch", next ? dispatchDate(next) : "Nothing scheduled"],
        ].map(([k, v], i) => (
          <div
            key={k}
            className={`flex items-baseline justify-between gap-4 py-4 sm:block ${
              i > 0 ? "border-t border-hairline sm:border-l sm:border-t-0 sm:pl-6" : ""
            }`}
          >
            <dt className="t-label text-graphite">{k}</dt>
            <dd className="t-data text-[1.0625rem] font-medium sm:mt-1.5">{v}</dd>
          </div>
        ))}
      </dl>

      <ul role="list" className="mt-2">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} today={today} />
        ))}
      </ul>
    </>
  );
}

function OrderRow({ order, today }: { order: StandingOrder; today: string }) {
  const item = getItem(order.slug);
  const [shown, apply] = useOptimistic(order, (o, change: OrderChange) => preview(o, change, today));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const dayId = useId();

  if (!item) return null;

  const run = (change: OrderChange) =>
    startTransition(async () => {
      apply(change);
      setError("");
      const res = await changeStandingOrder(order.id, change);
      if (res.error) setError(res.error);
    });

  const paused = shown.status === "paused";
  const waiting = !canOrder(item);

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 border-b border-hairline py-6 md:grid-cols-[5rem_minmax(0,1fr)_auto] md:gap-x-6">
      <Link
        href={`/catalog/${item.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative row-span-2 block aspect-square self-start border border-hairline bg-white md:row-span-2"
      >
        <Vial item={item} className="absolute inset-0 h-full w-full" />
      </Link>

      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <Link href={`/catalog/${item.slug}`} className="t-h3 text-[1.25rem] no-underline hover:text-sun">
            {item.name}
          </Link>
          <span className={`t-label ${paused ? "text-graphite" : "text-ink"}`}>
            {paused ? "Paused" : "Active"}
          </span>
        </p>
        <p className="t-data mt-1 text-[0.75rem] text-graphite">
          {item.fill} · {money(item.price)} a vial · {shown.id}
        </p>
        <p className="mt-2.5 flex items-start gap-2 text-[0.875rem] leading-snug">
          {/* the mark, hollow while nothing is scheduled */}
          {paused ? (
            <span aria-hidden="true" className="mt-[0.4em] h-1.5 w-1.5 shrink-0 rounded-full border border-graphite" />
          ) : (
            <span className="dot mt-[0.45em]" aria-hidden="true" />
          )}
          {paused ? (
            <span className="text-graphite">Nothing ships until you resume it.</span>
          ) : (
            <span>
              Next dispatch{" "}
              <span className="t-data font-medium">{dispatchDate(upcomingDispatch(shown, today))}</span>
              {waiting && (
                <span className="text-graphite"> — waits for the next lot, then ships</span>
              )}
            </span>
          )}
        </p>
        {shown.address && (
          <p className="mt-1 text-[0.8125rem] text-graphite">
            To {shown.address.recipient}, {shown.address.city}, {shown.address.region}
          </p>
        )}
      </div>

      <p className="t-data col-start-2 self-start text-[1.0625rem] font-medium md:col-start-3 md:row-start-1 md:text-right">
        {money(item.price * shown.quantity)}
        <span className="block text-[0.6875rem] font-normal text-graphite">a month</span>
      </p>

      <div className="col-span-2 flex flex-wrap items-end gap-x-5 gap-y-4 md:col-span-2 md:col-start-2">
        <div>
          <span className="t-label mb-2 block text-graphite" aria-hidden="true">
            Vials
          </span>
          <QuantityStepper
            size="sm"
            value={shown.quantity}
            onChange={(quantity) => run({ kind: "quantity", quantity })}
            label={`Vials of ${item.name} per month`}
          />
        </div>

        <div>
          <label htmlFor={dayId} className="t-label mb-2 block text-graphite">
            Dispatch on the first
          </label>
          <select
            id={dayId}
            value={shown.weekday}
            onChange={(e) => run({ kind: "day", weekday: Number(e.target.value) as Weekday })}
            className="h-10 border border-graphite bg-white px-2.5 text-[0.875rem]"
          >
            {DISPATCH_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} of the month
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-1 md:ml-auto">
          {confirming ? (
            <span role="group" aria-label={`Cancel the standing order for ${item.name}?`} className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[0.8125rem]">Cancel for good?</span>
              <button
                type="button"
                onClick={() => run({ kind: "cancel" })}
                className="btn btn-primary min-h-[2.5rem] px-3.5 text-[0.8125rem]"
              >
                {pending ? "Cancelling…" : "Yes, cancel it"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex h-10 items-center px-2.5 text-[0.8125rem] text-graphite hover:text-ink"
              >
                Keep it
              </button>
            </span>
          ) : (
            <>
              {!paused && <RowAction onClick={() => run({ kind: "skip" })}>Skip next</RowAction>}
              <RowAction onClick={() => run({ kind: paused ? "resume" : "pause" })}>
                {paused ? "Resume" : "Pause"}
              </RowAction>
              <RowAction onClick={() => setConfirming(true)}>Cancel</RowAction>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="col-span-2 text-[0.8125rem] text-sun md:col-span-2 md:col-start-2">
          {error}
        </p>
      )}
    </li>
  );
}

function RowAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center px-2.5 text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
    >
      {children}
    </button>
  );
}
