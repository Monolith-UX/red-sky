"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { submitStory, type StoryState } from "@/app/stories/actions";
import { Check, Field, FormMessage } from "@/components/forms/fields";
import { CLASSES, catalogue } from "@/lib/catalog";
import { LIMITS } from "@/lib/stories";

type Defaults = { name: string; organisation: string; email: string } | null;

function Sequences({ id, name, label, required, value }: { id: string; name: string; label: string; required?: boolean; value?: string }) {
  return (
    <div>
      <label htmlFor={id} className="t-label flex items-baseline justify-between gap-3 text-graphite">
        {label}
        {!required && <span className="text-[0.625rem] tracking-[0.12em] text-graphite/80">Optional</span>}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        className="mt-2 h-12 w-full border border-graphite bg-white px-3 text-[0.9375rem] transition-colors duration-150 hover:border-ink"
      >
        <option value="">{required ? "Choose a sequence" : "None"}</option>
        {CLASSES.map((c) => (
          <optgroup key={c.key} label={c.label}>
            {catalogue
              .filter((i) => i.klass === c.key && i.purity !== null)
              .map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

function Counted({
  id,
  name,
  label,
  note,
  max,
  rows,
  value,
}: {
  id: string;
  name: string;
  label: string;
  note: string;
  max: number;
  rows: number;
  value?: string;
}) {
  const [length, setLength] = useState(value?.length ?? 0);
  return (
    <div>
      <label htmlFor={id} className="t-label block text-graphite">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={max}
        defaultValue={value}
        onChange={(e) => setLength(e.target.value.length)}
        aria-describedby={`${id}-note`}
        className="mt-2 block w-full resize-y border border-graphite bg-white px-3.5 py-3 text-[0.9375rem] leading-relaxed transition-colors duration-150 hover:border-ink"
      />
      <p id={`${id}-note`} className="mt-2 flex justify-between gap-4 text-[0.8125rem] leading-snug text-graphite">
        <span>{note}</span>
        <span className="t-data shrink-0 text-[0.75rem]">
          {length} / {max}
        </span>
      </p>
    </div>
  );
}

export function StoryForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState<StoryState, FormData>(submitStory, {});
  const id = useId();
  const sent = useRef<HTMLHeadingElement>(null);
  const f = state.fields;
  const chosen = f?.slugs?.split(",") ?? [];

  useEffect(() => {
    if (state.sent) sent.current?.focus();
  }, [state.sent]);

  if (state.sent) {
    return (
      <div className="border-t border-ink pt-7">
        <p className="rail-label">Received — {state.sent.id}</p>
        <h3 ref={sent} tabIndex={-1} className="t-h2 mt-6 max-w-[16ch] text-[clamp(1.75rem,2.6vw,2.25rem)] focus:outline-none">
          Thank you. A person reads it next.
        </h3>
        <p className="t-body mt-4 text-[0.9375rem]">
          Nothing is published until someone has read it and confirmed it with you. Quote{" "}
          <span className="t-data text-ink">{state.sent.id}</span> if you want to change or withdraw it.
        </p>
        {state.sent.verified && (
          <p className="mt-4 flex items-center gap-2.5 text-[0.9375rem]">
            <span className="dot" aria-hidden="true" />
            It will carry a verified order mark — this account has ordered the sequence.
          </p>
        )}
        {state.sent.flagged && (
          <p className="mt-5 border-t border-hairline pt-4 text-[0.875rem] leading-relaxed">
            Parts of it read as use in a person or an animal, or as a health outcome. We do not publish
            that, so we may ask you to revise it before it can appear.
          </p>
        )}
        <p className="t-data mt-5 border-t border-hairline pt-4 text-[0.75rem] leading-relaxed text-graphite">
          This build stores stories for review but does not yet send email.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <Field label="Title" name="title" maxLength={LIMITS.title} defaultValue={f?.title} placeholder="Three lots, one column, no surprises" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Sequences id={`${id}-s1`} name="slugs" label="Sequence" required value={chosen[0]} />
        <Sequences id={`${id}-s2`} name="slugs" label="Another sequence" value={chosen[1]} />
      </div>
      <Field label="Lot number" name="lot" defaultValue={f?.lot} placeholder="RS-2601-B" optional spellCheck={false} />

      <Counted
        id={`${id}-story`}
        name="story"
        label="The work"
        note="What you set out to measure or make, what you used, and what happened."
        max={LIMITS.story}
        rows={7}
        value={f?.story}
      />
      <Counted
        id={`${id}-outcome`}
        name="outcome"
        label="What changed"
        note="How the research moved — including if it did not."
        max={LIMITS.outcome}
        rows={3}
        value={f?.outcome}
      />

      <div className="grid gap-5 border-t border-hairline pt-6 sm:grid-cols-2">
        <Field label="Name as it should appear" name="name" autoComplete="name" defaultValue={f?.name ?? defaults?.name} />
        <Field label="Role" name="role" defaultValue={f?.role} placeholder="Analytical chemist" />
        <Field label="Organisation" name="organisation" autoComplete="organization" defaultValue={f?.organisation ?? defaults?.organisation} optional />
        <Field label="Location" name="location" defaultValue={f?.location} placeholder="Boston, Massachusetts" optional />
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={f?.email ?? defaults?.email}
          className="sm:col-span-2"
          note="Used to confirm the story with you. Never published."
        />
      </div>

      <div aria-hidden="true" className="visually-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="flex flex-col gap-3 border-t border-hairline pt-6">
        <legend className="t-label mb-3 text-graphite">Before it is considered</legend>
        <Check name="own-work">This is my own work, in a laboratory research setting.</Check>
        <Check name="no-human-use">It describes no use in people or animals, no doses and no health outcomes.</Check>
        <Check name="publish">
          Red Sky may publish it with the name and details above, and will take it down when I ask.
        </Check>
      </fieldset>

      <FormMessage error={state.error} />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? "Sending…" : "Send the story for review"}
        </button>
        {!defaults && (
          <p className="max-w-[40ch] text-[0.8125rem] leading-relaxed text-graphite">
            Ordered it from an account?{" "}
            <Link href="/account?next=/stories%23share" className="text-ink decoration-sun underline-offset-4">
              Sign in first
            </Link>{" "}
            and the story carries a verified order mark.
          </p>
        )}
      </div>
    </form>
  );
}
