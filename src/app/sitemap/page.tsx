import type { Metadata } from "next";
import Link from "next/link";
import { CLASSES, STOCK_LABEL, catalogue } from "@/lib/catalog";
import { policyList } from "@/lib/legal";
import { CATEGORIES, byDate, longDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Sitemap — Red Sky",
  description: "Every page on the Red Sky site, including every sequence, journal entry and policy.",
};

const SITE = [
  { label: "Home", href: "/" },
  { label: "Catalogue", href: "/catalog" },
  { label: "How every lot is tested", href: "/#method" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

const YOURS = [
  { label: "Your account", href: "/account" },
  { label: "Favorites", href: "/account#favorites" },
  { label: "Monthly standing orders", href: "/account#auto-delivery" },
  { label: "Waitlists", href: "/account#waitlist" },
  { label: "Cart", href: "/cart" },
];

function LinkList({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={heading}>
      <h2 className="t-label border-b border-ink pb-3 text-graphite">{heading}</h2>
      <ul role="list">
        {links.map((l) => (
          <li key={l.href} className="border-b border-hairline">
            <Link href={l.href} className="block py-3 text-[0.9375rem] no-underline transition-colors duration-150 hover:text-sun">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The human sitemap: the whole site on one sheet, set like an inventory. The
 * catalogue carries each lot's number and status, so it doubles as a stock
 * list; /sitemap.xml remains the machine-readable version.
 */
export default function SitemapPage() {
  return (
    <article className="bg-paper">
      <header className="shell pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="grid12 gap-y-6">
          <p className="rail-label col-span-12 md:col-span-7 lg:col-span-5">
            Sitemap — every page on one sheet
          </p>
          <div className="col-span-12 lg:col-span-9">
            <h1 className="t-display max-w-[15ch]">The whole site, filed like a stock list.</h1>
            <p className="t-lead mt-7 max-w-[54ch]">
              {catalogue.length} sequences, {byDate.length} journal entries and{" "}
              {policyList.length} policies. Search engines read the same list at{" "}
              <a href="/sitemap.xml" className="t-data text-[0.9375em] decoration-sun underline-offset-4">
                /sitemap.xml
              </a>
              .
            </p>
          </div>
        </div>
      </header>

      <div className="shell border-t border-hairline py-14 md:py-16">
        <div className="grid12 gap-y-14">
          {/* ── The site ─────────────────────────────────────────────── */}
          <div className="col-span-12 grid gap-12 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1 lg:content-start">
            <LinkList heading="Red Sky" links={SITE} />
            <LinkList heading="Your account" links={YOURS} />
            <LinkList
              heading="Policies"
              links={[
                ...policyList.map((p) => ({ label: p.title, href: `/${p.slug}` })),
                { label: "Sitemap", href: "/sitemap" },
              ]}
            />
          </div>

          {/* ── The catalogue, as an inventory ───────────────────────── */}
          <section aria-labelledby="inventory-heading" className="col-span-12 lg:col-span-8 lg:col-start-5">
            <h2 id="inventory-heading" className="t-label border-b border-ink pb-3 text-graphite">
              Catalogue — {catalogue.length} sequences in {CLASSES.length} classes
            </h2>

            {CLASSES.map((c) => {
              const items = catalogue
                .filter((i) => i.klass === c.key)
                .sort((a, b) => a.name.localeCompare(b.name));
              return (
                <div key={c.key} className="mt-8 first:mt-6">
                  <h3 className="t-h3">{c.label}</h3>
                  <ul role="list" className="mt-3 border-t border-hairline">
                    {items.map((i) => (
                      <li key={i.slug} className="border-b border-hairline">
                        <Link
                          href={`/catalog/${i.slug}`}
                          className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 py-3 no-underline sm:grid-cols-[minmax(0,1fr)_7.5rem_7rem_5rem]"
                        >
                          <span className="text-[0.9375rem] transition-colors duration-150 group-hover:text-sun">
                            {i.name}
                          </span>
                          <span className="t-data text-[0.75rem] text-graphite sm:order-none">
                            {i.lot ?? "—"}
                          </span>
                          <span className="t-data hidden text-[0.75rem] text-graphite sm:block">
                            {STOCK_LABEL[i.stock]}
                          </span>
                          <span className="t-data hidden text-right text-[0.75rem] sm:block">
                            {i.purity !== null ? `${i.purity.toFixed(2)}%` : "Pending"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </div>

        {/* ── The journal ──────────────────────────────────────────── */}
        <section aria-labelledby="journal-heading" className="mt-20 md:mt-24">
          <h2 id="journal-heading" className="t-label border-b border-ink pb-3 text-graphite">
            Blog — {byDate.length} journal entries, newest first
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const entries = byDate.filter((p) => p.category === cat.key);
              return (
                <div key={cat.key}>
                  <h3 className="t-h3">
                    <Link href={`/blog?category=${cat.key}`} className="no-underline hover:text-sun">
                      {cat.label}
                    </Link>
                  </h3>
                  <ul role="list" className="mt-3 border-t border-hairline">
                    {entries.map((p) => (
                      <li key={p.slug} className="border-b border-hairline">
                        <Link href={`/blog/${p.slug}`} className="group block py-3 no-underline">
                          <span className="block text-[0.9375rem] leading-snug transition-colors duration-150 group-hover:text-sun">
                            {p.title}
                          </span>
                          <span className="t-data mt-1 block text-[0.6875rem] text-graphite">
                            № {String(p.no).padStart(3, "0")} · <time dateTime={p.date}>{longDate(p.date)}</time>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </article>
  );
}
