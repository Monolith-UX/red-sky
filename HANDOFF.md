# Handoff prompt

Copy everything between the rules below into a fresh Claude Code session.

---

I'm continuing work on an existing project: a storefront for **Red Sky**, a company
selling research peptides. The code is at `E:\Work\Claude Projects\projects\peptides`
on this machine. Please start by reading `DESIGN.md` in the project root — it holds the
design direction, the token system, the page model and the open items. Then read
`src/lib/` to understand the data model before changing anything.

**Use all relevant skills**, including: `/frontend-design`, `/high-end-visual-design`,
`/design-taste-frontend`, `/ui-ux-pro-max`, `/accessibility`, `/impeccable`,
`/modern-web-design`, `/ui-styling`, `/design-system`, `/superdesign`,
`/vercel-react-view-transitions`.

## Stack and how to run it

- Next.js 16.3.5 (App Router, Turbopack), React 19.2, Tailwind v4, TypeScript. Node 24.
- `npm run dev` — or use the Browser pane's `preview_start` with the `redsun` config in
  `.claude/launch.json`, which has `autoPort: true` because port 3000 is taken on this
  machine. Expect a random high port.
- `npx tsc --noEmit` and `npx next build` both pass right now. Keep them passing.
- **Not a git repo.** Consider `git init` and an initial commit before making changes,
  so there's a way back.

## What is already built

46 static pages, all working:

| Route | What it is |
|---|---|
| `/` | Homepage. 4-slide hero carousel, assurance strip, catalog preview, method, testimonials, newsletter |
| `/catalog` | 24 sequences, sticky filter rail (search / class / availability), sort, live count |
| `/catalog/[slug]` | 24 product pages: vial, full chromatogram, 14-field certificate of analysis, handling, FAQs, related |
| `/blog` | Journal card grid, 1/2/3 col, featured entry spans two |
| `/blog/[slug]` | 11 entries, sticky contents rail with scroll-spy, per-entry FAQs, prev/next |
| `/privacy` `/terms` `/cookie-policy` `/accessibility` | Policy pages, same sticky contents rail |
| `/sitemap.xml` | Generated from the catalogue, posts and policies |

Site-wide: sticky three-state header, mobile drawer (focus-trapped, red gradient),
back-to-top, a branded "bench assistant" chatbot that refuses dosing questions by
design, and a footer with the research-use-only notice.

## Conventions that will bite you if you don't know them

1. **Tailwind v4 tree-shakes `@theme`.** `globals.css` uses `@theme static` on purpose —
   without it, tokens used only in hand-written CSS (not in a utility class) get dropped
   and the declarations silently become invalid. Don't change it back.
2. **Font variables live on `<html>`, not `<body>`.** `--font-display` is composed in
   `:root`, so `--font-newsreader` has to resolve at the same element. Moving the
   next/font className to `<body>` breaks every display face with no error.
3. **Eyebrow/heading stacking.** Section headers must use `SectionHeader`
   (`src/components/section-header.tsx`). If you hand-roll a `grid12` with a
   `col-span-5` eyebrow and a `col-span-7` heading and no explicit `row-start`, the
   heading flows into the eyebrow's row and sits beside it. This bug has been fixed
   twice already — use the component.
4. **`ViewTransition` imports from `react`** (not `unstable_ViewTransition`), and needs
   no config flag — the `experimental.viewTransition` option no longer exists in Next
   16.3 and will fail typecheck if you add it.
5. **Two view-transition patterns only**, both deliberate: shared `text-morph` on entry
   titles (journal card → article headline) and list identity on both grids. Directional
   page slides were deliberately skipped — they'd have to wrap the page and sit outside
   the title morph, and React won't fire a nested shared element when the parent mounts
   as one unit. Reasoning is in `DESIGN.md`.
6. **Bash heredocs choke on the long content blocks in this project.** Use the Write tool
   for anything large rather than `cat > file <<'EOF'`.
7. **The Browser pane drops frames on this machine.** Screenshots often come back blank
   or partially rendered. Verify layout by measuring in `javascript_tool` (scrollWidth vs
   clientWidth, `getBoundingClientRect` comparisons) — that has been reliable where
   screenshots were not.

## Data model

Everything is data-driven; there is no CMS. Content lives in `src/lib/`:

- `catalog.ts` — 24 products. Formulas and monoisotopic masses are **real chemistry**.
  Lots, purities, prices and dates are sample data.
- `trace.ts` — generates a chromatogram deterministically from retention time and purity,
  so every catalogue card draws a different curve and a given lot always draws its own.
  `sticksFor` and `curveFor` are the mass-spectrum and cold-chain variants.
- `coa.ts` — derives certificate fields per lot, with explicit overrides where a sequence
  has something specific to say (GHK-Cu's copper complex, NAD+'s salt form, sequences).
- `product-faqs.ts` — builds 6–7 product questions from each lot's own release data
  rather than 24 hand-written sets, so answers stay true when a lot changes.
- `posts.ts` + `faqs.ts` — 11 journal entries with real technical content, plus
  hand-written FAQs per entry.
- `legal.ts` — the four policy documents.
- `content.ts` — nav, hero slides, homepage sections.

## Open items — pick these up

1. **`public/img/wolverine-stack.jpg` cannot ship.** It's fan art of a Marvel-owned
   character and still carries the original artist's watermark. It's referenced once, in
   the `stack` slide's `src` in `content.ts`. Needs licensed or original artwork.
2. **`public/img/vial-placeholder.jpg` is one image used for all 24 products**, and its
   label reads "BPC-157 / 10 mL" regardless of the sequence. Needs per-product imagery,
   or a generated label.
3. **The four policy pages are drafts and say so on the page.** They have not been
   reviewed by counsel. The research-use restriction in `/terms` is the priority.
4. **Testimonials on the homepage are placeholder copy** attributed to generic roles.
5. **Cart and sign-in are non-functional stubs.** No checkout, no auth, no persistence.
   This is the obvious next build.
6. **Nav has both "Journal" and "Blog".** Journal points at
   `/blog?category=release-notes`, Blog at `/blog`. Workable, but worth resolving.
7. **The contents rail is hidden on mobile** rather than relocated — a table of contents
   below an article you've already read is noise. A collapsed jump-list at the top is the
   alternative if wanted.
8. **The bench assistant answers from a local keyword map** in
   `src/components/bench-dock.tsx`. If you wire it to a real model, keep the refusal path
   for dosing, medical and veterinary questions.

## How I'd like you to work

Match the existing code: same comment density, same naming, Tailwind utilities for layout
with a small set of hand-written classes in `globals.css` for the type scale and
specialty bits. Verify changes by measurement and by keeping `npx next build` green, and
tell me plainly what you checked versus what you assumed.

---
