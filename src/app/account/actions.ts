"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MAX_QUANTITY,
  isWeekday,
  nextDispatch,
  readAddress,
  todayIso,
  upcomingDispatch,
  type Address,
  type AvatarType,
  type StandingOrder,
  type Weekday,
} from "@/lib/account";
import { clean, isEmail } from "@/lib/forms";
import {
  allowAttempt,
  clearAttempts,
  currentSessionHash,
  currentUser,
  endSession,
  hashPassword,
  startSession,
  verifyPassword,
} from "@/lib/server/auth";
import {
  changeOrder,
  closeAccount as dropAccount,
  createUser,
  endOtherSessions,
  findUserByEmail,
  getUser,
  mergeOwner,
  removeAvatar as dropAvatar,
  saveAddress,
  saveAvatar,
  saveProfile as writeProfile,
  setPasswordHash,
} from "@/lib/server/store";
import { forgetVisitor, readVisitor } from "@/lib/server/visitor";

/**
 * Every action re-checks who is asking. Rendering a form only for a signed-in
 * user is not a security boundary: an action can be called without the page.
 */

export type FormState = {
  error?: string;
  fields?: Record<string, string>;
  ok?: boolean;
  message?: string;
};

const MIN_PASSWORD = 10;

/** Only same-site paths, so a crafted link cannot bounce someone off-site after sign-in. */
function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/account";
}

async function adoptGuest(user: string) {
  const guest = await readVisitor();
  if (guest) await mergeOwner(guest, user);
}

/* ── Sign in, create, sign out ─────────────────────────────── */

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email"), 254).toLowerCase();
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const keep = form.get("keep") === "on";
  const fields = { email };

  if (!isEmail(email) || !password) {
    return { error: "Enter the email address and password for the account.", fields };
  }
  if (!(await allowAttempt(`sign-in:${email}`))) {
    return {
      error: "Too many attempts for that address. Wait ten minutes, or ask through the contact page.",
      fields,
    };
  }

  const user = await findUserByEmail(email);
  const valid = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !valid) {
    return { error: "That email and password do not match an account.", fields };
  }

  await clearAttempts(`sign-in:${email}`);
  await adoptGuest(user.id);
  await startSession(user.id, keep);
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const email = clean(form.get("email"), 254).toLowerCase();
  const name = clean(form.get("name"), 80);
  const organisation = clean(form.get("organisation"), 120);
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const keep = form.get("keep") === "on";
  const fields = { email, name, organisation };

  if (!isEmail(email)) {
    return { error: "That address is missing an @ or a domain. Check it and try again.", fields };
  }
  if (password.length < MIN_PASSWORD) {
    return { error: `Use a password of at least ${MIN_PASSWORD} characters.`, fields };
  }
  if (password.length > 200) {
    return { error: "That password is longer than we accept. Keep it under 200 characters.", fields };
  }
  if (form.get("terms") !== "on") {
    return {
      error: "Confirm that you are at least 21 and accept the terms of sale to create an account.",
      fields,
    };
  }
  if (!(await allowAttempt(`sign-up:${email}`, 3))) {
    return { error: "Too many attempts for that address. Wait ten minutes and try again.", fields };
  }

  const id = crypto.randomUUID();
  const created = await createUser({
    id,
    email,
    passwordHash: await hashPassword(password),
    created: new Date().toISOString(),
  });
  if (!created) {
    return { error: "There is already an account for that address. Sign in instead.", fields };
  }

  await adoptGuest(id);
  await writeProfile(id, { name, organisation, email });
  await startSession(id, keep);
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await endSession();
  redirect("/account");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Your session has ended. Sign in again to change the password." };

  const current = typeof form.get("current") === "string" ? String(form.get("current")) : "";
  const replacement = typeof form.get("replacement") === "string" ? String(form.get("replacement")) : "";

  if (replacement.length < MIN_PASSWORD) {
    return { error: `Use a new password of at least ${MIN_PASSWORD} characters.` };
  }
  if (replacement.length > 200) {
    return { error: "That password is longer than we accept. Keep it under 200 characters." };
  }
  if (!(await allowAttempt(`password:${user.id}`))) {
    return { error: "Too many attempts. Wait ten minutes and try again." };
  }

  const record = await getUser(user.id);
  if (!(await verifyPassword(current, record?.passwordHash ?? null))) {
    return { error: "The current password is not right." };
  }

  await setPasswordHash(user.id, await hashPassword(replacement));
  const everywhere = form.get("everywhere") === "on";
  if (everywhere) await endOtherSessions(user.id, await currentSessionHash());
  return {
    ok: true,
    message: everywhere
      ? "Password changed, and every other device has been signed out."
      : "Password changed.",
  };
}

/* ── Profile and avatar ────────────────────────────────────── */

async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Sign in to change your account.");
  return user;
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Your session has ended. Sign in again to save." };

  const name = clean(form.get("name"), 80);
  const organisation = clean(form.get("organisation"), 120);
  const email = clean(form.get("email"), 254).toLowerCase();
  const fields = { name, organisation, email };

  if (email && !isEmail(email)) {
    return { error: "That address is missing an @ or a domain. Check it and try again.", fields };
  }

  await writeProfile(user.id, { name, organisation, email: email || user.email });
  revalidatePath("/account");
  return { ok: true, message: "Saved.", fields };
}

/** Reads the first bytes, never the declared type, to decide what a file is. */
function sniff(bytes: Uint8Array): AvatarType | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

const AVATAR_LIMIT = 512 * 1024;

export async function uploadAvatar(form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Your session has ended. Sign in again to change the photo." };

  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image first." };
  }
  if (file.size > AVATAR_LIMIT) {
    return { error: "That image is too large. Use one under 512 KB." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) {
    return { error: "That file is not a PNG, JPEG or WebP image." };
  }

  await saveAvatar(user.id, type, bytes);
  revalidatePath("/account");
  return { ok: true, message: "Photo updated." };
}

export async function removeAvatar(): Promise<FormState> {
  const user = await requireUser();
  await dropAvatar(user.id);
  revalidatePath("/account");
  return { ok: true, message: "Photo removed." };
}

/* ── Delivery address ──────────────────────────────────────── */

export type AddressState = FormState & { address?: Partial<Address> };

export async function saveDeliveryAddress(_: AddressState, form: FormData): Promise<AddressState> {
  const user = await currentUser();
  if (!user) return { error: "Your session has ended. Sign in again to save." };

  const { address, missing } = readAddress(form);
  if (missing) {
    return { error: `Add the ${missing.label.toLowerCase()} so the courier can deliver it.`, address };
  }

  await saveAddress(user.id, address);
  revalidatePath("/account");
  return { ok: true, message: "Address saved." };
}

export async function removeDeliveryAddress(): Promise<FormState> {
  const user = await requireUser();
  await saveAddress(user.id, null);
  revalidatePath("/account");
  return { ok: true, message: "Address removed." };
}

/* ── Closing the account ───────────────────────────────────── */

/**
 * Asks for the password again, so an unattended signed-in browser cannot close
 * the account. Redirects to the signed-out page with the categories that were
 * kept — names only, nothing personal in the URL.
 */
export async function closeAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Your session has ended. Sign in again to close the account." };

  if (form.get("confirm") !== "on") {
    return { error: "Tick the box to confirm that you want the account closed." };
  }
  if (!(await allowAttempt(`close:${user.id}`))) {
    return { error: "Too many attempts. Wait ten minutes and try again." };
  }
  const password = typeof form.get("password") === "string" ? String(form.get("password")) : "";
  const record = await getUser(user.id);
  if (!(await verifyPassword(password, record?.passwordHash ?? null))) {
    return { error: "That password is not right. Nothing has been deleted." };
  }

  const kept = await dropAccount(user.id);
  if (!kept) return { error: "That account no longer exists." };

  await endSession();
  await forgetVisitor();
  redirect(`/account?closed=${kept.join(",") || "none"}`);
}

/* ── Standing orders ───────────────────────────────────────── */

export type OrderChange =
  | { kind: "pause" }
  | { kind: "resume" }
  | { kind: "skip" }
  | { kind: "quantity"; quantity: number }
  | { kind: "day"; weekday: Weekday }
  | { kind: "cancel" };

export async function changeStandingOrder(id: string, change: OrderChange): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "Your session has ended. Sign in again to change this order." };
  if (typeof id !== "string" || !change || typeof change !== "object") {
    return { error: "That change was not understood." };
  }

  const today = todayIso();
  const found = await changeOrder(user.id, id, (order): StandingOrder | null => {
    switch (change.kind) {
      case "pause":
        return { ...order, status: "paused" };
      case "resume":
        return { ...order, status: "active", nextDispatch: nextDispatch(order.weekday, today) };
      case "skip":
        // Dispatches fall on a first weekday, so the next one after it is a month on.
        return { ...order, nextDispatch: nextDispatch(order.weekday, upcomingDispatch(order, today)) };
      case "quantity": {
        const q = Math.floor(Number(change.quantity));
        return q >= 1 && q <= MAX_QUANTITY ? { ...order, quantity: q } : order;
      }
      case "day":
        return isWeekday(change.weekday)
          ? { ...order, weekday: change.weekday, nextDispatch: nextDispatch(change.weekday, today) }
          : order;
      case "cancel":
        return null;
      default:
        return order;
    }
  });

  if (!found) return { error: "That standing order is no longer on this account." };
  revalidatePath("/account");
  return { ok: true };
}
