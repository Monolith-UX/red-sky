# Red Sky — questions for counsel

Prepared 2026-09-15 from the site as built (https://famous-parfait-7d7ac4.netlify.app).
Nothing here is legal advice; it is a list of what the site does and says, and the
questions that follow from it, so a lawyer can review it efficiently.

## The business, as the site describes it

- Red Sky Biosciences LLC (Nevada) sells synthetic peptides "strictly for in-vitro
  laboratory research" to institutions **and to individual researchers**, online, in the
  US. 26 sequences: BPC-157, TB-500, GHK-Cu, KPV, Ipamorelin, CJC-1295 no DAC, Hexarelin,
  GHRP-2, GHRP-6, Sermorelin, Tesamorelin, AOD-9604, MOTS-c, NAD+, Semax, Selank, DSIP,
  Pinealon, Epithalon, Thymosin alpha-1, LL-37, Glutathione, Vilon, Kisspeptin-10,
  Melanotan II and PT-141.
- Buyers create an account, attest at sign-up and at checkout, and can set any line to
  ship **every month** (a standing order).
- Payment is not yet connected; a high-risk merchant account is being sought.

Items marked **[fact to confirm]** are things the site states that the owner needs to
confirm are true before launch.

## 1. Selling research-use-only peptides to individuals

The terms say products are "not drugs, foods, cosmetics or medical devices", "not for
human or veterinary consumption", and that buyers must be 21+ and "qualified to handle
research chemicals".

- Is a research-use-only disclaimer, with clickwrap attestation, adequate for sales to
  individuals rather than institutions? What verification of "qualified researcher"
  would be expected?
- Several sequences are widely discussed as unapproved drugs used by people (for
  example BPC-157, TB-500, Melanotan II). Does the product mix, or the audience it
  attracts, change the analysis regardless of the label?
- Any state-specific restrictions on shipping to particular states?

## 2. Recurring monthly shipments ("standing orders")

- Does a monthly subscription for research reagents sold to individuals undercut the
  research-use position (it resembles a consumer supply)?
- Automatic-renewal law: the site shows the monthly price, the dispatch day, skip, pause
  and cancel controls in the account. Once card billing exists, what disclosures,
  consent and cancellation mechanics are required (e.g. state auto-renewal statutes)?

## 3. Names and claims

- **"Wolverine Stack"** (BPC-157 + TB-500 at $14 off the pair): trademark exposure (the
  Marvel character), and whether the name implies a healing claim.
- **Class names** describing effects in the body: "Repair and recovery", "GH
  secretagogues", "Metabolic", "Cognitive and neuro", "Longevity and immune",
  "Endocrine and pigment". Should these become neutral chemical or research-area labels?
- Short product notes (e.g. "Melanocortin receptor agonist") — acceptable as
  pharmacology descriptions?
- The bench assistant refuses dosing questions; the contact form flags them. Is the
  refusal wording adequate?

## 4. Accuracy of what the site presents as data

- **Sample data**: lots, purities, prices and dates are placeholders until entered in
  the staff page, as are the "412 shipments logged this year" figure and the three
  named analysts (Joanna Reyes, Marcus Bell, Priya Anand), who author the journal.
  **[fact to confirm]** Real names, or remove.
- **Certificates**: until a real lot is entered, observed mass, water content, largest
  impurity and analyst initials are generated. A lot saved as real must now state every
  figure, and a certificate PDF can be attached. **Question:** should sample
  certificates be shown publicly at all before launch?
- **Chromatograms**: the trace drawn on each product is generated from the retention
  time and purity; it is now labelled "Trace drawn from the certificate". The site
  still says every certificate "carries the trace" and prints each figure "beside the
  chromatogram it came from". **[fact to confirm]** Real certificates include
  chromatograms.
- **Contact details**: the address (1140 Ferrier Street, Unit 4, Reno) and phone
  (+1 775 555 0143, a fictional 555 number) are placeholders. **[fact to confirm]**
- **Domain**: redskybio.com is not registered. The site no longer shows email addresses
  and routes all contact through a form. Trademark check on "Red Sky" before
  registering?

## 5. Privacy and data

The privacy draft was written to describe the site truthfully. Review points:

- It promises: a copy of your data and account closure (both self-serve on the account
  page now); deletion of what can be deleted, keeping order records **seven years** for
  lot traceability; staff access to order data "restricted and logged" (a staff log now
  exists).
- It describes emails that **do not exist yet**: lot release notes with one-click
  unsubscribe, one waitlist email per sequence. Should the policy say "will" or be
  trimmed until email is live?
- Payment data: says the processor passes back only the last four digits. True once a
  processor is connected; name the processor then.
- Data is hosted with Supabase (US East) and Netlify. Processor agreements (DPAs) in
  place?
- Seven-year retention of a closed account's orders: justified basis, and is it the
  right period?
- Client stories: published only after moderation; stories about human or animal use
  are flagged and not published. Consent and take-down terms adequate?

## 6. Attestations as currently worded

- Sign-up: "I am at least 21 and I accept the terms of sale."
- Checkout: "These materials are for in-vitro laboratory research only and will not be
  administered to a person or an animal. I accept the terms of sale."
- Enough as clickwrap, or is something stronger expected (identity or institution
  verification, a signed end-use statement for certain sequences)?

## 7. Payments

Mainstream processors restrict or close this category; a high-risk acquirer will review
the site itself. Anything counsel wants changed should ideally be changed before the
application, since underwriters compare the application with the live site.

## Documents to review

- Terms of sale, privacy policy, cookie policy, accessibility statement: `/terms`,
  `/privacy`, `/cookie-policy`, `/accessibility` on the site (source: `src/lib/legal.ts`).
- Product pages, e.g. `/catalog/bpc-157`; the stack at `/cart` after adding it from the
  homepage; the account page and its standing-order controls.
