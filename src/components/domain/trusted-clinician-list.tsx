"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAvailabilityLabel } from "@/lib/availability-label";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
import type { FollowedClinicianSummary } from "@/types";

const PAGE_SIZE = 5;

export function TrustedClinicianList({ following }: { following: FollowedClinicianSummary[] }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? following : following.slice(0, PAGE_SIZE);
  const remaining = following.length - PAGE_SIZE;

  return (
    <div className="space-y-2">
      <Card className="overflow-hidden bg-white/90">
        <ul className="divide-y divide-border">
          {visible.map((clinician) => (
            <li key={clinician.profileId} className="flex items-center gap-0 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                >
                  {getInitials(clinician.displayName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{clinician.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{clinician.title}</p>
                </div>
              </div>
              <div className="flex w-44 shrink-0 justify-center">
                <Badge className="w-full justify-center">{getAvailabilityLabel(clinician.availabilityStatus)}</Badge>
              </div>
              <span className="w-32 shrink-0 text-right text-xs text-muted-foreground">Added {clinician.followedAtLabel}</span>
              <Link
                className="w-24 shrink-0 text-right text-sm font-medium text-primary hover:text-primary/80"
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
          className="text-sm font-medium text-primary hover:text-primary/80"
          onClick={() => setExpanded(true)}
          type="button"
        >
          Show {remaining} more
        </button>
      )}
      {expanded && following.length > PAGE_SIZE && (
        <button
          className="text-sm font-medium text-primary hover:text-primary/80"
          onClick={() => setExpanded(false)}
          type="button"
        >
          Show less
        </button>
      )}
    </div>
  );
}
