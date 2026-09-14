"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { subscribeToReleases, type SubscribeState } from "@/app/actions";
import { isEmail } from "@/lib/forms";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [local, setLocal] = useState<"idle" | "error">("idle");
  const [result, action, pending] = useActionState<SubscribeState, FormData>(subscribeToReleases, {
    status: "idle",
  });
  const input = useRef<HTMLInputElement>(null);

  // Checked here for instant feedback, and again on the server.
  const state = local === "error" ? "error" : result.status;

  useEffect(() => {
    if (result.status === "error") input.current?.focus();
  }, [result]);

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="on-ink relative scroll-mt-24 overflow-hidden bg-ink text-paper"
    >
      {/* The mark, reprised and cropped by the band edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-1/2 hidden h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-sun lg:block"
      />

      <div className="shell relative py-24 md:py-28">
        <div className="grid12 gap-y-6 lg:grid-rows-[auto_auto] lg:gap-y-7">
          <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5 lg:col-start-1 lg:row-start-1">
            Journal — lot releases
          </p>

          <div className="col-span-12 lg:col-span-6 lg:col-start-1 lg:row-start-2">
            <h2 id="newsletter-heading" className="t-h2 max-w-[13ch]">
              New lots, new assays.
            </h2>
            <p className="t-lead mt-6">
              Every certificate goes up the day it comes back from the lab. We send a
              short note listing what was released and what it tested at — roughly twice
              a month, and nothing else.
            </p>

            <form
              action={action}
              onSubmit={(e) => {
                if (!isEmail(email.trim())) {
                  e.preventDefault();
                  setLocal("error");
                  input.current?.focus();
                }
              }}
              noValidate
              className="mt-10 max-w-lg"
            >
              <label htmlFor="newsletter-email" className="t-label block text-[#8d94a0]">
                Email address
              </label>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  ref={input}
                  id="newsletter-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@lab.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (local === "error") setLocal("idle");
                  }}
                  aria-invalid={state === "error" || undefined}
                  aria-describedby={
                    state === "error" ? "newsletter-error" : "newsletter-note"
                  }
                  className="h-12 min-w-0 flex-1 border border-[#6a7280] bg-transparent px-4 text-[0.9375rem] text-paper transition-colors duration-150 placeholder:text-[#767e8c] focus:border-paper"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="btn btn-primary shrink-0 disabled:opacity-60"
                >
                  {pending ? "Signing up…" : "Sign up"}
                </button>
              </div>

              <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
                {state === "error" && (
                  <p
                    id="newsletter-error"
                    className="flex items-center gap-2 text-[0.8125rem] text-[#ff9aa9]"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                      <circle cx="6.5" cy="6.5" r="6" fill="none" stroke="currentColor" />
                      <path d="M6.5 3v4" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="6.5" cy="9.4" r="0.8" fill="currentColor" />
                    </svg>
                    {(local !== "error" && result.message) ||
                      "That address is missing an @ or a domain. Check it and try again."}
                  </p>
                )}
                {state === "done" && (
                  <p className="flex items-center gap-2 text-[0.8125rem] text-paper">
                    <span className="dot" aria-hidden="true" />
                    {result.already
                      ? "That address is already on the list."
                      : "You are on the list. Release notes go out roughly twice a month."}
                  </p>
                )}
              </div>

              <p id="newsletter-note" className="mt-4 text-[0.8125rem] text-[#8d94a0]">
                Unsubscribe in one click. We do not share the list.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
