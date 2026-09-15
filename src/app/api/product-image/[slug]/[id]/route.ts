import { getProducts, readProductImage } from "@/lib/server/store";

/**
 * Serves a product photo. Product photos are public — they are on the
 * catalogue — so this only checks that the product lists the image, takes the
 * type from that record rather than the request, and locks the response down
 * so the file can only ever be an image. The version in the query string
 * changes when a photo is replaced, so a versioned URL can be cached for good.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!/^[a-z0-9-]{1,60}$/.test(slug) || !/^[a-z0-9]{8,40}$/.test(id)) return new Response(null, { status: 404 });

  const image = (await getProducts())[slug]?.images.find((i) => i.id === id);
  const bytes = image ? await readProductImage(slug, image) : null;
  if (!image || !bytes) return new Response(null, { status: 404 });

  const versioned = new URL(request.url).searchParams.get("v") === String(image.version);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
