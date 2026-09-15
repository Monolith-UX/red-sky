import "server-only";
import { seedCatalogue, type CatalogItem } from "@/lib/catalog";
import { productToItem, type ImageType } from "@/lib/products";
import { currentUser } from "./auth";
import { getProducts, logAdmin } from "./store";

/**
 * Staff are named by email in RED_SKY_ADMINS, comma-separated, and must be
 * signed in as that account. Until RED_SKY_ADMINS is set, the story
 * moderators in RED_SKY_MODERATORS are the staff.
 */
const listed = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const adminEmails = () => listed(process.env.RED_SKY_ADMINS ?? process.env.RED_SKY_MODERATORS);

/** The signed-in staff member, or null. Safe while rendering: it never writes. */
export async function currentAdmin() {
  const user = await currentUser();
  return user && adminEmails().includes(user.email) ? user : null;
}

/**
 * For Server Actions: the staff member, or a thrown error. Every admin action
 * calls this itself — the page hiding a form from others is not a boundary.
 */
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new Error("Staff only.");
  return admin;
}

/** Records staff access and changes, as the privacy policy says we do. */
export const audit = (actor: string, action: string, detail: Record<string, unknown> = {}) =>
  logAdmin(actor, action, detail);

/**
 * The products as they stand in the store right now — not as the running
 * build has them — so staff always edit the current list. Before any product
 * is saved, that is the sample catalogue written in code.
 */
export async function liveProducts(): Promise<CatalogItem[]> {
  const saved = Object.values(await getProducts());
  if (!saved.length) return seedCatalogue;
  return saved
    .filter((p) => !p.archived)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    .map(productToItem);
}

/**
 * The catalogue is built into the site, so a saved product or lot goes live
 * when the site rebuilds. NETLIFY_BUILD_HOOK is a build hook URL from Netlify
 * (Site configuration → Build & deploy → Build hooks); without it, staff
 * trigger a deploy by hand. Returns the sentence to show staff.
 */
export async function rebuild(): Promise<string> {
  const hook = process.env.NETLIFY_BUILD_HOOK;
  if (!hook) return "Saved. It goes live on the next deploy — set NETLIFY_BUILD_HOOK to make that automatic.";
  try {
    const res = await fetch(hook, { method: "POST", body: "{}" });
    return res.ok
      ? "Saved. The site is rebuilding and the change will be live in about three minutes."
      : `Saved, but the rebuild did not start (Netlify answered ${res.status}). Trigger a deploy in Netlify.`;
  } catch {
    return "Saved, but the rebuild could not be reached. Trigger a deploy in Netlify.";
  }
}

/** Reads the first bytes, never the declared type, to decide what an image is. */
export function sniffImage(bytes: Uint8Array): ImageType | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}
