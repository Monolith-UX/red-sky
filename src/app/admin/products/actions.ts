"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { seedCatalogue } from "@/lib/catalog";
import { knownFacts } from "@/lib/coa";
import { clean } from "@/lib/forms";
import { IMAGE_LIMIT, MAX_IMAGES, readProductForm, type ProductRecord } from "@/lib/products";
import { audit, rebuild, requireAdmin, sniffImage } from "@/lib/server/admin";
import {
  deleteProduct,
  getProducts,
  importProducts,
  productInUse,
  removeProductImage,
  saveProduct,
  saveProductImage,
} from "@/lib/server/store";

export type ProductState = { error?: string; ok?: boolean; message?: string };

const done = (path: string) => {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(path);
};

/**
 * The first time: copies the sample products written in code into the store,
 * with what is known of their sequences, so the list staff edit starts as the
 * site stands. Never overwrites a product already there.
 */
export async function importCatalogueAction(): Promise<ProductState> {
  const admin = await requireAdmin();
  const rows: Omit<ProductRecord, "updated">[] = seedCatalogue.map((item, position) => {
    const known = knownFacts(item.slug);
    return {
      slug: item.slug,
      name: item.name,
      formula: item.formula,
      mass: item.mass,
      klass: item.klass,
      note: item.note,
      sequence: known.sequence ?? null,
      salt: known.salt ?? null,
      appearance: known.appearance ?? null,
      images: [],
      stock: item.stock,
      price: item.price,
      fill: item.fill,
      retention: item.retention,
      lot: item.lot,
      purity: item.purity,
      released: item.released,
      expected: item.expected ?? null,
      position,
      archived: false,
      updatedBy: admin.email,
    };
  });
  let added: number;
  try {
    added = await importProducts(rows);
  } catch {
    return { error: "The products table is not there yet. Run the products migration in Supabase, then try again." };
  }
  await audit(admin.email, "products.import", { added });
  done("/admin/products");
  // The import screen gives way to the list once products exist, so the confirmation is on the list.
  redirect(`/admin/products?imported=${added}`);
}

/** Creates a product (no `original`) or edits one. A new product starts as Coming soon. */
export async function saveProductAction(original: string | null, _: ProductState, form: FormData): Promise<ProductState> {
  const admin = await requireAdmin();
  const products = await getProducts();
  if (!Object.keys(products).length) return { error: "Copy the current catalogue in first, so no product goes missing." };

  const read = readProductForm(form, original === null);
  if ("error" in read) return { error: read.error };
  const { start, ...fields } = read.product;

  if (original === null) {
    if (products[fields.slug]) return { error: `There is already a product at /catalog/${fields.slug}. Choose another web address.` };
    await saveProduct({
      ...fields,
      images: [],
      stock: "upcoming",
      price: start!.price,
      fill: start!.fill,
      retention: 10,
      lot: null,
      purity: null,
      released: null,
      expected: start!.expected,
      position: Math.max(0, ...Object.values(products).map((p) => p.position)) + 1,
      archived: false,
      updatedBy: admin.email,
    });
    await audit(admin.email, "product.create", { slug: fields.slug, name: fields.name });
    await rebuild();
    done(`/admin/products/${fields.slug}`);
    redirect(`/admin/products/${fields.slug}?created=1`);
  }

  const existing = products[original];
  if (!existing) return { error: "That product is no longer in the store." };
  // The web address is fixed once a product exists: orders, lots and links point at it.
  await saveProduct({ ...existing, ...fields, slug: existing.slug, updatedBy: admin.email });
  await audit(admin.email, "product.save", { slug: existing.slug, name: fields.name });
  done(`/admin/products/${existing.slug}`);
  return { ok: true, message: await rebuild() };
}

/** Takes a product off the site, or puts it back. Its record, lot and images are kept. */
export async function archiveProductAction(slug: string, archived: boolean): Promise<ProductState> {
  const admin = await requireAdmin();
  const existing = (await getProducts())[slug];
  if (!existing) return { error: "That product is no longer in the store." };
  await saveProduct({ ...existing, archived, updatedBy: admin.email });
  await audit(admin.email, archived ? "product.archive" : "product.restore", { slug });
  done(`/admin/products/${slug}`);
  const next = await rebuild();
  return {
    ok: true,
    message: archived
      ? `Removed from the site; its record stays, so past orders still name it. ${next}`
      : `Back in the catalogue. ${next}`,
  };
}

/** Deletes a product for good — only one nothing refers to. Anything else is archived instead. */
export async function deleteProductAction(slug: string): Promise<ProductState> {
  const admin = await requireAdmin();
  const existing = (await getProducts())[slug];
  if (!existing) return { error: "That product is no longer in the store." };
  if (await productInUse(slug)) {
    return { error: "Orders, standing orders or stories refer to this product, so it can only be removed from the site, not deleted." };
  }
  await deleteProduct(slug);
  await audit(admin.email, "product.delete", { slug, name: existing.name });
  await rebuild();
  done("/admin/products");
  redirect("/admin/products?deleted=" + encodeURIComponent(existing.name));
}

/** Moves a product one place up or down the catalogue order. */
export async function moveProductAction(slug: string, direction: -1 | 1): Promise<ProductState> {
  const admin = await requireAdmin();
  const ordered = Object.values(await getProducts()).sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  const at = ordered.findIndex((p) => p.slug === slug);
  const to = at + (direction === 1 ? 1 : -1);
  if (at < 0 || to < 0 || to >= ordered.length) return { ok: true };
  [ordered[at], ordered[to]] = [ordered[to], ordered[at]];
  // Renumber everything once, so positions stay a clean 0…n after imports and deletes.
  for (const [position, p] of ordered.entries()) {
    if (p.position !== position) await saveProduct({ ...p, position, updatedBy: admin.email });
  }
  await audit(admin.email, "product.move", { slug, direction });
  done("/admin/products");
  return { ok: true, message: await rebuild() };
}

/* ── Images ────────────────────────────────────────────────── */

export async function uploadProductImageAction(slug: string, _: ProductState, form: FormData): Promise<ProductState> {
  const admin = await requireAdmin();
  const existing = (await getProducts())[slug];
  if (!existing) return { error: "That product is no longer in the store." };
  if (existing.images.length >= MAX_IMAGES) return { error: `A product holds up to ${MAX_IMAGES} images. Remove one first.` };

  const alt = clean(form.get("alt"), 160);
  if (!alt) return { error: "Describe the image for people who cannot see it, e.g. “BPC-157 vial, lot label facing”." };

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (file.size > IMAGE_LIMIT) return { error: "That image is over 4 MB. Export it smaller and try again." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return { error: "That file is not a PNG, JPEG or WebP image." };

  const image = { id: randomBytes(8).toString("hex"), type, alt, version: Date.now() };
  await saveProductImage(slug, image, bytes);
  await saveProduct({ ...existing, images: [...existing.images, image], updatedBy: admin.email });
  await audit(admin.email, "product.image.add", { slug, image: image.id });
  done(`/admin/products/${slug}`);
  return { ok: true, message: `Image added. ${await rebuild()}` };
}

export type ImageChange = { kind: "main" } | { kind: "remove" } | { kind: "alt"; alt: string };

export async function changeProductImageAction(slug: string, id: string, change: ImageChange): Promise<ProductState> {
  const admin = await requireAdmin();
  const existing = (await getProducts())[slug];
  const image = existing?.images.find((i) => i.id === id);
  if (!existing || !image) return { error: "That image is no longer on this product." };

  let images = existing.images;
  if (change.kind === "main") images = [image, ...images.filter((i) => i.id !== id)];
  if (change.kind === "remove") {
    images = images.filter((i) => i.id !== id);
    await removeProductImage(slug, image);
  }
  if (change.kind === "alt") {
    const alt = clean(change.alt, 160);
    if (!alt) return { error: "The description cannot be empty." };
    images = images.map((i) => (i.id === id ? { ...i, alt } : i));
  }
  await saveProduct({ ...existing, images, updatedBy: admin.email });
  await audit(admin.email, `product.image.${change.kind}`, { slug, image: id });
  done(`/admin/products/${slug}`);
  return { ok: true, message: await rebuild() };
}
