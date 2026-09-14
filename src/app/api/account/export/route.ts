import { todayIso } from "@/lib/account";
import { currentUser } from "@/lib/server/auth";
import { exportOwner } from "@/lib/server/store";

/**
 * A copy of everything this account holds, as one JSON file — the portable
 * copy the privacy policy promises, without having to write in for it. Only
 * ever the signed-in user's own data; a cross-site page can start the
 * download but cannot read it.
 */
export async function GET() {
  const user = await currentUser();
  const data = user ? await exportOwner(user.id) : null;
  if (!data) return new Response("Sign in to download your data.", { status: 401 });

  const file = {
    exported: new Date().toISOString(),
    from: "Red Sky Biosciences — redskybio.com",
    note: "Everything this account holds. Password and session hashes are left out: they are credentials, not information about you. Questions to privacy@redskybio.com.",
    ...data,
  };

  return new Response(JSON.stringify(file, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="red-sky-account-${todayIso()}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
