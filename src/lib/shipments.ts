import { nextDispatch, type Address, type CartLine, type StandingOrder } from "./account";
import { canOrder, getItem } from "./catalog";
import { savingFor, stackSavings } from "./stacks";

/**
 * A month's shipment, as staff pack it: one customer's active standing
 * orders due on the same day to the same address. Lines whose sequence
 * cannot be ordered today wait, as the customer's page says they will.
 * Shared by the staff page (to show) and the action (to record), so both
 * work out the same lines and total.
 */
export type ShipmentOrder = StandingOrder & { owner: string; email: string | null };

export type Shipment = {
  key: string;
  owner: string;
  email: string | null;
  date: string;
  address: Address | null;
  ships: ShipmentOrder[];
  waiting: ShipmentOrder[];
  lines: CartLine[];
  total: number;
  saving: number;
};

const groupKey = (o: ShipmentOrder) => `${o.owner}|${o.nextDispatch}|${JSON.stringify(o.address ?? null)}`;

/** Active standing orders due on or before `until`, grouped into shipments, oldest first. */
export function shipmentsDue(orders: ShipmentOrder[], until: string): Shipment[] {
  const groups = new Map<string, ShipmentOrder[]>();
  for (const o of orders) {
    if (o.status !== "active" || o.nextDispatch > until) continue;
    groups.set(groupKey(o), [...(groups.get(groupKey(o)) ?? []), o]);
  }
  return [...groups.entries()]
    .map(([key, group]) => {
      const ships = group.filter((o) => {
        const item = getItem(o.slug);
        return item && canOrder(item);
      });
      const lines: CartLine[] = ships.map((o) => ({ slug: o.slug, plan: "monthly", quantity: o.quantity }));
      const saving = savingFor(stackSavings(lines));
      const total = lines.reduce((n, l) => n + (getItem(l.slug)?.price ?? 0) * l.quantity, 0) - saving;
      return {
        key,
        owner: group[0].owner,
        email: group[0].email,
        date: group[0].nextDispatch,
        address: group[0].address ?? null,
        ships,
        waiting: group.filter((o) => !ships.includes(o)),
        lines,
        total,
        saving,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Where each shipped order goes next: the first chosen weekday of the following month. */
export const advanceFor = (ships: StandingOrder[]) =>
  ships.map((o) => ({ id: o.id, from: o.nextDispatch, nextDispatch: nextDispatch(o.weekday, o.nextDispatch) }));
