// Profile photos against Supabase Storage. Run against a server using Supabase:
//   BASE_URL=http://localhost:PORT node scripts/verify/avatar-supabase.mjs
// It signs up a throwaway account, and deletes it (and anything it left) at the end.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { launch } from "./cdp.mjs";

process.loadEnvFile(fileURLToPath(new URL("../../.env.local", import.meta.url)));
const sb = createClient(process.env.SUPABASE_URL.replace(/\/(rest\/v1\/?)?$/, ""), process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const OUT = fileURLToPath(new URL("./out", import.meta.url));
const IMG = `${OUT}/avatar-test.png`;
const IMG2 = `${OUT}/avatar-test-2.png`;
writeFileSync(IMG, await sharp({ create: { width: 600, height: 400, channels: 3, background: "#BC002D" } }).png().toBuffer());
writeFileSync(IMG2, await sharp({ create: { width: 300, height: 300, channels: 3, background: "#14161A" } }).png().toBuffer());

const STARTED = new Date().toISOString();
const log = [];
const check = (name, ok, detail = "") => log.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
const email = `photo-check+${Date.now()}@lab.org`;
const password = "photo check passphrase";
const page = await launch({ profile: "cdp-avatar", port: 9349 });
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
const objects = async (id) => ((await sb.storage.from("avatars").list()).data ?? []).filter((o) => o.name.startsWith(id)).map((o) => o.name);

try {
  await page.goto("/account", 2500);
  const su = `section[aria-labelledby="sign-up-heading"]`;
  await page.type(`${su} input[name="name"]`, "Photo Check");
  await page.type(`${su} input[name="email"]`, email);
  await page.type(`${su} input[name="password"]`, password);
  await page.click(`${su} input[name="terms"]`);
  await page.click(`${su} button[type="submit"]`);
  check("signs up on Supabase", await waitFor(`document.querySelector("h1")?.textContent === "Photo Check"`, 15000));
  const id = (await sb.from("users").select("id").eq("email", email).single()).data?.id;

  await page.upload('input[type="file"][accept^="image/"]', [IMG]);
  check("upload reports success", await waitFor(bodyHas("Photo updated")));
  const profile = (await sb.from("profiles").select("avatar_type, avatar_version").eq("owner", id).single()).data;
  const first = await objects(id);
  check("the profile records the photo", !!profile?.avatar_type && !!profile.avatar_version, JSON.stringify(profile));
  check("one object in the private avatars bucket", first.length === 1, first.join(", "));

  const mine = await page.eval(`fetch("/api/account/avatar").then(async r => ({ status: r.status, type: r.headers.get("content-type"), csp: r.headers.get("content-security-policy"), bytes: (await r.arrayBuffer()).byteLength }))`);
  check("the owner is served the photo", mine.status === 200 && /^image\/(webp|jpeg|png)$/.test(mine.type) && mine.bytes > 100 && mine.csp === "default-src 'none'", JSON.stringify(mine));
  const stranger = await page.eval(`fetch("/api/account/avatar", { credentials: "omit" }).then(r => r.status)`);
  check("a visitor without the session gets nothing", stranger === 404, `status ${stranger}`);
  const direct = await fetch(`${process.env.SUPABASE_URL.replace(/\/(rest\/v1\/?)?$/, "")}/storage/v1/object/public/avatars/${first[0]}`);
  check("the bucket is not publicly readable", direct.status >= 400, `status ${direct.status}`);

  await page.goto("/account", 2500);
  await page.upload('input[type="file"][accept^="image/"]', [IMG2]);
  check("changing the photo reports success", await waitFor(bodyHas("Photo updated")));
  const second = await objects(id);
  check("changing it leaves one object", second.length === 1, second.join(", "));

  await page.goto("/account", 2500);
  await page.eval(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Remove photo")?.click()`);
  check("removing reports success", await waitFor(bodyHas("Photo removed")));
  const removed = (await sb.from("profiles").select("avatar_type").eq("owner", id).single()).data;
  check("removing deletes the object and clears the profile", (await objects(id)).length === 0 && removed?.avatar_type === null);

  await page.goto("/account", 2500);
  await page.upload('input[type="file"][accept^="image/"]', [IMG]);
  await waitFor(bodyHas("Photo updated"));
  await page.goto("/account", 2500);
  await page.click("#data summary");
  await page.type('#data input[name="password"]', password);
  await page.click('#data input[name="confirm"]');
  await page.eval(`document.querySelector('#data button[type="submit"]').click()`);
  check("closing the account", await waitFor(bodyHas("The account is closed"), 15000));
  check("closing deletes the photo too", (await objects(id)).length === 0);
  check("no page or console errors", page.errors.length === 0, page.errors.slice(0, 3).join(" // "));
} finally {
  // Whatever happened above, leave nothing behind.
  const users = (await sb.from("users").select("id").like("email", "photo-check+%@lab.org")).data ?? [];
  for (const { id } of users) {
    for (const t of ["favorites", "waitlist", "profiles", "carts", "placed_orders", "standing_orders", "retained"]) await sb.from(t).delete().eq("owner", id);
    await sb.from("users").delete().eq("id", id);
    const left = await objects(id);
    if (left.length) await sb.storage.from("avatars").remove(left);
  }
  // Some attempt keys carry the account id rather than the address, so clear by time.
  await sb.from("attempts").delete().gte("at", STARTED);
  await page.close();
  console.log(log.join("\n"));
}
