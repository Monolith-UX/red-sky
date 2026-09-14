"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { STOCK_LABEL, catalogue, isReleased, shortDate, waitingFor } from "@/lib/catalog";
import { coaFor } from "@/lib/coa";

const normalise = (s: string) => s.toUpperCase().replace(/\s+/g, "");

/**
 * Type the lot number off the vial and its certificate comes up; type a name
 * and every lot of it does. Below the search sits the full ledger of what is
 * published, newest first — the unreleased at the foot, marked as pending.
 */
export function CertificateLookup() {
  const [query, setQuery] = useState("");
  const id = useId();

  const ledger = useMemo(() => {
    const out = [...catalogue].sort((a, b) =>
      a.released === null ? 1 : b.released === null ? -1 : b.released.localeCompare(a.released),
    );
    const q = normalise(query);
    if (!q) return out;
    return out.filter(
      (c) => normalise(c.name).includes(q) || (c.lot && normalise(c.lot).includes(q)) || normalise(c.formula).includes(q),
    );
  }, [query]);

  const exact = catalogue.find((c) => c.lot && normalise(c.lot) === normalise(query));

  return (
    <div>
      <div className="grid12 gap-y-6">
        <div className="col-span-12 lg:col-span-6">
          <label htmlFor={`${id}-q`} className="t-label block text-graphite">
            Lot number, sequence or formula
          </label>
          <input
            id={`${id}-q`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="RS-2601-B"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-count`}
            className="t-data mt-2.5 h-14 w-full border border-ink bg-white px-4 text-[1.125rem] placeholder:text-graphite/50"
          />
          <p id={`${id}-count`} aria-live="polite" className="t-data mt-2.5 text-[0.75rem] text-graphite">
            {query ? `${ledger.length} of ${catalogue.length} match` : `${catalogue.length} sequences on record`}
          </p>
        </div>
      </div>

      {exact && isReleased(exact) && (
        <Specimen slug={exact.slug} />
      )}

      <div className="mt-12">
        <div className="hidden grid-cols-[7rem_minmax(0,1fr)_7rem_6rem_4rem_8rem] gap-4 border-b border-ink pb-2.5 md:grid" aria-hidden="true">
          {["Lot", "Sequence", "Released", "Purity", "Analyst", "Status"].map((h) => (
            <span key={h} className="t-label text-graphite">{h}</span>
          ))}
        </div>
        {ledger.length === 0 ? (
          <p className="border-b border-hairline py-12 text-[0.9375rem] text-graphite">
            Nothing on record matches that. Check the number against the vial label, or{" "}
            <Link href="/contact?topic=lot" className="text-ink decoration-sun underline-offset-4">
              ask the technical team
            </Link>{" "}
            to look it up.
          </p>
        ) : (
          <ul role="list">
            {ledger.map((c) => {
              const coa = isReleased(c) ? coaFor(c) : null;
              return (
                <li key={c.slug} className="border-b border-hairline">
                  <Link
                    href={`/catalog/${c.slug}#certificate`}
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 py-4 no-underline transition-colors duration-150 hover:bg-paper md:grid-cols-[7rem_minmax(0,1fr)_7rem_6rem_4rem_8rem]"
                  >
                    <span className="t-data order-2 text-[0.8125rem] text-graphite md:order-none md:text-ink">
                      {c.lot ?? "—"}
                    </span>
                    <span className="order-1 text-[1rem] font-medium transition-colors duration-150 group-hover:text-sun md:order-none">
                      {c.name}
                    </span>
                    <span className="t-data order-3 text-[0.8125rem] text-graphite md:order-none">
                      {c.released ? shortDate(c.released) : "Pending"}
                    </span>
                    <span className="t-data order-4 text-right text-[0.8125rem] font-medium md:order-none md:text-left">
                      {c.purity !== null ? `${c.purity.toFixed(2)}%` : "—"}
                    </span>
                    <span className="t-data hidden text-[0.8125rem] text-graphite md:block">
                      {coa?.analyst ?? "—"}
                    </span>
                    <span className="t-label order-5 col-span-2 text-graphite md:order-none md:col-span-1">
                      {c.released === null ? waitingFor(c) : STOCK_LABEL[c.stock]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Specimen({ slug }: { slug: string }) {
  const item = catalogue.find((c) => c.slug === slug);
  if (!item || !isReleased(item)) return null;
  const coa = coaFor(item);
  const fields: [string, string][] = [
    ["Area purity", coa.purity],
    ["Retention", coa.retention],
    ["Observed mass", coa.observed],
    ["Theoretical mass", coa.theoretical],
    ["Salt form", coa.salt],
    ["Water content", coa.water],
    ["Analyst", coa.analyst],
    ["Released", shortDate(item.released)],
  ];

  return (
    <section aria-label={`Certificate summary for lot ${item.lot}`} className="mt-10 border border-ink bg-paper">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-hairline px-5 py-4 md:px-7">
        <p className="flex items-center gap-3">
          <span className="dot" aria-hidden="true" />
          <span className="t-h3">{item.name}</span>
          <span className="t-data text-[0.875rem] text-graphite">lot {item.lot}</span>
        </p>
        <Link href={`/catalog/${item.slug}#certificate`} className="text-[0.875rem] font-medium decoration-sun underline-offset-4">
          Open the full certificate
        </Link>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map(([k, v]) => (
          <div key={k} className="border-b border-hairline px-5 py-3.5 sm:border-r md:px-7">
            <dt className="t-label text-graphite">{k}</dt>
            <dd className="t-data mt-1 text-[0.9375rem] font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
