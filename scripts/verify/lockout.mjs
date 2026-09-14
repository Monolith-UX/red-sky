// Proves the publishable (public) key can reach nothing: every table and view refuses to
// read, write or delete, every function refuses to run, and both buckets refuse to list,
// download or upload. Canary rows and files are planted with the secret key first, so an
// empty answer cannot pass for a locked door, and are removed afterwards.
// Needs SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_PUBLISHABLE_KEY in .env.local.
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(fileURLToPath(new URL("../../.env.local", import.meta.url)));
const url = process.env.SUPABASE_URL.trim().replace(/\/(rest\/v1\/?)?$/, "");
const opts = { auth: { persistSession: false } };
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY.trim(), opts);
const pub = createClient(url, process.env.SUPABASE_PUBLISHABLE_KEY.trim(), opts);

const log = [];
const check = (name, ok, detail = "") => log.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
const denied = (res) => !!res.error || (Array.isArray(res.data) && res.data.length === 0) || res.data === null;
const why = (res) => res.error?.message ?? `data ${JSON.stringify(res.data)?.slice(0, 60)}`;

const CANARY = "lockout-canary";
const owner = crypto.randomUUID();
const now = new Date().toISOString();

// Canaries, planted with the secret key.
const plant = [
  admin.from("subscribers").insert({ email: `${CANARY}@lab.org` }),
  admin.from("messages").insert({ ref: CANARY, received: now, topic: "other", name: CANARY, email: `${CANARY}@lab.org`, message: "canary" }),
  admin.from("profiles").insert({ owner, name: CANARY }),
  admin.from("favorites").insert({ slug: CANARY, owner }),
  admin.from("admin_log").insert({ actor: CANARY, action: "canary" }),
  admin.from("attempts").insert({ key: CANARY }),
  admin.storage.from("avatars").upload(`${CANARY}.png`, new Uint8Array([137, 80, 78, 71]), { contentType: "image/png", upsert: true }),
  admin.storage.from("certificates").upload(`${CANARY}.pdf`, new TextEncoder().encode("%PDF-1.4 canary"), { contentType: "application/pdf", upsert: true }),
];
const planted = await Promise.all(plant);
check("canaries planted with the secret key", planted.every((r) => !r.error), planted.filter((r) => r.error).map(why).join(" | "));

try {
  const tables = ["users", "sessions", "profiles", "favorites", "waitlist", "carts", "placed_orders", "standing_orders", "retained", "messages", "stories", "subscribers", "attempts", "lots", "admin_log"];
  for (const t of tables) {
    const read = await pub.from(t).select("*").limit(5);
    check(`${t}: public key cannot read`, denied(read), why(read));
  }
  for (const v of ["favorite_counts", "waitlist_counts"]) {
    const read = await pub.from(v).select("*");
    check(`${v}: public key cannot read`, denied(read), why(read));
  }

  const writes = [
    ["users", () => pub.from("users").insert({ id: crypto.randomUUID(), email: `${CANARY}-pub@lab.org`, password_hash: "x" })],
    ["stories", () => pub.from("stories").insert({ id: `${CANARY}-pub`, received: now, status: "published", email: "x@lab.org", name: "x", title: "x", story: "x" })],
    ["lots", () => pub.from("lots").insert({ slug: `${CANARY}-pub`, stock: "upcoming", price: 1, fill: "1 mg", expected: "2027-01-01", updated_by: "x" })],
    ["subscribers (update)", () => pub.from("subscribers").update({ email: "hijacked@lab.org" }).eq("email", `${CANARY}@lab.org`).select()],
    ["messages (delete)", () => pub.from("messages").delete().eq("ref", CANARY).select()],
  ];
  for (const [name, run] of writes) {
    const res = await run();
    check(`${name}: public key cannot write`, denied(res), why(res));
  }

  const rpcs = [
    ["merge_owner", { p_from: owner, p_into: crypto.randomUUID() }],
    ["place_order", { p_owner: owner, p_order: {}, p_standing: [] }],
    ["close_account", { p_user: owner }],
    ["allow_attempt", { p_key: CANARY, p_limit: 5, p_window_ms: 1000 }],
    ["record_shipment", { p_owner: owner, p_order: {}, p_advance: [] }],
  ];
  for (const [fn, args] of rpcs) {
    const res = await pub.rpc(fn, args);
    check(`${fn}(): public key cannot run it`, !!res.error, why(res));
  }

  // Uploads use each bucket's allowed type, so a refusal is about permission, not the file.
  const allowed = { avatars: ["png", "image/png", new Uint8Array([137, 80, 78, 71])], certificates: ["pdf", "application/pdf", new TextEncoder().encode("%PDF-1.4 x")] };
  for (const [bucket, file] of [["avatars", `${CANARY}.png`], ["certificates", `${CANARY}.pdf`]]) {
    const list = await pub.storage.from(bucket).list();
    check(`${bucket}: public key cannot list`, denied(list), why(list));
    const dl = await pub.storage.from(bucket).download(file);
    check(`${bucket}: public key cannot download`, !!dl.error || !dl.data, dl.error?.message ?? "got data");
    const [ext, type, bytes] = allowed[bucket];
    const up = await pub.storage.from(bucket).upload(`${CANARY}-pub.${ext}`, bytes, { contentType: type });
    check(`${bucket}: public key cannot upload`, !!up.error && !/mime type/i.test(up.error.message), up.error?.message ?? "uploaded");
    const open = await fetch(`${url}/storage/v1/object/public/${bucket}/${file}`);
    check(`${bucket}: no public URL`, open.status >= 400, `status ${open.status}`);
  }

  // The canaries are still intact: nothing the public key tried changed them.
  const sub = await admin.from("subscribers").select("email").eq("email", `${CANARY}@lab.org`);
  const msg = await admin.from("messages").select("ref").eq("ref", CANARY);
  check("canaries unchanged afterwards", sub.data?.length === 1 && msg.data?.length === 1);
} finally {
  await Promise.all([
    admin.from("subscribers").delete().like("email", `${CANARY}%`),
    admin.from("messages").delete().like("ref", `${CANARY}%`),
    admin.from("profiles").delete().eq("owner", owner),
    admin.from("favorites").delete().eq("owner", owner),
    admin.from("admin_log").delete().eq("actor", CANARY),
    admin.from("attempts").delete().like("key", `${CANARY}%`),
    admin.from("users").delete().like("email", `${CANARY}%`),
    admin.from("stories").delete().like("id", `${CANARY}%`),
    admin.from("lots").delete().like("slug", `${CANARY}%`),
    admin.storage.from("avatars").remove([`${CANARY}.png`, `${CANARY}-pub.png`]),
    admin.storage.from("certificates").remove([`${CANARY}.pdf`, `${CANARY}-pub.pdf`]),
  ]);
  console.log(log.join("\n"));
}
