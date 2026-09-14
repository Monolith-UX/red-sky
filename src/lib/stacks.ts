import type { CartLine, Plan } from "./account";
import { canOrder, getItem } from "./catalog";

/**
 * A stack is a pricing rule, not a product: the sequences stay separate lines
 * with their own lots and certificates, and each complete set on the same plan
 * comes off the total. The Wolverine Stack is BPC-157 ($48) with TB-500 ($62),
 * $14 below the two apart — the $96 on the homepage.
 */
export const STACKS = [
  { id: "wolverine", name: "Wolverine Stack", slugs: ["bpc-157", "tb-500"], saving: 14 },
] as const;

export type Saving = { id: string; name: string; plan: Plan; sets: number; amount: number };

export function stackSavings(lines: Pick<CartLine, "slug" | "plan" | "quantity">[]): Saving[] {
  const out: Saving[] = [];
  for (const stack of STACKS) {
    for (const plan of ["once", "monthly"] as const) {
      const counts = stack.slugs.map((slug) => {
        const item = getItem(slug);
        if (!item || !canOrder(item)) return 0;
        return lines.filter((l) => l.slug === slug && l.plan === plan).reduce((n, l) => n + l.quantity, 0);
      });
      const sets = Math.min(...counts);
      if (sets > 0) out.push({ id: stack.id, name: stack.name, plan, sets, amount: sets * stack.saving });
    }
  }
  return out;
}

export const savingFor = (savings: Saving[], plan?: Plan) =>
  savings.filter((s) => !plan || s.plan === plan).reduce((n, s) => n + s.amount, 0);
