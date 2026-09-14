# Handoff prompt

Copy everything between the rules below into a fresh Claude Code session.

---

I'm continuing work on **Red Sky**, a storefront for research-use-only peptides, at
`E:\Work\Claude Projects\projects\peptides`. It is a git repo — run `git log --oneline`
first. Read `DESIGN.md` (design system, page model, the personal layer, open items),
then `src/lib/` before changing anything.

Use the relevant skills: `/frontend-design`, `/high-end-visual-design`,
`/design-taste-frontend`, `/impeccable`, `/accessibility`, `/vercel-react-view-transitions`.

## Stack
Next.js 16.3.5 (App Router, Turbopack), React 19.2, Tailwind v4, TypeScript, Node 24.
`npx tsc --noEmit` and `npx next build` both pass (64 static pages plus dynamic
`/account`, `/cart`, `/stories`, `/stories/review` and `/api/*`). Keep them passing.

## Built so far
- **Catalogue**: 26 sequences with stock states in / low / out / made-to-order / upcoming.
  Unreleased sequences show no invented data. Each vial label is drawn from its own lot.
- **Favorites**: a heart on every product image. The hover and focus tip shows real counts.
- **Waitlist**: a bell under the heart on out-of-stock and upcoming sequences, and a
  waitlist panel on their product pages.
- **Accounts**: email and password, with a 90-day rolling session. Guest data merges in at
  sign-in. The account page has an avatar upload (re-encoded in the browser), favorites,
  monthly standing orders (skip, pause, quantity, day, cancel), order history, waitlists,
  profile, delivery address and password change.
- **Cart**: a one-time or monthly plan per line, and a Wolverine Stack saving ($14 per
  BPC-157 + TB-500 set) with a cross-sell. Checkout takes a delivery address and the
  research-use attestation. Payment is not connected.
- **Pages**: About, Testing, Handling, Certificates (lot lookup), Client Stories (submission
  with research-only flagging and a moderation queue), Contact, Sitemap page,
  `sitemap.xml`, `robots.txt`, a branded 404 and error page.
- **Homepage and catalogue**: carousels. The catalogue slides are computed from lots and
  draw real traces. The stack slide is original artwork.
- **Bench assistant**: answers from catalogue data (lot lookup, counts, features) and
  still refuses dosing questions.
- **Policies**: drafts updated to describe the real cookies, data and standing orders.

## Conventions that will bite you
1. `globals.css` uses `@theme static` on purpose. Don't change it.
2. Font variables live on `<html>`, not `<body>`.
3. Section headers use `SectionHeader`. Don't hand-roll eyebrow/heading grids.
4. `ViewTransition` imports from `react`; there is no config flag.
5. **Never call a function exported from a `"use client"` file inside a server component.**
   It becomes a client reference and throws at runtime; `tsc` won't catch it. Shared
   helpers go in `src/lib/`.
6. Next 16's `error.js` prop is `retry`, not `reset`. Use `connection()` from
   `next/server` to make a page per-request.
7. The unlayered `.dot` class beats Tailwind colour utilities on the same element.
8. Pages opening on the red field must be listed in `RED_MASTHEAD` in `site-header.tsx`.
9. Bash heredocs and `node -e` mangle backticks, `\r` and regex escapes. Use the Write and
   Edit tools for code.
10. **Only one `next dev` can run per folder.** Another chat's server may already hold it;
    reuse its port rather than killing it. The Browser pane drops frames here, so verify
    with headless Chrome:
    `BASE_URL=http://localhost:<port> node scripts/verify/e2e.mjs` (35 checks, all passing)
    and `node scripts/verify/chemistry.mjs`. Screenshots land in `scripts/verify/out/`.
11. `.data/` holds the local store and is git-ignored. It was cleared after testing.
    `RED_SKY_MODERATORS=you@lab.org` in `.env.local` unlocks `/stories/review`.

## What's left
- **Design review.** Look at `scripts/verify/out` screenshots of About, Testing,
  Handling, Certificates, Stories, Cart and Account at desktop and 390px. Run a
  `/design-taste-frontend` pass. These pages are measured (no overflow at 320 and 390px,
  no console errors) but have not all been reviewed by eye.
- **Account deletion and data export.** The privacy draft promises both.
- **Editable delivery address** on the account page. Today it only changes at checkout.
- **Email verification** on sign-up, and a real password-reset flow. Both need an email
  provider.
- **On hold, needing the owner's decisions:**
  - payment processor (check its acceptable-use terms for research peptides)
  - email provider
  - production database (Supabase is connected in the owner's environment; ask before
    creating anything)
  - counsel review (see DESIGN.md: recurring RUO shipments, the "Wolverine Stack" name,
    effect-describing class names)
  - real testimonials and stories

## How I'd like you to work
Match the existing code: comment density, naming, Tailwind for layout, a small set of
hand-written classes in `globals.css`. Ground every claim in content the site already
makes — don't invent policies, people, numbers or testimonials. Commit in coherent
chunks. Tell me plainly what you verified and what you assumed.

---
