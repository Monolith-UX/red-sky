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

Red appears once or twice per viewport. Never as a texture.

## Type
- **Newsreader** (variable serif, optical sizing) — display only, tracked −0.03em.
  Journal/annual-report register, not fashion-luxury.
- **Instrument Sans** — body and UI. Slightly narrow neo-grotesk, not Inter.
- **IBM Plex Mono** — data only: lot numbers, purities, formulas, axis values.
  Legitimate mono use — this content *is* data.

## Grid
12 columns, 1360px measure, 24px gutters. Asymmetric splits throughout (7/5, 5/7).
A 2-column index rail carries a tracked mono section label and a hairline; content
runs in columns 3–12. Body copy never exceeds 68ch.

## Signature
**A hinomaru disc that behaves like an instrument window.** Each hero slide draws a
different analytical reading straight through it — HPLC trace, mass spectrum, cold-chain
curve. The line is ink outside the disc and paper-white inside, so the circle reads as
an aperture rather than a decoration. The disc stays fixed while the reading changes;
it recurs at 6px as the page's only ornament.

Slides 1-3 are the real triad of research-grade material —
**purity → identity → integrity** — each read through the window. On the red field
the disc inverts: paper white, with the trace red inside it and white outside.

Slide 4 is the Wolverine Stack release. It keeps the same slot and the same rhythm
but swaps the instrument reading for product artwork and the ruler for the stack's
composition, so the announcement sits inside the system rather than beside it.

## Section headers
One shape everywhere (`SectionHeader`): eyebrow with a trailing rule in column one,
heading directly beneath it in the same column, optional note hanging bottom-right
so the block reads composed rather than centred.

## Pages

| Route | Ground | Notes |
|---|---|---|
| `/` | red masthead → bench | Hero carousel, 4 slides |
| `/catalog` | red masthead → bench | 24 sequences, filter rail, per-lot trace on every card |
| `/catalog/[slug]` | bench + paper panels | 24 product pages, certificate of analysis, FAQs |
| `/blog` | red masthead → bench | Card grid, featured entry spans two columns |
| `/blog/[slug]` | paper sheet | 11 entries, sticky contents rail, FAQs |
| `/privacy` `/terms` `/cookie-policy` `/accessibility` | paper sheet | Sticky contents rail |

**Ground rule:** index and marketing surfaces open on the red field. Reading
surfaces — journal entries and policies — are paper sheets with no red masthead,
because a 2000-word read does not want a banner and the shared title morph needs
matching text colour on both ends.

## Generated imagery
No photography for editorial, and one placeholder vial for products. Everything
else is drawn from the lot's own numbers:

- `lib/trace.ts` seeds a chromatogram from retention time and purity, so every
  catalogue card draws a different curve and the same lot always draws its own.
  `sticksFor` and `curveFor` give the mass-spectrum and cold-chain variants.
- `lib/coa.ts` derives the certificate fields deterministically per lot, with
  explicit overrides where a sequence has something specific to say.
- `lib/product-faqs.ts` builds product questions from release data rather than
  24 hand-written sets, so answers stay true when a lot changes.
- Journal thumbnails reuse the hero's instrument window, with the reading chosen
  by category and seeded by entry number.

## Motion
Two view-transition patterns, both deliberate:
- **Shared element** — an entry title morphs from the journal card into the
  article headline (`share="text-morph"`, so large type does not ghost).
- **List identity** — filtering the catalogue or the journal rearranges cards
  rather than cutting to a new set.

Deliberately not added: directional page slides. They would have to wrap the
page and would sit outside the title morph, and React does not fire a nested
shared element when the parent mounts as one unit. One good transition beats two
that fight.

## Open items
- **`public/img/wolverine-stack.jpg` is not cleared for commercial use.** It is fan
  art of a Marvel-owned character and still carries the original artist's watermark.
  Swap it for licensed or original artwork before launch — it is referenced once, in
  `src/lib/content.ts` under the `stack` slide's `src`.
- Testimonials are placeholder copy attributed to generic roles, not real customers.
- **The four policy pages are drafts, not legal advice**, and have not been
  reviewed by counsel. The research-use restriction in `/terms` is the one to
  get a lawyer onto first.
- `public/img/vial-placeholder.jpg` is a rendered stand-in used for all 24
  products; its label reads BPC-157 and 10 mL regardless of the sequence.
- Lots, purities, prices and dates are sample data. Molecular formulas,
  monoisotopic masses and the sequences on certificates are real.
- The bench assistant answers from a local keyword map in `src/components/bench-dock.tsx`.
  It refuses dosing, medical and veterinary questions by design; keep that refusal in
  place if you wire it to a real model.
- CSS tokens still read `sun` / `sun-field` / `on-sun`. They name the red disc mark,
  which survived the rename to Red Sky, so they were left alone.

## Motion
One authored moment: the trace draws itself on load and on each slide change
(~1.1s, stroke-dashoffset). Everything else is state feedback under 180ms.
`prefers-reduced-motion` kills the draw and the auto-advance.

## Quality floor
Carousel: pause/play control, pauses on hover and focus, arrow-key support, correct
`aria-roledescription` / `aria-live`. Contrast computed, not eyeballed. 320px up.
Visible focus ring. 44px targets. Skip link.
