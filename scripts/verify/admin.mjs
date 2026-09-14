// Staff workflow checks. Run against a server using the file store, started with
// RED_SKY_STORE=file RED_SKY_ADMINS=staff-check@lab.org, from an empty .data/:
//   BASE_URL=http://localhost:PORT node scripts/verify/admin.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch } from "./cdp.mjs";

const SCRATCH = fileURLToPath(new URL("./out", import.meta.url));
const STORE = fileURLToPath(new URL("../../.data/store.json", import.meta.url));
const PDF = `${SCRATCH}/test-certificate.pdf`;
mkdirSync(SCRATCH, { recursive: true });
rmSync(`${SCRATCH}/cdp-admin`, { recursive: true, force: true });
writeFileSync(PDF, "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

// E2E_STORE=supabase: the checks that look inside the store query Supabase instead (keys
// from .env.local), and the run removes everything it wrote, including its test lot.
let sb = null;
if (process.env.E2E_STORE === "supabase") {
  try { process.loadEnvFile(fileURLToPath(new URL("../../.env.local", import.meta.url))); } catch {}
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(process.env.SUPABASE_URL.trim().replace(/\/(rest\/v1\/?)?$/, ""), process.env.SUPABASE_SECRET_KEY.trim(), { auth: { persistSession: false } });
}
const STARTED = new Date().toISOString();
const EMAILS = ["customer-check@lab.org", "staff-check@lab.org"];
const readFile = () => JSON.parse(readFileSync(STORE, "utf8"));

/** The store, read the same way whichever one the server uses. */
const S = {
  async lot(slug) {
    if (!sb) return readFile().lots?.[slug];
    const r = (await sb.from("lots").select().eq("slug", slug).maybeSingle()).data;
    return r && { ...r, purity: Number(r.purity), observedMass: Number(r.observed_mass) };
  },
  async userId(email) {
    if (!sb) return Object.values(readFile().users).find((u) => u.email === email)?.id;
    return (await sb.from("users").select("id").eq("email", email).maybeSingle()).data?.id;
  },
  async standing(owner) {
    if (!sb) return readFile().orders[owner] ?? [];
    return ((await sb.from("standing_orders").select().eq("owner", owner)).data ?? []).map((o) => ({ ...o, nextDispatch: o.next_dispatch }));
  },
  async makeDue(owner, day) {
    if (!sb) {
      const store = readFile();
      store.orders[owner] = store.orders[owner].map((o) => ({ ...o, nextDispatch: day }));
      return writeFileSync(STORE, JSON.stringify(store, null, 2));
    }
    await sb.from("standing_orders").update({ next_dispatch: day }).eq("owner", owner);
  },
  async shipments(owner) {
    if (!sb) return (readFile().placed[owner] ?? []).filter((o) => o.source === "standing");
    return (await sb.from("placed_orders").select().eq("owner", owner).eq("source", "standing")).data ?? [];
  },
  /** Supabase only: leave nothing behind, and above all not the test lot, which a build would publish. */
  async cleanup() {
    if (!sb) return;
    const users = (await sb.from("users").select("id").in("email", EMAILS)).data ?? [];
    for (const { id } of users) {
      for (const t of ["favorites", "waitlist", "profiles", "carts", "placed_orders", "standing_orders", "retained"]) await sb.from(t).delete().eq("owner", id);
      await sb.from("users").delete().eq("id", id);
    }
    await sb.from("lots").delete().eq("slug", "bpc-157").eq("lot", "RS-TEST-01");
    await sb.storage.from("certificates").remove(["RS-TEST-01.pdf"]);
    await sb.from("messages").delete().in("email", EMAILS);
    await sb.from("admin_log").delete().in("actor", EMAILS);
    await sb.from("attempts").delete().gte("at", STARTED);
  },
};
await S.cleanup(); // a previous interrupted run

const log = [];
const check = (name, ok, detail = "") => log.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
const bodyHas = (s) => `document.body.textContent.toLowerCase().includes(${JSON.stringify(s.toLowerCase())})`;
const page = await launch({ profile: "cdp-admin", port: 9342 });
await page.viewport(1280, 900);
const waitFor = async (js, ms = 10000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if (await page.eval(`!!(${js})`)) return true; } catch {}
    await page.sleep(150);
  }
  return false;
};
const clickText = async (t) => {
  await page.eval(`[...document.querySelectorAll("button, a")].find(b => b.textContent.trim().startsWith(${JSON.stringify(t)}))?.setAttribute("data-t", "1")`);
  await page.click('[data-t="1"]');
  await page.eval(`document.querySelector('[data-t="1"]')?.removeAttribute("data-t")`);
};
const signUp = async (name, email, password) => {
  await page.goto("/account", 2500);
  const su = `section[aria-labelledby="sign-up-heading"]`;
  await page.type(`${su} input[name="name"]`, name);
  await page.type(`${su} input[name="email"]`, email);
  await page.type(`${su} input[name="password"]`, password);
  await page.click(`${su} input[name="terms"]`);
  await page.click(`${su} button[type="submit"]`);
  return waitFor(`document.querySelector("h1")?.textContent === ${JSON.stringify(name)}`, 15000);
};
const signOut = async () => {
  await page.goto("/account", 2000);
  await clickText("Sign out");
  await waitFor(bodyHas("Create an account"), 10000);
};

/* ── A customer writes in, and cannot see the staff page ── */
check("customer signs up", await signUp("Ada Customer", "customer-check@lab.org", "customer passphrase"));
await page.goto("/contact?topic=order", 2500);
await page.type('input[name="name"]', "Ada Customer");
await page.type('input[name="email"]', "customer-check@lab.org");
await page.type('textarea[name="message"]', "I have forgotten my password for this account.");
await clickText("Send the message");
check("contact message is received", await waitFor(bodyHas("Message received")));
await page.goto("/admin", 2500);
check("a customer is refused the staff page", await page.eval(bodyHas("This page is for Red Sky staff")));
await signOut();

/* ── Staff ── */
check("staff signs up", await signUp("Sam Staff", "staff-check@lab.org", "staff passphrase long"));
await page.goto("/admin", 3000);
check("staff page opens", await page.eval(bodyHas("The back of the shop")));
check("the message is in the inbox", await page.eval(bodyHas("I have forgotten my password for this account")));
check("all 26 sequences listed", (await page.eval(`document.querySelectorAll('#lots tbody tr').length`)) === 26);

await page.goto("/admin/lots/bpc-157", 3000);
check("lot editor opens with the formula", await page.eval(bodyHas("C62H98N16O22")));
// A real lot with a figure missing is refused.
await page.eval(`document.querySelector('input[name="sample"]').checked && document.querySelector('input[name="sample"]').click()`);
await page.eval(`document.querySelector('input[name="lot"]').value = ""`);
await page.type('input[name="lot"]', "RS-TEST-01");
await clickText("Save and publish");
check("a real lot missing figures is refused", await waitFor(bodyHas("from the certificate, or tick")));

// React resets the form after the action, so everything is filled again.
await page.goto("/admin/lots/bpc-157", 3000);
await page.eval(`document.querySelector('input[name="sample"]').checked && document.querySelector('input[name="sample"]').click()`);
for (const [name, value] of [["lot", "RS-TEST-01"], ["purity", "99.12"], ["retention", "11.4"], ["observedMass", "1419.55"], ["water", "3.1"], ["largestImpurity", "0.31% at 10.9 min"], ["analyst", "S.S."], ["price", "52"]]) {
  await page.eval(`document.querySelector('input[name="${name}"]').value = ""`);
  await page.type(`input[name="${name}"]`, value);
}
await page.eval(`document.querySelector('input[name="released"]').value = "2026-09-10"`);
await page.upload('input[name="certificate"]', [PDF]);
await clickText("Save and publish");
check("a complete real lot saves", await waitFor(bodyHas("Saved. It goes live on the next deploy")), await page.eval(`document.querySelector('[role="alert"]')?.textContent ?? ""`));

const row = await S.lot("bpc-157");
check("the store holds the lot as entered", row?.lot === "RS-TEST-01" && row.purity === 99.12 && row.observedMass === 1419.55 && row.analyst === "S.S." && row.sample === false && row.certificate === "RS-TEST-01.pdf", JSON.stringify(row ?? {}).slice(0, 160));
const pdf = await page.eval(`fetch("/api/certificate/RS-TEST-01").then(async r => ({ status: r.status, type: r.headers.get("content-type"), head: (await r.text()).slice(0, 5) }))`);
check("the certificate PDF is served", pdf.status === 200 && pdf.type === "application/pdf" && pdf.head === "%PDF-", JSON.stringify(pdf));
check("an unknown lot has no certificate", (await page.eval(`fetch("/api/certificate/RS-NONE-00").then(r => r.status)`)) === 404);

await page.goto("/admin", 3000);
check("the lot shows as saved, waiting for a rebuild", await page.eval(`[...document.querySelectorAll('#lots tbody tr')].find(r => r.textContent.includes("BPC-157"))?.textContent.includes("Waiting for rebuild")`));

/* ── A monthly pair, moved to a new address, then shipped ── */
for (const slug of ["bpc-157", "tb-500"]) {
  await page.eval(`fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "add", slug: "${slug}", plan: "monthly", quantity: 1 }) }).then(r => r.status)`);
}
await page.goto("/cart", 3000);
for (const [f, v] of [["recipient", "Sam Staff"], ["line1", "40 Assay Court"], ["city", "Cambridge"], ["region", "Massachusetts"], ["postal", "02139"]]) {
  await page.type(`input[name="address.${f}"]`, v);
}
await page.click('input[name="attest"]');
await clickText("Place order");
check("a monthly pair is ordered", await waitFor(bodyHas("Order recorded"), 15000));

await page.goto("/account", 3000);
await clickText("Change address");
await waitFor(`document.querySelector('#profile input[name="address.line1"]')`);
await page.eval(`document.querySelector('#profile input[name="address.line1"]').value = ""`);
await page.type('#profile input[name="address.line1"]', "9 New Bench Lane");
check("the address form offers to move both standing orders", await page.eval(bodyHas("Send all 2 standing orders here too")));
await clickText("Save address");
check("saving moves the standing orders", await waitFor(bodyHas("all 2 standing orders ship there")));
const staffId = await S.userId("staff-check@lab.org");
const moved = await S.standing(staffId);
check("each standing order holds the new address", moved.length === 2 && moved.every((o) => o.address?.line1 === "9 New Bench Lane"));

// Bring both due to today, as if the month had turned, so they appear this week.
const today = new Date().toISOString().slice(0, 10);
await S.makeDue(staffId, today);
await page.goto("/admin", 3000);
check("the pair shows as one shipment due, with the stack saving", await page.eval(`(() => { const t = document.querySelector("#due")?.textContent ?? ""; return t.includes("BPC-157") && t.includes("TB-500") && t.includes("$96.00") && t.includes("$14.00 stack saving") && t.includes("9 New Bench Lane"); })()`));
await clickText("Record shipment");
check("recording confirms the shipment on the page", await waitFor(bodyHas("unpaid. Each of its standing orders moved to next")));
const shipments = await S.shipments(staffId);
const advanced = await S.standing(staffId);
check(
  "one shipment recorded, and both orders move to next month",
  shipments.length === 1 && Number(shipments[0].totals.today) === 96 && shipments[0].address.line1 === "9 New Bench Lane" &&
    advanced.every((o) => o.nextDispatch > today),
  `${shipments.length} shipments; next ${advanced.map((o) => o.nextDispatch).join(", ")}`,
);

/* ── Reset a customer's password ── */
await page.type('#accounts input[name="email"]', "customer-check@lab.org");
await clickText("Set a temporary password");
check("a temporary password is shown once", await waitFor(bodyHas("Temporary password — shown once")));
const temporary = await page.eval(`document.querySelector('#accounts .select-all')?.textContent`);
check("the log records the reset and the lot save", await (async () => {
  await page.goto("/admin", 3000);
  return page.eval(bodyHas("account.reset-password") + " && " + bodyHas("lot.save"));
})());
await signOut();

await page.goto("/account", 2500);
const si = `section[aria-labelledby="sign-in-heading"]`;
await page.type(`${si} input[name="email"]`, "customer-check@lab.org");
await page.type(`${si} input[name="password"]`, temporary ?? "");
await page.click(`${si} button[type="submit"]`);
check("the customer signs in with the temporary password", await waitFor(`document.querySelector("h1")?.textContent === "Ada Customer"`, 15000));

check("no page or console errors", page.errors.length === 0, page.errors.slice(0, 3).join(" // "));
await page.close();
await S.cleanup();
console.log(log.join("\n"));
