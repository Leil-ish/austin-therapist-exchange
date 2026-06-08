"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { followClinician, unfollowClinician } from "@/app-actions/member-actions";
import { Button } from "@/components/ui/button";

export function TrustToggleButton({
  followedProfileId,
  initialIsFollowed,
  size = "sm"
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

  let label: React.ReactNode;
  if (isPending) {
    label = <span className="opacity-50">Saving…</span>;
  } else if (isFollowed) {
    label = hovered ? (
      "Remove"
    ) : (
      <>
        <Check className="mr-1.5 h-3.5 w-3.5" />
        In your network
      </>
    );
  } else {
    label = "Add to trusted network";
  }

  const unfollowedVariant = size === "default" ? "outline" : "ghost";

  return (
    <div className="flex flex-col gap-1">
      <Button
        disabled={isPending}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        size={size}
        variant={isFollowed ? "outline" : unfollowedVariant}
      >
        {label}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
