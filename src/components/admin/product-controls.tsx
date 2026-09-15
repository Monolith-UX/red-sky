"use client";

import { useState, useTransition } from "react";
import {
  archiveProductAction,
  deleteProductAction,
  importCatalogueAction,
  moveProductAction,
  type ProductState,
} from "@/app/admin/products/actions";
import { FormMessage } from "@/components/forms/fields";

const link =
  "text-[0.8125rem] underline decoration-hairline underline-offset-4 hover:decoration-ink disabled:opacity-40";

/** The one-time copy of the catalogue into the store. */
export function ImportCatalogue({ count }: { count: number }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ProductState>({});
  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={pending || state.ok}
        onClick={() => start(async () => setState(await importCatalogueAction()))}
        className="btn btn-primary justify-self-start disabled:opacity-60"
      >
        {pending ? "Copying…" : `Copy the ${count} products in`}
      </button>
      <FormMessage error={state.error} message={state.message} />
    </div>
  );
}

/** Up and down in the catalogue order. */
export function MoveProduct({ slug, name, first, last }: { slug: string; name: string; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex gap-1">
      {([-1, 1] as const).map((d) => (
        <button
          key={d}
          type="button"
          disabled={pending || (d === -1 ? first : last)}
          onClick={() => start(async () => void (await moveProductAction(slug, d)))}
          aria-label={`Move ${name} ${d === -1 ? "up" : "down"}`}
          className="grid h-9 w-9 place-items-center border border-hairline text-graphite hover:border-ink hover:text-ink disabled:opacity-30"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className={d === 1 ? "rotate-180" : ""}>
            <path d="M5 1.5v7M1.5 5 5 1.5 8.5 5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
      ))}
    </span>
  );
}

/**
 * Removing takes a product off the site and keeps it; deleting erases it, and
 * is offered only when nothing — no order, standing order or story — refers to it.
 */
export function ProductStatus({ slug, name, archived, deletable }: { slug: string; name: string; archived: boolean; deletable: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<ProductState>({});
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (archived || confirm(`Take ${name} off the site? Its record, lot and photos are kept, and you can put it back.`)) {
              start(async () => setState(await archiveProductAction(slug, !archived)));
            }
          }}
          className="btn btn-ghost disabled:opacity-60"
        >
          {archived ? "Put it back in the catalogue" : "Remove from the site"}
        </button>
        {deletable ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete ${name} for good, with its lot and photos? This cannot be undone.`)) {
                start(async () => setState(await deleteProductAction(slug)));
              }
            }}
            className={`${link} text-sun`}
          >
            Delete permanently
          </button>
        ) : (
          <span className="text-[0.8125rem] text-graphite">
            Orders or stories refer to it, so it can be removed but not deleted.
          </span>
        )}
      </div>
      <FormMessage error={state.error} message={state.message} />
    </div>
  );
}
