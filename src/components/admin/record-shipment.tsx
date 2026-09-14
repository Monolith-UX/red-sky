"use client";

import { useState, useTransition } from "react";
import { recordShipmentAction, type AdminState } from "@/app/admin/actions";
import { FormMessage } from "@/components/forms/fields";

/** One button per shipment; the server works the shipment out again before recording it. */
export function RecordShipment({ owner, date, label }: { owner: string; date: string; label: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<AdminState>({});
  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending || state.ok}
        onClick={() => start(async () => setState(await recordShipmentAction(owner, date)))}
        className="btn btn-ghost disabled:opacity-60"
      >
        {pending ? "Recording…" : state.ok ? "Recorded" : "Record shipment"}
        <span className="visually-hidden"> for {label}</span>
      </button>
      <FormMessage error={state.error} message={state.message} />
    </div>
  );
}
