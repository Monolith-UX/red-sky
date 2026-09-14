"use server";

import { CLINICAL, EMAIL_LIVE, TOPICS, channelFor, isTopic } from "@/lib/contact";
import { clean, cleanText, isEmail } from "@/lib/forms";
import { allowAttempt } from "@/lib/server/auth";
import { addMessage } from "@/lib/server/store";

export type ContactState = {
  error?: string;
  fields?: Record<string, string>;
  sent?: { ref: string; email: string; channel: string; clinical: boolean };
};

const shortId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();

/**
 * Stores the message against a reference. There is no mail provider in this
 * build, so nothing is forwarded yet: this is where a transactional email to
 * the channel's inbox, and an acknowledgement to the sender, would be sent.
 */
export async function sendMessage(_: ContactState, form: FormData): Promise<ContactState> {
  const topic = isTopic(form.get("topic")) ? (form.get("topic") as string) : "other";
  const fields = {
    topic,
    name: clean(form.get("name"), 80),
    email: clean(form.get("email"), 254).toLowerCase(),
    organisation: clean(form.get("organisation"), 120),
    lot: clean(form.get("lot"), 24).toUpperCase(),
    message: cleanText(form.get("message"), 4000),
  };
  const channel = channelFor(topic as (typeof TOPICS)[number]["value"]);

  // A filled honeypot is a bot. Tell it everything went fine and keep nothing.
  if (clean(form.get("website"), 200)) {
    return { sent: { ref: `MSG-${shortId()}`, email: fields.email, channel: channel.email, clinical: false } };
  }

  if (!fields.name) return { error: "Add your name, so the reply can use it.", fields };
  if (!isEmail(fields.email)) {
    return { error: "That address is missing an @ or a domain. Check it and try again.", fields };
  }
  if (fields.message.length < 10) {
    return { error: "Say a little more in the message — a sentence is enough.", fields };
  }
  if (!(await allowAttempt(`contact:${fields.email}`, 5, 60 * 60 * 1000))) {
    return {
      error: EMAIL_LIVE
        ? `That is a lot of messages in an hour. Write to ${channel.email} directly instead.`
        : "That is a lot of messages in an hour. Wait a while and send the rest together.",
      fields,
    };
  }

  const today = new Date().toISOString();
  const ref = `MSG-${today.slice(2, 10).replace(/-/g, "")}-${shortId()}`;
  await addMessage({ ref, received: today, ...fields });

  return {
    sent: { ref, email: fields.email, channel: channel.email, clinical: CLINICAL.test(fields.message) },
  };
}
