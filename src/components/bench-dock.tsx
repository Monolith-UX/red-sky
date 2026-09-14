"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CHIPS, answerFor, type Reply } from "@/lib/assistant";

/* ─────────────────────────────────────────────────────────────
   The bench assistant answers from the catalogue itself — see
   lib/assistant.ts. Dosing, medical and veterinary questions are
   refused by design; everything here is sold for in-vitro research.
   ───────────────────────────────────────────────────────────── */

type Message = { from: "bot" | "you"; text: string; link?: Reply["link"] };

const OPENER: Message = {
  from: "bot",
  text: "Ask me about a lot, a certificate, purity, monthly orders or how we ship. I answer from the same data that ships with the vial.",
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
      () => setMessages((m) => [...m, { from: "bot", ...answerFor(q) }]),
      420,
    );
  }

  function toTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  const chips = CHIPS;

  return (
    <div className="bench-dock pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-end">
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
                      {m.link && (
                        <Link
                          href={m.link.href}
                          onClick={() => setOpen(false)}
                          className="mt-2 flex w-fit items-center gap-2 font-medium decoration-sun underline-offset-4"
                        >
                          {m.link.label}
                          <svg width="14" height="9" viewBox="0 0 16 10" fill="none" aria-hidden="true">
                            <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                          </svg>
                        </Link>
                      )}
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
                  {chips.map((chip) => (
                    <li key={chip}>
                      <button
                        type="button"
                        onClick={() => send(chip)}
                        className="border border-hairline px-2.5 py-1.5 text-[0.75rem] text-graphite transition-colors duration-150 hover:border-ink hover:text-ink"
                      >
                        {chip}
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
