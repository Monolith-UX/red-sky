import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AddressBlock } from "@/components/account/address-block";
import { RecordShipment } from "@/components/admin/record-shipment";
import { ResetPassword } from "@/components/admin/reset-password";
import { StaffOnly } from "@/components/admin/staff-only";
import { SectionHeader } from "@/components/section-header";
import { TocAside } from "@/components/toc-aside";
import { dayLabel, dispatchDate, todayIso } from "@/lib/account";
import { STOCK_LABEL, builtLots, money, nameOf } from "@/lib/catalog";
import { TOPICS } from "@/lib/contact";
import { staffTime } from "@/lib/lots";
import { shipmentsDue } from "@/lib/shipments";
import { audit, currentAdmin, liveProducts } from "@/lib/server/admin";
import { currentUser } from "@/lib/server/auth";
import {
  adminLog,
  allMessages,
  allPlacedOrders,
  allStandingOrders,
  getLots,
  storeName,
  storiesWith,
} from "@/lib/server/store";

export const metadata: Metadata = {
  title: "Staff — Red Sky",
  robots: { index: false, follow: false },
};

const when = staffTime;

/** A log entry's detail as "slug bpc-157 · lot RS-2604-C", readable and wrappable. */
const describe = (detail: Record<string, unknown>) =>
  Object.entries(detail)
    .map(([k, v]) => `${k} ${String(v)}`)
    .join(" · ");

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ recorded?: string | string[] }> }) {
  const { recorded } = await searchParams;
  if (!(await currentUser())) redirect("/account?next=/admin");
  const admin = await currentAdmin();
  if (!admin) return <StaffOnly />;

  const [lots, orders, standing, messages, stories, log] = await Promise.all([
    getLots(),
    allPlacedOrders(50),
    allStandingOrders(),
    allMessages(50),
    storiesWith("pending", "flagged"),
    adminLog(200),
  ]);
  const products = await liveProducts();
  // Viewing orders and messages is access to personal data, and the privacy policy says it is logged.
  await audit(admin.email, "view", { page: "admin" });

  // Visits are logged but not listed: thirty "view" lines would bury the changes.
  const changes = log.filter((e) => e.action !== "view").slice(0, 30);
  const activeStanding = standing.filter((s) => s.status === "active");
  const today = todayIso();
  const until = new Date(Date.parse(today + "T00:00:00Z") + 7 * 86400000).toISOString().slice(0, 10);
  const due = shipmentsDue(standing, until);
  // Set by recordShipmentAction's redirect; looked up, so a hand-typed reference shows nothing.
  const justRecorded = typeof recorded === "string" ? orders.find((o) => o.order.ref === recorded) : undefined;
  const waiting = Object.values(lots).filter((l) => builtLots[l.slug]?.updated !== l.updated).length;
  const hook = !!process.env.NETLIFY_BUILD_HOOK;

  return (
    <>
      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-12 pt-12 md:pb-16 md:pt-16">
          <div className="grid12 gap-y-10">
            <div className="col-span-12 lg:col-span-7">
              <p className="rail-label">Staff — {admin.email}</p>
              <h1 className="t-display mt-7 max-w-[14ch] md:mt-9">The back of the shop.</h1>
              <p className="t-lead mt-7 max-w-[54ch]">
                Lots and certificates, orders to pack, messages to answer. Every visit and change here
                is logged.
              </p>
              <nav aria-label="Staff pages" className="mt-8 flex flex-wrap gap-x-4 gap-y-3">
                <Link href="/admin/products" className="btn btn-ghost">
                  Products and photos
                </Link>
                <Link href="/stories/review" className="btn btn-ghost">
                  Story review
                </Link>
              </nav>
            </div>
            <dl className="col-span-12 self-end lg:col-span-4 lg:col-start-9">
              {[
                ["Saved lots", `${Object.keys(lots).length} of ${products.length}`],
                ["Waiting to go live", String(waiting)],
                ["Orders shown", String(orders.length)],
                ["Active standing orders", String(activeStanding.length)],
                ["Stories to review", String(stories.length)],
                ["Store", storeName],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex items-baseline justify-between gap-4 border-b border-hairline py-3 ${i === 0 ? "border-t border-t-ink" : ""}`}
                >
                  <dt className="t-label text-graphite">{k}</dt>
                  <dd className="t-data text-[1rem] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="shell py-14 md:py-20">
        <div className="grid12 gap-y-14">
          <div className="col-span-12 min-w-0 space-y-20 md:space-y-24 lg:col-span-9">
            {/* ── Lots ─────────────────────────────────────────────── */}
            <section id="lots" aria-labelledby="lots-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Lots — what the catalogue shows"
                heading="Every sequence and its current lot."
                headingId="lots-heading"
                note={
                  hook
                    ? "Saving a lot rebuilds the site; it is live about three minutes later."
                    : "NETLIFY_BUILD_HOOK is not set, so a saved lot goes live on the next deploy."
                }
              />
              {/* relative: the visually-hidden labels are absolute, and would otherwise
                  escape the scroller and widen the page on a phone. */}
              <div className="relative mt-10 overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-left text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-ink">
                      {["Sequence", "Lot", "Purity", "Stock", "Price", "Source", ""].map((h) => (
                        <th key={h} scope="col" className="t-label py-2.5 pr-4 font-normal text-graphite">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((seed) => {
                      const row = lots[seed.slug];
                      const shown = row ?? seed;
                      const live = row && builtLots[seed.slug]?.updated === row.updated;
                      return (
                        <tr key={seed.slug} className="border-b border-hairline">
                          <th scope="row" className="py-3 pr-4 font-medium">
                            {/* The name edits too, so a phone need not scroll to the last column. */}
                            <Link href={`/admin/lots/${seed.slug}`} className="no-underline hover:text-sun">
                              {seed.name}
                            </Link>
                          </th>
                          <td className="t-data py-3 pr-4 text-[0.8125rem]">{shown.lot ?? "—"}</td>
                          <td className="t-data py-3 pr-4 text-[0.8125rem]">
                            {shown.purity !== null ? `${shown.purity.toFixed(2)}%` : "—"}
                          </td>
                          <td className="py-3 pr-4">{STOCK_LABEL[shown.stock]}</td>
                          <td className="t-data py-3 pr-4 text-[0.8125rem]">{money(shown.price)}</td>
                          <td className="py-3 pr-4 text-[0.8125rem] leading-snug">
                            {row ? (
                              <>
                                {row.sample ? "Saved, marked sample" : "Saved"}
                                <span className="block text-graphite">
                                  {live ? "Live" : "Waiting for rebuild"} · {when(row.updated)}
                                </span>
                              </>
                            ) : (
                              <span className="text-graphite">Sample, in code</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <Link href={`/admin/lots/${seed.slug}`} className="text-[0.8125rem] decoration-sun underline-offset-4">
                              Edit<span className="visually-hidden"> {seed.name}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Orders ───────────────────────────────────────────── */}
            <section id="orders" aria-labelledby="orders-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Orders — newest first"
                heading="What has been ordered."
                headingId="orders-heading"
                note="Payment is not connected yet: nothing here has been charged."
              />
              {orders.length === 0 ? (
                <p className="mt-10 border-y border-hairline py-8 text-[0.9375rem] text-graphite">No orders yet.</p>
              ) : (
                <ul role="list" className="mt-10 border-t border-ink">
                  {orders.map(({ order, email, closed }) => (
                    <li key={order.ref} className="grid gap-x-6 gap-y-3 border-b border-hairline py-6 md:grid-cols-[12rem_minmax(0,1fr)_14rem]">
                      <div>
                        <p className="t-data text-[0.875rem] font-medium">{order.ref}</p>
                        {order.source === "standing" && <p className="t-label mt-1 text-graphite">Monthly shipment</p>}
                        <p className="t-data mt-1 text-[0.75rem] text-graphite">{when(order.placed)}</p>
                        <p className="mt-2 break-all text-[0.8125rem]">
                          {email ?? "unknown"}
                          {closed && <span className="block text-graphite">account closed</span>}
                        </p>
                      </div>
                      <div className="text-[0.9375rem] leading-relaxed">
                        {order.lines.map((l) => (
                          <p key={`${l.slug}-${l.plan}`}>
                            <span className="t-label mr-2 text-graphite">{l.plan === "monthly" ? "Monthly" : "Once"}</span>
                            {l.quantity} × {nameOf(l.slug)}
                          </p>
                        ))}
                        {order.weekday && (
                          <p className="mt-1 text-[0.8125rem] text-graphite">Monthly lines ship on the first {dayLabel(order.weekday)}</p>
                        )}
                        {order.totals && (
                          <p className="t-data mt-2 text-[0.8125rem]">
                            {money(order.totals.today)} due
                            {order.totals.saving > 0 && ` · ${money(order.totals.saving)} stack saving`}
                          </p>
                        )}
                      </div>
                      <div className="text-[0.8125rem] text-graphite">
                        {order.address ? <AddressBlock address={order.address} /> : "No address recorded"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Due to ship ──────────────────────────────────────── */}
            <section id="due" aria-labelledby="due-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Due to ship — the next seven days"
                heading="This week's shipments."
                headingId="due-heading"
                note="Pack each one, then record it: that writes the order to the customer's history and moves each standing order to next month. No card is charged yet."
              />
              {justRecorded && (
                <p role="status" className="mt-8 flex items-start gap-2.5 border-l-2 border-ink pl-4 text-[0.9375rem]">
                  Recorded {justRecorded.order.ref} for {justRecorded.email ?? "the account"}:{" "}
                  {money(justRecorded.order.totals?.today ?? 0)} unpaid. Each of its standing orders moved to next
                  month, and it is listed under Orders.
                </p>
              )}
              {due.length === 0 ? (
                <p className="mt-10 border-y border-hairline py-8 text-[0.9375rem] text-graphite">
                  Nothing due before {dispatchDate(until)}.
                </p>
              ) : (
                <ul role="list" className="mt-10 border-t border-ink">
                  {due.map((s) => (
                    <li key={s.key} className="grid gap-x-6 gap-y-4 border-b border-hairline py-6 md:grid-cols-[12rem_minmax(0,1fr)_13rem]">
                      <div>
                        <p className="t-data text-[0.875rem] font-medium">{dispatchDate(s.date)}</p>
                        {s.date < today && <p className="t-label mt-1 text-sun">Overdue</p>}
                        <p className="mt-2 break-all text-[0.8125rem]">{s.email ?? "unknown"}</p>
                      </div>
                      <div className="text-[0.9375rem] leading-relaxed">
                        {s.ships.map((o) => (
                          <p key={o.id}>
                            {o.quantity} × {nameOf(o.slug)}
                          </p>
                        ))}
                        {s.waiting.map((o) => (
                          <p key={o.id} className="text-graphite">
                            {o.quantity} × {nameOf(o.slug)} — waits for stock
                          </p>
                        ))}
                        {s.ships.length > 0 && (
                          <p className="t-data mt-2 text-[0.8125rem]">
                            {money(s.total)}
                            {s.saving > 0 && ` · ${money(s.saving)} stack saving`}
                          </p>
                        )}
                        <div className="mt-3 text-[0.8125rem] text-graphite">
                          {s.address ? <AddressBlock address={s.address} /> : "No address on this standing order"}
                        </div>
                      </div>
                      <div>
                        {s.ships.length > 0 && s.address ? (
                          <RecordShipment owner={s.owner} date={s.date} label={`${s.email ?? "unknown"}, ${dispatchDate(s.date)}`} />
                        ) : (
                          <p className="text-[0.8125rem] text-graphite">
                            {s.address ? "Nothing here can ship today." : "Needs an address before it can ship."}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Standing orders ──────────────────────────────────── */}
            <section id="standing" aria-labelledby="standing-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Standing orders — by next dispatch"
                heading="Every standing order."
                headingId="standing-heading"
                note="Nothing dispatches automatically yet; these are the dates customers were given."
              />
              {standing.length === 0 ? (
                <p className="mt-10 border-y border-hairline py-8 text-[0.9375rem] text-graphite">No standing orders.</p>
              ) : (
                <div className="relative mt-10 overflow-x-auto">
                  <table className="w-full min-w-[40rem] border-collapse text-left text-[0.875rem]">
                    <thead>
                      <tr className="border-b border-ink">
                        {["Next dispatch", "Sequence", "Vials", "Status", "Account"].map((h) => (
                          <th key={h} scope="col" className="t-label py-2.5 pr-4 font-normal text-graphite">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {standing.map((s) => (
                        <tr key={s.id} className="border-b border-hairline">
                          <td className="t-data py-3 pr-4 text-[0.8125rem]">{s.status === "active" ? dispatchDate(s.nextDispatch) : "—"}</td>
                          <td className="py-3 pr-4">{nameOf(s.slug)}</td>
                          <td className="t-data py-3 pr-4 text-[0.8125rem]">{s.quantity}</td>
                          <td className="py-3 pr-4">{s.status === "active" ? "Active" : "Paused"}</td>
                          <td className="break-all py-3 text-[0.8125rem]">{s.email ?? "unknown"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── Messages ─────────────────────────────────────────── */}
            <section id="messages" aria-labelledby="messages-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Messages — from the contact form"
                heading="Waiting for an answer."
                headingId="messages-heading"
                note="Reply from your own email client; the address is the one they gave."
              />
              {messages.length === 0 ? (
                <p className="mt-10 border-y border-hairline py-8 text-[0.9375rem] text-graphite">No messages.</p>
              ) : (
                <ul role="list" className="mt-10 border-t border-ink">
                  {messages.map((m) => (
                    <li key={m.ref} className="grid gap-x-6 gap-y-3 border-b border-hairline py-6 md:grid-cols-[12rem_minmax(0,1fr)]">
                      <div>
                        <p className="t-data text-[0.875rem] font-medium">{m.ref}</p>
                        <p className="t-data mt-1 text-[0.75rem] text-graphite">{when(m.received)}</p>
                        <p className="t-label mt-2 text-graphite">{TOPICS.find((t) => t.value === m.topic)?.label ?? m.topic}</p>
                      </div>
                      <div>
                        <p className="text-[0.9375rem]">
                          <span className="font-medium">{m.name}</span>
                          {m.organisation && <span className="text-graphite"> · {m.organisation}</span>}
                          {" · "}
                          <a
                            href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.ref}`)}`}
                            className="break-all decoration-sun underline-offset-4"
                          >
                            {m.email}
                          </a>
                          {m.lot && <span className="t-data text-[0.8125rem] text-graphite"> · lot {m.lot}</span>}
                        </p>
                        <p className="mt-2 max-w-[68ch] whitespace-pre-line text-[0.9375rem] leading-relaxed">{m.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Accounts ─────────────────────────────────────────── */}
            <section id="accounts" aria-labelledby="accounts-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Accounts — forgotten passwords"
                heading="Reset a password by hand."
                headingId="accounts-heading"
                note="Until email is connected, a customer who has forgotten their password writes in, and staff reset it here."
              />
              <div className="mt-10">
                <ResetPassword />
              </div>
              <p className="mt-8 text-[0.9375rem]">
                Client stories waiting: {stories.length}.{" "}
                <Link href="/stories/review" className="decoration-sun underline-offset-4">
                  Open the review queue
                </Link>
              </p>
            </section>

            {/* ── Log ──────────────────────────────────────────────── */}
            <section id="log" aria-labelledby="log-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Log — the last thirty changes"
                heading="Who changed what here."
                headingId="log-heading"
                note="Page visits are logged as well; they are kept, but not listed here."
              />
              <ul role="list" className="mt-10 border-t border-ink text-[0.8125rem]">
                {changes.map((e, i) => (
                  <li key={`${e.at}-${i}`} className="grid gap-x-6 border-b border-hairline py-2.5 md:grid-cols-[9rem_14rem_minmax(0,1fr)]">
                    <span className="t-data text-graphite">{when(e.at)}</span>
                    <span className="break-all">{e.actor}</span>
                    <span>
                      {e.action}
                      {Object.keys(e.detail).length > 0 && (
                        <span className="t-data break-words text-graphite"> {describe(e.detail)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-3 lg:col-start-10">
            <TocAside
              label="Staff"
              items={[
                { id: "lots", label: "Lots" },
                { id: "orders", label: "Orders" },
                { id: "due", label: "Due to ship" },
                { id: "standing", label: "Standing orders" },
                { id: "messages", label: "Messages" },
                { id: "accounts", label: "Accounts" },
                { id: "log", label: "Log" },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}

