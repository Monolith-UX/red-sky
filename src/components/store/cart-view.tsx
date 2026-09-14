"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { placeOrder, type CheckoutState } from "@/app/cart/actions";
import { Vial } from "@/components/catalog/vial";
import { Check, FormMessage } from "@/components/forms/fields";
import {
  DISPATCH_DAYS,
  dayLabel,
  dispatchDate,
  type CartLine,
  type Plan,
  type Weekday,
} from "@/lib/account";
import { type CatalogItem, canOrder, getItem, money, waitingFor } from "@/lib/catalog";
import { cartCount, changeCart, refreshSession, useSession } from "@/lib/session-client";
import { QuantityStepper } from "./add-to-cart";

type Row = { line: CartLine; item: CatalogItem; key: string };

/** A sequence can hold one line per plan; keying by occurrence keeps focus on a line whose plan changes. */
function rows(lines: CartLine[]): Row[] {
  const seen = new Map<string, number>();
  return lines.flatMap((line) => {
    const item = getItem(line.slug);
    if (!item) return [];
    const n = seen.get(line.slug) ?? 0;
    seen.set(line.slug, n + 1);
    return [{ line, item, key: `${line.slug}-${n}` }];
  });
}

export function CartView({ initial, signedIn }: { initial: CartLine[]; signedIn: boolean }) {
  const session = useSession();
  const lines = session.status === "ready" ? session.cart : initial;
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [weekday, setWeekday] = useState<Weekday>(2);
  const dayId = useId();

  useEffect(() => {
    if (state.placed) void refreshSession();
  }, [state.placed]);

  if (state.placed) return <Placed placed={state.placed} />;

  const all = rows(lines);
  const live = all.filter((r) => canOrder(r.item));
  const gone = all.filter((r) => !canOrder(r.item));
  const sum = (plan: Plan) =>
    live.filter((r) => r.line.plan === plan).reduce((s, r) => s + r.item.price * r.line.quantity, 0);
  const vials = (plan: Plan) =>
    live.filter((r) => r.line.plan === plan).reduce((s, r) => s + r.line.quantity, 0);
  const once = sum("once");
  const monthly = sum("monthly");

  if (!all.length) {
    return (
      <div className="border-y border-hairline py-16 md:py-20">
        <p className="t-h2 text-[clamp(1.75rem,2.6vw,2.25rem)]">The cart is empty.</p>
        <p className="t-body mt-4 text-[0.9375rem]">
          Add a sequence from the catalogue. Whether a line ships once or every month is chosen
          per line, on the product page or here.
        </p>
        <Link href="/catalog" className="btn btn-primary mt-8">
          Browse the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid12 gap-y-12">
      {/* ── Lines ─────────────────────────────────────────────────── */}
      <div className="col-span-12 lg:col-span-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
          <p className="t-data text-[0.8125rem]" aria-live="polite">
            {cartCount(lines)} {cartCount(lines) === 1 ? "vial" : "vials"} · {all.length}{" "}
            {all.length === 1 ? "line" : "lines"}
          </p>
          <Link href="/catalog" className="text-[0.8125rem] text-graphite no-underline hover:text-ink">
            Keep browsing
          </Link>
        </div>

        <ul role="list">
          {live.map((r) => (
            <LineRow key={r.key} row={r} weekday={weekday} />
          ))}
        </ul>

        {gone.length > 0 && (
          <div className="mt-10">
            <p className="t-label border-b border-hairline pb-3 text-graphite">
              No longer available — not included in the order
            </p>
            <ul role="list">
              {gone.map((r) => (
                <li
                  key={r.key}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-hairline py-4"
                >
                  <span>
                    <Link href={`/catalog/${r.item.slug}`} className="font-medium no-underline hover:text-sun">
                      {r.item.name}
                    </Link>
                    <span className="t-data ml-3 text-[0.75rem] text-graphite">{waitingFor(r.item)}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <Link
                      href={`/catalog/${r.item.slug}`}
                      className="text-[0.8125rem] decoration-sun underline-offset-4"
                    >
                      Join the waitlist
                    </Link>
                    <button
                      type="button"
                      onClick={() => changeCart({ op: "remove", slug: r.line.slug, plan: r.line.plan })}
                      className="text-[0.8125rem] text-graphite hover:text-ink"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Summary ───────────────────────────────────────────────── */}
      <aside
        aria-labelledby="summary-heading"
        className="col-span-12 self-start border border-hairline bg-paper lg:sticky lg:top-24 lg:col-span-4"
      >
        <h2 id="summary-heading" className="t-label border-b border-hairline px-5 py-3.5 text-graphite">
          Order summary
        </h2>

        <dl className="px-5 text-[0.875rem]">
          <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
            <dt className="text-graphite">
              One-time <span className="t-data text-[0.75rem]">· {vials("once")} vials</span>
            </dt>
            <dd className="t-data">{money(once)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
            <dt className="text-graphite">
              First monthly delivery <span className="t-data text-[0.75rem]">· {vials("monthly")} vials</span>
            </dt>
            <dd className="t-data">{money(monthly)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-4">
            <dt className="font-medium">Due today</dt>
            <dd className="t-metric text-[1.75rem]">{money(once + monthly)}</dd>
          </div>
          {monthly > 0 && (
            <div className="flex items-baseline justify-between gap-4 border-t border-ink py-3">
              <dt className="font-medium">Then every month</dt>
              <dd className="t-data text-[1.0625rem] font-medium">{money(monthly)}</dd>
            </div>
          )}
        </dl>

        {monthly > 0 && (
          <div className="border-t border-hairline px-5 py-4">
            <label htmlFor={dayId} className="t-label block text-graphite">
              Monthly dispatch
            </label>
            <select
              id={dayId}
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value) as Weekday)}
              className="mt-2 h-11 w-full border border-graphite bg-white px-3 text-[0.875rem]"
            >
              {DISPATCH_DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  First {d.label} of every month
                </option>
              ))}
            </select>
            <p className="mt-2 text-[0.75rem] leading-relaxed text-graphite">
              Monday to Wednesday only, so no box sits in a depot over a weekend. Skip, pause or
              cancel any time from your account.
            </p>
          </div>
        )}

        <div className="border-t border-hairline px-5 pb-5 pt-4">
          <p className="text-[0.75rem] leading-relaxed text-graphite">
            Prices are per vial in US dollars. Tax, duties and cold-chain shipping are shown before
            you pay.
          </p>

          {signedIn ? (
            <form action={action} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="weekday" value={weekday} />
              <Check name="attest">
                These materials are for in-vitro laboratory research only and will not be
                administered to a person or an animal. I accept the{" "}
                <Link href="/terms" className="decoration-sun underline-offset-4">
                  terms of sale
                </Link>
                .
              </Check>
              <FormMessage error={state.error} />
              <button
                type="submit"
                disabled={pending || !live.length}
                className="btn btn-primary w-full disabled:opacity-60"
              >
                {pending ? "Placing the order…" : `Place order · ${money(once + monthly)}`}
              </button>
            </form>
          ) : (
            <div className="mt-5">
              <p className="text-[0.875rem] leading-relaxed">
                Sign in to place the order. Everything in the cart comes with you.
              </p>
              <Link href="/account?next=/cart" className="btn btn-primary mt-4 w-full">
                Sign in to check out
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function LineRow({ row, weekday }: { row: Row; weekday: Weekday }) {
  const { line, item } = row;
  const group = useId();
  const [failed, setFailed] = useState(false);

  const run = async (op: Parameters<typeof changeCart>[0]) => {
    setFailed(!(await changeCart(op)));
  };

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 border-b border-hairline py-6 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-x-6">
      <Link
        href={`/catalog/${item.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-square self-start border border-hairline bg-white sm:row-span-2"
      >
        <Vial item={item} className="absolute inset-0 h-full w-full" />
      </Link>

      <div className="min-w-0">
        <Link href={`/catalog/${item.slug}`} className="t-h3 text-[1.3125rem] no-underline hover:text-sun">
          {item.name}
        </Link>
        <p className="t-data mt-1 text-[0.75rem] text-graphite">
          {item.fill} · {money(item.price)} a vial
          {item.lot && ` · lot ${item.lot}`}
          {item.purity !== null && ` · ${item.purity.toFixed(2)}%`}
        </p>

        <fieldset className="mt-3.5">
          <legend className="visually-hidden">How {item.name} ships</legend>
          <div className="inline-flex border border-graphite">
            {(["once", "monthly"] as const).map((plan) => {
              const on = line.plan === plan;
              return (
                <label
                  key={plan}
                  className={`inline-flex h-9 cursor-pointer items-center px-3.5 text-[0.8125rem] transition-colors duration-150 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sun ${
                    on ? "bg-ink text-paper" : "text-graphite hover:bg-white hover:text-ink"
                  } ${plan === "monthly" ? "border-l border-graphite" : ""}`}
                >
                  <input
                    type="radio"
                    name={group}
                    value={plan}
                    checked={on}
                    onChange={() => run({ op: "plan", slug: line.slug, plan: line.plan, to: plan })}
                    className="visually-hidden"
                  />
                  {plan === "once" ? "One-time" : "Monthly"}
                </label>
              );
            })}
          </div>
        </fieldset>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-graphite">
          {line.plan === "monthly"
            ? `Ships with this order, then on the first ${dayLabel(weekday)} of every month.`
            : "Ships once, from the current lot."}
        </p>
      </div>

      <p className="t-data col-start-2 text-[1.0625rem] font-medium sm:col-start-3 sm:row-start-1 sm:text-right">
        {money(item.price * line.quantity)}
        {line.plan === "monthly" && (
          <span className="block text-[0.6875rem] font-normal text-graphite">a month</span>
        )}
      </p>

      <div className="col-span-2 flex flex-wrap items-center gap-x-5 gap-y-2 sm:col-span-2 sm:col-start-2">
        <QuantityStepper
          size="sm"
          value={line.quantity}
          onChange={(quantity) => run({ op: "quantity", slug: line.slug, plan: line.plan, quantity })}
          label={`Vials of ${item.name}`}
        />
        <button
          type="button"
          onClick={() => run({ op: "remove", slug: line.slug, plan: line.plan })}
          className="inline-flex h-10 items-center text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
        >
          Remove<span className="visually-hidden"> {item.name}</span>
        </button>
        {failed && (
          <span role="alert" className="text-[0.8125rem] text-sun">
            That change did not save. Try again.
          </span>
        )}
      </div>
    </li>
  );
}

function Placed({ placed }: { placed: NonNullable<CheckoutState["placed"]> }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const monthly = placed.lines.filter((l) => l.plan === "monthly");
  const once = placed.lines.filter((l) => l.plan === "once");
  const describe = (ls: CartLine[]) =>
    ls.map((l) => `${l.quantity} × ${getItem(l.slug)?.name ?? l.slug}`).join(", ");

  return (
    <section aria-labelledby="placed-heading" className="grid12 gap-y-8 border-t border-ink pt-8">
      <div className="col-span-12 lg:col-span-7">
        <p className="rail-label">Order recorded — {placed.ref}</p>
        <h2 ref={heading} id="placed-heading" className="t-h2 mt-7 max-w-[16ch] focus:outline-none" tabIndex={-1}>
          Thank you. The order is in.
        </h2>
        <dl className="mt-8 text-[0.9375rem]">
          {once.length > 0 && (
            <div className="border-t border-hairline py-4">
              <dt className="t-label text-graphite">Ships once</dt>
              <dd className="mt-1.5">{describe(once)}</dd>
            </div>
          )}
          {monthly.length > 0 && placed.weekday && placed.firstMonthly && (
            <div className="border-t border-hairline py-4">
              <dt className="t-label text-graphite">Every month</dt>
              <dd className="mt-1.5">
                {describe(monthly)} — ships with this order, then on the first{" "}
                {dayLabel(placed.weekday)} of each month, starting{" "}
                <span className="t-data">{dispatchDate(placed.firstMonthly)}</span>.
              </dd>
            </div>
          )}
        </dl>
        <p className="t-data mt-4 border-t border-hairline pt-4 text-[0.75rem] leading-relaxed text-graphite">
          Payment is not connected in this build, so nothing has been charged and nothing will ship.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          {monthly.length > 0 && (
            <Link href="/account#auto-delivery" className="btn btn-primary">
              Manage standing orders
            </Link>
          )}
          <Link href="/catalog" className="btn btn-ghost">
            Back to the catalogue
          </Link>
        </div>
      </div>
    </section>
  );
}
