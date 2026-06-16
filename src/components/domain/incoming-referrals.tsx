"use client";

import { useState, useTransition } from "react";

import { respondToIncomingReferral } from "@/app-actions/member-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IncomingReferral, ReferralStatus } from "@/lib/data/referral-tracking";

function statusClasses(status: ReferralStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-700";
    case "accepted":
      return "bg-blue-100 text-blue-700";
    case "declined":
      return "bg-red-100 text-red-600";
    case "closed":
      return "bg-gray-100 text-gray-500";
    case "completed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

function statusLabel(status: ReferralStatus): string {
  switch (status) {
    case "open": return "Pending your response";
    case "accepted": return "You accepted";
    case "declined": return "Marked not a fit";
    case "closed": return "Dismissed";
    case "completed": return "Placed";
    default: return status;
  }
}

function ReferralCard({ referral: initial }: { referral: IncomingReferral }) {
  const [referral, setReferral] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function respond(response: "accepted" | "declined" | "dismissed") {
    const optimisticStatus: ReferralStatus =
      response === "dismissed" ? "closed" : response;
    setReferral((prev) => ({
      ...prev,
      status: optimisticStatus,
      respondedAtLabel: "just now",
    }));
    startTransition(async () => {
      const result = await respondToIncomingReferral(referral.caseReferralId, response);
      if (!result.ok) {
        // revert on failure
        setReferral(initial);
      }
    });
  }

  function undoResponse() {
    setReferral((prev) => ({ ...prev, status: "open", respondedAtLabel: undefined }));
    startTransition(async () => {
      await respondToIncomingReferral(referral.caseReferralId, "dismissed");
    });
  }

  const hasResponded = referral.status !== "open";

  return (
    <div className="rounded-2xl border bg-background p-4 space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={referral.referringClinicianName} size="sm" />
          <div className="space-y-0.5 min-w-0">
            <p className="font-medium text-foreground">
              Referral from {referral.referringClinicianName}
            </p>
            <p className="text-xs text-muted-foreground">
              Logged {referral.receivedAtLabel}
              {referral.respondedAtLabel ? ` · Responded ${referral.respondedAtLabel}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-muted-foreground border rounded px-1.5 py-0.5">
            {referral.clientReference}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClasses(referral.status)}`}
          >
            {statusLabel(referral.status)}
          </span>
        </div>
      </div>

      {/* De-identified criteria */}
      <div className="flex flex-wrap gap-1.5">
        {referral.levelOfCare && <Badge variant="outline">{referral.levelOfCare}</Badge>}
        {referral.presentingIssue && <Badge variant="outline">{referral.presentingIssue}</Badge>}
        {referral.clientType && <Badge variant="outline">{referral.clientType}</Badge>}
        {referral.paymentModel && (
          <Badge variant="outline">{referral.paymentModel.replace("_", " ")}</Badge>
        )}
        {referral.insurance && referral.insurance !== "N/A" && (
          <Badge variant="outline">{referral.insurance}</Badge>
        )}
        {referral.neighborhood && <Badge variant="outline">{referral.neighborhood}</Badge>}
        {referral.urgency && (
          <Badge variant="muted">{referral.urgency} urgency</Badge>
        )}
      </div>

      {/* Honest-labeling note */}
      <p className="text-xs text-muted-foreground italic">
        Logged when this referral was sent — the client&apos;s details will come directly from{" "}
        {referral.referringClinicianName}.
      </p>

      {/* Respond controls */}
      {!hasResponded ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => respond("accepted")}
          >
            I can take this
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => respond("declined")}
          >
            I&apos;m full / not a fit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => respond("dismissed")}
          >
            Dismiss
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {referral.status === "accepted" && "You indicated you can take this client."}
            {referral.status === "declined" && "You marked this as not a fit."}
            {referral.status === "closed" && "Dismissed."}
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={undoResponse}
            className="text-xs text-primary underline underline-offset-2 disabled:opacity-50"
          >
            Change response
          </button>
        </div>
      )}
    </div>
  );
}

export function IncomingReferrals({ referrals }: { referrals: IncomingReferral[] }) {
  return (
    <div className="space-y-4">
      {referrals.map((r) => (
        <ReferralCard key={r.caseReferralId} referral={r} />
      ))}
    </div>
  );
}
