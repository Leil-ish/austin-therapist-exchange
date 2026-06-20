"use client";

import { useTransition } from "react";

import { confirmAvailability } from "@/app-actions/member-actions";
import { AVAILABILITY_STALE_DAYS } from "@/lib/referral-matching";

function daysSince(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

export function AvailabilityFreshnessBanner({
  availabilityStatus,
  availabilityUpdatedAt
}: {
  availabilityStatus: string;
  availabilityUpdatedAt?: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  const days = daysSince(availabilityUpdatedAt);
  const isStale = days === null || days > AVAILABILITY_STALE_DAYS;
  const isUnconfirmed = !availabilityUpdatedAt;

  if (!isStale && !isUnconfirmed) return null;

  const daysLabel = days !== null ? `${days} day${days === 1 ? "" : "s"} ago` : "not recently confirmed";

  function handleConfirm(status: "accepting" | "waitlist" | "not_accepting") {
    startTransition(async () => {
      await confirmAvailability(status);
    });
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 lg:col-span-2">
      <p className="text-sm font-medium text-amber-900">
        {isUnconfirmed
          ? "Your availability hasn't been confirmed yet — still accepting new clients?"
          : `Your availability was last confirmed ${daysLabel} — still accepting new clients?`}
      </p>
      <p className="mt-1 text-xs text-amber-700">
        A quick confirmation keeps your profile current for colleagues making referrals.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleConfirm("accepting")}
          className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          Yes, accepting
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleConfirm("waitlist")}
          className="rounded-full border border-amber-300 bg-white px-4 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50 transition-colors"
        >
          Waitlist only
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleConfirm("not_accepting")}
          className="rounded-full border border-amber-300 bg-white px-4 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50 transition-colors"
        >
          Not right now
        </button>
      </div>
    </div>
  );
}
