"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { claimProfile } from "@/app-actions/member-actions";

export function ClaimProfileButton() {
  const [claimed, setClaimed] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClaim() {
    setPending(true);
    const result = await claimProfile();
    if (result.ok) setClaimed(true);
    setPending(false);
  }

  if (claimed) {
    return (
      <p className="text-sm font-medium text-primary">
        ✓ Profile claimed — thank you for reviewing your information!
      </p>
    );
  }

  return (
    <Button onClick={handleClaim} disabled={pending}>
      {pending ? "Saving…" : "My profile looks accurate"}
    </Button>
  );
}
