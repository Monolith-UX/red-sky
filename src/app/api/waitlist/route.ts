import { canWaitlist, getItem } from "@/lib/catalog";
import { isEmail } from "@/lib/forms";
import { getProfile, setWaitlist } from "@/lib/server/store";
import { ensureOwner } from "@/lib/server/auth";
import { readJson, sameOrigin } from "@/lib/server/visitor";

/**
 * Only sequences with nothing to sell take a waitlist. Joining needs an email
 * address, from the request or already on the account; leaving never does.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request refused." }, { status: 403 });
  }

  const body = (await readJson(request)) as
    | { slug?: unknown; on?: unknown; email?: unknown }
    | null;
  const item = typeof body?.slug === "string" ? getItem(body.slug) : undefined;
  if (!body || !item || !canWaitlist(item) || typeof body.on !== "boolean") {
    return Response.json({ error: "That sequence does not take a waitlist." }, { status: 400 });
  }

  const owner = await ensureOwner();
  let email: string | null = null;

  if (body.on) {
    const given = typeof body.email === "string" ? body.email.trim() : "";
    email = given || (await getProfile(owner)).email;
    if (!isEmail(email)) {
      return Response.json(
        { error: "That address is missing an @ or a domain. Check it and try again." },
        { status: 422 },
      );
    }
  }

  const count = await setWaitlist(owner, item.slug, email);

  return Response.json(
    { slug: item.slug, on: body.on, count, email },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
