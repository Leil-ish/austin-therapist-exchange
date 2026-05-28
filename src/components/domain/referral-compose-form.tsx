"use client";

import Link from "next/link";
import { useState } from "react";

import { sendDirectReferral } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateMatchConfidence,
  clientTypeMatches,
  generateMatchExplanation,
  getDynamicDropdownOptions,
  levelOfCareMatches,
  LEVELS_OF_CARE,
  LOCATION_OPTIONS,
  locationMatches,
  PAYMENT_OPTIONS,
  paymentModelMatchesFilter,
  presentingIssueMatches,
  PRESENTING_ISSUES
} from "@/lib/referral-matching";
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

function ConfidenceIndicator({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const dots = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
  const color = confidence === "high" ? "bg-green-500" : confidence === "medium" ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium capitalize">{confidence}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < dots ? color : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}

function MatchExplanation({ explanations }: { explanations: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-primary hover:text-primary/80 underline"
      >
        Why this match? {isExpanded ? "▼" : "▶"}
      </button>
      {isExpanded && (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {explanations.map((explanation, index) => (
            <li key={index}>• {explanation}</li>
          ))}
        </ul>
      )}
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

  const dynamicOptions = getDynamicDropdownOptions(therapists);

  // Filter therapists based on criteria
  const filteredTherapists = therapists.filter(therapist => {
    // Hard excludes
    if (levelOfCare && !levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) return false;
    if (payment && !paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"))) return false;
    if (location && !locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) return false;

    return true;
  });

  // Sort and rank therapists
  const rankedTherapists = filteredTherapists
    .map(therapist => {
      const confidence = calculateMatchConfidence(levelOfCare, clientType, presentingIssue, payment, location, therapist);
      const explanations = generateMatchExplanation(levelOfCare, clientType, presentingIssue, payment, location, therapist);

      const trustScore =
        Number(Boolean(therapist.trustedByViewer)) * 8 +
        Number(Boolean(therapist.isFollowed)) * 5 +
        Math.min(therapist.trustedBy.length, 3) * 2;

      const availabilityScore = getAvailabilityRank(therapist.availabilityStatus);

      // Confidence score: high=3, medium=2, low=1
      const confidenceScore = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;

      return {
        therapist,
        confidence,
        explanations,
        score: trustScore + availabilityScore + confidenceScore
      };
    })
    .sort((a, b) => b.score - a.score);

  const hasRequiredFields = levelOfCare && clientType && presentingIssue && payment;

  const highMediumMatches = rankedTherapists.filter(match => match.confidence === "high" || match.confidence === "medium");
  const lowMatches = rankedTherapists.filter(match => match.confidence === "low");

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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="levelOfCare">
                Level of Care <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="levelOfCare"
                value={levelOfCare}
                onChange={(e) => setLevelOfCare(e.target.value)}
                required
              >
                <option value="">Select level of care</option>
                {dynamicOptions.levelsOfCare.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="clientType">
                Client Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="clientType"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                required
              >
                <option value="">Select client type</option>
                {dynamicOptions.clientTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="presentingIssue">
                Presenting Issue <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="presentingIssue"
                value={presentingIssue}
                onChange={(e) => setPresentingIssue(e.target.value)}
                required
              >
                <option value="">Select presenting issue</option>
                {dynamicOptions.presentingIssues.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="payment">
                Payment <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="payment"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                required
              >
                <option value="">Select payment type</option>
                {dynamicOptions.paymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
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
                {dynamicOptions.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
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

      {/* Therapist Matches */}
      {hasRequiredFields && (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Therapist Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rankedTherapists.length === 0 ? (
              <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                No therapists match these criteria yet. Try adjusting your filters.
              </div>
            ) : (
              <>
                {/* High and Medium Confidence Matches */}
                {highMediumMatches.length > 0 && (
                  <div className="space-y-4">
                    {highMediumMatches.map(({ therapist, confidence, explanations }) => (
                      <TherapistMatchCard
                        key={therapist.profileId}
                        therapist={therapist}
                        confidence={confidence}
                        explanations={explanations}
                        criteria={{ levelOfCare, clientType, presentingIssue, payment, location, additionalNotes }}
                        senderEmail={senderEmail}
                      />
                    ))}
                  </div>
                )}

                {/* Low Confidence Matches */}
                {lowMatches.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-muted-foreground">Other possible matches</h3>
                    {lowMatches.map(({ therapist, confidence, explanations }) => (
                      <TherapistMatchCard
                        key={therapist.profileId}
                        therapist={therapist}
                        confidence={confidence}
                        explanations={explanations}
                        criteria={{ levelOfCare, clientType, presentingIssue, payment, location, additionalNotes }}
                        senderEmail={senderEmail}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TherapistMatchCard({
  therapist,
  confidence,
  explanations,
  criteria,
  senderEmail
}: {
  therapist: PublicTherapistSummary;
  confidence: "high" | "medium" | "low";
  explanations: string[];
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
  return (
    <div className="rounded-2xl border bg-background p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-foreground">{therapist.displayName}</h3>
              <p className="text-sm text-muted-foreground">{therapist.title}</p>
            </div>
            <ConfidenceIndicator confidence={confidence} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>
              {therapist.availabilityStatus === "accepting"
                ? "Accepting referrals"
                : therapist.availabilityStatus === "waitlist"
                  ? "Limited openings"
                  : "Not accepting referrals"}
            </Badge>
            <Badge variant="outline">{therapist.neighborhoods[0] ?? therapist.city}</Badge>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p>{getCareFormatLabel(therapist)}</p>
            <p>{getPaymentModelLabel(therapist.paymentModel)}</p>
            <p className="md:col-span-2">{getTrustContext(therapist)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {therapist.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="muted">
                {specialty}
              </Badge>
            ))}
          </div>

          <MatchExplanation explanations={explanations} />
        </div>

        <div className="flex flex-col gap-2 md:min-w-32">
          <form action={sendDirectReferral}>
            <input name="returnTo" type="hidden" value="/member/referrals" />
            <input name="type" type="hidden" value="referral_request" />
            <input name="receiverProfileId" type="hidden" value={therapist.profileId} />
            <input name="levelOfCare" type="hidden" value={criteria.levelOfCare} />
            <input name="clientType" type="hidden" value={criteria.clientType} />
            <input name="presentingIssue" type="hidden" value={criteria.presentingIssue} />
            <input name="payment" type="hidden" value={criteria.payment} />
            <input name="location" type="hidden" value={criteria.location} />
            <input name="additionalNotes" type="hidden" value={criteria.additionalNotes} />

            <Button type="submit" className="w-full">
              Send referral
            </Button>
          </form>

          <Button variant="outline" asChild className="w-full">
            <Link href={`/directory/${therapist.slug}`}>
              View profile
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

