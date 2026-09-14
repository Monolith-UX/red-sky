"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { signIn, signUp, type FormState } from "@/app/account/actions";
import { Check, Field, FormMessage, PasswordField } from "@/components/forms/fields";
import { cartCount, useSession } from "@/lib/session-client";

function useFocusOnError(state: FormState) {
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.error) first.current?.focus();
  }, [state]);
  return first;
}

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  const first = useFocusOnError(state);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field
        ref={first}
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.fields?.email}
        placeholder="you@lab.org"
      />
      <PasswordField label="Password" name="password" autoComplete="current-password" />
      <Check name="keep" defaultChecked>
        Keep me signed in on this device
      </Check>
      <FormMessage error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-[0.8125rem] leading-relaxed text-graphite">
        Forgotten the password?{" "}
        <a href="/contact?topic=order#message" className="text-ink decoration-sun underline-offset-4">
          Send a message
        </a>{" "}
        from the address on the account and we will reset it.
      </p>
    </form>
  );
}

export function SignUpForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, {});
  const first = useFocusOnError(state);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" defaultValue={state.fields?.name} optional />
        <Field
          label="Organisation"
          name="organisation"
          autoComplete="organization"
          defaultValue={state.fields?.organisation}
          optional
        />
      </div>
      <Field
        ref={first}
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.fields?.email}
        placeholder="you@lab.org"
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        note="At least 10 characters. A passphrase is fine; a password manager is better."
      />
      <div className="flex flex-col gap-3">
        <Check name="terms">
          I am at least 21 and I accept the{" "}
          <Link href="/terms" className="decoration-sun underline-offset-4">
            terms of sale
          </Link>
          , including that everything is sold for laboratory research only.
        </Check>
        <Check name="keep" defaultChecked>
          Keep me signed in on this device
        </Check>
      </div>
      <FormMessage error={state.error} />
      <button type="submit" disabled={pending} className="btn btn-ghost w-full disabled:opacity-60">
        {pending ? "Creating the account…" : "Create an account"}
      </button>
    </form>
  );
}

/** Tells a guest what signing in keeps, using what this browser actually holds. */
export function GuestCarryover() {
  const session = useSession();
  const tallies: [number, string, string][] = [
    [session.favorites.mine.length, "favorite", "favorites"],
    [session.waitlist.mine.length, "waitlist", "waitlists"],
    [cartCount(session.cart), "item in the cart", "items in the cart"],
  ];
  const held = tallies.filter(([n]) => n > 0);
  const total = held.reduce((sum, [n]) => sum + n, 0);

  if (session.status !== "ready" || !held.length) return null;

  const list = held.map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  const phrase = list.length > 1 ? `${list.slice(0, -1).join(", ")} and ${list.at(-1)}` : list[0];

  return (
    <p className="flex items-start gap-2.5 text-[0.875rem] leading-relaxed">
      <span className="dot mt-[0.55em]" aria-hidden="true" />
      <span>
        This browser is holding {phrase}. Sign in or create an account and{" "}
        {total === 1 ? "it moves" : "they move"} into it.
      </span>
    </p>
  );
}
