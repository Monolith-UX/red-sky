"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { seedCatalogue } from "@/lib/catalog";
import { clean, isEmail } from "@/lib/forms";
import { readLotForm } from "@/lib/lots";
import { audit, requireAdmin } from "@/lib/server/admin";
import { hashPassword } from "@/lib/server/auth";
import {
  deleteLot,
  endOtherSessions,
  findUserByEmail,
  getLots,
  saveCertificate,
  saveLot,
  setPasswordHash,
} from "@/lib/server/store";

export type AdminState = { error?: string; ok?: boolean; message?: string; temporary?: string };

/**
 * The catalogue is built into the site, so a saved lot goes live when the
 * site rebuilds. NETLIFY_BUILD_HOOK is a build hook URL from Netlify (Site
 * configuration → Build & deploy → Build hooks); without it, staff trigger a
 * deploy by hand.
 */
async function rebuild(): Promise<string> {
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

const PDF_LIMIT = 4 * 1024 * 1024;

export async function saveLotAction(slug: string, _: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!seedCatalogue.some((c) => c.slug === slug)) return { error: "That sequence is not in the catalogue." };

  const read = readLotForm(slug, form, admin.email);
  if ("error" in read) return { error: read.error };
  const { lot } = read;

  // Two sequences cannot carry the same lot number.
  const clash = Object.values(await getLots()).find((l) => l.lot && l.lot === lot.lot && l.slug !== slug);
  if (clash) return { error: `Lot ${lot.lot} is already recorded against another sequence.` };

  let certificate: string | null | undefined;
  const file = form.get("certificate");
  if (file instanceof File && file.size > 0) {
    if (!lot.lot) return { error: "An upcoming sequence has no lot, so it cannot have a certificate yet." };
    if (file.size > PDF_LIMIT) return { error: "That PDF is over 4 MB. Export it at a lower resolution and try again." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    // %PDF- — read from the bytes, never the declared type.
    if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d)) {
      return { error: "That file is not a PDF." };
    }
    certificate = await saveCertificate(lot.lot, bytes);
  } else if (form.get("removeCertificate") === "on" || lot.stock === "upcoming") {
    certificate = null;
  }

  await saveLot(lot, certificate);
  await audit(admin.email, "lot.save", {
    slug,
    lot: lot.lot,
    stock: lot.stock,
    price: lot.price,
    sample: lot.sample,
    certificate: certificate === undefined ? "unchanged" : certificate ? "uploaded" : "removed",
  });
  revalidatePath("/admin");
  return { ok: true, message: await rebuild() };
}

export async function revertLotAction(slug: string): Promise<AdminState> {
  const admin = await requireAdmin();
  await deleteLot(slug);
  await audit(admin.email, "lot.revert", { slug });
  revalidatePath("/admin");
  return { ok: true, message: `Reverted to the values written in code. ${await rebuild()}` };
}

/** Readable and long: four groups of four, no characters that are easy to misread. */
function temporaryPassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join(""),
  ).join("-");
}

/**
 * Until email is connected, a forgotten password is reset by a person: staff
 * set a temporary one, every device is signed out, and staff send it to the
 * address on the account. The customer changes it on the account page.
 */
export async function resetPasswordAction(_: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const email = clean(form.get("email"), 254).toLowerCase();
  if (!isEmail(email)) return { error: "Enter the email address the account signs in with." };

  const user = await findUserByEmail(email);
  if (!user) return { error: "No account signs in with that address." };

  const temporary = temporaryPassword();
  await setPasswordHash(user.id, await hashPassword(temporary));
  await endOtherSessions(user.id, null);
  await audit(admin.email, "account.reset-password", { account: email });
  return {
    ok: true,
    message: `Temporary password set for ${email}, and every device signed out. Send it to that address only.`,
    temporary,
  };
}
