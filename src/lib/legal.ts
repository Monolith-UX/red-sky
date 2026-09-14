import type { Block } from "./posts";

/**
 * Drafting note for whoever inherits this: these are working drafts written to
 * describe how the site and the business actually behave. They are not legal
 * advice and have not been reviewed by counsel. Have a lawyer read them before
 * launch, particularly the research-use restriction in the terms of sale.
 */

export type Policy = {
  slug: string;
  title: string;
  eyebrow: string;
  standfirst: string;
  updated: string;
  body: Block[];
};

export const POLICY_SLUGS = [
  "privacy",
  "terms",
  "cookie-policy",
  "accessibility",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const policies: Record<PolicySlug, Policy> = {
  privacy: {
    slug: "privacy",
    title: "Privacy policy",
    eyebrow: "Legal — how we handle your data",
    standfirst:
      "What we collect when you buy from us, why we hold it, who else sees it, and how to make us delete it.",
    updated: "2026-09-14",
    body: [
      {
        t: "p",
        text: "Red Sky Biosciences LLC is the controller of the personal data described here. We sell laboratory reagents to institutions and to individual researchers, which means we hold less personal data than most retailers and are happy to keep it that way.",
      },
      { t: "h2", text: "What we collect" },
      {
        t: "list",
        items: [
          "Account and order data: name, organisation, email address, telephone number, billing and delivery addresses, and the contents of your orders, including standing orders and the dispatch day you chose.",
          "Sign-in data: a salted hash of your password, never the password itself, and a hash of the token that keeps a device signed in.",
          "A profile photo, if you upload one. It is cropped and re-encoded in your browser before it is sent, so the original file and any location data inside it never reach us.",
          "What you choose to save: favorites, waitlists and your cart. Before you sign in these are held against an anonymous identifier for your browser, and they move into your account when you do.",
          "Payment data: handled by our payment processor. We receive the last four digits of the card and the authorisation result. We never see or store the full card number.",
          "Correspondence: emails you send us, messages sent through the contact form and the bench assistant, and client stories you submit, with the email address you give for confirming them.",
          "Technical data: IP address, browser type and pages visited, collected in aggregate for security and to keep the site working.",
        ],
      },
      { t: "h2", text: "Why we hold it" },
      {
        t: "list",
        items: [
          "To take, fulfil and deliver your orders, and to tie a shipment to the lot it contained. This is contractual necessity.",
          "To keep lot traceability records, so a certificate can be matched to a buyer years later. This is a legitimate interest and, for some jurisdictions, a legal obligation.",
          "To send lot release notes, if and only if you asked for them. This is consent, and you can withdraw it from any email in one click.",
          "To send a single email when a sequence you joined a waitlist for is released or back in stock. This is consent, and leaving the waitlist withdraws it.",
          "To publish a client story, only after confirming it with you and only with the details you agreed to. The email address you give is used to confirm the story and is never published.",
          "To meet tax, accounting and export-control obligations.",
        ],
      },
      { t: "h2", text: "Who else sees it" },
      {
        t: "p",
        text: "Our payment processor, our shipping carriers, our accountants, and the providers who host this site and send our email. Each is bound by contract to process data only on our instructions. We do not sell personal data, we do not share it for advertising, and we do not disclose customer identities or order contents except where we are legally compelled to.",
      },
      { t: "h2", text: "How long we keep it" },
      {
        t: "list",
        items: [
          "Order and lot-traceability records: seven years from the order date.",
          "Accounting records: as required by law in the jurisdiction of sale.",
          "Marketing consent and mailing list membership: until you unsubscribe, then a suppression record so we do not add you back.",
          "Correspondence: three years, unless it forms part of an order record.",
          "Profile photos, favorites, waitlists and saved addresses: until you remove them or close the account.",
          "Client stories: until you ask for a story to be taken down, and a record of the request after that.",
        ],
      },
      { t: "h2", text: "Your rights" },
      {
        t: "p",
        text: "Depending on where you live, you can ask us for a copy of the data we hold about you, ask us to correct it, ask us to delete it, object to processing, or ask for it in a portable format. If you have an account, the Your data section of the account page does two of these straight away: it downloads everything the account holds as one file, and it closes the account. For anything else, send a request through the contact page, choosing My data and privacy, and we will respond within thirty days. We will not charge you for this and we will not make the service worse because you asked.",
      },
      {
        t: "p",
        text: "One limit worth stating plainly: we cannot delete lot-traceability records while we are obliged to keep them. If you ask us to erase your data, we will delete everything we are free to delete and tell you exactly what remains and why.",
      },
      { t: "h2", text: "Cookies" },
      {
        t: "p",
        text: "This site sets a small number of cookies, none of them for advertising. They are listed individually in the cookie policy.",
      },
      { t: "h2", text: "Security" },
      {
        t: "p",
        text: "Traffic to this site is encrypted in transit. Access to order data is restricted to staff who need it, and is logged. If we ever suffer a breach affecting your data, we will tell you and the relevant regulator within the time limits the law sets, and we will tell you what we know rather than waiting until we know everything.",
      },
      { t: "h2", text: "Changes and contact" },
      {
        t: "p",
        text: "If we change this policy materially we will date the change at the top of this page and, where the change affects how we use data you have already given us, email anyone on the list. Questions go through the contact page, or by post to Red Sky Biosciences LLC, 1140 Ferrier Street, Unit 4, Reno, Nevada 89502.",
      },
    ],
  },

  terms: {
    slug: "terms",
    title: "Terms of sale",
    eyebrow: "Legal — the terms you buy under",
    standfirst:
      "The conditions that apply to every order. The first one is the one that matters most: everything here is sold for laboratory research and nothing else.",
    updated: "2026-09-14",
    body: [
      { t: "h2", text: "Research use only" },
      {
        t: "p",
        text: "Every product sold by Red Sky Biosciences is supplied strictly for in-vitro laboratory research. Our products are not drugs, foods, cosmetics or medical devices. They are not for human or veterinary consumption, not for any diagnostic or therapeutic purpose, and not for administration to any person or animal.",
      },
      {
        t: "quote",
        text: "By placing an order you confirm that you are qualified to handle research chemicals and that you will not administer them to a human or an animal.",
      },
      {
        t: "p",
        text: "We do not provide dosing, clinical, medical or veterinary guidance, and we will not answer questions framed that way. If you ask our technical team or the assistant on this site how much of something to take, the answer will be that we cannot help with that.",
      },
      { t: "h2", text: "Who may order" },
      {
        t: "p",
        text: "You must be at least 21 years old and ordering on behalf of yourself as a qualified researcher, or on behalf of an institution that is. We may refuse or cancel any order at our discretion, including where we believe the material is intended for human use, and we will refund in full if we do.",
      },
      { t: "h2", text: "Orders, prices and payment" },
      {
        t: "list",
        items: [
          "Your order is an offer. A contract forms only when we send a dispatch confirmation, not when you receive an order acknowledgement.",
          "Prices are per vial in US dollars and exclude tax, duties and shipping, which are shown before you pay.",
          "We may correct obvious pricing errors before dispatch. If a price was wrong we will tell you and let you confirm or cancel.",
          "Payment is taken at the point of order. Institutional accounts may be offered net-30 terms in writing.",
          "Where sequences are sold together as a stack, the saving applies to each complete set on the same plan. The sequences remain separate items, each with its own lot and certificate.",
        ],
      },
      { t: "h2", text: "Accounts" },
      {
        t: "p",
        text: "You are responsible for keeping your password to yourself and for what is ordered from your account. A device you sign in on with “keep me signed in” stays signed in for ninety days from your last visit; sign out on any device you share, and change your password if you think someone else has used it. Changing it can sign every other device out.",
      },
      { t: "h2", text: "Standing orders" },
      {
        t: "list",
        items: [
          "A monthly standing order is a series of separate orders, each made under these terms. The first ships with the order that opened it; each later one is dispatched on the first Monday, Tuesday or Wednesday of the month that you chose.",
          "Each dispatch ships the lot current at the time, with that lot's own certificate. The lot number will change from one month to the next.",
          "You can skip a month, pause, change the quantity or dispatch day, or cancel, from your account at any time before a dispatch. Cancelling ends future dispatches and does not affect anything already shipped.",
          "If a sequence is out of stock on a dispatch day, that dispatch waits for the next lot rather than substituting anything else.",
          "The same research-use restriction applies to every dispatch. We may cancel a standing order on the same grounds as any other order, and will refund anything charged for a dispatch that has not shipped.",
        ],
      },
      { t: "h2", text: "Waitlists" },
      {
        t: "p",
        text: "Joining a waitlist for a sequence that is out of stock or not yet released reserves nothing and is not an order. We send one email when a lot is released or back in stock, and you can leave the waitlist at any time.",
      },
      { t: "h2", text: "Shipping, title and risk" },
      {
        t: "p",
        text: "Stocked lots ordered before 14:00 Eastern ship the same business day. Title and risk pass to you on delivery to the address you gave us. Vials leave our freezer at minus 20 degrees Celsius on gel packs with a temperature logger in the box; the logger readout is part of the record for that shipment.",
      },
      { t: "h2", text: "Specification and certificates" },
      {
        t: "p",
        text: "Each lot is supplied against the certificate of analysis published for that lot. Area purity is measured by reverse-phase HPLC at 214 nm and reports UV-absorbing material; it is not net peptide content, which is available on request. Where a lot is described as meeting a purity floor, that description is the specification, and a lot that misses it is destroyed rather than sold.",
      },
      { t: "h2", text: "Returns and replacements" },
      {
        t: "list",
        items: [
          "Tell us within 14 days of delivery if a lot does not meet its certificate, and we will replace it or refund it in full.",
          "If the temperature logger shows an excursion, do not open the vial. Send us the readout and the lot number and we will ship a replacement the same day.",
          "Because these are temperature-controlled reagents whose integrity we cannot verify once they leave our chain, we cannot accept returns of opened vials that were correctly supplied.",
        ],
      },
      { t: "h2", text: "Warranty and disclaimer" },
      {
        t: "p",
        text: "We warrant that each product conforms to the certificate of analysis for its lot at the time of dispatch. Beyond that, and to the fullest extent the law allows, products are supplied without any other warranty, express or implied, including any implied warranty of merchantability or fitness for a particular purpose. Research reagents behave differently in different hands, and we cannot warrant a result in your system.",
      },
      { t: "h2", text: "Limitation of liability" },
      {
        t: "p",
        text: "Nothing in these terms limits liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot lawfully be limited. Subject to that, our total liability for any order is limited to the amount you paid for it, and we are not liable for indirect or consequential loss, lost research time, or the cost of repeating work.",
      },
      { t: "h2", text: "Export and compliance" },
      {
        t: "p",
        text: "You are responsible for complying with the laws that apply where you are. Some of these materials are controlled or prohibited in some jurisdictions. We will not falsify a customs declaration, understate a value, or describe the contents of a shipment as anything other than what they are.",
      },
      { t: "h2", text: "Client stories" },
      {
        t: "p",
        text: "If you submit a story about your research, you confirm that it is your own work in a laboratory setting and that it describes no use in people or animals. You let us publish it, with the name and details you gave, on this site; you keep ownership of it and can ask us to take it down at any time. We publish only after confirming a story with its author, we may edit for length, and we do not publish anything that describes dosing, treatment or health outcomes.",
      },
      { t: "h2", text: "Governing law and contact" },
      {
        t: "p",
        text: "These terms are governed by the laws of the State of Nevada, and the courts of Nevada have exclusive jurisdiction, except that consumers may bring proceedings in their own place of residence where local law gives them that right. Questions go through the contact page.",
      },
    ],
  },

  "cookie-policy": {
    slug: "cookie-policy",
    title: "Cookie policy",
    eyebrow: "Legal — what this site stores on your device",
    standfirst:
      "A short list, because it is a short list. Two cookies, no advertising, no third-party trackers, and nothing that follows you off this site.",
    updated: "2026-09-14",
    body: [
      {
        t: "p",
        text: "A cookie is a small file a site stores in your browser so it can recognise the same browser later. Some are necessary for a shop to function; most of the ones you meet elsewhere are not. Here is everything this site uses.",
      },
      { t: "h2", text: "Strictly necessary" },
      {
        t: "list",
        items: [
          "rs_session — keeps you signed in. If you tick “keep me signed in”, it lasts ninety days from your last visit and renews each time you come back; if you do not, it ends when you close the browser. It holds a random token; the matching record on our side stores only a hash of it.",
          "rs_visitor — an anonymous identifier, set the first time you favorite a sequence, join a waitlist or add something to the cart without signing in, so those choices stay with this browser. It is not set by simply visiting. It expires after twelve months, and what it holds moves into your account when you sign in.",
        ],
      },
      {
        t: "p",
        text: "Both are set only when you do something that needs them, and neither can be switched off without breaking the cart or sign-in. They are httpOnly, which means scripts on the page cannot read them, and they are never sent to anyone else.",
      },
      { t: "h2", text: "Analytics" },
      {
        t: "p",
        text: "This site does not currently set analytics cookies. If that changes, the cookies will be listed here before they are used, they will be set only if you accept them, and the data will not be shared with any advertising network.",
      },
      { t: "h2", text: "What we do not use" },
      {
        t: "list",
        items: [
          "No advertising or retargeting cookies. We do not run ads and we do not build audiences.",
          "No social network pixels or embedded share widgets that phone home.",
          "No cross-site tracking or data brokerage of any kind.",
        ],
      },
      { t: "h2", text: "Controlling cookies" },
      {
        t: "p",
        text: "Every browser lets you block or delete cookies for a site. If you block the two above, the cart, favorites and sign-in will not work, which is a limitation of how those features work rather than a position we are taking. Signing out deletes rs_session straight away.",
      },
      { t: "h2", text: "Changes" },
      {
        t: "p",
        text: "If we add a cookie, it gets added to the list above and this page gets a new date. Questions go through the contact page.",
      },
    ],
  },

  accessibility: {
    slug: "accessibility",
    title: "Accessibility statement",
    eyebrow: "Legal — how usable this site is, honestly",
    standfirst:
      "What we target, what we have actually done, what still does not work, and how to tell us when we have got it wrong.",
    updated: "2026-09-14",
    body: [
      {
        t: "p",
        text: "Red Sky Biosciences aims to meet WCAG 2.2 at Level AA across this site. This statement describes where we are against that target rather than claiming we have arrived, because a claim nobody has tested is worth nothing.",
      },
      { t: "h2", text: "What we have done" },
      {
        t: "list",
        items: [
          "Every interactive control is reachable and operable by keyboard, with a visible focus ring that meets the contrast requirement on every background it lands on.",
          "Text contrast is computed rather than eyeballed. Body copy meets or exceeds 4.5 to 1 against its background, including the light text on the red field.",
          "The homepage carousel has a visible pause control, stops on hover and on keyboard focus, responds to the left and right arrow keys, and does not advance on its own for anyone whose system asks for reduced motion.",
          "All motion respects prefers-reduced-motion. Animated traces render in their finished state and page transitions resolve instantly.",
          "Interactive targets are at least 24 by 24 pixels with adequate spacing, and touch targets in navigation are 44 pixels tall.",
          "A skip link precedes the header, landmarks are used throughout, and each page has exactly one first-level heading.",
          "Layouts reflow to 320 pixels without horizontal scrolling and remain usable at 200 percent zoom.",
          "Charts and diagrams carry text alternatives describing what the reading shows, not just that a chart is present.",
        ],
      },
      { t: "h2", text: "Known limitations" },
      {
        t: "p",
        text: "We would rather list these than let you find them:",
      },
      {
        t: "list",
        items: [
          "Chromatogram graphics describe the shape of the trace in their alternative text, but the underlying values are not yet available as a data table. If you need the numbers for a lot, ask us and we will send the integration report.",
          "The bench assistant is a scripted helper rather than a live agent. It announces new messages politely, but it cannot answer outside the topics it knows and it is not a substitute for writing to us.",
          "Some certificate tables are wide. They scroll horizontally inside their own container on narrow screens rather than reflowing into stacked rows.",
          "We have tested with keyboard, with automated tooling and with screen readers, but we have not yet run a formal audit with an external assessor. That is scheduled rather than done.",
        ],
      },
      { t: "h2", text: "Telling us something is broken" },
      {
        t: "p",
        text: "If any part of this site stops you doing something, tell us through the contact page, choosing Accessibility of this site, with the page address and what happened. We aim to reply within five business days and to tell you either when it will be fixed or why it will not be. If you need information from a page that you cannot use, say so and we will send you the content in another format at no cost.",
      },
      { t: "h2", text: "Formal complaints" },
      {
        t: "p",
        text: "If our reply does not resolve the problem, you can escalate to Red Sky Biosciences LLC, 1140 Ferrier Street, Unit 4, Reno, Nevada 89502. Depending on where you live, you may also have a route to a national enforcement body, and we will not object to you using it.",
      },
    ],
  },
};

export const policyList = POLICY_SLUGS.map((s) => policies[s]);
