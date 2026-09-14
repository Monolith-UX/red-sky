// Full-page screenshots for design review, at desktop and phone width, with a signed-in
// account holding a cart, an order and a standing order so the personal pages are not empty.
// Run: BASE_URL=http://localhost:PORT node scripts/verify/shots.mjs
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { launch } from "./cdp.mjs";

const SCRATCH = fileURLToPath(new URL("./out", import.meta.url));
rmSync(`${SCRATCH}/cdp-shots`, { recursive: true, force: true });

const page = await launch({ profile: "cdp-shots", port: 9338 });
await page.viewport(1280, 900);
const find = (t) => `[...document.querySelectorAll("button, a")].find(b => b.textContent.trim().startsWith(${JSON.stringify(t)}))`;
const clickText = async (t) => {
  await page.eval(`${find(t)}?.setAttribute("data-shot", "1")`);
  await page.click('[data-shot="1"]');
  await page.eval(`document.querySelector('[data-shot="1"]')?.removeAttribute("data-shot")`);
};

// An account with an order (one-time and monthly) and a second stack in the cart.
await page.goto("/account", 2500);
const su = `section[aria-labelledby="sign-up-heading"]`;
await page.type(`${su} input[name="name"]`, "Marcus Bell");
await page.type(`${su} input[name="email"]`, `shots+${Date.now()}@lab.org`);
await page.type(`${su} input[name="password"]`, "the column never lies");
await page.click(`${su} input[name="terms"]`);
await page.click(`${su} button[type="submit"]`);
await page.sleep(3000);

for (let round = 0; round < 2; round++) {
  await page.goto("/", 2500);
  await page.click('button[aria-label^="Show slide 4"]');
  await page.sleep(900);
  await clickText("Add the stack");
  await page.sleep(1200);
  if (round === 1) break;
  await page.goto("/cart", 3000);
  for (const [field, value] of [["recipient", "Marcus Bell"], ["line1", "1 Lab Way"], ["city", "Boston"], ["region", "Massachusetts"], ["postal", "02115"]]) {
    await page.type(`input[name="address.${field}"]`, value);
  }
  await page.eval(`[...document.querySelectorAll("li")].find(li => li.textContent.includes("BPC-157") && li.querySelector("fieldset"))?.querySelector("label:nth-of-type(2)")?.click()`);
  await page.sleep(800);
  await page.click('input[name="attest"]');
  await clickText("Place order");
  await page.sleep(3000);
}

const PAGES = ["/about", "/testing", "/handling", "/certificates", "/stories", "/cart", "/account"];
for (const [w, h, mobile] of [[1280, 900, false], [390, 844, true]]) {
  await page.viewport(w, h, mobile);
  for (const path of PAGES) {
    await page.goto(path, 2200);
    await page.shot(`review-${w}${path.replace("/", "-")}`, { full: true });
  }
}
console.log(page.errors.length ? page.errors.join("\n") : "no console errors");
await page.close();
