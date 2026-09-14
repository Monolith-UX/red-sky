"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Reading, Ruler, StackWindow } from "./reading";
import { type Slide, stackLots } from "@/lib/content";

const INTERVAL = 7000;

/**
 * The red masthead as a carousel. The homepage and the catalogue each pass
 * their own slides; the slot, the rhythm and the controls are shared, so the
 * two read as one system.
 */
export function HeroCarousel({ slides, label }: { slides: Slide[]; label: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches) setPlaying(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (n: number) => {
      setIndex(() => (n + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (!playing || held || reduced) return;
    const t = window.setInterval(() => go(index + 1), INTERVAL);
    return () => window.clearInterval(t);
  }, [playing, held, reduced, index, go]);

  const slide = slides[index];
  const autoplaying = playing && !reduced;
  const lots = slide.kind === "stack" ? stackLots(slide.lots) : [];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      id="hero"
      className="sun-field on-sun relative -mt-16 pb-14 pt-[5.5rem] md:-mt-[4.5rem] md:pb-20 md:pt-[7.5rem]"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        }
      }}
    >
      <div className="shell">
        <div aria-live={autoplaying ? "off" : "polite"} aria-atomic="false">
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}: ${slide.eyebrow}`}
            className="grid12 gap-y-10 lg:grid-rows-[auto_1fr] lg:gap-y-0"
          >
            {/* 1 — the claim */}
            <div
              key={`claim-${slide.id}`}
              className="slide-in col-span-12 lg:col-span-5 lg:col-start-1 lg:row-start-1"
            >
              <p className="rail-label mb-7 md:mb-9">{slide.eyebrow}</p>
              <h1 className="t-display max-w-[14ch]">{slide.heading}</h1>
            </div>

            {/* 2 — the reading */}
            <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1">
              <div
                key={`metric-${slide.id}`}
                className="slide-in flex items-end justify-between gap-6 border-b border-hairline pb-3"
              >
                <span className="t-label pb-1.5 text-[var(--color-on-sun)]">Reading</span>
                <span className="text-right">
                  <span className="t-metric block">{slide.metric}</span>
                </span>
              </div>
              <p
                key={`ml-${slide.id}`}
                className="t-label slide-in mt-2.5 text-right text-[var(--color-on-sun)]"
              >
                {slide.metricLabel}
              </p>

              {slide.kind === "reading" ? (
                <>
                  <div className="mt-6 md:mt-8">
                    <Reading
                      reading={slide.reading}
                      drawKey={index}
                      inverted
                      path={slide.trace}
                      alt={slide.alt}
                    />
                  </div>
                  <div className="mt-3">
                    <Ruler marks={slide.rulerMarks} inverted />
                  </div>
                </>
              ) : (
                <>
                  <div key={`stack-${slide.id}`} className="slide-in mt-6 md:mt-8">
                    <StackWindow items={lots} alt={slide.alt} />
                  </div>

                  {/* Same slot as the ruler: what the stack is made of */}
                  <dl className="mt-3 grid grid-cols-2 border-t border-hairline">
                    {lots.map((item, i) => (
                      <div
                        key={item.slug}
                        className={`flex items-baseline justify-between gap-3 py-2.5 ${
                          i === 0 ? "pr-5" : "border-l border-hairline pl-5"
                        }`}
                      >
                        <dt className="t-data text-[0.8125rem]">{item.name}</dt>
                        <dd className="t-data text-[0.8125rem] text-[var(--color-on-sun)]">
                          {item.purity?.toFixed(2)}%
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              <p
                key={`cap-${slide.id}`}
                className="t-data slide-in mt-5 text-[0.75rem] leading-relaxed text-[var(--color-on-sun)]"
              >
                {slide.readingCaption}
              </p>
            </div>

            {/* 3 — the argument */}
            <div
              key={`arg-${slide.id}`}
              className="slide-in col-span-12 self-end lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:pb-2"
            >
              <p className="t-lead lg:mt-10">{slide.body}</p>
              <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3 md:mt-10">
                {slide.actions.map((a, i) => (
                  <Link
                    key={a.href + a.label}
                    href={a.href}
                    className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-10 flex items-center gap-2 border-t border-hairline pt-2 md:mt-12 md:gap-5">
          <ul className="flex items-center" role="list">
            {slides.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? "true" : undefined}
                  aria-label={`Show slide ${i + 1} of ${slides.length}: ${s.eyebrow}`}
                  className="group grid h-11 w-9 place-items-center"
                >
                  <span
                    className={`block h-2.5 w-2.5 rounded-full border transition-colors duration-150 ${
                      i === index
                        ? "border-white bg-white"
                        : "border-white/55 group-hover:border-white group-hover:bg-white/45"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex h-11 items-center gap-2.5 px-2 text-[var(--color-on-sun)] transition-colors duration-150 hover:text-white"
            aria-label={autoplaying ? "Pause the carousel" : "Play the carousel"}
          >
            <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true">
              {autoplaying ? (
                <>
                  <rect x="0" y="0" width="3.2" height="11" fill="currentColor" />
                  <rect x="6.4" y="0" width="3.2" height="11" fill="currentColor" />
                </>
              ) : (
                <path d="M0 0 L10 5.5 L0 11 Z" fill="currentColor" />
              )}
            </svg>
            <span className="t-label hidden sm:inline">
              {autoplaying ? "Pause" : "Play"}
            </span>
          </button>

          <span className="t-data ml-auto pr-1 text-[0.75rem] text-[var(--color-on-sun)]">
            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}
