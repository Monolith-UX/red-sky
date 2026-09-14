import {
  STOCK_LABEL,
  type CatalogItem,
  canOrder,
  catalogue,
  money,
  released,
  shortDate,
  waitingFor,
} from "./catalog";
import { CLINICAL } from "./contact";

/**
 * The bench assistant's answers, built from the catalogue rather than typed
 * in, so a count or a purity it quotes is the one on the lot page. The
 * clinical refusal is checked first and nothing can outrank it; keep that
 * order if a language model is ever put behind `answerFor`.
 */

export type Reply = { text: string; link?: { href: string; label: string } };

const REFUSAL: Reply = {
  text: "I can't help with that one. Everything Red Sky sells is for in-vitro laboratory research — we don't give dosing, medical or veterinary guidance, and nothing here is a drug. For handling, reconstitution or solubility questions, the technical team answers within a business day.",
  link: { href: "/contact?topic=handling", label: "Write to the technical team" },
};

const LOT = /\bRS-\d{4}-[A-Z]\b/i;

function aboutItem(item: CatalogItem): Reply {
  const link = { href: `/catalog/${item.slug}`, label: `Open ${item.name}` };
  if (item.purity === null) {
    return {
      text: `${item.name} (${item.formula}) has been announced but not released. ${waitingFor(item)}; it can't be ordered until that lot clears release, but you can join the waitlist on its page.`,
      link,
    };
  }
  const state =
    item.stock === "out"
      ? `The last lot has sold through — ${waitingFor(item).toLowerCase()}, and there's a waitlist on its page.`
      : `${STOCK_LABEL[item.stock]}, ${money(item.price)} for ${item.fill}.`;
  return {
    text: `${item.name} lot ${item.lot} assayed at ${item.purity.toFixed(2)}% area purity by RP-HPLC and was released ${shortDate(item.released)}. ${state}`,
    link: { href: `/catalog/${item.slug}#certificate`, label: "Read its certificate" },
  };
}

type Topic = { chip?: string; match: RegExp; reply: () => Reply };

const TOPICS: Topic[] = [
  {
    chip: "Where are the certificates?",
    match: /\b(coa|certificate|chromatogram|trace|hplc report|paperwork|document|lot lookup)/i,
    reply: () => ({
      text: `Every lot page carries its own HPLC trace, the ESI-MS result and the analyst's initials — ${released.length} certificates are published right now. You can also look any lot up by its number.`,
      link: { href: "/certificates", label: "Look up a lot" },
    }),
  },
  {
    chip: "What is the purity floor?",
    match: /\b(purity|pure|99|assay|grade|quality|impurit)/i,
    reply: () => {
      const shelf = released.filter((c) => c.stock === "in" || c.stock === "low");
      const low = shelf.reduce((a, b) => (b.purity < a.purity ? b : a));
      return {
        text: `99% area purity by reverse-phase HPLC at 214 nm, on every lot. A lot that misses is destroyed rather than discounted. The lowest on the shelf today is ${low.name} lot ${low.lot} at ${low.purity.toFixed(2)}%.`,
        link: { href: "/testing", label: "How every lot is tested" },
      };
    },
  },
  {
    chip: "How do you ship?",
    match: /\b(ship|shipping|deliver|courier|cold chain|freight|arrive|track|logger)/i,
    reply: () => ({
      text: "Vials leave the freezer at −20 °C on gel packs with a temperature logger in the box, so you can read the whole journey before you open it. Stocked lots ordered before 14:00 ET ship the same business day.",
      link: { href: "/handling", label: "Handling and delivery" },
    }),
  },
  {
    chip: "Can I get it every month?",
    match: /\b(monthly|subscri|auto.?deliver|recurring|standing order|repeat order|every month)/i,
    reply: () => ({
      text: "Yes. Choose monthly auto-delivery on a product page, or switch any cart line to monthly. It ships with the order, then on the first Monday, Tuesday or Wednesday of every month, and you can skip, pause or cancel from your account.",
      link: { href: "/account#auto-delivery", label: "Your standing orders" },
    }),
  },
  {
    match: /\b(waitlist|wait list|notify|back in stock|out of stock|sold out|restock|coming soon|when will)/i,
    reply: () => {
      const waiting = catalogue.filter((c) => !canOrder(c));
      return {
        text: `Anything out of stock or not yet released has a bell under its heart, and a waitlist gets one email the day the certificate goes up. Waiting now: ${waiting
          .map((c) => `${c.name} (${waitingFor(c).toLowerCase()})`)
          .join(", ")}.`,
        link: { href: "/account#waitlist", label: "Your waitlists" },
      };
    },
  },
  {
    match: /\b(favou?rite|heart|save for later|saved)/i,
    reply: () => ({
      text: "The heart on any card or product page saves the sequence to your account, and hovering it shows how many people have saved it too.",
      link: { href: "/account#favorites", label: "Your favorites" },
    }),
  },
  {
    match: /\b(account|sign ?in|log ?in|password|profile|avatar)/i,
    reply: () => ({
      text: "An account keeps favorites, waitlists and standing orders together across devices, and a device you sign in on stays signed in for ninety days from your last visit. Forgotten passwords are reset by the technical team.",
      link: { href: "/account", label: "Your account" },
    }),
  },
  {
    chip: "Do you quote bulk?",
    match: /\b(bulk|quantity|wholesale|custom|synthesis|gram|quote|invoice|net.?30|institution)/i,
    reply: () => ({
      text: "Yes. Bulk quantities, other fills and custom synthesis are quoted within one business day — send the sequence, the scale and the purity you need.",
      link: { href: "/contact?topic=quote", label: "Ask for a quote" },
    }),
  },
  {
    match: /\b(stor|freezer|fridge|shelf life|expire|stability|reconstitut|lyophil|handle|dissolve)/i,
    reply: () => ({
      text: "Hold sealed vials at −20 °C out of light. Let a vial reach room temperature before breaking the seal, run diluent slowly down the wall, and swirl rather than shake. Aliquot before refreezing.",
      link: { href: "/handling", label: "The full handling notes" },
    }),
  },
  {
    match: /\b(stor(y|ies)|testimonial|review|case stud)/i,
    reply: () => ({
      text: "Client stories come from labs describing their own research with our material. Every one is read before it's published, and none describe use in people or animals.",
      link: { href: "/stories", label: "Client stories" },
    }),
  },
  {
    match: /\b(contact|email|phone|call|talk to|human|person)/i,
    reply: () => ({
      text: "The technical team is at lab@redskybio.com and +1 775 555 0143, and answers within a business day.",
      link: { href: "/contact", label: "Contact the team" },
    }),
  },
  {
    match: /\b(catalog|carry|stock|available|sell|sequences|products)/i,
    reply: () => {
      const orderable = catalogue.filter(canOrder).length;
      return {
        text: `${catalogue.length} sequences are in the catalogue: ${orderable} can be ordered today and ${catalogue.length - orderable} take a waitlist. Every card shows its lot, its purity and its own chromatogram.`,
        link: { href: "/catalog", label: "Browse the catalogue" },
      };
    },
  },
];

const FALLBACK: Reply = {
  text: "I can answer on lots and certificates, purity, shipping and storage, monthly orders, waitlists and bulk quotes. For anything else, the technical team replies within a business day.",
  link: { href: "/contact", label: "Contact the team" },
};

export function answerFor(text: string): Reply {
  if (CLINICAL.test(text)) return REFUSAL;

  const lot = text.match(LOT)?.[0].toUpperCase();
  if (lot) {
    const item = catalogue.find((c) => c.lot === lot);
    return item
      ? aboutItem(item)
      : {
          text: `There's no published certificate for ${lot}. Check the number against the vial label, or send it to the technical team and they will look it up.`,
          link: { href: "/certificates", label: "Look up a lot" },
        };
  }

  // A sequence named outright gets its own answer. Longest names first, so
  // "GHRP-6" is not mistaken for something shorter inside it.
  const named = [...catalogue]
    .sort((a, b) => b.name.length - a.name.length)
    .find((c) => text.toLowerCase().includes(c.name.toLowerCase()));
  if (named) return aboutItem(named);

  return TOPICS.find((t) => t.match.test(text))?.reply() ?? FALLBACK;
}

export const CHIPS = TOPICS.filter((t) => t.chip).map((t) => t.chip as string);
