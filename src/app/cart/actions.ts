"use server";

import { revalidatePath } from "next/cache";
import {
  isWeekday,
  nextDispatch,
  todayIso,
  type CartLine,
  type StandingOrder,
  type Weekday,
} from "@/lib/account";
import { canOrder, getItem } from "@/lib/catalog";
import { currentUser } from "@/lib/server/auth";
import { getCart, placeOrder as recordOrder } from "@/lib/server/store";

export type CheckoutState = {
  error?: string;
  placed?: {
    ref: string;
    lines: CartLine[];
    weekday: Weekday | null;
    firstMonthly: string | null;
  };
};

const shortId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

/**
 * Turns the cart into an order. One-time lines are recorded as bought; each
 * monthly line also opens a standing order that dispatches on the first
 * chosen weekday of every month after this one.
 *
 * Payment is not connected in this build: nothing is charged and nothing
 * ships. This is where a payment intent would be confirmed before recording.
 */
export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await currentUser();
  if (!user) return { error: "Sign in to place the order." };

  if (form.get("attest") !== "on") {
    return {
      error:
        "Confirm that these materials are for laboratory research only and that you accept the terms of sale.",
    };
  }

  const lines = (await getCart(user.id)).filter((l) => {
    const item = getItem(l.slug);
    return item && canOrder(item);
  });
  if (!lines.length) {
    return { error: "Nothing in the cart can be ordered today." };
  }

  const monthly = lines.filter((l) => l.plan === "monthly");
  const day = Number(form.get("weekday"));
  const weekday = monthly.length && isWeekday(day) ? day : null;
  if (monthly.length && !weekday) {
    return { error: "Choose a dispatch day for the monthly deliveries." };
  }

  const today = todayIso();
  const firstMonthly = weekday ? nextDispatch(weekday, today) : null;
  const standing: StandingOrder[] = weekday
    ? monthly.map((l) => ({
        id: `SO-${shortId()}`,
        slug: l.slug,
        quantity: l.quantity,
        weekday,
        status: "active",
        nextDispatch: firstMonthly!,
        created: today,
      }))
    : [];

  const ref = `ORD-${today.slice(2).replace(/-/g, "")}-${shortId()}`;
  await recordOrder(
    user.id,
    { ref, placed: new Date().toISOString(), lines, weekday, standing: standing.map((s) => s.id) },
    standing,
  );

  revalidatePath("/cart");
  revalidatePath("/account");
  return { placed: { ref, lines, weekday, firstMonthly } };
}
