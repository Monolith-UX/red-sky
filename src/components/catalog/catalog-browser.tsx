"use client";

import { ViewTransition, startTransition, useMemo, useState } from "react";
import {
  CLASSES,
  type ClassKey,
  type SortKey,
  SORTS,
  STOCK_LABEL,
  type StockState,
  catalogue,
} from "@/lib/catalog";
import { ProductCard } from "./product-card";

const STOCKS: StockState[] = ["in", "low", "made-to-order"];

export function CatalogBrowser() {
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState<ClassKey[]>([]);
  const [stocks, setStocks] = useState<StockState[]>([]);
  const [sort, setSort] = useState<SortKey>("name");
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Filter changes run as Transitions so the grid rearranges instead of jumping. */
  const change = (fn: () => void) => startTransition(fn);

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = catalogue.filter((item) => {
      if (classes.length && !classes.includes(item.klass)) return false;
      if (stocks.length && !stocks.includes(item.stock)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q) ||
        item.lot.toLowerCase().includes(q) ||
        item.note.toLowerCase().includes(q)
      );
    });

    return out.sort((a, b) => {
      if (sort === "purity") return b.purity - a.purity;
      if (sort === "price") return a.price - b.price;
      if (sort === "released") return b.released.localeCompare(a.released);
      return a.name.localeCompare(b.name);
    });
  }, [query, classes, stocks, sort]);

  const active = classes.length + stocks.length + (query.trim() ? 1 : 0);

  const clear = () =>
    change(() => {
      setQuery("");
      setClasses([]);
      setStocks([]);
    });

  return (
    <div className="grid12 mt-12 gap-y-8 md:mt-16">
      {/* ── Filter rail ───────────────────────────────────────────── */}
      <div className="col-span-12 lg:col-span-3">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
          className="flex h-12 w-full items-center justify-between border border-graphite px-4 text-[0.875rem] lg:hidden"
        >
          <span className="font-medium">
            Filters{active > 0 ? ` · ${active}` : ""}
          </span>
          <svg
            width="13"
            height="8"
            viewBox="0 0 13 8"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
          >
            <path d="M1 1l5.5 5.5L12 1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>

        <div
          id="catalog-filters"
          className={`${filtersOpen ? "mt-4 block" : "hidden"} lg:sticky lg:top-24 lg:mt-0 lg:block`}
        >
          <div>
            <label htmlFor="catalog-search" className="t-label block text-graphite">
              Search
            </label>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                change(() => setQuery(v));
              }}
              placeholder="Name, formula or lot"
              className="mt-2.5 h-11 w-full border border-graphite bg-transparent px-3 text-[0.875rem] placeholder:text-graphite/70"
            />
          </div>

          <fieldset className="mt-8 border-t border-hairline pt-5">
            <legend className="t-label float-left w-full pb-1 text-graphite">
              Class
            </legend>
            <ul role="list" className="clear-both space-y-0.5">
              {CLASSES.map((c) => (
                <li key={c.key}>
                  <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.875rem]">
                    <input
                      type="checkbox"
                      checked={classes.includes(c.key)}
                      onChange={() => change(() => setClasses((l) => toggle(l, c.key)))}
                      className="h-4 w-4 shrink-0 accent-sun"
                    />
                    <span>{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset className="mt-7 border-t border-hairline pt-5">
            <legend className="t-label float-left w-full pb-1 text-graphite">
              Availability
            </legend>
            <ul role="list" className="clear-both space-y-0.5">
              {STOCKS.map((s) => (
                <li key={s}>
                  <label className="flex cursor-pointer items-center gap-3 py-1.5 text-[0.875rem]">
                    <input
                      type="checkbox"
                      checked={stocks.includes(s)}
                      onChange={() => change(() => setStocks((l) => toggle(l, s)))}
                      className="h-4 w-4 shrink-0 accent-sun"
                    />
                    <span>{STOCK_LABEL[s]}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          {active > 0 && (
            <button
              type="button"
              onClick={clear}
              className="mt-7 flex h-11 items-center gap-2 text-[0.875rem] text-graphite transition-colors duration-150 hover:text-sun"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
                <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      <div className="col-span-12 lg:col-span-8 lg:col-start-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink pb-3">
          <p aria-live="polite" className="t-data text-[0.8125rem]">
            {items.length} of {catalogue.length} sequences
          </p>

          <span className="flex items-center gap-3">
            <label htmlFor="catalog-sort" className="t-label text-graphite">
              Sort
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => {
                const v = e.target.value as SortKey;
                change(() => setSort(v));
              }}
              className="h-9 border border-graphite bg-transparent px-2 text-[0.8125rem]"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </span>
        </div>

        {items.length === 0 ? (
          <div className="border-b border-hairline py-20 text-center">
            <p className="t-h3">Nothing matches those filters.</p>
            <p className="t-body mx-auto mt-3 text-[0.9375rem]">
              Clear them to see all {catalogue.length} sequences, or ask the bench
              assistant whether we can synthesise what you need.
            </p>
            <button type="button" onClick={clear} className="btn btn-ghost mt-7">
              Clear all filters
            </button>
          </div>
        ) : (
          <ul
            role="list"
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {items.map((item) => (
              <ViewTransition key={item.slug} enter="card-in" exit="card-out">
                <li>
                  <ProductCard item={item} />
                </li>
              </ViewTransition>
            ))}
          </ul>
        )}

        <p className="mt-10 max-w-[62ch] text-[0.8125rem] leading-relaxed text-graphite">
          Every price is per vial. Bulk quantities and sequences outside this list are
          quoted within one business day — write to{" "}
          <a href="#newsletter" className="decoration-sun underline-offset-4">
            lab@redskybio.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
