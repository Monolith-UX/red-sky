"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

/**
 * The house form controls: a tracked mono label above a hairline-framed input,
 * with a note or an error beneath, wired to the input for assistive tech.
 */

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  note?: ReactNode;
  error?: string;
  optional?: boolean;
  ref?: Ref<HTMLInputElement>;
};

export function Field({ label, note, error, optional, className = "", ...input }: FieldProps) {
  const id = useId();
  const described = error ? `${id}-error` : note ? `${id}-note` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="t-label flex items-baseline justify-between gap-3 text-graphite">
        {label}
        {optional && <span className="text-[0.625rem] tracking-[0.12em] text-graphite/80">Optional</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className="mt-2 h-12 w-full border border-graphite bg-white px-3.5 text-[0.9375rem] transition-colors duration-150 placeholder:text-graphite/60 hover:border-ink aria-[invalid=true]:border-sun"
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-[0.8125rem] leading-snug text-sun">
          {error}
        </p>
      ) : (
        note && (
          <p id={`${id}-note`} className="mt-2 text-[0.8125rem] leading-snug text-graphite">
            {note}
          </p>
        )
      )}
    </div>
  );
}

export function PasswordField(props: FieldProps) {
  const [shown, setShown] = useState(false);
  const { label, note, error, className = "", ...input } = props;
  const id = useId();
  const described = error ? `${id}-error` : note ? `${id}-note` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="t-label block text-graphite">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className="h-12 w-full border border-graphite bg-white pl-3.5 pr-[4.75rem] text-[0.9375rem] transition-colors duration-150 hover:border-ink aria-[invalid=true]:border-sun"
          {...input}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-controls={id}
          className="t-label absolute inset-y-1 right-1 px-3 text-graphite transition-colors duration-150 hover:text-ink"
        >
          {shown ? "Hide" : "Show"}
          <span className="visually-hidden"> password</span>
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-[0.8125rem] leading-snug text-sun">
          {error}
        </p>
      ) : (
        note && (
          <p id={`${id}-note`} className="mt-2 text-[0.8125rem] leading-snug text-graphite">
            {note}
          </p>
        )
      )}
    </div>
  );
}

export function Check({
  name,
  children,
  defaultChecked,
  required,
}: {
  name: string;
  children: ReactNode;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[0.875rem] leading-relaxed">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        required={required}
        className="mt-[0.3rem] h-4 w-4 shrink-0 accent-sun"
      />
      <span>{children}</span>
    </label>
  );
}

/** A form-level message: an alert for errors, a quiet confirmation otherwise. */
export function FormMessage({ error, message }: { error?: string; message?: string }) {
  return (
    <div aria-live="polite" className="min-h-[1.25rem]">
      {error ? (
        <p role="alert" className="flex items-start gap-2 text-[0.8125rem] leading-snug text-sun">
          <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true" className="mt-[0.15rem] shrink-0">
            <circle cx="6.5" cy="6.5" r="6" fill="none" stroke="currentColor" />
            <path d="M6.5 3v4" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="6.5" cy="9.4" r="0.8" fill="currentColor" />
          </svg>
          {error}
        </p>
      ) : (
        message && (
          <p className="flex items-center gap-2 text-[0.8125rem] text-ink">
            <span className="dot" aria-hidden="true" />
            {message}
          </p>
        )
      )}
    </div>
  );
}
