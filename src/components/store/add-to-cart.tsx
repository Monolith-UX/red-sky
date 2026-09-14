"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MAX_QUANTITY, type Plan } from "@/lib/account";
import { type CatalogItem, money } from "@/lib/catalog";
import { changeCart } from "@/lib/session-client";

const Check = () => (
  <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden="true">
    <path d="M1 5.2 4.6 8.6 12 1.2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

function useFlash(ms = 1800) {
  const [state, setState] = useState<"idle" | "added" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const flash = (next: "added" | "failed") => {
    setState(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), ms);
  };
  return [state, flash] as const;
}

/** The card's button: one vial, one-time. The plan can be changed in the cart. */
export function AddToCartButton({ item }: { item: CatalogItem }) {
  const [state, flash] = useFlash();
  const [message, setMessage] = useState("");

  async function add() {
    const ok = await changeCart({ op: "add", slug: item.slug, plan: "once", quantity: 1 });
    flash(ok ? "added" : "failed");
    setMessage(ok ? `${item.name} added to your cart.` : `${item.name} was not added. Try again.`);
  }

  return (
    <>
      <button
        type="button"
        onClick={add}
        className="btn btn-primary relative z-10 mt-3 min-h-[2.75rem] w-full"
      >
        {state === "added" ? (
          <>
            <Check /> Added to cart
          </>
        ) : state === "failed" ? (
          "Not added — try again"
        ) : (
          "Add to cart"
        )}
        <span className="visually-hidden">
          {" "}
          — {item.name}, {item.fill}
        </span>
      </button>
      <span aria-live="polite" className="visually-hidden">
        {message}
      </span>
    </>
  );
}

/**
 * The product page's order block: one-time or monthly, a quantity, and the
 * button. Monthly lines become standing orders at checkout.
 */
export function PurchasePanel({ item }: { item: CatalogItem }) {
  const [plan, setPlan] = useState<Plan>("once");
  const [quantity, setQuantity] = useState(1);
  const [state, flash] = useFlash(6000);
  const [added, setAdded] = useState<{ plan: Plan; quantity: number } | null>(null);
  const name = useId();

  async function add() {
    const ok = await changeCart({ op: "add", slug: item.slug, plan, quantity });
    flash(ok ? "added" : "failed");
    setAdded(ok ? { plan, quantity } : null);
  }

  const options: { value: Plan; title: string; note: string; price: string }[] = [
    {
      value: "once",
      title: "One-time purchase",
      note: "Ships from the current lot.",
      price: money(item.price),
    },
    {
      value: "monthly",
      title: "Monthly auto-delivery",
      note: "Ships now, then on the first Monday, Tuesday or Wednesday of every month — your choice at checkout. Skip, pause or cancel from your account.",
      price: `${money(item.price)} / mo`,
    },
  ];

  return (
    <div className="mt-6">
      <fieldset>
        <legend className="t-label mb-2.5 text-graphite">Purchase</legend>
        <div className="border border-hairline bg-paper">
          {options.map((o, i) => {
            const checked = plan === o.value;
            return (
              <label
                key={o.value}
                className={`relative flex cursor-pointer items-start gap-3.5 px-4 py-3.5 transition-colors duration-150 ${
                  i > 0 ? "border-t border-hairline" : ""
                } ${checked ? "bg-white" : "hover:bg-white/60"}`}
              >
                <input
                  type="radio"
                  name={name}
                  value={o.value}
                  checked={checked}
                  onChange={() => setPlan(o.value)}
                  className="mt-[0.2rem] h-4 w-4 shrink-0 accent-sun"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.9375rem] font-medium">{o.title}</span>
                    <span className="t-data shrink-0 text-[0.875rem]">{o.price}</span>
                  </span>
                  <span className="mt-1 block max-w-[46ch] text-[0.8125rem] leading-relaxed text-graphite">
                    {o.note}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex gap-2.5">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          label={`Quantity of ${item.name}`}
        />
        <button type="button" onClick={add} className="btn btn-primary flex-1">
          {state === "added" ? (
            <>
              <Check /> Added to cart
            </>
          ) : state === "failed" ? (
            "Not added — try again"
          ) : plan === "monthly" ? (
            "Add monthly delivery"
          ) : (
            "Add to cart"
          )}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-[1.5rem] text-[0.8125rem] leading-relaxed">
        {state === "added" && added && (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-2">
              <span className="dot" aria-hidden="true" />
              {added.quantity} × {item.name}
              {added.plan === "monthly" ? ", every month," : ""} in your cart.
            </span>
            <Link href="/cart" className="font-medium decoration-sun underline-offset-4">
              Review the cart
            </Link>
          </span>
        )}
        {state === "failed" && (
          <span className="text-sun">That did not reach the cart. Check your connection and try again.</span>
        )}
      </p>
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  label,
  size = "lg",
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  size?: "lg" | "sm";
  disabled?: boolean;
}) {
  const h = size === "lg" ? "h-12" : "h-10";
  const w = size === "lg" ? "w-11" : "w-9";
  return (
    <div role="group" aria-label={label} className={`flex ${h} shrink-0 items-stretch border border-graphite`}>
      <button
        type="button"
        aria-label="One fewer"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className={`${w} grid place-items-center transition-colors duration-150 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:text-hairline`}
      >
        <svg width="11" height="2" viewBox="0 0 11 2" aria-hidden="true">
          <path d="M0 1h11" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      <output aria-live="polite" className="t-data grid min-w-[2.25rem] place-items-center border-x border-hairline text-[0.9375rem]">
        {value}
      </output>
      <button
        type="button"
        aria-label="One more"
        disabled={disabled || value >= MAX_QUANTITY}
        onClick={() => onChange(Math.min(MAX_QUANTITY, value + 1))}
        className={`${w} grid place-items-center transition-colors duration-150 hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:text-hairline`}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
          <path d="M0 5.5h11M5.5 0v11" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </div>
  );
}
