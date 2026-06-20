"use client";

import { useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import type { AvailabilityStatus, FollowedClinicianSummary } from "@/types";

function AvailabilityDot({ status }: { status: AvailabilityStatus }) {
  if (status === "accepting") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        Accepting
      </span>
    );
  }
  if (status === "waitlist") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
        Limited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
      Not accepting
    </span>
  );
}

const PAGE_SIZE = 5;

export function TrustedClinicianList({ following }: { following: FollowedClinicianSummary[] }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? following : following.slice(0, PAGE_SIZE);
  const remaining = following.length - PAGE_SIZE;

  return (
    <div className="space-y-2">
      <Card className="overflow-hidden bg-white/90">
        <ul className="divide-y divide-border/40">
          {visible.map((clinician) => (
            <li key={clinician.profileId} className="flex items-center gap-0 px-5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar avatarUrl={clinician.avatarUrl} name={clinician.displayName} size="xs" />
                <div className="min-w-0">
                  <Link
                    href={`/directory/${clinician.slug}?returnTo=/member/network`}
                    className="truncate text-sm font-medium text-foreground hover:underline underline-offset-4"
                  >
                    {clinician.displayName}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{clinician.title}</p>
                </div>
              </div>
              <div className="flex w-36 shrink-0 justify-center">
                <AvailabilityDot status={clinician.availabilityStatus} />
              </div>
              <span className="w-32 shrink-0 text-right text-xs text-muted-foreground/60">Added {clinician.followedAtLabel}</span>
              <Link
                className="w-24 shrink-0 text-right text-sm font-medium text-primary transition-colors hover:text-primary/70"
                href={`/directory/${clinician.slug}`}
              >
                View profile
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {!expanded && remaining > 0 && (
        <button
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setExpanded(true)}
          type="button"
        >
          Show {remaining} more
        </button>
      )}
      {expanded && following.length > PAGE_SIZE && (
        <button
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setExpanded(false)}
          type="button"
        >
          Show less
        </button>
      )}
    </div>
  );
}
