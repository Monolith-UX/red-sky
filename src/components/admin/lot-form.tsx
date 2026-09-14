"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { revertLotAction, saveLotAction, type AdminState } from "@/app/admin/actions";
import { Check, Field, FormMessage } from "@/components/forms/fields";
import type { StockState } from "@/lib/catalog";
import { STOCK_STATES, type LotRecord } from "@/lib/lots";

/** Starting values: the saved row, else the sample lot written in code. */
export type LotDefaults = Omit<LotRecord, "updated" | "updatedBy" | "certificate"> & {
  certificateUrl: string | null;
};

/**
 * One sequence's lot, as staff edit it. Certificate figures are required for
 * a real lot (see readLotForm); the sample box is the only way to leave gaps.
 */
export function LotForm({ slug, defaults, saved }: { slug: string; defaults: LotDefaults; saved: boolean }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveLotAction.bind(null, slug), {});
  const [stock, setStock] = useState<StockState>(defaults.stock);
  const [reverting, startRevert] = useTransition();
  const [reverted, setReverted] = useState<AdminState>({});
  const stockId = useId();
  const upcoming = stock === "upcoming";
  const v = (n: number | null) => (n === null ? "" : String(n));

  return (
    <form action={action} noValidate className="grid gap-10">
      <fieldset className="grid gap-5 md:grid-cols-3">
        <legend className="t-label mb-4 text-graphite">On the shelf</legend>
        <div>
          <label htmlFor={stockId} className="t-label block text-graphite">
            Stock
          </label>
          <select
            id={stockId}
            name="stock"
            value={stock}
            onChange={(e) => setStock(e.target.value as StockState)}
            className="mt-2 h-12 w-full border border-graphite bg-white px-3 text-[0.9375rem] hover:border-ink"
          >
            {STOCK_STATES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Field label="Price per vial, $" name="price" inputMode="decimal" defaultValue={v(defaults.price)} />
        <Field label="Fill per vial" name="fill" defaultValue={defaults.fill} placeholder="5 mg" />
        <Field
          label={upcoming ? "First lot expected" : "Next lot expected"}
          name="expected"
          type="date"
          defaultValue={defaults.expected ?? ""}
          optional={!upcoming}
        />
      </fieldset>

      {!upcoming && (
        <fieldset className="grid gap-5 md:grid-cols-3">
          <legend className="t-label mb-4 text-graphite">The lot and its certificate</legend>
          <Field label="Lot number" name="lot" defaultValue={defaults.lot ?? ""} placeholder="RS-2604-C" autoCapitalize="characters" spellCheck={false} />
          <Field label="Area purity, %" name="purity" inputMode="decimal" defaultValue={v(defaults.purity)} />
          <Field label="Released" name="released" type="date" defaultValue={defaults.released ?? ""} />
          <Field label="Retention, min" name="retention" inputMode="decimal" defaultValue={v(defaults.retention)} />
          <Field label="Observed mass, Da" name="observedMass" inputMode="decimal" defaultValue={v(defaults.observedMass)} />
          <Field label="Water content, %" name="water" inputMode="decimal" defaultValue={v(defaults.water)} />
          <Field
            label="Largest impurity"
            name="largestImpurity"
            defaultValue={defaults.largestImpurity ?? ""}
            placeholder="0.14% at 1.7 min"
            className="md:col-span-2"
          />
          <Field label="Analyst initials" name="analyst" defaultValue={defaults.analyst ?? ""} placeholder="J.R." />
          <Field label="Salt form" name="salt" defaultValue={defaults.salt ?? ""} placeholder="Trifluoroacetate" optional />
          <Field
            label="Appearance"
            name="appearance"
            defaultValue={defaults.appearance ?? ""}
            placeholder="White to off-white lyophilized powder"
            optional
            className="md:col-span-2"
          />
          <div className="md:col-span-3">
            <label className="t-label block text-graphite" htmlFor={`${stockId}-pdf`}>
              Certificate PDF
            </label>
            <input
              id={`${stockId}-pdf`}
              type="file"
              name="certificate"
              accept="application/pdf"
              className="mt-2 block w-full text-[0.875rem] file:mr-4 file:h-11 file:border file:border-ink file:bg-paper file:px-4 file:text-[0.8125rem]"
            />
            <p className="mt-2 text-[0.8125rem] text-graphite">
              Up to 4 MB. Uploading replaces the current one.
              {defaults.certificateUrl && (
                <>
                  {" "}
                  <a href={defaults.certificateUrl} target="_blank" rel="noreferrer" className="text-ink decoration-sun underline-offset-4">
                    Open the current certificate
                  </a>
                </>
              )}
            </p>
            {defaults.certificateUrl && (
              <div className="mt-3">
                <Check name="removeCertificate">Remove the current certificate</Check>
              </div>
            )}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 border-t border-hairline pt-6">
        <Check name="sample" defaultChecked={defaults.sample}>
          These figures are sample data, not a real release. Gaps are then filled with generated values on the site.
        </Check>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
            {pending ? "Saving…" : "Save and publish"}
          </button>
          {saved && (
            <button
              type="button"
              disabled={reverting}
              onClick={() => {
                if (confirm("Delete this saved lot and go back to the values written in code?")) {
                  startRevert(async () => setReverted(await revertLotAction(slug)));
                }
              }}
              className="text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 hover:text-ink hover:decoration-ink disabled:opacity-50"
            >
              {reverting ? "Reverting…" : "Revert to the values in code"}
            </button>
          )}
        </div>
        <FormMessage error={state.error} message={reverted.message ?? state.message} />
      </div>
    </form>
  );
}
