"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { sendDirectReferralInline } from "@/app-actions/member-actions";
import type { ReferralSendState } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  calculateMatchConfidence,
  CLIENT_TYPES,
  getMatchDimensions,
  insuranceMatches,
  INSURANCE_CARRIERS,
  levelOfCareMatches,
  LEVELS_OF_CARE,
  LOCATION_OPTIONS,
  locationMatches,
  PAYMENT_OPTIONS,
  paymentModelMatchesFilter,
  PRESENTING_ISSUES
} from "@/lib/referral-matching";
import type { MatchDimension } from "@/lib/referral-matching";
import type { PublicTherapistSummary } from "@/types";

const URGENCY_OPTIONS = [
  "Urgent - needs care in the next few days",
  "Moderately Urgent - needs care in the next week",
  "Low Urgency - needs care in the next few weeks"
] as const;

const FORMAT_OPTIONS = ["In person", "Telehealth", "Hybrid"] as const;
const AGE_RANGE_OPTIONS = ["Child (0-12)", "Adolescent (13-17)", "Adult (18+)"] as const;

function getUrgencyColor(urgency: string) {
  if (urgency.includes("Urgent") && !urgency.includes("Moderately")) return "bg-red-100 border-red-300 text-red-900";
  if (urgency.includes("Moderately")) return "bg-yellow-100 border-yellow-300 text-yellow-900";
  return "bg-green-100 border-green-300 text-green-900";
}

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
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold tabular-nums ${scoreColor}`}>
          {matchCount}/{dimensions.length}
        </span>
        <span className="text-xs text-muted-foreground">criteria matched</span>
        <div className="ml-1 flex gap-0.5">
          {dimensions.map((dimension) => (
            <div
              key={dimension.label}
              className={`h-1.5 w-5 rounded-full ${dimension.status === "match" ? "bg-green-500" : "bg-red-300"}`}
            />
          ))}
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

      <div className="flex flex-wrap gap-1.5">
        {dimensions.map((dimension) => (
          <span
            key={dimension.label}
            className={
              dimension.status === "match"
                ? "inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                : "inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50/70 px-2.5 py-0.5 text-xs font-medium text-red-500"
            }
          >
            <span aria-hidden>{dimension.status === "match" ? "✓" : "✗"}</span>
            {dimension.value}
          </span>
        ))}
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
  const [urgency, setUrgency] = useState("");
  const [clientType, setClientType] = useState("");
  const [presentingIssue, setPresentingIssue] = useState("");
  const [location, setLocation] = useState("");
  const [payment, setPayment] = useState("");
  const [insurance, setInsurance] = useState("");
  const [privatePayMax, setPrivatePayMax] = useState("");
  const [format, setFormat] = useState("");
  const [groupFocus, setGroupFocus] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const getRequiredFields = () => {
    switch (levelOfCare) {
      case "Group Therapy":
        return { clientType, groupFocus, format, payment, urgency };
      case "Intensive Outpatient (IOP)":
      case "Partial Hospitalization (PHP)":
        return { clientType, presentingIssue, insurance, urgency };
      case "Residential Treatment":
        return { clientType, presentingIssue, insurance, ageRange, urgency };
      case "Weekly Therapy":
      default:
        return { clientType, presentingIssue, payment, urgency };
    }
  };

  const requiredFieldsObj = getRequiredFields();
  const hasRequiredFields = Boolean(levelOfCare) && Object.values(requiredFieldsObj).every(Boolean);
  const selectedPresentingIssue = levelOfCare === "Group Therapy" ? groupFocus : presentingIssue;
  const criteria = {
    levelOfCare,
    urgency,
    clientType,
    presentingIssue: selectedPresentingIssue,
    payment,
    location,
    insurance,
    privatePayMax,
    format,
    additionalNotes
  };

  const filteredTherapists = therapists.filter((therapist) => {
    if (levelOfCare && !levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) return false;
    if (payment && !paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"))) return false;
    if (location && !locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) return false;
    if (
      insurance &&
      (payment === "Insurance" || payment === "Both" || levelOfCare === "Intensive Outpatient (IOP)" || levelOfCare === "Partial Hospitalization (PHP)" || levelOfCare === "Residential Treatment") &&
      !insuranceMatches(insurance, therapist.insuranceAccepted, therapist.paymentModel)
    ) {
      return false;
    }

    return true;
  });

  const rankedTherapists = filteredTherapists
    .map((therapist) => {
      const confidence = calculateMatchConfidence(levelOfCare, clientType, selectedPresentingIssue, payment, location, insurance, therapist);
      const dimensions = getMatchDimensions(levelOfCare, clientType, selectedPresentingIssue, payment, location, insurance, therapist);

      let urgencyBoost = 0;
      if (urgency.includes("Urgent") && !urgency.includes("Moderately") && therapist.availabilityStatus === "accepting") {
        urgencyBoost = 5;
      } else if (urgency.includes("Moderately") && therapist.availabilityStatus !== "full") {
        urgencyBoost = 2;
      }

      const trustScore =
        Number(Boolean(therapist.trustedByViewer)) * 8 +
        Number(Boolean(therapist.isFollowed)) * 5 +
        Math.min(therapist.trustedBy.length, 3) * 2;
      const availabilityScore = getAvailabilityRank(therapist.availabilityStatus);
      const confidenceScore = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;

      return {
        therapist,
        confidence,
        dimensions,
        score: trustScore + availabilityScore + confidenceScore + urgencyBoost
      };
    })
    .sort((a, b) => b.score - a.score);

  const highMediumMatches = rankedTherapists.filter((match) => match.confidence === "high" || match.confidence === "medium");
  const lowMatches = rankedTherapists.filter((match) => match.confidence === "low");

  const handleLevelOfCareChange = (level: string) => {
    setLevelOfCare(level);
    setPresentingIssue("");
    setLocation("");
    setPayment("");
    setInsurance("");
    setPrivatePayMax("");
    setFormat("");
    setGroupFocus("");
    setAgeRange("");
  };

  const handlePaymentChange = (newPayment: string) => {
    setPayment(newPayment);
    if (newPayment !== "Insurance" && newPayment !== "Both") setInsurance("");
    if (newPayment !== "Private Pay" && newPayment !== "Both") setPrivatePayMax("");
  };

  return (
    <div className="space-y-6">
      {statusCopy && (
        <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
          {statusCopy}
        </div>
      )}

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Referral search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Level of Care <span className="text-red-500">*</span>
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {LEVELS_OF_CARE.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelOfCareChange(levelOfCare === level ? "" : level)}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                      levelOfCare === level
                        ? "bg-primary text-white shadow"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {levelOfCare && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="urgency">
                  Urgency <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full rounded-2xl border px-4 py-3 text-sm transition ${urgency ? getUrgencyColor(urgency) : "bg-white text-slate-900"}`}
                  id="urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  required
                >
                  <option value="">Select urgency level</option>
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    {CLIENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {levelOfCare !== "Group Therapy" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="presentingIssue">
                      {levelOfCare === "Residential Treatment" || levelOfCare === "Intensive Outpatient (IOP)" || levelOfCare === "Partial Hospitalization (PHP)" ? "Primary Need" : "Presenting Issue"}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                      id="presentingIssue"
                      value={presentingIssue}
                      onChange={(e) => setPresentingIssue(e.target.value)}
                      required
                    >
                      <option value="">Select issue</option>
                      {PRESENTING_ISSUES.map((issue) => (
                        <option key={issue} value={issue}>
                          {issue}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {levelOfCare === "Group Therapy" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="groupFocus">
                        Group Focus <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                        id="groupFocus"
                        value={groupFocus}
                        onChange={(e) => setGroupFocus(e.target.value)}
                        required
                      >
                        <option value="">Select focus</option>
                        {PRESENTING_ISSUES.map((issue) => (
                          <option key={issue} value={issue}>
                            {issue}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="format">
                        Format <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                        id="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        required
                      >
                        <option value="">Select format</option>
                        {FORMAT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

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
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {(levelOfCare === "Weekly Therapy" || levelOfCare === "Group Therapy") && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="payment">
                      Payment <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                      id="payment"
                      value={payment}
                      onChange={(e) => handlePaymentChange(e.target.value)}
                      required
                    >
                      <option value="">Select payment type</option>
                      {PAYMENT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {((levelOfCare === "Weekly Therapy" || levelOfCare === "Group Therapy") && (payment === "Insurance" || payment === "Both")) ||
                levelOfCare === "Intensive Outpatient (IOP)" ||
                levelOfCare === "Partial Hospitalization (PHP)" ||
                levelOfCare === "Residential Treatment" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="insurance">
                      Insurance {(levelOfCare === "Intensive Outpatient (IOP)" || levelOfCare === "Partial Hospitalization (PHP)" || levelOfCare === "Residential Treatment") && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                      id="insurance"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      required={levelOfCare === "Intensive Outpatient (IOP)" || levelOfCare === "Partial Hospitalization (PHP)" || levelOfCare === "Residential Treatment"}
                    >
                      <option value="">Select insurance</option>
                      {INSURANCE_CARRIERS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {(levelOfCare === "Weekly Therapy" || levelOfCare === "Group Therapy") && (payment === "Private Pay" || payment === "Both") && (
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

                {levelOfCare === "Residential Treatment" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="ageRange">
                      Age Range <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                      id="ageRange"
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      required
                    >
                      <option value="">Select age range</option>
                      {AGE_RANGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
            </>
          )}
        </CardContent>
      </Card>

      {hasRequiredFields ? (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Therapist Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rankedTherapists.length === 0 ? (
              <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                No therapists match these criteria yet. Try adjusting your filters or check back as more providers join.
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
        <p className="text-sm text-muted-foreground">Complete the required criteria above to see matching therapists.</p>
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
    urgency: string;
    clientType: string;
    presentingIssue: string;
    payment: string;
    location: string;
    insurance: string;
    privatePayMax: string;
    format: string;
    additionalNotes: string;
  };
  senderEmail?: string;
}) {
  const [state, formAction] = useActionState<ReferralSendState, FormData>(
    sendDirectReferralInline,
    { status: "idle" }
  );
  const referralTitle = [
    "Referral",
    criteria.clientType,
    criteria.presentingIssue ? `for ${criteria.presentingIssue}` : ""
  ].filter(Boolean).join(" ");
  const referralBody = criteria.additionalNotes || "Structured referral request from referral search.";

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
              <Badge key={specialty} variant="muted">
                {specialty}
              </Badge>
            ))}
            {therapist.communities.slice(0, 2).map((community) => (
              <Badge key={community} variant="outline" className="border-primary/30 text-xs text-primary">
                {community}
              </Badge>
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
            <input name="title" type="hidden" value={referralTitle} />
            <input name="body" type="hidden" value={referralBody} />
            <input name="levelOfCare" type="hidden" value={criteria.levelOfCare} />
            <input name="urgencyLevel" type="hidden" value={criteria.urgency} />
            <input name="clientType" type="hidden" value={criteria.clientType} />
            <input name="presentingIssue" type="hidden" value={criteria.presentingIssue} />
            <input name="payment" type="hidden" value={criteria.payment} />
            <input name="location" type="hidden" value={criteria.location} />
            <input name="insuranceWanted" type="hidden" value={criteria.insurance} />
            <input name="formatWanted" type="hidden" value={criteria.format} />
            <input name="privatePayMax" type="hidden" value={criteria.privatePayMax} />
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
