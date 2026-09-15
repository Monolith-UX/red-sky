"use client";

import { useActionState, useState, useTransition } from "react";
import {
  changeProductImageAction,
  uploadProductImageAction,
  type ImageChange,
  type ProductState,
} from "@/app/admin/products/actions";
import { Field, FormMessage } from "@/components/forms/fields";
import { MAX_IMAGES, imagePath, type ProductImage } from "@/lib/products";

/**
 * A product's photos: the first is the main one, on the card and first in the
 * gallery. Each needs a description for people who cannot see it.
 */
export function ProductImages({ slug, images }: { slug: string; images: ProductImage[] }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(uploadProductImageAction.bind(null, slug), {});
  const [changing, start] = useTransition();
  const [result, setResult] = useState<ProductState>({});
  const change = (id: string, c: ImageChange) => start(async () => setResult(await changeProductImageAction(slug, id, c)));

  return (
    <div className="grid gap-8">
      {images.length === 0 ? (
        <p className="border-y border-hairline py-6 text-[0.9375rem] text-graphite">
          No photos yet. Until there is one, the catalogue shows the vial with this product’s own label.
        </p>
      ) : (
        <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="flex flex-col border border-hairline bg-paper">
              <div className="relative aspect-[5/4] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- served by our own route, already sized */}
                <img src={imagePath(slug, img)} alt={img.alt} className="absolute inset-0 h-full w-full object-contain" />
                {i === 0 && <span className="t-label absolute left-2 top-2 bg-ink px-2 py-1 text-paper">Main</span>}
              </div>
              <div className="grid gap-3 p-3">
                <AltEditor alt={img.alt} busy={changing} onSave={(alt) => change(img.id, { kind: "alt", alt })} />
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {i > 0 && (
                    <button
                      type="button"
                      disabled={changing}
                      onClick={() => change(img.id, { kind: "main" })}
                      className="text-[0.8125rem] underline decoration-hairline underline-offset-4 hover:decoration-ink disabled:opacity-50"
                    >
                      Make main
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={changing}
                    onClick={() => confirm("Remove this image?") && change(img.id, { kind: "remove" })}
                    className="text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 hover:text-ink hover:decoration-ink disabled:opacity-50"
                  >
                    Remove<span className="visually-hidden"> image {i + 1}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <FormMessage error={result.error} message={result.message} />

      {images.length < MAX_IMAGES ? (
        <form action={action} noValidate className="grid gap-5 border-t border-hairline pt-6 md:grid-cols-2">
          <div>
            <label htmlFor="product-image" className="t-label block text-graphite">
              Add a photo
            </label>
            <input
              id="product-image"
              type="file"
              name="image"
              accept="image/png,image/jpeg,image/webp"
              className="mt-2 block w-full text-[0.875rem] file:mr-4 file:h-11 file:border file:border-ink file:bg-paper file:px-4 file:text-[0.8125rem]"
            />
            <p className="mt-2 text-[0.8125rem] text-graphite">PNG, JPEG or WebP, up to 4 MB.</p>
          </div>
          <Field
            label="Description for screen readers"
            name="alt"
            placeholder="BPC-157 vial, lot label facing"
            note="What the photo shows, in a sentence."
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-2">
            <button type="submit" disabled={pending} className="btn btn-ghost disabled:opacity-60">
              {pending ? "Uploading…" : "Upload the photo"}
            </button>
            <FormMessage error={state.error} message={state.message} />
          </div>
        </form>
      ) : (
        <p className="text-[0.875rem] text-graphite">This product has the most photos it can hold ({MAX_IMAGES}).</p>
      )}
    </div>
  );
}

function AltEditor({ alt, busy, onSave }: { alt: string; busy: boolean; onSave: (alt: string) => void }) {
  const [value, setValue] = useState(alt);
  return (
    <div className="flex items-end gap-2">
      <Field label="Description" name="alt-edit" value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 flex-1" />
      {value !== alt && (
        <button type="button" disabled={busy} onClick={() => onSave(value)} className="btn btn-ghost h-12 px-3 disabled:opacity-50">
          Save
        </button>
      )}
    </div>
  );
}
