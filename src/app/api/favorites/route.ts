import { catalogue } from "@/lib/catalog";
import { setFavorite } from "@/lib/server/store";
import { ensureOwner } from "@/lib/server/auth";
import { readJson, sameOrigin } from "@/lib/server/visitor";

const SLUGS = new Set(catalogue.map((c) => c.slug));

/** Sets, rather than toggles, so the client states the outcome it wants. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "Cross-origin request refused." }, { status: 403 });
  }

  const body = (await readJson(request)) as { slug?: unknown; on?: unknown } | null;
  if (!body || typeof body.slug !== "string" || !SLUGS.has(body.slug) || typeof body.on !== "boolean") {
    return Response.json({ error: "Expected a catalogue slug and on: true or false." }, { status: 400 });
  }

  const owner = await ensureOwner();
  const count = await setFavorite(owner, body.slug, body.on);

  return Response.json(
    { slug: body.slug, on: body.on, count },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
