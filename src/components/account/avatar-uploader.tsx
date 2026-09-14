"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { removeAvatar, uploadAvatar, type FormState } from "@/app/account/actions";
import { FormMessage } from "@/components/forms/fields";
import { refreshSession } from "@/lib/session-client";
import { Avatar } from "./avatar";

const SIZE = 320;

/**
 * Crops to a square and re-encodes in the browser before anything is sent, so
 * the upload is small and carries none of the original file's metadata —
 * including where a phone photo was taken.
 */
async function prepare(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file: JPEG, PNG or WebP.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("That file is over 20 MB. Choose a smaller photo.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("That file could not be read as an image. Try a JPEG or PNG.");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser could not prepare the image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  // Browsers without a WebP encoder hand back a PNG; JPEG keeps those small.
  const webp = await encode("image/webp", 0.88);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.9);
  if (!jpeg) throw new Error("That image could not be prepared. Try another.");
  return jpeg;
}

export function AvatarUploader({
  src,
  seed,
}: {
  src: string | null;
  seed: number;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<FormState>({});
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  // Once the server copy is live, drop the local preview.
  useEffect(() => setPreview(null), [src]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function choose(file: File | undefined) {
    if (!file) return;
    setStatus({});
    let blob: Blob;
    try {
      blob = await prepare(file);
    } catch (e) {
      setStatus({ error: (e as Error).message });
      return;
    }

    setPreview(URL.createObjectURL(blob));
    const form = new FormData();
    form.append(
      "avatar",
      new File([blob], blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg", { type: blob.type }),
    );

    startTransition(async () => {
      const res = await uploadAvatar(form);
      setStatus(res);
      if (res.error) setPreview(null);
      await refreshSession();
    });
  }

  function remove() {
    setStatus({});
    startTransition(async () => {
      setStatus(await removeAvatar());
      await refreshSession();
    });
  }

  const shown = preview ?? src;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={`relative rounded-full transition-[box-shadow,opacity] duration-150 ${
          dragging ? "shadow-[0_0_0_3px_var(--color-paper),0_0_0_5px_var(--color-ink)]" : ""
        } ${pending ? "opacity-60" : ""}`}
      >
        <Avatar src={shown} seed={seed} size={112} alt={shown ? "Your profile photo" : ""} />
      </div>

      <div className="min-w-0">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          className="visually-hidden"
          onChange={(e) => {
            choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending}
            className="btn btn-ghost min-h-[2.75rem] px-4 disabled:opacity-60"
          >
            {pending ? "Saving…" : src ? "Change photo" : "Upload a photo"}
          </button>
          {src && !pending && (
            <button
              type="button"
              onClick={remove}
              className="inline-flex h-11 items-center px-3 text-[0.8125rem] text-graphite underline decoration-hairline underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink"
            >
              Remove photo
            </button>
          )}
        </div>
        <p className="mt-2 max-w-[38ch] text-[0.75rem] leading-relaxed text-graphite">
          Or drop an image on the disc. It is cropped square and resized in your browser; the
          original file, and any location data in it, never leaves this device.
        </p>
        <div className="mt-2">
          <FormMessage error={status.error} message={status.message} />
        </div>
      </div>
    </div>
  );
}
