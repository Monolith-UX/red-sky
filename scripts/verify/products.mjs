// Product management checks: import, add, edit, photos, order, remove, restore, delete.
// Against a file-store server started with RED_SKY_STORE=file RED_SKY_ADMINS=staff-check@lab.org,
// from an empty .data/:           BASE_URL=http://localhost:PORT node scripts/verify/products.mjs
// Against Supabase, add E2E_STORE=supabase; the run then restores the products table to what it
// was (empty stays empty) and removes its test account, order and photos.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { launch } from "./cdp.mjs";

const OUT = fileURLToPath(new URL("./out", import.meta.url));
const STORE = fileURLToPath(new URL("../../.data/store.json", import.meta.url));
mkdirSync(OUT, { recursive: true });
rmSync(`${OUT}/cdp-products`, { recursive: true, force: true });
const IMG1 = `${OUT}/product-1.png`;
const IMG2 = `${OUT}/product-2.png`;
writeFileSync(IMG1, await sharp({ create: { width: 800, height: 640, channels: 3, background: "#FBFBFA" } }).png().toBuffer());
writeFileSync(IMG2, await sharp({ create: { width: 640, height: 640, channels: 3, background: "#14161A" } }).png().toBuffer());

let sb = null;
if (process.env.E2E_STORE === "supabase") {
  try { process.loadEnvFile(fileURLToPath(new URL("../../.env.local", import.meta.url))); } catch {}
  const { createClient } = await import("@supabase/supabase-js");
  sb = createClient(process.env.SUPABASE_URL.trim().replace(/\/(rest\/v1\/?)?$/, ""), process.env.SUPABASE_SECRET_KEY.trim(), { auth: { persistSession: false } });
}
const STARTED = new Date().toISOString();
const SNAPSHOT = sb ? ((await sb.from("products").select()).data ?? []) : [];
const STAFF = "staff-check@lab.org";
const TEST = "test-peptide-alpha";

const S = {
  async products() {
    if (!sb) { try { return JSON.parse(readFileSync(STORE, "utf8")).products ?? {}; } catch { return {}; } }
    const rows = (await sb.from("products").select()).data ?? [];
    return Object.fromEntries(rows.map((r) => [r.slug, r]));
  },
  async cleanup(hadProducts) {
    if (!sb) return;
    // Put back every real product exactly as it was: moving the test product renumbers the order.
    if (SNAPSHOT.length) await sb.from("products").upsert(SNAPSHOT);
    const files = (await sb.storage.from("product-images").list(TEST)).data ?? [];
    if (files.length) await sb.storage.from("product-images").remove(files.map((f) => `${TEST}/${f.name}`));
    await sb.from("products").delete().eq("slug", TEST);
    if (!hadProducts) await sb.from("products").delete().neq("slug", "");
    const users = (await sb.from("users").select("id").eq("email", STAFF)).data ?? [];
    for (const { id } of users) {
      for (const t of ["favorites", "waitlist", "profiles", "carts", "placed_orders", "standing_orders", "retained"]) await sb.from(t).delete().eq("owner", id);
      await sb.from("users").delete().eq("id", id);
    }
    await sb.from("admin_log").delete().eq("actor", STAFF);
    await sb.from("attempts").delete().gte("at", STARTED);
  },
};
const hadProducts = Object.keys(await S.products()).length > 0;
if (hadProducts && sb) {
  console.log("Supabase already has products; this run adds and removes only its own test product.");
}

const log = [];
const check = (name, ok, detail = "") => log.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
const page = await launch({ profile: "cdp-products", port: 9351 });
await page.viewport(1280, 900);
const waitFor = async (js, ms = 12000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if (await page.eval(`!!(${js})`)) return true; } catch {}
    await page.sleep(200);
  }
  return false;
};
const bodyHas = (s) => `document.body.textContent.toLowerCase().includes(${JSON.stringify(s.toLowerCase())})`;
const clickText = async (t) => {
  await page.eval(`[...document.querySelectorAll("button, a")].find(b => b.textContent.trim().startsWith(${JSON.stringify(t)}))?.setAttribute("data-t", "1")`);
  await page.click('[data-t="1"]');
  await page.eval(`document.querySelector('[data-t="1"]')?.removeAttribute("data-t")`);
};
const fill = async (name, value) => {
  await page.eval(`(() => { const el = document.querySelector('[name="${name}"]'); el.value = ""; el.dispatchEvent(new Event("input", { bubbles: true })); })()`);
  await page.type(`[name="${name}"]`, value);
};
// Confirm dialogs answer yes, on every page — a real dialog would block the page and hang the run.
await page.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.confirm = () => true;" });

try {
  await page.goto("/account", 2500);
  const su = `section[aria-labelledby="sign-up-heading"]`;
  await page.type(`${su} input[name="name"]`, "Sam Staff");
  await page.type(`${su} input[name="email"]`, STAFF);
  await page.type(`${su} input[name="password"]`, "staff passphrase long");
  await page.click(`${su} input[name="terms"]`);
  await page.click(`${su} button[type="submit"]`);
  check("staff signs up", await waitFor(`document.querySelector("h1")?.textContent === "Sam Staff"`, 15000));

  await page.goto("/admin", 3000);
  check("the staff page links to products", await page.eval(`!!document.querySelector('a[href="/admin/products"]')`));

  await page.goto("/admin/products", 3000);
  if (!hadProducts) {
    check("an empty store offers the one-time import", await page.eval(bodyHas("First, copy the catalogue in")));
    await clickText("Copy the 26 products in");
    check("importing copies all 26 and says so", await waitFor(bodyHas("26 products copied into the store"), 15000));
  }
  await page.goto("/admin/products", 3000);
  check("the list shows the catalogue", (await page.eval(`document.querySelectorAll("tbody tr").length`)) >= 26);
  const imported = await S.products();
  check("imported products keep their facts", imported["ghk-cu"]?.salt === "Acetate, copper complex" && imported["bpc-157"]?.sequence === "GEPPPGKPADDAGLV");

  /* ── Add ── */
  await page.goto("/admin/products/new", 3000);
  await fill("name", "Test Peptide Alpha");
  check("the web address follows the name", (await page.eval(`document.querySelector('[name="slug"]').value`)) === TEST);
  await fill("formula", "C2H5NO2");
  await fill("mass", "80");
  check("the form works out the formula's mass", await page.eval(bodyHas("The formula weighs 75.07 Da")));
  await fill("note", "Glycine, standing in as a test product.");
  await fill("price", "20");
  await fill("fill", "5 mg");
  await page.eval(`document.querySelector('[name="expected"]').value = "2026-12-01"`);
  await clickText("Add the product");
  check("a mass that does not match the formula is refused", await waitFor(bodyHas("That formula weighs 75.07 Da on average, not 80.00")));
  // React resets the form after the action, so it is filled again.
  await page.goto("/admin/products/new", 3000);
  for (const [n, v] of [["name", "Test Peptide Alpha"], ["formula", "C2H5NO2"], ["mass", "75.07"], ["note", "Glycine, standing in as a test product."], ["price", "20"], ["fill", "5 mg"]]) await fill(n, v);
  await page.eval(`document.querySelector('[name="expected"]').value = "2026-12-01"`);
  await clickText("Add the product");
  check("adding lands on the new product", await waitFor(bodyHas("Added as Coming soon"), 15000));
  const added = (await S.products())[TEST];
  check("stored as Coming soon at the end of the order", added?.stock === "upcoming" && Number(added.price) === 20 && added.expected?.slice(0, 10) === "2026-12-01", JSON.stringify(added ?? {}).slice(0, 140));

  await page.goto("/admin/products/new", 3000);
  for (const [n, v] of [["name", "Test Peptide Alpha"], ["formula", "C2H5NO2"], ["mass", "75.07"], ["note", "Again."], ["price", "20"], ["fill", "5 mg"]]) await fill(n, v);
  await page.eval(`document.querySelector('[name="expected"]').value = "2026-12-01"`);
  await clickText("Add the product");
  check("a second product at the same address is refused", await waitFor(bodyHas("There is already a product at /catalog/test-peptide-alpha")));

  /* ── Photos ── */
  await page.goto(`/admin/products/${TEST}`, 3000);
  await clickText("Upload the photo");
  check("a photo without a description is refused", await waitFor(bodyHas("Describe the image for people who cannot see it")));
  await page.goto(`/admin/products/${TEST}`, 3000);
  await page.upload("#product-image", [IMG1]);
  await fill("alt", "Test vial, label facing");
  await clickText("Upload the photo");
  check("a photo uploads", await waitFor(bodyHas("Image added")));
  await page.goto(`/admin/products/${TEST}`, 3000);
  await page.upload("#product-image", [IMG2]);
  await fill("alt", "Test vial, from above");
  await clickText("Upload the photo");
  await waitFor(bodyHas("Image added"));
  let imgs = (await S.products())[TEST].images;
  check("two photos stored, in order", imgs.length === 2 && imgs[0].alt === "Test vial, label facing");
  const served = await page.eval(`fetch("/api/product-image/${TEST}/${imgs[1].id}?v=${imgs[1].version}").then(r => ({ status: r.status, type: r.headers.get("content-type"), cache: r.headers.get("cache-control") }))`);
  check("the photo is served as an image, cacheable", served.status === 200 && served.type === "image/png" && /immutable/.test(served.cache ?? ""), JSON.stringify(served));
  check("an unknown photo is not found", (await page.eval(`fetch("/api/product-image/${TEST}/0123456789abcdef").then(r => r.status)`)) === 404);

  await page.goto(`/admin/products/${TEST}`, 3000);
  await clickText("Make main");
  await page.sleep(2500);
  imgs = (await S.products())[TEST].images;
  check("make main moves the photo first", imgs[0].alt === "Test vial, from above");
  await page.goto(`/admin/products/${TEST}`, 3000);
  await page.eval(`(() => { const el = document.querySelectorAll('[name="alt-edit"]')[1]; el.focus(); el.select(); })()`);
  await page.send("Input.insertText", { text: "Test vial, label facing the camera" });
  await page.sleep(300);
  await page.eval(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Save").click()`);
  await page.sleep(2500);
  imgs = (await S.products())[TEST].images;
  check("a description can be edited", imgs[1].alt === "Test vial, label facing the camera");
  await page.goto(`/admin/products/${TEST}`, 3000);
  await page.eval(`[...document.querySelectorAll("button")].filter(b => b.textContent.startsWith("Remove") && b.textContent.includes("image"))[1].click()`);
  await page.sleep(2500);
  imgs = (await S.products())[TEST].images;
  check("a photo can be removed", imgs.length === 1 && imgs[0].alt === "Test vial, from above");

  /* ── Edit, order, remove, restore ── */
  await page.goto(`/admin/products/${TEST}`, 3000);
  check("the web address is fixed once saved", await page.eval(`document.querySelector('[name="slug"]').readOnly`));
  await fill("note", "Glycine, edited.");
  await clickText("Save and publish");
  check("details save", await waitFor(bodyHas("Saved. It goes live on the next deploy")));
  check("the edit is stored", (await S.products())[TEST].note === "Glycine, edited.");

  const before = (await S.products())[TEST].position;
  await page.goto("/admin/products", 3000);
  await page.click(`button[aria-label="Move Test Peptide Alpha up"]`);
  await page.sleep(2500);
  check("moving up changes the order", (await S.products())[TEST].position === before - 1);

  await page.goto(`/admin/products/${TEST}`, 3000);
  await clickText("Remove from the site");
  check("removing from the site", await waitFor(bodyHas("Removed from the site; its record stays")));
  check("stored as archived", (await S.products())[TEST].archived === true);
  await page.goto(`/admin/products/${TEST}`, 3000);
  await clickText("Put it back in the catalogue");
  check("putting it back", await waitFor(bodyHas("Back in the catalogue")));

  /* ── A product in an order cannot be deleted ── */
  await page.eval(`fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "add", slug: "kpv", plan: "once", quantity: 1 }) })`);
  await page.goto("/cart", 3000);
  for (const [f, v] of [["recipient", "Sam Staff"], ["line1", "40 Assay Court"], ["city", "Cambridge"], ["region", "Massachusetts"], ["postal", "02139"]]) await page.type(`input[name="address.${f}"]`, v);
  await page.click('input[name="attest"]');
  await clickText("Place order");
  await waitFor(bodyHas("Order recorded"), 15000);
  await page.goto("/admin/products/kpv", 3000);
  check("a product in an order offers no permanent delete", await page.eval(bodyHas("Orders or stories refer to it, so it can be removed but not deleted")) && !(await page.eval(bodyHas("Delete permanently"))));

  /* ── Delete ── */
  await page.goto(`/admin/products/${TEST}`, 3000);
  await clickText("Delete permanently");
  check("deleting returns to the list with a notice", await waitFor(bodyHas("Test Peptide Alpha was deleted"), 15000));
  check("the product is gone from the store", !(await S.products())[TEST]);
  check("its photos are gone", (await page.eval(`fetch("/api/product-image/${TEST}/${imgs[0].id}").then(r => r.status)`)) === 404);

  check("no page or console errors", page.errors.length === 0, page.errors.slice(0, 3).join(" // "));
} finally {
  await page.close();
  await S.cleanup(hadProducts);
  console.log(log.join("\n"));
}
