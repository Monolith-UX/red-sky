/**
 * Where a message goes. Addresses and reply times are the ones the policies
 * and the rest of the site already commit to — nothing here is new policy.
 */

/**
 * False until the domain is registered and its mailboxes exist. While false,
 * no address is shown or linked, and every channel is reached through the
 * contact form (stored, and read in /admin). Flip it and the addresses below
 * reappear on the contact page, the form and the policy sidebar.
 */
export const EMAIL_LIVE = false;

export const CHANNELS = [
  {
    key: "lab",
    title: "Technical team",
    email: "lab@redskybio.com",
    covers: "Certificates and lot lookups, solubility, handling, reconstitution, orders, institutional accounts, bulk and custom synthesis quotes.",
    reply: "Within one business day",
  },
  {
    key: "privacy",
    title: "Privacy",
    email: "privacy@redskybio.com",
    covers: "A copy of your data, a correction, a deletion, or a question about how we hold it.",
    reply: "Within thirty days",
  },
  {
    key: "access",
    title: "Accessibility",
    email: "access@redskybio.com",
    covers: "Anything on this site that stops you doing something, or content you need in another format.",
    reply: "Within five business days",
  },
] as const;

export type ChannelKey = (typeof CHANNELS)[number]["key"];

export const TOPICS = [
  { value: "lot", label: "A certificate or a specific lot", channel: "lab" },
  { value: "handling", label: "Handling, storage or reconstitution", channel: "lab" },
  { value: "quote", label: "Bulk quantities or another fill", channel: "lab" },
  { value: "synthesis", label: "A custom synthesis", channel: "lab" },
  { value: "order", label: "An order, a standing order or an account", channel: "lab" },
  { value: "privacy", label: "My data and privacy", channel: "privacy" },
  { value: "access", label: "Accessibility of this site", channel: "access" },
  { value: "other", label: "Something else", channel: "lab" },
] as const;

export type TopicValue = (typeof TOPICS)[number]["value"];

export const isTopic = (v: unknown): v is TopicValue => TOPICS.some((t) => t.value === v);

export const channelFor = (topic: TopicValue) =>
  CHANNELS.find((c) => c.key === TOPICS.find((t) => t.value === topic)?.channel) ?? CHANNELS[0];

/**
 * Questions about taking, dosing or treating with a product get the same
 * answer here as from the bench assistant: we do not give that guidance.
 */
export const CLINICAL =
  /\b(dose|dosage|dosing|inject|injection|mg\/kg|how much should|take it|cycle|human use|myself|my body|side effects?|safe to use|treat|cure|therapy|prescri)/i;
