"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { sendDirectReferralInline } from "@/app-actions/member-actions";
import type { ReferralSendState } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateMatchConfidence,
  CLIENT_TYPES,
  clientTypeMatches,
  getMatchDimensions,
  levelOfCareMatches,
  LEVELS_OF_CARE,
  LOCATION_OPTIONS,
  locationMatches,
  PAYMENT_OPTIONS,
  paymentModelMatchesFilter,
  presentingIssueMatches,
  PRESENTING_ISSUES
} from "@/lib/referral-matching";
import type { MatchDimension } from "@/lib/referral-matching";
import type { PublicTherapistSummary } from "@/types";

function getPaymentModelLabel(value: string) {
  if (value === "private_pay") return "Private pay";
  if (value === "insurance") return "Insurance";
  return "Private pay and insurance";
}

function getCareFormatLabel(therapist: PublicTherapistSummary) {
  if (therapist.inPerson && therapist.telehealth) {
    return "In person and telehealth";
  }

  if (therapist.telehealth) {
    return "Telehealth";
  }

  return "In person";
}

function getTrustContext(therapist: PublicTherapistSummary) {
  if (therapist.trustedByViewer) {
    return "Trusted by you";
  }

  if (therapist.isFollowed) {
    return "In your network";
  }

  if (therapist.trustedBy.length === 1) {
    return `Trusted by ${therapist.trustedBy[0]?.name}`;
  }

  if (therapist.trustedBy.length > 1) {
    return `Trusted by ${therapist.trustedBy[0]?.name} and ${therapist.trustedBy.length - 1} others`;
  }

  return "No direct trust context yet";
}

function getAvailabilityRank(status: PublicTherapistSummary["availabilityStatus"]) {
  if (status === "accepting") return 3;
  if (status === "waitlist") return 2;
  return 1;
}

function MatchBreakdown({
  dimensions,
  confidence,
  availabilityStatus
}: {
  dimensions: MatchDimension[];
  confidence: "high" | "medium" | "low";
  availabilityStatus: "accepting" | "waitlist" | "full";
}) {
  if (dimensions.length === 0) return null;

  const matchCount = dimensions.filter((d) => d.status === "match").length;
  const scoreColor =
    confidence === "high"
      ? "text-green-700"
      : confidence === "medium"
        ? "text-yellow-600"
        : "text-red-500";

  return (
    <div className="space-y-2 rounded-xl bg-muted/40 px-3 py-2.5">
      {/* Score row + segmented bar */}
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold tabular-nums ${scoreColor}`}>
          {matchCount}/{dimensions.length}
        </span>
        <span className="text-xs text-muted-foreground">criteria matched</span>
        <div className="ml-1 flex gap-0.5">
          {dimensions.map((d) => (
            <div
              key={d.label}
              className={`h-1.5 w-5 rounded-full ${d.status === "match" ? "bg-green-500" : "bg-red-300"}`}
            />
          ))}
          {/* Availability as extra segment */}
          <div
            className={`h-1.5 w-5 rounded-full ${
              availabilityStatus === "accepting"
                ? "bg-green-500"
                : availabilityStatus === "waitlist"
                  ? "bg-yellow-400"
                  : "bg-gray-300"
            }`}
          />
        </div>
      </div>

      {/* Per-dimension chips */}
      <div className="flex flex-wrap gap-1.5">
        {dimensions.map((d) => (
          <span
            key={d.label}
            className={
              d.status === "match"
                ? "inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                : "inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50/70 px-2.5 py-0.5 text-xs font-medium text-red-500"
            }
          >
            <span aria-hidden>{d.status === "match" ? "✓" : "✗"}</span>
            {d.value}
          </span>
        ))}
        {/* Availability chip */}
        <span
          className={
            availabilityStatus === "accepting"
              ? "inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
              : availabilityStatus === "waitlist"
                ? "inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700"
                : "inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {availabilityStatus === "accepting"
            ? "✓ Available"
            : availabilityStatus === "waitlist"
              ? "~ Waitlist"
              : "✗ Full"}
        </span>
      </div>
    </div>
  );
}

export function ReferralComposeForm({
  senderEmail,
  statusCopy,
  therapists
}: {
  senderEmail?: string;
  statusCopy?: string | null;
  therapists: PublicTherapistSummary[];
}) {
  const [levelOfCare, setLevelOfCare] = useState("");
  const [clientType, setClientType] = useState("");
  const [presentingIssue, setPresentingIssue] = useState("");
  const [payment, setPayment] = useState("");
  const [location, setLocation] = useState("");
  const [privatePayMax, setPrivatePayMax] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Filter therapists based on hard criteria
  const filteredTherapists = therapists.filter(therapist => {
    if (levelOfCare && !levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) return false;
    if (payment && !paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"))) return false;
    if (location && !locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) return false;
    return true;
  });

  // Sort and rank therapists
  const rankedTherapists = filteredTherapists
    .map(therapist => {
      const confidence = calculateMatchConfidence(levelOfCare, clientType, presentingIssue, payment, location, therapist);
      const dimensions = getMatchDimensions(levelOfCare, clientType, presentingIssue, payment, location, therapist);

      const trustScore =
        Number(Boolean(therapist.trustedByViewer)) * 8 +
        Number(Boolean(therapist.isFollowed)) * 5 +
        Math.min(therapist.trustedBy.length, 3) * 2;

      const availabilityScore = getAvailabilityRank(therapist.availabilityStatus);
      const confidenceScore = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;

      return { therapist, confidence, dimensions, score: trustScore + availabilityScore + confidenceScore };
    })
    .sort((a, b) => b.score - a.score);

  // Show matches as soon as any criterion is set
  const hasCriteria = levelOfCare || clientType || presentingIssue || payment || location;

  const highMediumMatches = rankedTherapists.filter(match => match.confidence === "high" || match.confidence === "medium");
  const lowMatches = rankedTherapists.filter(match => match.confidence === "low");

  const criteria = { levelOfCare, clientType, presentingIssue, payment, location, additionalNotes };

  return (
    <div className="space-y-6">
      {statusCopy && (
        <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
          {statusCopy}
        </div>
      )}

      {/* Referral Criteria */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Referral Criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Level of Care</label>
              <div className="flex flex-wrap gap-2">
                {LEVELS_OF_CARE.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLevelOfCare(levelOfCare === level ? "" : level)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                      levelOfCare === level
                        ? "border-foreground bg-foreground text-background"
                        : "border-muted-foreground/30 bg-white text-foreground hover:border-foreground/60"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="clientType">
                Client Type
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="clientType"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
              >
                <option value="">Any client type</option>
                {CLIENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="presentingIssue">
                Presenting Issue
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="presentingIssue"
                value={presentingIssue}
                onChange={(e) => setPresentingIssue(e.target.value)}
              >
                <option value="">Any presenting issue</option>
                {PRESENTING_ISSUES.map((issue) => (
                  <option key={issue} value={issue}>{issue}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="payment">
                Payment
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="payment"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              >
                <option value="">Any payment type</option>
                {PAYMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="location">
                Location
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Any location</option>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {payment === "Private Pay" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="privatePayMax">
                  Private Pay Max
                </label>
                <input
                  className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                  id="privatePayMax"
                  placeholder="e.g. $200"
                  value={privatePayMax}
                  onChange={(e) => setPrivatePayMax(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="additionalNotes">
              Additional Notes
            </label>
            <textarea
              className="min-h-20 w-full rounded-2xl border bg-white px-4 py-3 text-sm"
              id="additionalNotes"
              placeholder="Any additional context that might help the receiving therapist..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Therapist Matches — shown as soon as any criterion is set */}
      {hasCriteria ? (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Therapist Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rankedTherapists.length === 0 ? (
              <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                No therapists match these criteria. Try adjusting your filters.
              </div>
            ) : (
              <>
                {highMediumMatches.length > 0 && (
                  <div className="space-y-4">
                    {highMediumMatches.map(({ therapist, confidence, dimensions }) => (
                      <TherapistMatchCard
                        key={therapist.profileId}
                        therapist={therapist}
                        confidence={confidence}
                        dimensions={dimensions}
                        criteria={criteria}
                        senderEmail={senderEmail}
                      />
                    ))}
                  </div>
                )}

                {lowMatches.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Other possible matches</h3>
                    {lowMatches.map(({ therapist, confidence, dimensions }) => (
                      <TherapistMatchCard
                        key={therapist.profileId}
                        therapist={therapist}
                        confidence={confidence}
                        dimensions={dimensions}
                        criteria={criteria}
                        senderEmail={senderEmail}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Set at least one criterion above to see matching therapists.</p>
      )}
    </div>
  );
}

function TherapistMatchCard({
  therapist,
  confidence,
  dimensions,
  criteria,
  senderEmail
}: {
  therapist: PublicTherapistSummary;
  confidence: "high" | "medium" | "low";
  dimensions: MatchDimension[];
  criteria: {
    levelOfCare: string;
    clientType: string;
    presentingIssue: string;
    payment: string;
    location: string;
    additionalNotes: string;
  };
  senderEmail?: string;
}) {
  const [state, formAction] = useActionState<ReferralSendState, FormData>(
    sendDirectReferralInline,
    { status: "idle" }
  );

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border bg-background p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">{therapist.displayName}</p>
            <p className="text-sm text-muted-foreground">{therapist.title}</p>
          </div>
          <span className="text-sm font-medium text-green-600">✓ Referral sent</span>
        </div>
        <Button asChild className="mt-3 w-full" variant="outline" size="sm">
          <Link href={`/directory/${therapist.slug}`}>View profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-medium text-foreground">{therapist.displayName}</h3>
            <p className="text-sm text-muted-foreground">{therapist.title}</p>
            <p className="text-xs text-muted-foreground">{therapist.neighborhoods[0] ?? therapist.city}</p>
          </div>

          <div className="grid gap-1.5 text-sm text-muted-foreground md:grid-cols-2">
            <p>{getCareFormatLabel(therapist)}</p>
            <p>{getPaymentModelLabel(therapist.paymentModel)}</p>
            <p className="md:col-span-2">{getTrustContext(therapist)}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {therapist.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="muted">{specialty}</Badge>
            ))}
            {therapist.communities.slice(0, 2).map((community) => (
              <Badge key={community} variant="outline" className="border-primary/30 text-xs text-primary">{community}</Badge>
            ))}
          </div>

          <MatchBreakdown
            dimensions={dimensions}
            confidence={confidence}
            availabilityStatus={therapist.availabilityStatus}
          />
        </div>

        <div className="flex flex-col gap-2 md:min-w-32">
          <form action={formAction}>
            <input name="receiverProfileId" type="hidden" value={therapist.profileId} />
            <input name="levelOfCare" type="hidden" value={criteria.levelOfCare} />
            <input name="clientType" type="hidden" value={criteria.clientType} />
            <input name="presentingIssue" type="hidden" value={criteria.presentingIssue} />
            <input name="payment" type="hidden" value={criteria.payment} />
            <input name="location" type="hidden" value={criteria.location} />
            <input name="additionalNotes" type="hidden" value={criteria.additionalNotes} />
            <SubmitButton className="w-full" pendingLabel="Sending…">
              Send referral
            </SubmitButton>
          </form>
          {state.status === "error" && (
            <p className="text-xs text-red-600">Couldn&apos;t send. Try again.</p>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href={`/directory/${therapist.slug}`}>View profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
