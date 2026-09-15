"use client";

import { useActionState, useId, useState } from "react";
import { saveProductAction, type ProductState } from "@/app/admin/products/actions";
import { Field, FormMessage } from "@/components/forms/fields";
import { CLASSES } from "@/lib/catalog";
import { averageMass, slugify, type ProductRecord } from "@/lib/products";

type Values = Pick<ProductRecord, "slug" | "name" | "formula" | "mass" | "klass" | "note" | "sequence" | "salt" | "appearance">;

/**
 * Adds a product (no `original`) or edits one. The formula's own average mass
 * is worked out as it is typed, so a wrong mass shows before it is saved.
 */
export function ProductForm({ original, values }: { original: string | null; values: Values | null }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(saveProductAction.bind(null, original), {});
  const [name, setName] = useState(values?.name ?? "");
  const [slug, setSlug] = useState(values?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formula, setFormula] = useState(values?.formula ?? "");
  const [mass, setMass] = useState(values?.mass ?? "");
  const classId = useId();
  const isNew = original === null;

  const computed = averageMass(formula.replace(/\s+/g, ""));
  const massNote =
    computed === null
      ? formula
        ? "Not a formula this form recognises. Use Hill notation, e.g. C62H98N16O22."
        : "The average molecular weight, in daltons."
      : Math.abs(Number(mass) - computed) <= 0.1
        ? `Matches the formula (${computed.toFixed(2)} Da).`
        : `The formula weighs ${computed.toFixed(2)} Da on average.`;

  return (
    <form action={action} noValidate className="grid gap-10">
      <fieldset className="grid gap-5 md:grid-cols-2">
        <legend className="t-label mb-4 text-graphite">The product</legend>
        <Field
          label="Name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (isNew && !slugTouched) setSlug(slugify(e.target.value));
          }}
          placeholder="Tesamorelin"
        />
        <Field
          label="Web address"
          name="slug"
          value={slug}
          readOnly={!isNew}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase());
          }}
          note={isNew ? `The page will be /catalog/${slug || "…"}. It cannot change later.` : "Fixed: orders and links point at it."}
          spellCheck={false}
        />
        <Field
          label="Molecular formula"
          name="formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="C62H98N16O22"
          spellCheck={false}
        />
        <Field
          label="Average mass, Da"
          name="mass"
          inputMode="decimal"
          value={mass}
          onChange={(e) => setMass(e.target.value)}
          note={massNote}
        />
        <div>
          <label htmlFor={classId} className="t-label block text-graphite">
            Catalogue class
          </label>
          <select
            id={classId}
            name="klass"
            defaultValue={values?.klass ?? CLASSES[0].key}
            className="mt-2 h-12 w-full border border-graphite bg-white px-3 text-[0.9375rem] hover:border-ink"
          >
            {CLASSES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <Field label="One-line note" name="note" defaultValue={values?.note ?? ""} placeholder="GHRH (1-44) analogue." />
        <Field
          label="Amino-acid sequence"
          name="sequence"
          defaultValue={values?.sequence ?? ""}
          optional
          spellCheck={false}
          className="md:col-span-2"
        />
        <Field label="Salt form" name="salt" defaultValue={values?.salt ?? ""} placeholder="Trifluoroacetate" optional />
        <Field
          label="Appearance"
          name="appearance"
          defaultValue={values?.appearance ?? ""}
          placeholder="White to off-white lyophilized powder"
          optional
        />
      </fieldset>

      {isNew && (
        <fieldset className="grid gap-5 md:grid-cols-3">
          <legend className="t-label mb-4 text-graphite">What it starts with</legend>
          <Field label="Price per vial, $" name="price" inputMode="decimal" />
          <Field label="Fill per vial" name="fill" placeholder="5 mg" />
          <Field label="First lot expected" name="expected" type="date" />
          <p className="text-[0.8125rem] leading-relaxed text-graphite md:col-span-3">
            A new product shows as Coming soon, with a waitlist, until you release its first lot on
            the lot page.
          </p>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-6">
        <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-60">
          {pending ? "Saving…" : isNew ? "Add the product" : "Save and publish"}
        </button>
        <FormMessage error={state.error} message={state.message} />
      </div>
    </form>
  );
}
