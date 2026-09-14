"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav } from "@/lib/content";
import { AccountLink, CartLink, DrawerAccountItem } from "./store/header-controls";

/**
 * Routes that open on the red masthead. The header's first render has to be
 * right before any script runs, or every paper page flashes white nav text on
 * a grey ground until the effect below measures the page.
 */
const RED_MASTHEAD = ["/", "/catalog", "/blog", "/contact"];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"top" | "hero" | "past">(
    RED_MASTHEAD.includes(pathname) ? "top" : "past",
  );
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /* Three states: clear at rest on the red field, solid red while a masthead
     scrolls under it, then bench grey. Re-measured on every route change,
     because the header now persists across navigations. */
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setMode("past");
      return;
    }
    const sync = () =>
      setMode(
        hero.getBoundingClientRect().bottom <= 72
          ? "past"
          : window.scrollY <= 8
            ? "top"
            : "hero",
      );
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [pathname]);

  // Close the drawer once navigation actually happens.
  useEffect(() => setOpen(false), [pathname]);

  // Lock the page behind the drawer, and restore focus when it closes.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const light = mode !== "past";
  const current = (match?: string) =>
    match && pathname.startsWith(match) ? ("page" as const) : undefined;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        mode === "past"
          ? "border-hairline bg-bench/95 backdrop-blur-[2px]"
          : mode === "hero"
            ? "on-sun border-white/15 bg-[#6f0a1c]/92 text-white backdrop-blur-sm"
            : "on-sun border-transparent bg-transparent text-white"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 no-underline"
          aria-label="Red Sky, home"
        >
          <span
            className={`block h-[0.85rem] w-[0.85rem] rounded-full transition-colors duration-300 md:h-[0.9rem] md:w-[0.9rem] ${
              light ? "bg-white" : "bg-sun"
            }`}
          />
          <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">
            Red Sky
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-9" role="list">
            {nav.map((item) => {
              const on = current(item.match);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={on}
                    className={`relative block py-2 text-[0.8125rem] no-underline transition-colors duration-150 ${
                      light
                        ? on
                          ? "text-white"
                          : "text-[var(--color-on-sun)] hover:text-white"
                        : on
                          ? "text-ink"
                          : "text-graphite hover:text-ink"
                    }`}
                  >
                    {item.label}
                    {on && (
                      <span
                        aria-hidden="true"
                        className={`absolute inset-x-0 bottom-0 h-px ${
                          light ? "bg-white" : "bg-sun"
                        }`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-0.5">
          <AccountLink light={light} />
          <CartLink />

          <button
            ref={trigger}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Open the menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <svg width="20" height="12" viewBox="0 0 20 12" aria-hidden="true">
              <path d="M0 1h20M0 11h13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[60] overflow-hidden lg:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/45 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className={`sun-field on-sun absolute inset-y-0 right-0 flex w-full max-w-sm flex-col text-white shadow-[-24px_0_56px_-24px_rgba(20,22,26,0.45)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline pl-[clamp(1.25rem,6vw,2rem)] pr-3">
            <span className="t-label text-[var(--color-on-sun)]">Menu</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
              aria-label="Close the menu"
              className="flex h-11 w-11 items-center justify-center"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
                <path d="M1 1l13 13M14 1L1 14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          <nav
            aria-label="Site"
            className="flex-1 overflow-y-auto px-[clamp(1.25rem,6vw,2rem)] py-4"
          >
            <ul role="list">
              {nav.map((item) => (
                <li key={item.label} className="border-b border-hairline">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-4 py-5 no-underline"
                  >
                    <span className="t-h3">{item.label}</span>
                    <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true">
                      <path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </Link>
                </li>
              ))}
              <li className="border-b border-hairline">
                <DrawerAccountItem onNavigate={() => setOpen(false)} />
              </li>
            </ul>

            <Link
              href="/catalog"
              onClick={() => setOpen(false)}
              className="btn btn-primary mt-8 w-full"
            >
              Browse the catalogue
            </Link>

            <p className="mt-8 text-[0.8125rem] leading-relaxed text-[var(--color-on-sun)]">
              <span className="font-medium text-white">Research use only.</span> Sold for
              in-vitro laboratory research. Not for human or veterinary consumption.
            </p>
            <p className="t-data mt-5 pb-6 text-[0.75rem] text-[var(--color-on-sun)]">
              lab@redskybio.com · +1 775 555 0143
            </p>
          </nav>
        </div>
      </div>
    </header>
  );
}
