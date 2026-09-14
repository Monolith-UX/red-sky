"use server";

import { isEmail } from "@/lib/forms";
import { allowAttempt } from "@/lib/server/auth";
import { subscribe } from "@/lib/server/store";

export type SubscribeState = { status: "idle" | "error" | "done"; message?: string; already?: boolean };

/**
 * Adds an address to the release-notes list. Stored locally in this build;
 * connect the mailing provider here, with its double opt-in, before launch.
 */
export async function subscribeToReleases(_: SubscribeState, form: FormData): Promise<SubscribeState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!isEmail(email)) {
    return { status: "error", message: "That address is missing an @ or a domain. Check it and try again." };
  }
  if (!(await allowAttempt(`subscribe:${email}`, 5, 60 * 60 * 1000))) {
    return { status: "error", message: "That address has been tried several times. Wait a little and try again." };
  }
  const added = await subscribe(email);
  return { status: "done", already: !added };
}
