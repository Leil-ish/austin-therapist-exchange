"use client";

import Link from "next/link";
import { useState } from "react";

import { sendDirectReferral } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateMatchConfidence,
  generateMatchExplanation,
  insuranceMatches,
  levelOfCareMatches,
  LEVELS_OF_CARE,
  LOCATION_OPTIONS,
  locationMatches,
  PAYMENT_OPTIONS,
  paymentModelMatchesFilter,
  PRESENTING_ISSUES,
  CLIENT_TYPES,
  INSURANCE_CARRIERS
} from "@/lib/referral-matching";
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

  const insuranceOptions = INSURANCE_CARRIERS;

  // Determine required fields based on level of care
  const getRequiredFields = () => {
    switch (levelOfCare) {
      case "Group":
        return { clientType, groupFocus, format, payment, urgency };
      case "IOP":
      case "PHP":
        return { clientType, presentingIssue, insurance, urgency };
      case "Residential":
        return { clientType, presentingIssue, insurance, ageRange, urgency };
      case "Outpatient":
      default:
        return { clientType, presentingIssue, payment, urgency };
    }
  };

  const requiredFieldsObj = getRequiredFields();
  const hasRequiredFields = levelOfCare && Object.values(requiredFieldsObj).every(val => val);
  const selectedPresentingIssue = levelOfCare === "Group" ? groupFocus : presentingIssue;

  // Filter therapists based on level of care
  const filteredTherapists = therapists.filter(therapist => {
    if (levelOfCare && !levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) return false;
    if (payment && !paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"))) return false;
    if (location && !locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) return false;
    if (
      insurance &&
      (payment === "Insurance" || payment === "Both" || levelOfCare === "IOP" || levelOfCare === "PHP" || levelOfCare === "Residential") &&
      !insuranceMatches(insurance, therapist.insuranceAccepted, therapist.paymentModel)
    ) return false;
    return true;
  });

  // Rank therapists with urgency consideration
  const rankedTherapists = filteredTherapists
    .map(therapist => {
      const confidence = calculateMatchConfidence(levelOfCare, clientType, selectedPresentingIssue, payment, location, insurance, therapist);
      const explanations = generateMatchExplanation(levelOfCare, clientType, selectedPresentingIssue, payment, location, insurance, therapist);

      // Boost score for urgent referrals if therapist is accepting
      let urgencyBoost = 0;
      if (urgency.includes("Urgent") && !urgency.includes("Moderately") && therapist.availabilityStatus === "accepting") {
        urgencyBoost = 5;
        explanations.push("Urgent referral: this therapist is currently accepting new clients.");
      } else if (urgency.includes("Moderately") && therapist.availabilityStatus !== "full") {
        urgencyBoost = 2;
        explanations.push("Moderately urgent: this therapist has limited openings but may still be a fit.");
      } else if (urgency.includes("Low Urgency")) {
        explanations.push("Low urgency: clinical fit and trust signals are weighted more heavily than immediate availability.");
      }

      const trustScore =
        Number(Boolean(therapist.trustedByViewer)) * 8 +
        Number(Boolean(therapist.isFollowed)) * 5 +
        Math.min(therapist.trustedBy.length, 3) * 2;

      const availabilityScore = therapist.availabilityStatus === "accepting" ? 3 : therapist.availabilityStatus === "waitlist" ? 2 : 1;
      const confidenceScore = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;

      return {
        therapist,
        confidence,
        explanations,
        score: trustScore + availabilityScore + confidenceScore + urgencyBoost
      };
    })
    .sort((a, b) => b.score - a.score);

  const highMediumMatches = rankedTherapists.filter(match => match.confidence === "high" || match.confidence === "medium");
  const lowMatches = rankedTherapists.filter(match => match.confidence === "low");

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
    // Clear conditional fields
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

      {/* Referral Criteria Card */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Referral search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Level of Care Segmented Control - Primary */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Level of Care <span className="text-red-500">*</span>
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {LEVELS_OF_CARE.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelOfCareChange(level)}
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
              {/* Urgency Dropdown - Required */}
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

              {/* Conditional Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Client Type - Always shown when level selected */}
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

                {/* Presenting Issue / Primary Need */}
                {levelOfCare !== "Group" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="presentingIssue">
                      {levelOfCare === "Residential" || levelOfCare === "IOP" || levelOfCare === "PHP" ? "Primary Need" : "Presenting Issue"}
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

                {/* Group Focus - Only for Group */}
                {levelOfCare === "Group" && (
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
                )}

                {/* Format - Only for Group */}
                {levelOfCare === "Group" && (
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
                      {FORMAT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Location - For Outpatient and Group */}
                {(levelOfCare === "Outpatient" || levelOfCare === "Group") && (
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
                )}

                {/* Location - For IOP, PHP, Residential */}
                {(levelOfCare === "IOP" || levelOfCare === "PHP" || levelOfCare === "Residential") && (
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
                )}

                {/* Payment - For Outpatient and Group */}
                {(levelOfCare === "Outpatient" || levelOfCare === "Group") && (
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

                {/* Insurance - Conditional on Payment or Required for IOP/PHP/Residential */}
                {((levelOfCare === "Outpatient" || levelOfCare === "Group") && (payment === "Insurance" || payment === "Both")) ||
                levelOfCare === "IOP" ||
                levelOfCare === "PHP" ||
                levelOfCare === "Residential" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="insurance">
                      Insurance {(levelOfCare === "IOP" || levelOfCare === "PHP" || levelOfCare === "Residential") && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                      id="insurance"
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      required={levelOfCare === "IOP" || levelOfCare === "PHP" || levelOfCare === "Residential"}
                    >
                      <option value="">Select insurance</option>
                      {insuranceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {/* Private Pay Max - Conditional on Payment */}
                {(levelOfCare === "Outpatient" || levelOfCare === "Group") && (payment === "Private Pay" || payment === "Both") && (
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

                {/* Age Range - Only for Residential */}
                {levelOfCare === "Residential" && (
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
                      {AGE_RANGE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

              {/* Additional Notes - Always shown when level selected */}
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

      {/* Therapist Matches */}
      {hasRequiredFields && (
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
                {/* High and Medium Confidence Matches */}
                {highMediumMatches.length > 0 && (
                  <div className="space-y-4">
                    {highMediumMatches.map(({ therapist, confidence, explanations }) => (
                      <TherapistMatchCard
                        key={therapist.profileId}
                        therapist={therapist}
                        confidence={confidence}
                        explanations={explanations}
                        criteria={{ levelOfCare, urgency, clientType, presentingIssue: selectedPresentingIssue, payment, location, insurance, privatePayMax, format, additionalNotes }}
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
                        criteria={{ levelOfCare, urgency, clientType, presentingIssue: selectedPresentingIssue, payment, location, insurance, privatePayMax, format, additionalNotes }}
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
  const referralTitle = [
    "Referral",
    criteria.clientType,
    criteria.presentingIssue ? `for ${criteria.presentingIssue}` : ""
  ].filter(Boolean).join(" ");
  const referralBody = criteria.additionalNotes || "Structured referral request from referral search.";

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
