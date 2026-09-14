import "server-only";
import { currentUser } from "./auth";
import { getProfile } from "./store";

/** Moderators are named by email in RED_SKY_MODERATORS, comma-separated; staff (RED_SKY_ADMINS) moderate too. */
export async function isModerator() {
  const user = await currentUser();
  const allowed = [process.env.RED_SKY_MODERATORS, process.env.RED_SKY_ADMINS]
    .join(",")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!user && allowed.includes(user.email);
}

/** Prefill for a signed-in author; nothing for a guest. */
export async function authorDefaults() {
  const user = await currentUser();
  if (!user) return null;
  const profile = await getProfile(user.id);
  return { name: profile.name, organisation: profile.organisation, email: profile.email || user.email };
}
