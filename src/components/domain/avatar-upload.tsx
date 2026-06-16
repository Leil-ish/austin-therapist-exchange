"use client";

import { useRef, useState, useTransition } from "react";

import { updateAvatarUrl } from "@/app-actions/member-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getInitials } from "@/components/ui/avatar";

export function AvatarUpload({
  userId,
  displayName,
  currentAvatarUrl
}: {
  userId: string;
  displayName: string;
  currentAvatarUrl?: string;
}) {
  const [preview, setPreview] = useState<string | undefined>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB.");
      return;
    }

    setError(null);

    // Optimistic local preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const supabase = createSupabaseBrowserClient();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      console.error("Avatar upload failed:", uploadError);
      setPreview(currentAvatarUrl);
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const fd = new FormData();
    fd.append("avatarUrl", publicUrl);

    startTransition(async () => {
      const result = await updateAvatarUrl(fd);
      if (result?.error) {
        console.error("Avatar URL save failed:", result.error);
        setError(`Save failed: ${result.error}`);
      }
    });
  }

  const initials = getInitials(displayName);

  return (
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
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
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
      <p className="text-xs text-muted-foreground">Click to upload a photo · JPEG, PNG, or WebP · max 5 MB</p>
      {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
