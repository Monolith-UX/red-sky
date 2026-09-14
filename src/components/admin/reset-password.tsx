"use client";

import { useActionState } from "react";
import { resetPasswordAction, type AdminState } from "@/app/admin/actions";
import { Field, FormMessage } from "@/components/forms/fields";

/** Sets a temporary password for a customer who has asked, and shows it once. */
export function ResetPassword() {
  const [state, action, pending] = useActionState<AdminState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} noValidate className="grid max-w-[36rem] gap-5">
      <Field
        label="Account email"
        name="email"
        type="email"
        autoComplete="off"
        note="Only after they have asked from that same address."
      />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" disabled={pending} className="btn btn-ghost disabled:opacity-60">
          {pending ? "Setting…" : "Set a temporary password"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
      {state.temporary && (
        <p className="border border-ink bg-paper px-4 py-3">
          <span className="t-label block text-graphite">Temporary password — shown once</span>
          <span className="t-data mt-1 block select-all text-[1.125rem]">{state.temporary}</span>
        </p>
      )}
    </form>
  );
}
