import { readAvatar } from "@/lib/server/store";
import { readOwner } from "@/lib/server/auth";

/**
 * Serves the visitor's own avatar and nobody else's. The type comes from the
 * bytes checked at upload, never from the request, and the response is locked
 * down so a crafted file cannot be interpreted as anything but an image.
 */
export async function GET(request: Request) {
  const owner = await readOwner();
  const avatar = owner ? await readAvatar(owner) : null;
  if (!avatar) return new Response(null, { status: 404 });

  const versioned = new URL(request.url).searchParams.get("v") === String(avatar.version);

  return new Response(new Uint8Array(avatar.bytes), {
    headers: {
      "Content-Type": avatar.type,
      "Cache-Control": versioned ? "private, max-age=31536000, immutable" : "private, no-cache",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
