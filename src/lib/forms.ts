/** Validation shared by the client forms and the server code that re-checks them. */

export const isEmail = (v: string) =>
  v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Trims, collapses internal runs of whitespace and caps the length. */
export const clean = (v: FormDataEntryValue | null | undefined, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Like `clean`, but keeps line breaks for free-text messages. */
export const cleanText = (v: FormDataEntryValue | null | undefined, max: number) =>
  typeof v === "string"
    ? v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max)
    : "";
