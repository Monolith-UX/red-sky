"use server";

import { revalidatePath } from "next/cache";
import { catalogue } from "@/lib/catalog";
import { clean, cleanText, isEmail } from "@/lib/forms";
import { allowAttempt, currentUser } from "@/lib/server/auth";
import { isModerator } from "@/lib/server/moderation";
import { addStory, hasOrdered, setStoryStatus } from "@/lib/server/store";
import { LIMITS, flagsFor } from "@/lib/stories";

export type StoryState = {
  error?: string;
  fields?: Record<string, string>;
  sent?: { id: string; flagged: boolean; verified: boolean };
};

const SLUGS = new Set(catalogue.map((c) => c.slug));
const shortId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

export async function submitStory(_: StoryState, form: FormData): Promise<StoryState> {
  const user = await currentUser();
  const fields = {
    name: clean(form.get("name"), LIMITS.name),
    role: clean(form.get("role"), LIMITS.role),
    organisation: clean(form.get("organisation"), LIMITS.organisation),
    location: clean(form.get("location"), LIMITS.location),
    email: clean(form.get("email"), 254).toLowerCase(),
    lot: clean(form.get("lot"), 24).toUpperCase(),
    title: clean(form.get("title"), LIMITS.title),
    story: cleanText(form.get("story"), LIMITS.story),
    outcome: cleanText(form.get("outcome"), LIMITS.outcome),
  };
  const slugs = form
    .getAll("slugs")
    .map((v) => String(v))
    .filter((s) => SLUGS.has(s))
    .slice(0, 3);
  const all = { ...fields, slugs: slugs.join(",") };

  // Bots fill the hidden field; they get a quiet success and nothing is kept.
  if (clean(form.get("website"), 200)) {
    return { sent: { id: `ST-${shortId()}`, flagged: false, verified: false } };
  }

  if (!fields.name || !fields.role) return { error: "Add the name and role the story should carry.", fields: all };
  if (!isEmail(fields.email)) {
    return { error: "Add an email address so we can confirm the story with you. It is never published.", fields: all };
  }
  if (!slugs.length) return { error: "Choose at least one sequence the story is about.", fields: all };
  if (fields.title.length < 8) return { error: "Give the story a title of a few words.", fields: all };
  if (fields.story.length < 120) {
    return { error: "Tell a little more — at least a few sentences on what you set out to do and what you used.", fields: all };
  }
  if (!fields.outcome) return { error: "Say what changed in your work, even if the answer is that nothing did.", fields: all };
  for (const consent of ["own-work", "no-human-use", "publish"]) {
    if (form.get(consent) !== "on") {
      return { error: "All three confirmations are needed before a story can be considered.", fields: all };
    }
  }
  if (!(await allowAttempt(`story:${fields.email}`, 3, 24 * 60 * 60 * 1000))) {
    return { error: "That is several stories in a day. Write to lab@redskybio.com if you have more to send.", fields: all };
  }

  const flags = flagsFor(fields.title, fields.story, fields.outcome);
  const verified = user ? await hasOrdered(user.id, slugs) : false;
  const id = `ST-${shortId()}`;

  await addStory({
    id,
    received: new Date().toISOString(),
    status: flags.length ? "flagged" : "pending",
    owner: user?.id ?? null,
    ...fields,
    slugs,
    verifiedOrder: verified,
    flags,
    published: null,
  });

  return { sent: { id, flagged: flags.length > 0, verified } };
}

export async function moderateStory(id: string, decision: "publish" | "reject" | "unpublish") {
  if (!(await isModerator())) return { error: "Only moderators can change a story." };
  const status = decision === "publish" ? "published" : decision === "reject" ? "rejected" : "pending";
  if (!(await setStoryStatus(String(id), status))) return { error: "That story no longer exists." };
  revalidatePath("/stories");
  revalidatePath("/stories/review");
  return { ok: true };
}
