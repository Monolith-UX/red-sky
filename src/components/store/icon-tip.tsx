"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The hover-and-focus tip shared by the icon toggles on product images. It
 * opens after a short hover or on keyboard focus, stays open while the pointer
 * is over it, closes on Escape (WCAG 1.4.13), and can be flashed after a tap
 * so touch screens see it too.
 */
export function useTip() {
  const [open, setOpen] = useState(false);
  const hover = useRef<number | undefined>(undefined);
  const linger = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(
    () => () => {
      window.clearTimeout(hover.current);
      window.clearTimeout(linger.current);
    },
    [],
  );

  return {
    open,
    setOpen,
    /** Spread on the wrapper that holds both the button and the tip. */
    wrapper: {
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return;
        window.clearTimeout(hover.current);
        hover.current = window.setTimeout(() => setOpen(true), 180);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType === "touch") return;
        window.clearTimeout(hover.current);
        setOpen(false);
      },
    },
    /** Spread on the button itself. */
    trigger: {
      onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
        e.currentTarget.dataset.touch = String(e.pointerType === "touch");
      },
      onFocus: (e: React.FocusEvent<HTMLButtonElement>) => {
        if (e.currentTarget.matches(":focus-visible")) setOpen(true);
      },
      onBlur: () => setOpen(false),
    },
    /** True when the click that just happened came from a finger. */
    wasTouch: (el: HTMLElement) => {
      const touch = el.dataset.touch === "true";
      delete el.dataset.touch;
      return touch;
    },
    flash: (ms = 2400) => {
      setOpen(true);
      window.clearTimeout(linger.current);
      linger.current = window.setTimeout(() => setOpen(false), ms);
    },
  };
}

export type Placement = "below" | "above" | "left";

const PLACE: Record<Placement, { box: string; hidden: string; caret: string }> = {
  below: { box: "right-0 top-full mt-1", hidden: "-translate-y-1", caret: "-top-1 right-[1.125rem]" },
  above: { box: "right-0 bottom-full mb-2.5", hidden: "translate-y-1", caret: "-bottom-1 right-[1.25rem]" },
  left: { box: "right-full top-1/2 mr-1.5 -translate-y-1/2", hidden: "translate-x-1", caret: "-right-1 top-1/2 -translate-y-1/2" },
};

export function Tip({
  id,
  open,
  placement,
  children,
}: {
  id: string;
  open: boolean;
  placement: Placement;
  children: ReactNode;
}) {
  const p = PLACE[placement];
  return (
    <span
      role="tooltip"
      id={id}
      className={`pointer-events-auto absolute z-30 whitespace-nowrap bg-ink px-3 py-2 text-[0.75rem] leading-none text-paper shadow-[0_10px_24px_-12px_rgba(20,22,26,0.55)] transition-[opacity,translate] duration-150 ease-out ${p.box} ${
        open ? "visible opacity-100" : `invisible opacity-0 ${p.hidden}`
      }`}
    >
      <span aria-hidden="true" className={`absolute h-2 w-2 rotate-45 bg-ink ${p.caret}`} />
      <span className="relative">{children}</span>
    </span>
  );
}
