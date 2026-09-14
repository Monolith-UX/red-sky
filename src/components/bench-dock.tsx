"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   The bench assistant answers from the site's own material.
   Dosing, medical and veterinary questions are refused by design —
   everything here is sold for in-vitro research only.
   ───────────────────────────────────────────────────────────── */

type Topic = { id: string; chip: string; match: RegExp; answer: string };

const REFUSAL: Topic = {
  id: "clinical",
  chip: "",
  match:
    /\b(dose|dosage|dosing|inject|injection|mg\/kg|protocol for me|how much should|take it|cycle|human|myself|my body|side effect|safe to use|treat|cure|therapy|prescri)/i,
  answer:
    "I can't help with that one. Everything Red Sky sells is for in-vitro laboratory research — we don't give dosing, medical or veterinary guidance, and nothing here is a drug. For handling, reconstitution or solubility questions, our technical team answers at lab@redskybio.com within a business day.",
};

const TOPICS: Topic[] = [
  {
    id: "coa",
    chip: "Where are the certificates?",
    match: /\b(coa|certificate|chromatogram|trace|hplc report|paperwork|document)/i,
    answer:
      "Every lot page carries its own HPLC trace, the ESI-MS identity result and the initials of the operator who ran it. You can also look a lot up directly by number — RS-2601-B is the BPC-157 currently shipping. Certificates go up the day they come back from the lab.",
  },
  {
    id: "purity",
    chip: "What is the purity floor?",
    match: /\b(purity|pure|99|assay|grade|quality|impurit)/i,
    answer:
      "99% area purity by reverse-phase HPLC at 214 nm, measured on every lot. A lot that misses the floor is destroyed rather than discounted. For reference, lot RS-2601-B assayed at 99.47% and GHK-Cu lot RS-2604-C at 99.61%.",
  },
  {
    id: "shipping",
    chip: "How do you ship?",
    match: /\b(ship|shipping|deliver|courier|cold chain|freight|order|arrive|track)/i,
    answer:
      "Vials leave the freezer at −20 °C and travel on gel packs with a temperature logger in the box, so you can read the whole journey before you open it. Orders placed before 14:00 ET ship the same business day. We have run 412 shipments this year without a chain break.",
  },
  {
    id: "storage",
    chip: "How should I store it?",
    match: /\b(stor|freezer|fridge|shelf life|expire|stability|reconstitut|lyophil|handle)/i,
    answer:
      "Lyophilized vials hold at −20 °C, sealed and out of light. Bring a vial to room temperature before you break the seal so nothing condenses inside it. Reconstitution guidance for each sequence sits on its lot page.",
  },
  {
    id: "bulk",
    chip: "Do you quote bulk?",
    match: /\b(bulk|quantity|wholesale|custom|synthesis|gram|quote|price|cost|invoice|account)/i,
    answer:
      "Yes. Bulk quantities and custom synthesis are quoted within one business day — send the sequence, the scale and the purity you need to lab@redskybio.com. Institutional accounts can be set up with net-30 terms.",
  },
  {
    id: "catalog",
    chip: "",
    match: /\b(catalog|carry|stock|available|bpc|tb-?500|ghk|ipamorelin|cjc|semax|sequence)/i,
    answer:
      "41 sequences are in the catalog. The six moving fastest right now are BPC-157, TB-500, GHK-Cu, Ipamorelin, CJC-1295 without DAC, and Semax — all in stock with current lots. Scroll up to the catalog to see purities and fills.",
  },
];

const FALLBACK =
  "I can answer on lots, certificates, purity, shipping, storage and bulk quotes. For anything outside that, the technical team replies at lab@redskybio.com within a business day.";

function answerFor(text: string) {
  if (REFUSAL.match.test(text)) return REFUSAL.answer;
  return TOPICS.find((t) => t.match.test(text))?.answer ?? FALLBACK;
}

type Message = { from: "bot" | "you"; text: string };

const OPENER: Message = {
  from: "bot",
  text: "Ask me about a lot, a certificate, purity, or how we ship. I answer from the same data that ships with the vial.",
};

export function BenchDock() {
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [messages, setMessages] = useState<Message[]>([OPENER]);
  const [draft, setDraft] = useState("");

  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, open]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { from: "you", text: q }]);
    setDraft("");
    window.setTimeout(
      () => setMessages((m) => [...m, { from: "bot", text: answerFor(q) }]),
      420,
    );
  }

  function toTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  const chips = TOPICS.filter((t) => t.chip);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-end">
      <div className="pointer-events-none flex w-full max-w-[26rem] flex-col items-end gap-3 p-4 sm:p-6">
        {/* Panel */}
        {open && (
          <div
            role="dialog"
            aria-label="Red Sky bench assistant"
            className="slide-in pointer-events-auto flex h-[min(30rem,70vh)] w-full flex-col border border-ink bg-paper shadow-[0_24px_48px_-28px_rgba(20,22,26,0.5)]"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 bg-ink py-3 pl-4 pr-2 text-paper">
              <span className="flex items-center gap-2.5">
                <span className="block h-[0.7rem] w-[0.7rem] rounded-full bg-sun" />
                <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.18em]">
                  Bench assistant
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  launcher.current?.focus();
                }}
                aria-label="Close the bench assistant"
                className="flex h-9 w-9 items-center justify-center text-[#b6bcc6] transition-colors duration-150 hover:text-paper"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                  <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>

            <div
              ref={log}
              className="flex-1 space-y-5 overflow-y-auto px-4 py-5"
              aria-live="polite"
              aria-atomic="false"
            >
              {messages.map((m, i) =>
                m.from === "bot" ? (
                  <div key={i} className="flex gap-2.5">
                    <span className="dot mt-2" aria-hidden="true" />
                    <p className="max-w-[92%] text-[0.875rem] leading-relaxed text-pretty">
                      <span className="visually-hidden">Assistant: </span>
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <p
                    key={i}
                    className="ml-auto w-fit max-w-[85%] bg-bench-deep px-3 py-2 text-[0.875rem] leading-relaxed"
                  >
                    <span className="visually-hidden">You: </span>
                    {m.text}
                  </p>
                ),
              )}
            </div>

            {messages.length <= 1 && (
              <div className="shrink-0 px-4 pb-3">
                <ul role="list" className="flex flex-wrap gap-1.5">
                  {chips.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => send(t.chip)}
                        className="border border-hairline px-2.5 py-1.5 text-[0.75rem] text-graphite transition-colors duration-150 hover:border-ink hover:text-ink"
                      >
                        {t.chip}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="shrink-0 border-t border-hairline"
            >
              <label htmlFor="bench-input" className="visually-hidden">
                Ask the bench assistant
              </label>
              <div className="flex items-center">
                <input
                  ref={input}
                  id="bench-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask about a lot or a certificate"
                  autoComplete="off"
                  className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[0.875rem] placeholder:text-graphite/70 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send the message"
                  className="mr-1 flex h-10 w-10 items-center justify-center text-graphite transition-colors duration-150 hover:text-sun"
                >
                  <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden="true">
                    <path d="M0 5.5h15M11 1l4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
              </div>
              <p className="border-t border-hairline px-4 py-2.5 text-[0.6875rem] leading-snug text-graphite">
                Research use only. No dosing, medical or veterinary guidance.
              </p>
            </form>
          </div>
        )}

        {/* Buttons */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={toTop}
            aria-label="Back to top"
            className={`flex h-11 w-11 items-center justify-center border border-graphite bg-paper text-ink transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper ${
              showTop && !open
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-2 opacity-0"
            }`}
          >
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none" aria-hidden="true">
              <path d="M6.5 15V1M1 6l5.5-5L12 6" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>

          <button
            ref={launcher}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={
              open ? "Close the bench assistant" : "Open the bench assistant"
            }
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-paper bg-sun text-paper shadow-[0_12px_28px_-12px_rgba(20,22,26,0.55)] transition-colors duration-150 hover:bg-sun-deep"
          >
            {/* the trace, at launcher scale */}
            <svg width="26" height="18" viewBox="0 0 26 18" fill="none" aria-hidden="true">
              <path
                d="M0 14h6.5c1 0 1.6-1.2 2.2-4.2C9.6 5.4 10.4 2 12 2s2.4 3.4 3.3 7.8c.6 3 1.2 4.2 2.2 4.2H26"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
