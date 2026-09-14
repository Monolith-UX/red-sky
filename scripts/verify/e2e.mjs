// End-to-end checks across the storefront. Run: BASE_URL=http://localhost:PORT node scripts/verify/e2e.mjs
// Start from an empty .data/: the stories check expects nothing published yet.
// Against a server using Supabase, add E2E_STORE=supabase: the checks that look inside the
// store then query Supabase with the keys in .env.local, and the run deletes its own rows after.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch } from "./cdp.mjs";

const SCRATCH = fileURLToPath(new URL("./out", import.meta.url));
const STORE = fileURLToPath(new URL("../../.data/store.json", import.meta.url));
let sb = null;
if (process.env.E2E_STORE === "supabase") {
  try { process.loadEnvFile(fileURLToPath(new URL("../../.env.local", import.meta.url))); } catch {}
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
}
rmSync(`${SCRATCH}/cdp-e2e3`, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });

const log = [];
const check = (name, ok, detail = "") => log.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
const tag = (page, js, name) =>
  page.eval(`(() => { const el = (${js}); if (el) el.setAttribute("data-e2e", ${JSON.stringify(name)}); return !!el; })()`);
const waitFor = async (page, js, ms = 8000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if (await page.eval(`!!(${js})`)) return true; } catch {}
    await page.sleep(150);
  }
  return false;
};
const bodyHas = (s) => `document.body.textContent.toLowerCase().includes(${JSON.stringify(s.toLowerCase())})`;
const buttonByText = (t) => `[...document.querySelectorAll("button, a")].find(b => b.textContent.trim().startsWith(${JSON.stringify(t)}))`;

let page = await launch({ profile: "cdp-e2e3", port: 9337 });
await page.viewport(1280, 900);

/* ── Navigation ────────────────────────────────────────────── */
await page.goto("/", 2500);
const navLabels = await page.eval(`[...document.querySelectorAll('nav[aria-label="Main"] a')].map(a => a.textContent.trim())`);
check("main nav order", JSON.stringify(navLabels) === JSON.stringify(["About Us", "Catalog", "Testing", "Handling", "Client Stories", "Blog", "Contact"]), navLabels.join(" · "));
await page.viewport(1024, 800);
await page.sleep(400);
const navFit = await page.eval(`(() => { const nav = document.querySelector('nav[aria-label="Main"]').getBoundingClientRect(); const right = document.querySelector('header a[href="/account"]').getBoundingClientRect(); const logo = document.querySelector('header a[href="/"]').getBoundingClientRect(); return { gapLeft: Math.round(nav.left - logo.right), gapRight: Math.round(right.left - nav.right) }; })()`);
check("nav fits at 1024px", navFit.gapLeft > 8 && navFit.gapRight > 8, JSON.stringify(navFit));
await page.viewport(1280, 900);

/* ── Stack slide adds both vials ───────────────────────────── */
await page.click('button[aria-label^="Show slide 4"]');
await page.sleep(900);
await tag(page, buttonByText("Add the stack"), "stack");
await page.click('[data-e2e="stack"]');
check("stack button adds both vials", await waitFor(page, `document.querySelector('a[href="/cart"]')?.getAttribute("aria-label") === "Cart, 2 vials"`));

/* ── Newsletter ────────────────────────────────────────────── */
// A fresh address each run: the sign-up is rate-limited per address, in memory, for ten minutes.
await page.type("#newsletter-email", `releases+${Date.now()}@lab.org`);
await page.click('#newsletter button[type="submit"]');
check("newsletter stores the address", await waitFor(page, bodyHas("You are on the list") + " || " + bodyHas("already on the list")));

/* ── Waitlist bell with the email popover ──────────────────── */
await page.goto("/catalog", 2500);
const bell = 'button[aria-label="Waitlist for Sermorelin"]';
check("bell only on unorderable cards", (await page.eval(`document.querySelectorAll('button[aria-label^="Waitlist for"]').length`)) === 3);
await page.click(bell);
check("bell opens the email form", await waitFor(page, `document.querySelector('form[aria-label="Join the waitlist for Sermorelin"]')`));
await page.shot("e2e2-bell-popover", { clip: await page.eval(`(() => { const r = document.querySelector('${bell}').closest("article").getBoundingClientRect(); return { x: Math.max(0, r.x - 200), y: r.y + scrollY - 10, width: r.width + 220, height: 360 }; })()`) });
await page.type('form[aria-label="Join the waitlist for Sermorelin"] input[type="email"]', "bell@lab.org");
await page.click('form[aria-label="Join the waitlist for Sermorelin"] button[type="submit"]');
check("bell joins and fills", await waitFor(page, `document.querySelector('${bell}').getAttribute("aria-pressed") === "true"`));
await page.hover(bell);
const bellTip = await page.eval(`document.getElementById(document.querySelector('${bell}').getAttribute("aria-describedby"))?.textContent`);
check("bell tip counts who is waiting", /On the waitlist · \d+ waiting/.test(bellTip ?? ""), bellTip);

/* ── Sign up ───────────────────────────────────────────────── */
await page.goto("/account", 2500);
const email = `e2e2+${Date.now()}@lab.org`;
const su = `section[aria-labelledby="sign-up-heading"]`;
await page.type(`${su} input[name="name"]`, "Marcus Bell");
await page.type(`${su} input[name="email"]`, email);
await page.type(`${su} input[name="password"]`, "the column never lies");
await page.click(`${su} input[name="terms"]`);
await page.click(`${su} button[type="submit"]`);
check("sign-up lands on the dashboard", await waitFor(page, `document.querySelector("h1")?.textContent === "Marcus Bell"`, 15000));

/* ── Cart: stack saving, plan split, cross-sell ────────────── */
await page.goto("/cart", 3000);
check("stack saving applies to a one-time pair", await waitFor(page, bodyHas("Wolverine Stack") + ` && document.body.textContent.includes("−$14.00")`));
const dueBefore = await page.eval(`[...document.querySelectorAll("aside dl div")].find(d => d.textContent.includes("Due today"))?.querySelector("dd")?.textContent`);
check("due today is the $96 stack price", dueBefore === "$96.00", dueBefore);
await tag(page, `[...document.querySelectorAll("li")].find(li => li.textContent.includes("BPC-157") && li.querySelector("fieldset"))?.querySelector("label:nth-of-type(2)")`, "bpc-monthly");
await page.click('[data-e2e="bpc-monthly"]');
check("plans split the pair and offer the partner", await waitFor(page, bodyHas("Add TB-500 monthly for the Wolverine Stack")));
await tag(page, buttonByText("Add TB-500"), "add-partner");
await page.click('[data-e2e="add-partner"]');
check("adding the partner restores a monthly saving", await waitFor(page, bodyHas("1 set, every month")));

for (const [field, value] of [["recipient", "Marcus Bell"], ["line1", "1 Lab Way"], ["city", "Boston"], ["region", "Massachusetts"], ["postal", "02115"]]) {
  await page.type(`input[name="address.${field}"]`, value);
}
await page.click('input[name="attest"]');
await page.shot("e2e2-cart", { full: true });
await tag(page, buttonByText("Place order"), "place");
await page.click('[data-e2e="place"]');
check("order placed with totals", await waitFor(page, bodyHas("Order recorded") + " && " + bodyHas("stack saving"), 15000));

/* ── Account: orders, address, password ───────────────────── */
await page.goto("/account", 3000);
check("order history lists the order", await page.eval(`/ORD-\\d{6}-[A-Z0-9]{6}/.test(document.querySelector("#orders")?.textContent ?? "")`));
check("delivery address saved", await page.eval(bodyHas("1 Lab Way")));
await page.type('input[name="current"]', "wrong password here");
await page.type('input[name="replacement"]', "an even better passphrase");
await tag(page, buttonByText("Change password"), "pw");
await page.click('[data-e2e="pw"]');
check("wrong current password is refused", await waitFor(page, bodyHas("The current password is not right")));
await page.type('input[name="current"]', "the column never lies");
await page.type('input[name="replacement"]', "an even better passphrase");
await page.click('[data-e2e="pw"]');
check("password changes", await waitFor(page, bodyHas("Password changed")));

await tag(page, buttonByText("Change address"), "addr");
await page.click('[data-e2e="addr"]');
await waitFor(page, `document.querySelector('#profile input[name="address.line1"]')`);
await page.eval(`document.querySelector('#profile input[name="address.line1"]').value = ""`);
await page.type('#profile input[name="address.line1"]', "2 Bench Road");
await tag(page, buttonByText("Save address"), "addr-save");
await page.click('[data-e2e="addr-save"]');
check("address edits on the account page", await waitFor(page, bodyHas("Address saved") + " && " + bodyHas("2 Bench Road") + " && !document.querySelector('#profile input[name=\"address.line1\"]')", 10000));

const exported = await page.eval(`fetch("/api/account/export").then(async r => ({ status: r.status, disposition: r.headers.get("content-disposition"), text: await r.text() }))`);
const copy = exported.status === 200 ? JSON.parse(exported.text) : null;
check(
  "data export is the account's own, without hashes",
  copy?.account.email === email && copy.orders.length === 1 && copy.profile.address.line1 === "2 Bench Road" &&
    /attachment/.test(exported.disposition ?? "") && !/passwordHash|scrypt\$/.test(exported.text),
  `status ${exported.status}`,
);

/* ── Stories ───────────────────────────────────────────────── */
await page.goto("/stories", 3000);
check("stories page shows the template until approval", await page.eval(bodyHas("Template — how a published story is set")));
const fillStory = async (title, story, outcome) => {
  await page.type('input[name="title"]', title);
  await page.eval(`document.querySelector('select[name="slugs"]').value = "bpc-157"`);
  await page.type('textarea[name="story"]', story);
  await page.type('textarea[name="outcome"]', outcome);
  await page.type('input[name="role"]', "Method development lead");
  await page.click('input[name="own-work"]');
  await page.click('input[name="no-human-use"]');
  await page.click('input[name="publish"]');
  await tag(page, buttonByText("Send the story for review"), "send-story");
  await page.click('[data-e2e="send-story"]');
};
await fillStory(
  "Three lots, one column, no surprises",
  "We were building a stability-indicating HPLC method and needed a reference lot whose impurity profile was documented rather than guessed. We ran RS-2601-B against our own C18 gradient and compared the integration with the released trace, peak for peak, including the deletion sequence at 11.6 minutes.",
  "The method validated a month early, because the reference behaved exactly as its certificate said it would.",
);
check("clean story received with a verified mark", await waitFor(page, bodyHas("A person reads it next") + " && " + bodyHas("verified order mark"), 12000));
await page.goto("/stories", 2500);
await fillStory(
  "My recovery journey",
  "I took BPC-157 for my knee injury and felt better within a week. I injected it daily and my pain went down, so I wanted to share my progress with everyone reading this page about how well it worked for me.",
  "My knee healed.",
);
check("personal-use story is flagged", await waitFor(page, bodyHas("read as use in a person or an animal"), 12000));

await page.goto("/stories/review", 2500);
check("review queue refuses non-moderators", await page.eval(bodyHas("This queue is for moderators")));

// Stand in for a moderator: approve the clean story directly in the store.
if (sb) {
  await sb.from("stories").update({ status: "published", published: new Date().toISOString() })
    .eq("title", "Three lots, one column, no surprises").eq("status", "pending").eq("email", email);
} else {
  const db = JSON.parse(readFileSync(STORE, "utf8"));
  const clean = db.stories.find((s) => s.title === "Three lots, one column, no surprises" && s.status === "pending");
  if (clean) {
    clean.status = "published";
    clean.published = new Date().toISOString();
    writeFileSync(STORE, JSON.stringify(db, null, 2));
  }
}
await page.goto("/stories", 3000);
check("an approved story renders with its verified mark", await page.eval(bodyHas("Three lots, one column, no surprises") + " && " + bodyHas("Verified order")));
check("a flagged story never renders", !(await page.eval(bodyHas("My recovery journey"))));
await page.shot("e2e2-stories", { clip: { x: 0, y: 0, width: 1280, height: 1700 } });

/* ── Certificates, assistant, 404 ──────────────────────────── */
await page.goto("/certificates", 2500);
await page.type('input[type="search"]', "RS-2604-C");
check("lot lookup shows the certificate summary", await waitFor(page, `document.querySelector('section[aria-label="Certificate summary for lot RS-2604-C"]')`));
await page.shot("e2e2-certificates", { clip: { x: 0, y: 500, width: 1280, height: 900 } });

await page.click('button[aria-label="Open the bench assistant"]');
await page.type("#bench-input", "What is lot RS-2601-B?");
await page.key("Enter", "Enter", 13);
check("assistant answers a lot lookup from data", await waitFor(page, `[...document.querySelectorAll('[role="dialog"] p')].some(p => p.textContent.includes("99.47%") && p.textContent.includes("Read its certificate"))`));
await page.type("#bench-input", "how much should I inject for my knee");
await page.key("Enter", "Enter", 13);
check("assistant still refuses dosing", await waitFor(page, `[...document.querySelectorAll('[role="dialog"] p')].some(p => p.textContent.includes("I can't help with that one"))`));
const catalogueAnswer = await (async () => {
  await page.type("#bench-input", "how many products do you sell");
  await page.key("Enter", "Enter", 13);
  await page.sleep(900);
  return page.eval(`[...document.querySelectorAll('[role="dialog"] [aria-live] p')].map(p => p.textContent).at(-1)`);
})();
check("assistant counts the real catalogue", /^26 sequences/.test(catalogueAnswer?.replace(/^Assistant: /, "") ?? ""), catalogueAnswer?.slice(0, 80));

const res = await page.eval(`fetch("/no-such-page").then(r => r.status)`);
await page.goto("/no-such-page", 2000);
check("404 page with status 404", res === 404 && (await page.eval(bodyHas("Nothing is filed under that address"))), `status ${res}`);

for (const path of ["/about", "/testing", "/handling"]) {
  await page.goto(path, 2000);
  const h1 = await page.eval(`document.querySelector("h1")?.textContent`);
  check(`${path} renders`, !!h1, h1);
  await page.shot(`e2e2-page${path.replace("/", "-")}`, { clip: { x: 0, y: 0, width: 1280, height: 1600 } });
}

/* ── Narrow screens ────────────────────────────────────────── */
const widths = [];
for (const w of [320, 390]) {
  await page.viewport(w, 800, true);
  for (const path of ["/", "/about", "/catalog", "/catalog/sermorelin", "/testing", "/handling", "/certificates", "/stories", "/blog/reconstitution", "/cart", "/account", "/contact", "/sitemap", "/terms", "/no-such-page"]) {
    await page.goto(path, 1300);
    const over = await page.eval(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    if (over !== 0) widths.push(`${w}${path}:${over}`);
  }
}
check("no horizontal overflow at 320 and 390px", widths.length === 0, widths.join(" "));
await page.viewport(390, 844, true);
await page.goto("/blog/reconstitution", 2000);
check("mobile contents list above the article", await page.eval(`!!document.querySelector("main details summary") && getComputedStyle(document.querySelector("main details")).display !== "none"`));
await page.shot("e2e2-mobile-toc", { clip: { x: 0, y: 0, width: 390, height: 1200 } });

/* ── Closing the account ───────────────────────────────────── */
await page.viewport(1280, 900);
await page.goto("/account", 3000);
await page.click("#data summary");
await page.type('#data input[name="password"]', "not the password");
await page.click('#data input[name="confirm"]');
await tag(page, `document.querySelector('#data button[type="submit"]')`, "close");
await page.click('[data-e2e="close"]');
check("closing refuses a wrong password", await waitFor(page, bodyHas("Nothing has been deleted")));
// React resets the form after each action, so the box is ticked again.
await page.type('#data input[name="password"]', "an even better passphrase");
await page.eval(`document.querySelector('#data input[name="confirm"]').checked || document.querySelector('#data input[name="confirm"]').click()`);
await page.click('[data-e2e="close"]');
check("closing lands on the notice with what was kept", await waitFor(page, bodyHas("The account is closed") + " && " + bodyHas("placed orders, held for seven years"), 15000));
await page.shot("e2e2-account-closed", { clip: { x: 0, y: 0, width: 1280, height: 900 } });
if (sb) {
  const users = (await sb.from("users").select("id").eq("email", email)).data ?? [];
  const kept = (await sb.from("retained").select("owner").eq("email", email)).data ?? [];
  const orders = kept.length ? (await sb.from("placed_orders").select("ref").eq("owner", kept[0].owner)).data ?? [] : [];
  const leftovers = kept.length
    ? await Promise.all(["profiles", "carts", "favorites", "waitlist", "standing_orders"].map(async (t) =>
        (await sb.from(t).select("owner").eq("owner", kept[0].owner)).data?.length ?? 0))
    : [1];
  check("store deletes the account and keeps only its orders", users.length === 0 && orders.length === 1 && leftovers.every((n) => n === 0), `orders ${orders.length}, leftovers ${leftovers.join(",")}`);
} else {
  const after = JSON.parse(readFileSync(STORE, "utf8"));
  const gone = !Object.values(after.users).some((u) => u.email === email);
  const retained = Object.values(after.retained ?? {}).find((r) => r.email === email);
  check("store deletes the account and keeps only its orders", gone && retained?.orders.length === 1 && !Object.values(after.sessions).some((s) => !after.users[s.user]));
}
check("export refuses once closed", (await page.eval(`fetch("/api/account/export").then(r => r.status)`)) === 401);

// Supabase is shared, so the run removes what it wrote: its stories, retained orders, list entry and attempts.
if (sb) {
  const kept = (await sb.from("retained").select("owner").eq("email", email)).data ?? [];
  for (const { owner } of kept) await sb.from("placed_orders").delete().eq("owner", owner);
  await sb.from("retained").delete().eq("email", email);
  await sb.from("stories").delete().eq("email", email);
  await sb.from("subscribers").delete().like("email", "releases+%@lab.org");
  await sb.from("attempts").delete().or("key.like.%e2e2+%,key.like.%releases+%");
}

check("no page or console errors", page.errors.length === 0, page.errors.slice(0, 4).join(" // "));
await page.close();
console.log(log.join("\n"));
