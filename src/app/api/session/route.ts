import { currentUser, readOwner, renewSession } from "@/lib/server/auth";
import { favoriteSnapshot, getCart, getProfile, waitlistSnapshot } from "@/lib/server/store";
import { seedOf } from "@/lib/server/visitor";

/**
 * Everything a static page needs to personalise itself, in one request:
 * who is signed in, favorite and waitlist counts with this owner's own
 * entries, the cart, and enough of the profile for the header.
 *
 * Every page load calls it, which makes it the natural place to slide a
 * returning user's session forward. It never creates a guest id.
 */
export async function GET() {
  await renewSession();
  const [user, owner] = await Promise.all([currentUser(), readOwner()]);
  const [favorites, waitlist, cart, profile] = await Promise.all([
    favoriteSnapshot(owner),
    waitlistSnapshot(owner),
    getCart(owner),
    getProfile(owner),
  ]);

  return Response.json(
    {
      user: user ? { email: user.email } : null,
      favorites,
      waitlist,
      cart,
      profile: {
        name: profile.name,
        email: profile.email || user?.email || "",
        avatar: profile.avatar ? `/api/account/avatar?v=${profile.avatar.version}` : null,
        seed: seedOf(owner),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
