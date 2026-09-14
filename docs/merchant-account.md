# Card payments — applying for a merchant account

Status (2026-09-15): not applied. Checkout records orders and takes no payment; the
cart and the order page say so.

## Why not Stripe, Square or PayPal

Stripe's restricted-businesses list prohibits "incorrectly labeled research chemicals"
and treats pharmaceuticals as restricted; correctly labelled research-use products are
not named, but merchants selling research peptides widely report closures and held funds
once transaction patterns show what is sold. Card networks also scrutinise the category
(Mastercard's brand-risk program). Plan on a **high-risk merchant account**, applied for
openly, rather than a mainstream account that can be closed without notice.

Sources: [Stripe restricted businesses](https://stripe.com/legal/restricted-businesses);
industry write-ups such as [SeamlessChex](https://www.seamlesschex.com/blog/best-payment-processor-for-peptides)
and [PayRam](https://payram.com/blog/best-payment-processors-for-peptide-merchants) — these
are vendors' own marketing, so treat their claims as leads, not facts.

## What to do

1. Shortlist two or three brokers or acquirers that state in writing that they board
   research-use-only peptide merchants. Ask each, in writing: do you accept RUO peptides
   sold to individuals as well as institutions? Recurring monthly billing? What reserve
   (rolling or up-front), what fees, what term and early-termination fee?
2. Disclose exactly what is sold. Underwriters read the website; a mismatch between the
   application and the site is a common reason for closure later.
3. Ask which **gateway** they provide (commonly NMI or Authorize.net) and whether it
   supports **tokenised cards for recurring charges** — standing orders need that.
4. Send me the gateway name and its sandbox credentials (put them in `.env.local` and
   Netlify, never in chat). Checkout is then wired to authorise at order time and to
   charge standing orders on their dispatch day.

## What underwriters usually ask for

Confirm the list with the broker; it varies.

- Business: legal entity documents, EIN, a business bank account (voided cheque or
  letter), owner ID, and processing statements if you have any history.
- Website, reviewed before approval:
  - a **working** phone number and physical address — the site still shows placeholders
    (+1 775 555 0143, 1140 Ferrier Street, Reno), which will fail review;
  - an email address on your own domain — `redskybio.com` is not registered yet;
  - terms of sale, refund/returns, privacy and shipping policies (drafts exist; counsel
    has not reviewed them);
  - research-use-only labelling on every product and at checkout (in place), and an age
    gate (21+ attestation at sign-up; in place);
  - no health or treatment claims — see the counsel brief on the class names and the
    "Wolverine Stack" name;
  - real prices and real certificates — lots are still sample data until entered in
    `/admin`.
- Products: a product list, sample certificates of analysis, and supplier information.

## What changes in the code once approved

- Checkout: card entry through the gateway's hosted fields (card data never touches this
  site), authorisation before the order is recorded, and the order marked paid.
- Standing orders: a stored card token per order, charged on the dispatch day, with
  failed-payment handling and a notice to the customer (needs email).
- Staff page: payment status and refunds per order.
- Policies: the privacy policy already describes a processor receiving the last four
  digits; name the processor once chosen.
