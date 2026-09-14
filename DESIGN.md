# Red Sky — design direction

## Subject
Red Sky sells research-grade peptides. The buyer's real question is never "is this
pretty" — it is *"is this actually the molecule on the label, at the purity it claims?"*
The artifacts of that world are HPLC chromatograms, mass spectra, certificates of
analysis, lot numbers, and cold-chain logs. The homepage's single job: prove the
material is verifiable, then get the visitor into the catalog.

## Register
Analytical report meets Japanese pharmaceutical packaging. Precision, hairline rules,
tiny tracked data type, large quiet space.

The hero is a full-bleed red gradient field; everything below it is quiet bench grey
and paper. Boldness is spent once, at the top, and the rest of the page stays out of
its way.

Deliberately *not*: cream + high-contrast-serif + terracotta; near-black + acid accent;
broadsheet columns. Those are the current defaults, not choices.

## Palette
| Token | Hex | Role |
|---|---|---|
| `bench` | `#E9EAE6` | page ground — cool pale grey, lab-bench laminate |
| `paper` | `#FBFBFA` | panels, the "sheet on the bench" |
| `ink` | `#14161A` | text, rules, the one dark band |
| `graphite` | `#5A6069` | captions, axis labels, secondary copy (5.25:1 on bench) |
| `hairline` | `#CFD2CC` | structural rules |
| `sun` | `#BC002D` | the mark — hinomaru red, exactly. 6.46:1 on paper |
| `sun-field` | `#BD0C30 → #9E0225 → #6F0A1C` | hero gradient, 158°, with an 8% highlight at 72%/14% |
| `on-sun` | `#FAE3E7` | secondary text on the red field — 4.7:1 at the lightest stop |
| `sun-deep` | `#8E0021` | press state only |

Red appears once or twice per viewport. Never as a texture. The favorite heart fills
red; the waitlist bell fills ink, so a card never carries two red marks.

## Type
- **Newsreader** (variable serif, optical sizing) — display only, tracked −0.03em.
- **Instrument Sans** — body and UI. Slightly narrow neo-grotesk, not Inter.
- **IBM Plex Mono** — data only: lot numbers, purities, formulas, axis values.

## Grid
12 columns, 1360px measure, 24px gutters. Asymmetric splits throughout (7/5, 5/7).
Body copy never exceeds 68ch. Section labels (`.rail-label`) wrap below 40rem.

## Signature
**A hinomaru disc that behaves like an instrument window.** Each hero slide draws a
reading straight through it — HPLC trace, mass spectrum, cold-chain curve. The line is
ink outside the disc and paper-white inside, so the circle reads as an aperture.

- Homepage slides 1–3: purity → identity → integrity. Slide 4, the Wolverine Stack, is
  original artwork built from the house's own parts: the two labelled vials standing in
  the paper disc over a horizon of hairlines (`StackWindow` in `reading.tsx`). The old
  fan-art image is gone.
- Catalogue slides are computed from the lots: the lowest purity on the shelf and the
  newest release each draw **that lot's own trace** through the window; the third
  announces unreleased sequences.
- The default avatar is the window at 24–112px, seeded by the account.
- The 404 page is the window reading a flat baseline.

## Section headers
One shape everywhere (`SectionHeader`): eyebrow with a trailing rule in column one,
heading directly beneath it, optional note hanging bottom-right. (A generic design
checklist bans eyebrows; this system pins them. The brief wins.)

## Pages

| Route | Ground | Notes |
|---|---|---|
| `/` | red carousel → bench | 4 slides; stack slide has "Add the stack" |
| `/about` `/testing` `/handling` `/certificates` `/contact` `/stories` | red masthead → bench | content from the journal, terms and catalogue — nothing new claimed |
| `/catalog` | red carousel → bench | 3 computed slides, 26 sequences, filter rail |
| `/catalog/[slug]` | bench + paper | in stock, out of stock, or upcoming (no invented data) |
| `/blog` | red masthead → bench | nav label is "Blog"; the pages still call it the Journal |
| `/blog/[slug]` `/privacy` `/terms` `/cookie-policy` `/accessibility` | paper sheet | sticky rail on desktop, collapsed jump-list on mobile |
| `/account` `/cart` | paper masthead → bench | dynamic; noindex |
| `/sitemap` | paper sheet | inventory-style; `/sitemap.xml` and `/robots.txt` alongside |
| `/stories/review` | paper | moderators only (`RED_SKY_MODERATORS`) |

**Ground rule:** index and marketing surfaces open on the red field; reading and
personal surfaces are paper. Routes with a red masthead are listed in `RED_MASTHEAD`
in `site-header.tsx` so the header's first render is right — add new ones there.

## Generated imagery
No photography except one: `public/img/vial.webp`, the placeholder vial with its red
label repainted as blank paper (per-column shading preserved). Every label is then
printed per lot in SVG (`components/catalog/vial.tsx`) and multiplied into the photo:
name, formula, the lot's own trace, fill, lot number, research-use line. Unreleased
sequences print ASSAY PENDING and no trace.

- `lib/trace.ts` — `traceFor(retention, purity, frame?)`; the frame only scales, so card
  traces are byte-identical to before (verified for all lots).
- `lib/coa.ts`, `lib/product-faqs.ts` — certificates and questions from lot data;
  upcoming sequences get their own questions.
- Formulas and **average** molecular weights are real and script-checked
  (`scripts/verify/chemistry.mjs`; KPV and Epithalon were wrong and are fixed). The
  `mass` field is average MW, not monoisotopic.

## The personal layer
- `lib/server/store.ts` — the only persistence, choosing between two implementations of
  the same functions (type-checked against each other): `store-supabase.ts` (Postgres
  plus a private `avatars` Storage bucket; production) when `SUPABASE_URL` and
  `SUPABASE_SECRET_KEY` are set, else `store-file.ts` (one JSON file in `.data/`; local
  development and the e2e suite). `RED_SKY_STORE=file|supabase` overrides.
- Schema: `supabase/migrations/`. Server-only access with the secret key; RLS on every
  table with no policies, grants revoked from anon/authenticated. Multi-step writes
  (guest merge, placing an order, closing an account) are Postgres functions, so each
  is one transaction. Sign-in and form rate limits live in the `attempts` table so they
  hold across serverless instances. Sign-in stays the site's own (scrypt + hashed
  session tokens); Supabase Auth is not used.
- `/admin` (staff: `RED_SKY_ADMINS`, else the moderators) — lots and certificates, orders,
  standing orders, the contact inbox, password resets by hand, and a log of every visit
  and change (`admin_log`; the privacy policy says staff access is logged).
- Lots: sequence facts stay in `catalog.ts`; the lot (stock, price, fill, purity, dates,
  every certificate figure, the certificate PDF) is a row in `lots`, edited in
  `/admin/lots/[slug]`. `scripts/pull-lots.mjs` runs before every Netlify build and writes
  the rows to `lib/lots.json` (`{}` in the repo, so local builds show the sample lots);
  `catalog.ts` lays them over the sequences. Saving calls `NETLIFY_BUILD_HOOK`. A lot not
  marked sample must state every certificate figure — gaps would otherwise be filled with
  generated values (`coa.ts`). A failed pull fails the build, so the live catalogue never
  silently reverts to sample data.
- Email addresses are hidden while `EMAIL_LIVE` is false in `lib/contact.ts` (the domain is
  not registered); every channel goes through the contact form, read in `/admin`.
- Your data (account page): `/api/account/export` downloads everything the account holds
  as JSON, minus password and session hashes. Closing the account needs the password,
  deletes what the privacy draft says it will, moves placed orders to `retained` (lot
  traceability), and the signed-out page then lists what was kept.
- The delivery address is edited on the account page as well as at checkout. Each
  standing order keeps its own address (from the order that opened it); changing the
  saved address offers to move them all.
- Dispatch: `/admin` lists "Due to ship" for the next seven days, grouped into real
  shipments (`lib/shipments.ts`: one account, one date, one address; lines out of stock
  wait). Recording one writes an unpaid `SHP-` order (source `standing`) and moves each
  standing order to next month, in one transaction that refuses a double record. When
  payments exist, the charge belongs in `recordShipmentAction`.
- `lib/server/auth.ts` — scrypt passwords, 90-day rolling `rs_session`; `rs_visitor`
  identifies guests; guest data merges into the account at sign-in.
- `lib/session-client.ts` — the browser's copy of `/api/session`; favorites and cart are
  optimistic with rollback.
- `lib/stacks.ts` — stacks are a pricing rule ($14 off each BPC-157 + TB-500 set on the
  same plan), not a product.
- Helpers used by server components must not live in `"use client"` files — a function
  exported from one becomes a client reference and throws on the server.

## Motion
One authored moment: the trace draws itself (~1.1s, stroke-dashoffset). Two view
transitions: title `text-morph` (journal card → article) and list identity on both grids.
Everything else is state feedback under 180ms (the heart's fill pop is 180ms).
`prefers-reduced-motion` kills the draw, autoplay and smooth scrolling.

## Open items
**Blocking launch**
- Payments are not connected; checkout records orders and says so on the page.
- No email provider: waitlist notices, password resets, contact forwarding, story
  confirmation and newsletter double opt-in are all stubs. Pages say messages are stored.
- Production data lives in Supabase once its keys are set in Netlify (see `.env.example`).
- Lots, purities, prices, dates and the 412-shipments figure are sample data.
- Policy pages are drafts, updated to describe the site truthfully; not reviewed by counsel.

**For counsel, specifically**
- Recurring monthly shipments of research-use-only products to individuals.
- The "Wolverine Stack" name: trademark exposure, and an implied healing claim.
- Class names that describe effects in the body ("Repair and recovery", "Cognitive",
  "Metabolic", "Longevity").
- The research-use and 21+ attestations are clickwrap at sign-up and checkout — enough?
- Client stories: the research-only rule, flagging and moderation.

**Product decisions**
- Real testimonials need consent; unverified ones never render.
- Client stories publish only via moderation. Set `RED_SKY_MODERATORS` to see the queue.
- Image generation access was denied this session; real product photography would
  replace the labelled placeholder.
- The bench assistant answers from catalogue data (`lib/assistant.ts`); if a model is
  wired in, keep the refusal first.
