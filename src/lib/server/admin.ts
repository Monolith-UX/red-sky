import "server-only";
import { currentUser } from "./auth";
import { logAdmin } from "./store";

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
