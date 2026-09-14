"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { sendMessage, type ContactState } from "@/app/contact/actions";
import { Field, FormMessage } from "@/components/forms/fields";
import { CLINICAL, TOPICS, channelFor, isTopic, type TopicValue } from "@/lib/contact";

/** Remounts the form after a message is sent, so "send another" starts clean. */
export function ContactForm() {
  const [round, setRound] = useState(0);
  return <MessageForm key={round} onAnother={() => setRound((r) => r + 1)} />;
}

function MessageForm({ onAnother }: { onAnother: () => void }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, {});
  const [topic, setTopic] = useState<TopicValue>("lot");
  const [draft, setDraft] = useState("");
  const id = useId();
  const sentHeading = useRef<HTMLHeadingElement>(null);

  // Links elsewhere on the site preselect a topic: /contact?topic=synthesis.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("topic");
    if (isTopic(wanted)) setTopic(wanted);
  }, []);

  useEffect(() => {
    if (state.fields && isTopic(state.fields.topic)) setTopic(state.fields.topic);
    if (state.sent) sentHeading.current?.focus();
  }, [state]);

  const channel = channelFor(topic);
  const f = state.fields;

  if (state.sent) {
    return (
      <div className="border-t border-ink pt-7">
        <p className="rail-label">Message received — {state.sent.ref}</p>
        <h3 ref={sentHeading} tabIndex={-1} className="t-h2 mt-6 max-w-[16ch] text-[clamp(1.75rem,2.6vw,2.25rem)] focus:outline-none">
          Thank you. It is on the list for {channel.title.toLowerCase()}.
        </h3>
        <p className="t-body mt-4 text-[0.9375rem]">
          Keep the reference <span className="t-data text-ink">{state.sent.ref}</span>. The reply
          goes to <span className="t-data text-ink">{state.sent.email}</span>,{" "}
          {channel.reply.toLowerCase()}.
        </p>
        {state.sent.clinical && (
          <p className="mt-5 flex items-start gap-2.5 border-t border-hairline pt-4 text-[0.875rem] leading-relaxed">
            <span className="dot mt-[0.55em]" aria-hidden="true" />
            <span>
              Part of your message reads as a question about dosing or use in a person or an animal.
              We cannot answer that part; we will answer anything about handling or the certificate.
            </span>
          </p>
        )}
        <p className="t-data mt-5 border-t border-hairline pt-4 text-[0.75rem] leading-relaxed text-graphite">
          This build stores the message but does not yet forward it to an inbox.
        </p>
        <button type="button" onClick={onAnother} className="btn btn-ghost mt-7">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <div>
        <label htmlFor={`${id}-topic`} className="t-label block text-graphite">
          What it is about
        </label>
        <select
          id={`${id}-topic`}
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as TopicValue)}
          aria-describedby={`${id}-route`}
          className="mt-2 h-12 w-full border border-graphite bg-white px-3 text-[0.9375rem] transition-colors duration-150 hover:border-ink"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <p id={`${id}-route`} className="t-data mt-2 text-[0.75rem] text-graphite">
          Goes to {channel.email} · {channel.reply.toLowerCase()}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" defaultValue={f?.name} />
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={f?.email}
          placeholder="you@lab.org"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Organisation"
          name="organisation"
          autoComplete="organization"
          defaultValue={f?.organisation}
          optional
        />
        <Field
          label="Lot number"
          name="lot"
          defaultValue={f?.lot}
          placeholder="RS-2601-B"
          optional
          autoCapitalize="characters"
          spellCheck={false}
        />
      </div>

      <div>
        <label htmlFor={`${id}-message`} className="t-label block text-graphite">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={6}
          defaultValue={f?.message}
          onChange={(e) => setDraft(e.target.value)}
          aria-describedby={`${id}-clinical`}
          className="mt-2 block w-full resize-y border border-graphite bg-white px-3.5 py-3 text-[0.9375rem] leading-relaxed transition-colors duration-150 hover:border-ink"
        />
        <p id={`${id}-clinical`} aria-live="polite" className="mt-2 min-h-[1.25rem] text-[0.8125rem] leading-snug text-graphite">
          {CLINICAL.test(draft) &&
            "We do not answer dosing, medical or veterinary questions. Handling and certificate questions are welcome."}
        </p>
      </div>

      {/* Left empty by people; filled in by bots that fill in everything. */}
      <div aria-hidden="true" className="visually-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <FormMessage error={state.error} />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? "Sending…" : "Send the message"}
        </button>
        <p className="max-w-[36ch] text-[0.75rem] leading-relaxed text-graphite">
          What you send is used only to answer it.{" "}
          <Link href="/privacy" className="decoration-sun underline-offset-4">
            Privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
