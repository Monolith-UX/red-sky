import Link from "next/link";

/**
 * Every link goes somewhere real. Where no page exists yet, the link is to the
 * nearest thing that answers the question — a journal entry, a section of the
 * terms, or the contact desk with the topic already chosen.
 */
const columns = [
  {
    title: "Catalog",
    links: [
      { label: "All sequences", href: "/catalog" },
      { label: "New lots", href: "/blog?category=release-notes" },
      { label: "Bulk quantities", href: "/contact?topic=quote" },
      { label: "Custom synthesis", href: "/contact?topic=synthesis" },
    ],
  },
  {
    title: "Verification",
    links: [
      { label: "Certificates of analysis", href: "/certificates" },
      { label: "Testing method", href: "/testing" },
      { label: "Reading a chromatogram", href: "/blog/reading-your-chromatogram" },
      { label: "Client stories", href: "/stories" },
    ],
  },
  {
    title: "Ordering",
    links: [
      { label: "Handling and cold chain", href: "/handling" },
      { label: "Returns", href: "/terms#returns-and-replacements" },
      { label: "Standing orders", href: "/account#auto-delivery" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Red Sky", href: "/about" },
      { label: "Journal", href: "/blog" },
      { label: "Contact", href: "/contact" },
      { label: "Your account", href: "/account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-bench">
      <div className="shell py-16 md:py-20">
        <div className="grid12 gap-y-12">
          <div className="col-span-12 lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <span className="block h-[0.9rem] w-[0.9rem] rounded-full bg-sun" />
              <span className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em]">
                Red Sky
              </span>
            </div>
            <p className="t-body mt-5 max-w-[32ch] text-[0.9375rem]">
              Research peptides, synthesized to order and released against published
              analytical data.
            </p>
            <p className="t-data mt-6 text-[0.75rem] leading-relaxed text-graphite">
              Red Sky Biosciences LLC
              <br />
              1140 Ferrier Street, Unit 4
              <br />
              Reno, Nevada 89502
            </p>
          </div>

          {columns.map((col) => (
            <nav
              key={col.title}
              aria-label={col.title}
              className="col-span-6 md:col-span-3 lg:col-span-2"
            >
              <h2 className="t-label text-graphite">{col.title}</h2>
              <ul role="list" className="mt-4 space-y-0.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block py-1.5 text-[0.875rem] no-underline transition-colors duration-150 hover:text-sun"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 border-t border-hairline pt-6">
          <p className="max-w-[72ch] text-[0.8125rem] leading-relaxed text-graphite">
            <strong className="font-medium text-ink">Research use only.</strong> All
            products on this site are sold for in-vitro laboratory research. They are not
            drugs, foods or cosmetics, are not for human or veterinary consumption, and
            are not for diagnostic or therapeutic use of any kind.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="t-data text-[0.75rem] text-graphite">
              © 2026 Red Sky Biosciences · Every lot traceable
            </p>
            <ul role="list" className="-my-1.5 flex flex-wrap gap-x-6 gap-y-0">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Cookie Policy", href: "/cookie-policy" },
                { label: "Accessibility", href: "/accessibility" },
                { label: "Sitemap", href: "/sitemap" },
              ].map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="block py-1.5 text-[0.75rem] text-graphite no-underline transition-colors duration-150 hover:text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
