"use client";

import { useState } from "react";
import type { CatalogItem } from "@/lib/catalog";
import { imagePath } from "@/lib/products";
import { Vial } from "./vial";

/**
 * A product's photos, main one first, with the vial printed with this lot's
 * own label as the last view — so the certificate's lot number is always one
 * click away. Only used when the product has photos; otherwise the page shows
 * the vial alone, as before.
 */
export function ProductGallery({ item }: { item: CatalogItem }) {
  const images = item.images ?? [];
  const [shown, setShown] = useState(0); // images.length means the vial
  const vial = shown >= images.length;

  return (
    <div>
      <div className="relative aspect-[4/3] w-full">
        {vial ? (
          <Vial item={item} className="absolute inset-0 h-full w-full p-6" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own route, versioned for caching
          <img
            src={imagePath(item.slug, images[shown])}
            alt={images[shown].alt}
            className="absolute inset-0 h-full w-full object-contain p-4"
          />
        )}
      </div>
      <ul role="list" aria-label={`Views of ${item.name}`} className="flex flex-wrap gap-2 border-t border-hairline p-3">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => setShown(i)}
              aria-pressed={shown === i}
              aria-label={`Show photo ${i + 1}: ${img.alt}`}
              className="relative block h-14 w-14 overflow-hidden border border-hairline bg-white aria-pressed:border-ink"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail of the same route */}
              <img src={imagePath(item.slug, img)} alt="" className="h-full w-full object-cover" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setShown(images.length)}
            aria-pressed={vial}
            aria-label={`Show the vial with lot ${item.lot ?? "label"}`}
            className="t-data grid h-14 w-14 place-items-center border border-hairline bg-white text-[0.625rem] text-graphite aria-pressed:border-ink aria-pressed:text-ink"
          >
            Label
          </button>
        </li>
      </ul>
    </div>
  );
}
