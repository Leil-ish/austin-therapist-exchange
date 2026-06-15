"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";

import { followClinician, unfollowClinician } from "@/app-actions/member-actions";

export function TrustToggleButton({
  followedProfileId,
  initialIsFollowed,
}: {
  followedProfileId: string;
  initialIsFollowed: boolean;
  size?: "sm" | "default";
}) {
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const prev = isFollowed;
    setIsFollowed(!isFollowed);
    setError(null);

    startTransition(async () => {
      const result = prev
        ? await unfollowClinician(followedProfileId)
        : await followClinician(followedProfileId);

      if (!result.ok) {
        setIsFollowed(prev);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {isFollowed ? (
        <div
          className="inline-flex items-center"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hovered ? (
            <button
              className="text-xs text-muted-foreground/60 transition-colors hover:text-red-500 disabled:opacity-40"
              disabled={isPending}
              onClick={handleClick}
              type="button"
            >
              {isPending ? "Saving…" : "Remove"}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground/40" />
              Trusted
            </span>
          )}
        </div>
      ) : (
        <button
          className="text-sm font-medium text-foreground transition-colors hover:text-foreground/70 disabled:opacity-40"
          disabled={isPending}
          onClick={handleClick}
          type="button"
        >
          {isPending ? <span className="opacity-50">Saving…</span> : "+ Add to trusted network"}
        </button>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
