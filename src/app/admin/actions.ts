"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayIso } from "@/lib/account";
import { clean, isEmail } from "@/lib/forms";
import { readLotForm } from "@/lib/lots";
import { advanceFor, shipmentsDue } from "@/lib/shipments";
import { audit, liveProducts, rebuild, requireAdmin } from "@/lib/server/admin";
import { hashPassword } from "@/lib/server/auth";
import {
  allStandingOrders,
  deleteLot,
  endOtherSessions,
  recordShipment,
  findUserByEmail,
  getLots,
  saveCertificate,
  saveLot,
  setPasswordHash,
} from "@/lib/server/store";

export type AdminState = { error?: string; ok?: boolean; message?: string; temporary?: string };

const PDF_LIMIT = 4 * 1024 * 1024;

export async function saveLotAction(slug: string, _: AdminState, form: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  if (!(await liveProducts()).some((c) => c.slug === slug)) return { error: "That product is not in the catalogue." };

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

/**
 * Records one shipment from standing orders. The browser names the group
 * (owner and dispatch date); everything else — lines, prices, the stack
 * saving, the address — is worked out here again from the store. Payment is
 * not connected, so the record is unpaid; this is where a charge would go.
 */
export async function recordShipmentAction(owner: string, date: string): Promise<AdminState> {
  const admin = await requireAdmin();
  if (typeof owner !== "string" || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "That shipment was not understood." };
  }

  const shipment = shipmentsDue(await allStandingOrders(), date).find((s) => s.owner === owner && s.date === date);
  if (!shipment || shipment.ships.length === 0) {
    return { error: "Nothing in that shipment can ship now. Reload the page to see where it stands." };
  }

  const today = todayIso();
  const ref = `SHP-${today.slice(2).replace(/-/g, "")}-${crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  const recorded = await recordShipment(
    owner,
    {
      ref,
      placed: new Date().toISOString(),
      lines: shipment.lines,
      weekday: shipment.ships[0].weekday,
      standing: shipment.ships.map((o) => o.id),
      totals: { once: 0, monthly: shipment.total, saving: shipment.saving, today: shipment.total },
      address: shipment.address ?? undefined,
      source: "standing",
    },
    advanceFor(shipment.ships),
  );
  if (!recorded) return { error: "Someone recorded or changed this shipment a moment ago. Reload the page." };

  await audit(admin.email, "shipment.record", { ref, account: shipment.email, lines: shipment.lines.length });
  revalidatePath("/account");
  // The shipment leaves the due list once recorded, taking its button with it, so the
  // confirmation lives on the page instead (see `recorded` in admin/page.tsx).
  redirect(`/admin?recorded=${ref}#due`);
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
