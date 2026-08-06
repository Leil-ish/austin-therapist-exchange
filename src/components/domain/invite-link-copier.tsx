"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function InviteLinkCopier({ profileId }: { profileId: string }) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://austintherapistexchange.com"}/join/apply?ref=${profileId}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground font-mono truncate">
        {inviteUrl}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0"
      >
        {copied ? (
          <><Check className="h-4 w-4 mr-1.5 text-green-500" /> Copied</>
        ) : (
          <><Copy className="h-4 w-4 mr-1.5" /> Copy link</>
        )}
      </Button>
    </div>
  );
}
