import { CLINICAL } from "./contact";

/**
 * Client stories are submitted by researchers about their own laboratory work
 * and published only after a person has read them. Nothing on the page is
 * written by us: until stories are approved, it shows a template instead.
 *
 * The line held here is the one the terms hold. Everything sold is for
 * in-vitro research, so a story about use in a person or an animal — or about
 * a health outcome — is flagged on arrival and never published as written.
 */

export type StoryStatus = "pending" | "flagged" | "published" | "rejected";

export type Story = {
  id: string;
  received: string;
  status: StoryStatus;
  /** The signed-in account that submitted it, if any. Never shown. */
  owner: string | null;
  /** For verifying the story with its author. Never shown. */
  email: string;
  name: string;
  role: string;
  organisation: string;
  location: string;
  slugs: string[];
  lot: string;
  title: string;
  story: string;
  outcome: string;
  /** The submitting account has placed an order containing one of `slugs`. */
  verifiedOrder: boolean;
  flags: string[];
  published: string | null;
};

export const LIMITS = { title: 90, story: 1500, outcome: 600, name: 60, role: 60, organisation: 90, location: 60 };

/** Personal-use and outcome language, over and above the dosing questions CLINICAL catches. */
const PERSONAL =
  /\b(heal(ed|ing)?|injur(y|ies|ed)|pain|weight loss|lost \d+\s?(lb|lbs|kg|pounds)|muscle|fat loss|libido|tann?(ing|ed)|wrinkle|sleep(ing)? better|my (knee|shoulder|back|joint|tendon|skin|body)|on myself|i took|i injected|i felt|feel(ing)? better|results on me|my journey|my progress|patient|client of mine)\b/i;

export function flagsFor(...texts: string[]): string[] {
  const all = texts.join("\n");
  const flags: string[] = [];
  if (CLINICAL.test(all)) flags.push("Mentions dosing, treatment or human use");
  if (PERSONAL.test(all)) flags.push("Reads as personal use or a health outcome");
  return flags;
}

export const WE_PUBLISH = [
  "Your own work in a laboratory research setting.",
  "What you set out to measure or make, what you used, and what changed.",
  "Problems as well as successes — a lot that failed your own spec is a story too.",
  "Lot numbers, so a reader can find the certificate you worked from.",
];

export const WE_DO_NOT = [
  "Any use in people or animals, doses, or health outcomes of any kind.",
  "Claims that anything we sell treats, cures or prevents anything.",
  "Stories we cannot confirm with the person who sent them.",
  "Anything you have not agreed to put your name to.",
];

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join(".") + (name.trim() ? "." : "");
