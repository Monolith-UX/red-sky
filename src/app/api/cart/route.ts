import { MAX_QUANTITY, isPlan, type CartLine } from "@/lib/account";
import { canOrder, catalogue } from "@/lib/catalog";
import { changeCart } from "@/lib/server/store";
import { ensureOwner } from "@/lib/server/auth";
import { readJson, sameOrigin } from "@/lib/server/visitor";

const SLUGS = new Set(catalogue.map((c) => c.slug));
/** A sequence with nothing to sell cannot enter the cart, whatever the client sends. */
const ORDERABLE = new Set(catalogue.filter(canOrder).map((c) => c.slug));

type Op =
  | { op: "add"; slug: string; plan: CartLine["plan"]; quantity: number }
  | { op: "quantity"; slug: string; plan: CartLine["plan"]; quantity: number }
  | { op: "plan"; slug: string; plan: CartLine["plan"]; to: CartLine["plan"] }
  | { op: "remove"; slug: string; plan: CartLine["plan"] };

function parse(body: unknown): Op | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.slug !== "string" || !SLUGS.has(b.slug) || !isPlan(b.plan)) return null;
  const qty = Number(b.quantity);
  const validQty = Number.isInteger(qty) && qty >= 0 && qty <= MAX_QUANTITY;

  // Lines that sold out while in the cart can still be reduced or removed.
  const orderable = ORDERABLE.has(b.slug);

  switch (b.op) {
    case "add":
      return orderable && validQty && qty > 0
        ? { op: "add", slug: b.slug, plan: b.plan, quantity: qty }
        : null;
    case "quantity":
      return validQty && (orderable || qty === 0)
        ? { op: "quantity", slug: b.slug, plan: b.plan, quantity: qty }
        : null;
    case "plan":
      return orderable && isPlan(b.to) ? { op: "plan", slug: b.slug, plan: b.plan, to: b.to } : null;
    case "remove":
      return { op: "remove", slug: b.slug, plan: b.plan };
    default:
      return null;
  }
}

const same = (l: CartLine, op: Op) => l.slug === op.slug && l.plan === op.plan;

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request refused." }, { status: 403 });
  }

  const op = parse(await readJson(request));
  if (!op) {
    return Response.json({ error: "That cart change was not understood." }, { status: 400 });
  }

  const owner = await ensureOwner();
  const cart = await changeCart(owner, (lines) => {
    switch (op.op) {
      case "add":
        return [...lines, { slug: op.slug, plan: op.plan, quantity: op.quantity }];
      case "quantity":
        return lines.map((l) => (same(l, op) ? { ...l, quantity: op.quantity } : l));
      case "plan":
        // Switching into a plan the sequence already has merges the two lines.
        return lines.map((l) => (same(l, op) ? { ...l, plan: op.to } : l));
      case "remove":
        return lines.filter((l) => !same(l, op));
    }
  });

  return Response.json({ cart }, { headers: { "Cache-Control": "private, no-store" } });
}
