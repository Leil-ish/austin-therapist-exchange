"use client";

import "react-easy-crop/react-easy-crop.css";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";

import { updateAvatarUrl } from "@/app-actions/member-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getInitials } from "@/components/ui/avatar";

// Decode EXIF orientation via ImageBitmap so phone photos aren't sideways
async function readFileNormalized(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image" as ImageOrientation,
  });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.95);
}

// Render the chosen region onto a 512×512 canvas and export as WebP (or JPEG)
async function getCroppedBlob(
  src: string,
  pixels: Area,
): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const img = new Image();
  img.src = src;
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
  });

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  canvas
    .getContext("2d")!
    .drawImage(img, pixels.x, pixels.y, pixels.width, pixels.height, 0, 0, 512, 512);

  return new Promise((res, rej) => {
    canvas.toBlob(
      (b) => {
        if (b) { res({ blob: b, ext: "webp" }); return; }
        canvas.toBlob(
          (j) => (j ? res({ blob: j, ext: "jpg" }) : rej(new Error("Canvas export failed"))),
          "image/jpeg",
          0.9,
        );
      },
      "image/webp",
      0.9,
    );
  });
}

// ─── Crop editor modal ────────────────────────────────────────────────────────

function CropEditor({
  src,
  onSave,
  onCancel,
}: {
  src: string;
  onSave: (blob: Blob, ext: "webp" | "jpg") => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const croppedPixelsRef = useRef<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    croppedPixelsRef.current = pixels;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function handleSave() {
    if (!croppedPixelsRef.current) return;
    setIsExporting(true);
    try {
      const result = await getCroppedBlob(src, croppedPixelsRef.current);
      onSave(result.blob, result.ext);
    } catch {
      setIsExporting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop your photo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="font-serif text-lg font-semibold text-foreground">Crop your photo</h2>

        {/* react-easy-crop fills this container via absolute positioning */}
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="avatar-zoom" className="text-xs text-muted-foreground">
            Zoom
          </label>
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExporting}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isExporting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isExporting ? "Processing…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main upload component ────────────────────────────────────────────────────

export function AvatarUpload({
  userId,
  displayName,
  currentAvatarUrl,
}: {
  userId: string;
  displayName: string;
  currentAvatarUrl?: string;
}) {
  const [preview, setPreview] = useState<string | undefined>(currentAvatarUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-selected after cancel
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB.");
      return;
    }

    setError(null);
    setSaved(false);

    try {
      const normalized = await readFileNormalized(file);
      setCropSrc(normalized);
    } catch {
      setError("Could not read the selected file.");
    }
  }

  async function handleCropSave(blob: Blob, ext: "webp" | "jpg") {
    setCropSrc(null);
    setIsPending(true);
    setSaved(false);
    setError(null);

    const objectUrl = URL.createObjectURL(blob);
    setPreview(objectUrl);

    const path = `${userId}/avatar.${ext}`;
    const supabase = createSupabaseBrowserClient();
    const contentType = ext === "webp" ? "image/webp" : "image/jpeg";

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType });

    if (uploadError) {
      console.error("Avatar upload failed:", uploadError);
      setPreview(currentAvatarUrl);
      setIsPending(false);
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const fd = new FormData();
    fd.append("avatarUrl", publicUrl);

    const result = await updateAvatarUrl(fd);
    setIsPending(false);

    if (result?.error) {
      console.error("Avatar URL save failed:", result.error);
      setError(`Save failed: ${result.error}`);
    } else {
      setSaved(true);
    }
  }

  function handleCropCancel() {
    setCropSrc(null);
  }

  const initials = getInitials(displayName);

  return (
    <>
      {cropSrc && (
        <CropEditor
          src={cropSrc}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}
      <div className="flex flex-col items-center gap-3">
        <button
          aria-label="Change profile photo"
          className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted transition hover:border-primary/50"
          disabled={isPending}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={displayName}
              className="h-full w-full object-cover"
              src={preview}
            />
          ) : (
            <span className="text-xl font-semibold text-muted-foreground">
              {initials}
            </span>
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white transition ${
              isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isPending ? "Saving…" : "Change"}
          </span>
        </button>
        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          type="file"
          onChange={handleFileChange}
        />
        <p className="text-xs text-muted-foreground">
          Click to upload · JPEG, PNG, or WebP · max 5 MB
        </p>
        {isPending && (
          <p className="animate-pulse text-xs text-muted-foreground">Saving photo…</p>
        )}
        {saved && !isPending && (
          <p className="text-xs text-green-600">Photo saved — you can now save your profile.</p>
        )}
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}
