import type { Metadata } from "next";
import {
  PasswordForm,
  ProfileForm,
  SavedGrid,
  SessionSync,
  SignOutButton,
  WaitlistList,
} from "@/components/account/account-sections";
import { GuestCarryover, SignInForm, SignUpForm } from "@/components/account/auth-forms";
import { AvatarUploader } from "@/components/account/avatar-uploader";
import { OrderHistory } from "@/components/account/order-history";
import { StandingOrders } from "@/components/account/standing-orders";
import { SectionHeader } from "@/components/section-header";
import { TocAside } from "@/components/toc-aside";
import { todayIso } from "@/lib/account";
import { getItem, money, shortDate } from "@/lib/catalog";
import { currentUser, sessionInfo } from "@/lib/server/auth";
import {
  favoriteSnapshot,
  getOrders,
  getProfile,
  placedOrders,
  waitlistSnapshot,
} from "@/lib/server/store";
import { savingFor, stackSavings } from "@/lib/stacks";
import { seedOf } from "@/lib/server/visitor";

export const metadata: Metadata = {
  title: "Your account — Red Sky",
  description: "Favorites, waitlists and monthly standing orders.",
  robots: { index: false, follow: false },
};

function safeNext(value: string | string[] | undefined) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/account";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const [user, { next }] = await Promise.all([currentUser(), searchParams]);

  if (!user) return <SignedOut next={safeNext(next)} />;

  const [profile, favorites, waitlist, orders, placed, session] = await Promise.all([
    getProfile(user.id),
    favoriteSnapshot(user.id),
    waitlistSnapshot(user.id),
    getOrders(user.id),
    placedOrders(user.id),
    sessionInfo(),
  ]);

  const today = todayIso();
  const active = orders.filter((o) => o.status === "active");
  const monthly =
    active.reduce((sum, o) => sum + (getItem(o.slug)?.price ?? 0) * o.quantity, 0) -
    savingFor(stackSavings(active.map((o) => ({ slug: o.slug, plan: "monthly" as const, quantity: o.quantity }))));

  const ledger: [string, string][] = [
    ["Favorites", String(favorites.mine.length)],
    ["Waitlists", String(waitlist.mine.length)],
    ["Standing orders", `${active.length} active`],
    ["Every month", money(monthly)],
    [
      "Signed in",
      session?.persistent
        ? `until ${shortDate(session.expires.slice(0, 10))}`
        : "until the browser closes",
    ],
  ];

  return (
    <>
      <SessionSync signedIn />

      {/* ── Masthead ───────────────────────────────────────────────── */}
      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-12 pt-12 md:pb-16 md:pt-16">
          <div className="grid12 gap-y-10">
            <div className="col-span-12 lg:col-span-7">
              <p className="rail-label">Account — signed in</p>
              <h1 className="t-display mt-7 max-w-[14ch] md:mt-9">
                {profile.name || "Your account"}
              </h1>
              <p className="t-data mt-4 text-[0.875rem] text-graphite">
                {user.email}
                {profile.organisation && ` · ${profile.organisation}`}
              </p>
              <div className="mt-9">
                <AvatarUploader
                  src={profile.avatar ? `/api/account/avatar?v=${profile.avatar.version}` : null}
                  seed={seedOf(user.id)}
                />
              </div>
            </div>

            <div className="col-span-12 self-end lg:col-span-4 lg:col-start-9">
              <dl>
                {ledger.map(([k, v], i) => (
                  <div
                    key={k}
                    className={`flex items-baseline justify-between gap-4 border-b border-hairline py-3 ${
                      i === 0 ? "border-t border-t-ink" : ""
                    }`}
                  >
                    <dt className="t-label text-graphite">{k}</dt>
                    <dd className="t-data text-[1rem] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 flex justify-end">
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sections and rail ──────────────────────────────────────── */}
      <div className="shell py-14 md:py-20">
        <div className="grid12 gap-y-14">
          <div className="col-span-12 space-y-20 md:space-y-24 lg:col-span-9">
            <section id="favorites" aria-labelledby="favorites-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Favorites — from the catalogue"
                heading="Sequences you have favorited."
                headingId="favorites-heading"
              />
              <div className="mt-10">
                <SavedGrid initial={favorites.mine} />
              </div>
            </section>

            <section id="auto-delivery" aria-labelledby="orders-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Auto-delivery — standing orders"
                heading="What ships on the first of the month."
                headingId="orders-heading"
                note="Monday to Wednesday dispatch only, so nothing sits in a depot over a weekend."
              />
              <div className="mt-10">
                <StandingOrders orders={orders} today={today} />
              </div>
            </section>

            <section id="orders" aria-labelledby="history-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Orders — placed from this account"
                heading="Everything you have ordered."
                headingId="history-heading"
              />
              <div className="mt-10">
                <OrderHistory orders={placed} />
              </div>
            </section>

            <section id="waitlist" aria-labelledby="waitlist-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Waitlist — not yet on the shelf"
                heading="Waiting on a certificate."
                headingId="waitlist-heading"
                note="One email per sequence, the day its lot clears release."
              />
              <div className="mt-10">
                <WaitlistList initial={waitlist.mine} />
              </div>
            </section>

            <section id="profile" aria-labelledby="profile-heading" className="scroll-mt-24">
              <SectionHeader
                eyebrow="Profile — how we reach you"
                heading="Your details."
                headingId="profile-heading"
              />
              <div className="mt-10 max-w-[44rem]">
                <ProfileForm profile={profile} signInEmail={user.email} />
              </div>

              <div className="mt-14 max-w-[44rem] border-t border-hairline pt-8">
                <h3 className="t-h3">Delivery address</h3>
                {profile.address ? (
                  <address className="t-data mt-4 text-[0.875rem] not-italic leading-relaxed">
                    {profile.address.recipient}
                    {profile.address.organisation && <><br />{profile.address.organisation}</>}
                    <br />
                    {profile.address.line1}
                    {profile.address.line2 && `, ${profile.address.line2}`}
                    <br />
                    {profile.address.city}, {profile.address.region} {profile.address.postal}
                    <br />
                    {profile.address.country}
                  </address>
                ) : (
                  <p className="mt-3 text-[0.9375rem] text-graphite">None saved yet.</p>
                )}
                <p className="mt-3 text-[0.8125rem] text-graphite">
                  Saved from checkout, and changed there too — standing orders ship to the address on the order that opened them.
                </p>
              </div>

              <div className="mt-14 max-w-[44rem] border-t border-hairline pt-8">
                <h3 className="t-h3">Password</h3>
                <div className="mt-6">
                  <PasswordForm />
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-3 lg:col-start-10">
            <TocAside
              label="In your account"
              items={[
                { id: "favorites", label: "Favorites" },
                { id: "auto-delivery", label: "Auto-delivery" },
                { id: "orders", label: "Orders" },
                { id: "waitlist", label: "Waitlist" },
                { id: "profile", label: "Profile" },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function SignedOut({ next }: { next: string }) {
  return (
    <>
      <SessionSync signedIn={false} />

      <section className="border-b border-hairline bg-paper">
        <div className="shell pb-12 pt-12 md:pb-16 md:pt-16">
          <div className="grid12 gap-y-6">
            <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5">
              Account — sign in
            </p>
            <div className="col-span-12 lg:col-span-8">
              <h1 className="t-display max-w-[15ch]">One account for every bench you work at.</h1>
              <p className="t-lead mt-7 max-w-[54ch]">
                Favorites, waitlists and monthly standing orders, kept against your name rather
                than one browser. Sign in once on a device and it stays signed in for ninety days
                from your last visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="shell py-14 md:py-20">
        <div className="mb-10 max-w-[64ch] empty:hidden">
          <GuestCarryover />
        </div>

        <div className="grid12 gap-y-14">
          <section
            aria-labelledby="sign-in-heading"
            className="col-span-12 border-t border-ink pt-7 lg:col-span-5"
          >
            <h2 id="sign-in-heading" className="t-h2 text-[clamp(1.75rem,2.6vw,2.25rem)]">
              Sign in
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              Returning to a device you have signed in on? You will already be here.
            </p>
            <div className="mt-8">
              <SignInForm next={next} />
            </div>
          </section>

          <section
            aria-labelledby="sign-up-heading"
            className="col-span-12 border-t border-hairline pt-7 lg:col-span-6 lg:col-start-7"
          >
            <h2 id="sign-up-heading" className="t-h2 text-[clamp(1.75rem,2.6vw,2.25rem)]">
              Create an account
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
              For researchers and institutions. It takes a minute and asks for no card.
            </p>
            <div className="mt-8">
              <SignUpForm next={next} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
