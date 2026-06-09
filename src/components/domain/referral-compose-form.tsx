"use client";

import Link from "next/link";
import { useEffect, useMemo, useTransition, useState } from "react";
import { ChevronDown, ChevronUp, ClipboardCopy, Eye, MapPin, Pencil, RefreshCw, Users, Target, Globe, X } from "lucide-react";

import { logReferralContact, logReferralContacts } from "@/app-actions/member-actions";
import type { LogReferralContactResult, LogReferralContactsResult } from "@/app-actions/member-actions";
import { mintReferralCode } from "@/lib/referral-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  calculateMatchConfidence,
  CLIENT_TYPES,
  generateMatchExplanation,
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
  if (value === "private_pay") return "Accepts Private Pay";
  if (value === "insurance") return "Accepts Insurance";
  return "Private Pay & Insurance";
}

function getAvailabilityRank(status: PublicTherapistSummary["availabilityStatus"]) {
  if (status === "accepting") return 3;
  if (status === "waitlist") return 2;
  return 1;
}

function ConfidenceDots({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const count = confidence === "high" ? 3 : confidence === "medium" ? 2 : 1;
  const filledColor =
    confidence === "high"
      ? "bg-green-500"
      : confidence === "medium"
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${i <= count ? filledColor : "bg-gray-200"}`}
        />
      ))}
    </div>
  );
}

function MatchBreakdown({
  dimensions,
  availabilityStatus
}: {
  dimensions: MatchDimension[];
  availabilityStatus: "accepting" | "waitlist" | "full";
}) {
  if (dimensions.length === 0) return null;

  const matchCount = dimensions.filter((d) => d.status === "match").length;

  return (
    <div className="space-y-2 rounded-xl bg-muted/40 px-3 py-2.5">
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
      <p className="text-xs text-muted-foreground">
        {matchCount} of {dimensions.length} criteria matched
      </p>
    </div>
  );
}

type ContactCriteria = {
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

function buildMailtoBody(
  therapistName: string,
  senderName: string,
  code: string,
  criteria: ContactCriteria
): string {
  const lines: string[] = [];

  lines.push(`Hi ${therapistName},`);
  lines.push("");
  lines.push(
    "I came across your profile on Austin Therapist Exchange and think you may be a good fit for a client I'm hoping to refer. Here's what I can share:"
  );
  lines.push("");

  if (criteria.levelOfCare) lines.push(`- Level of care: ${criteria.levelOfCare}`);
  if (criteria.clientType) lines.push(`- Client type: ${criteria.clientType}`);
  if (criteria.presentingIssue) lines.push(`- Presenting concern: ${criteria.presentingIssue}`);

  const paymentParts: string[] = [];
  if (criteria.payment) paymentParts.push(criteria.payment);
  if (criteria.insurance && (criteria.payment === "Insurance" || criteria.payment === "Both")) {
    paymentParts.push(criteria.insurance);
  }
  if (paymentParts.length > 0) lines.push(`- Payment: ${paymentParts.join(" – ")}`);

  const formatParts: string[] = [];
  if (criteria.format) formatParts.push(criteria.format);
  if (criteria.location) formatParts.push(criteria.location);
  if (formatParts.length > 0) lines.push(`- Format & area: ${formatParts.join(", ")}`);

  if (criteria.urgency) lines.push(`- Timing: ${criteria.urgency}`);

  lines.push("");
  lines.push(
    "Would you be able to take this client on? If you have availability, I'll share the specifics directly through a secure channel."
  );
  lines.push("");
  lines.push(
    `Reference: ${code} — including this so we can both keep track of where this referral lands.`
  );
  lines.push("");
  lines.push(
    "About Austin Therapist Exchange: a private, invite-only referral network for Austin-area clinicians, built to make trusted therapist-to-therapist referrals simple. More at austintherapistexchange.com."
  );
  lines.push("");
  lines.push("Thanks so much,");
  if (senderName) lines.push(senderName);

  return lines.join("\r\n");
}

function buildMailto(
  email: string,
  therapistName: string,
  senderName: string,
  code: string,
  criteria: ContactCriteria
): string {
  const subject = "Referral for You - Via Austin Therapist Exchange";
  const body = buildMailtoBody(therapistName, senderName, code, criteria);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildBatchMailtoBody(senderName: string, code: string, criteria: ContactCriteria): string {
  const lines: string[] = [];

  lines.push("Hello,");
  lines.push("");
  lines.push(
    "I came across your profile on Austin Therapist Exchange and think you may be a good fit for a client I'm hoping to refer. Here's what I can share:"
  );
  lines.push("");

  if (criteria.levelOfCare) lines.push(`- Level of care: ${criteria.levelOfCare}`);
  if (criteria.clientType) lines.push(`- Client type: ${criteria.clientType}`);
  if (criteria.presentingIssue) lines.push(`- Presenting concern: ${criteria.presentingIssue}`);

  const paymentParts: string[] = [];
  if (criteria.payment) paymentParts.push(criteria.payment);
  if (criteria.insurance && (criteria.payment === "Insurance" || criteria.payment === "Both")) {
    paymentParts.push(criteria.insurance);
  }
  if (paymentParts.length > 0) lines.push(`- Payment: ${paymentParts.join(" – ")}`);

  const formatParts: string[] = [];
  if (criteria.format) formatParts.push(criteria.format);
  if (criteria.location) formatParts.push(criteria.location);
  if (formatParts.length > 0) lines.push(`- Format & area: ${formatParts.join(", ")}`);

  if (criteria.urgency) lines.push(`- Timing: ${criteria.urgency}`);

  lines.push("");
  lines.push(
    "Would you be able to take this client on? If you have availability, I'll share the specifics directly through a secure channel."
  );
  lines.push("");
  lines.push(
    `Reference: ${code} — including this so we can both keep track of where this referral lands.`
  );
  lines.push("");
  lines.push(
    "About Austin Therapist Exchange: a private, invite-only referral network for Austin-area clinicians, built to make trusted therapist-to-therapist referrals simple. More at austintherapistexchange.com."
  );
  lines.push("");
  lines.push("Thanks so much,");
  if (senderName) lines.push(senderName);

  return lines.join("\r\n");
}

function buildBatchMailto(
  senderEmail: string,
  bccEmails: string[],
  senderName: string,
  code: string,
  criteria: ContactCriteria
): string {
  const subject = "Referral for You - Via Austin Therapist Exchange";
  const body = buildBatchMailtoBody(senderName, code, criteria);
  const parts: string[] = [];
  if (bccEmails.length > 0) parts.push(`bcc=${encodeURIComponent(bccEmails.join(","))}`);
  parts.push(`subject=${encodeURIComponent(subject)}`);
  parts.push(`body=${encodeURIComponent(body)}`);
  const to = senderEmail ? encodeURIComponent(senderEmail) : "";
  return `mailto:${to}?${parts.join("&")}`;
}

export function ReferralComposeForm({
  statusCopy,
  therapists,
  senderName = "",
  senderEmail = ""
}: {
  statusCopy?: string | null;
  therapists: PublicTherapistSummary[];
  senderName?: string;
  senderEmail?: string;
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
  const [formOpen, setFormOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | undefined>(undefined);
  const [currentCode, setCurrentCode] = useState<string | undefined>(undefined);

  // Multi-select state
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [batchPendingCode] = useState(() => mintReferralCode());
  const [batchLogState, setBatchLogState] = useState<{ loggedCount: number; code: string } | null>(null);
  const [isBatchPending, startBatchTransition] = useTransition();

  const activeBatchCode = currentCode ?? batchPendingCode;

  // Restore state from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const loc = p.get("loc") ?? "";
    const urg = p.get("urg") ?? "";
    const ct = p.get("ct") ?? "";
    const pi = p.get("pi") ?? "";
    const region = p.get("region") ?? "";
    const pay = p.get("pay") ?? "";
    const ins = p.get("ins") ?? "";
    const fmt = p.get("fmt") ?? "";
    const gf = p.get("gf") ?? "";
    const age = p.get("age") ?? "";
    const sub = p.get("sub") === "1";
    if (loc) setLevelOfCare(loc);
    if (urg) setUrgency(urg);
    if (ct) setClientType(ct);
    if (pi) setPresentingIssue(pi);
    if (region) setLocation(region);
    if (pay) setPayment(pay);
    if (ins) setInsurance(ins);
    if (fmt) setFormat(fmt);
    if (gf) setGroupFocus(gf);
    if (age) setAgeRange(age);
    if (sub) { setSubmitted(true); setFormOpen(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write state to URL on every change (no router — avoids re-renders)
  useEffect(() => {
    const p = new URLSearchParams();
    if (levelOfCare) p.set("loc", levelOfCare);
    if (urgency) p.set("urg", urgency);
    if (clientType) p.set("ct", clientType);
    if (presentingIssue) p.set("pi", presentingIssue);
    if (location) p.set("region", location);
    if (payment) p.set("pay", payment);
    if (insurance) p.set("ins", insurance);
    if (format) p.set("fmt", format);
    if (groupFocus) p.set("gf", groupFocus);
    if (ageRange) p.set("age", ageRange);
    if (submitted) p.set("sub", "1");
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [levelOfCare, urgency, clientType, presentingIssue, location, payment, insurance, format, groupFocus, ageRange, submitted]);

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

  const filteredTherapists = useMemo(() =>
    therapists.filter((therapist) => {
      if (levelOfCare && !levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) return false;
      if (payment && !paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"))) return false;
      if (location && !locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) return false;
      if (
        insurance &&
        (payment === "Insurance" || payment === "Both" ||
          levelOfCare === "Intensive Outpatient (IOP)" ||
          levelOfCare === "Partial Hospitalization (PHP)" ||
          levelOfCare === "Residential Treatment") &&
        !insuranceMatches(insurance, therapist.insuranceAccepted, therapist.paymentModel)
      ) {
        return false;
      }
      return true;
    }),
    [therapists, levelOfCare, payment, location, insurance]
  );

  const rankedTherapists = useMemo(() =>
    filteredTherapists
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

        return { therapist, confidence, dimensions, score: trustScore + availabilityScore + confidenceScore + urgencyBoost };
      })
      .sort((a, b) => b.score - a.score),
    [filteredTherapists, levelOfCare, clientType, selectedPresentingIssue, payment, location, insurance, urgency]
  );

  const { topMatches, trustedNetworkMatches, broaderMatches, effectiveTopMatches, effectiveBroader, hasAnyNetwork } =
    useMemo(() => {
      const inNetwork = (t: PublicTherapistSummary) => t.trustedByViewer || t.isFollowed || t.trustedBy.length > 0;

      const top = rankedTherapists.filter((m) => m.confidence === "high" && inNetwork(m.therapist));
      const topIds = new Set(top.map((m) => m.therapist.profileId));

      const trusted = rankedTherapists.filter((m) => !topIds.has(m.therapist.profileId) && inNetwork(m.therapist));
      const trustedIds = new Set(trusted.map((m) => m.therapist.profileId));

      const broader = rankedTherapists.filter((m) => !topIds.has(m.therapist.profileId) && !trustedIds.has(m.therapist.profileId));

      const effectiveTop = top.length > 0 ? top : rankedTherapists.filter((m) => m.confidence === "high");
      const effectiveTopIds = new Set(effectiveTop.map((m) => m.therapist.profileId));
      const effectiveBroad = rankedTherapists.filter((m) => !effectiveTopIds.has(m.therapist.profileId));

      return {
        topMatches: top,
        trustedNetworkMatches: trusted,
        broaderMatches: broader,
        effectiveTopMatches: effectiveTop,
        effectiveBroader: effectiveBroad,
        hasAnyNetwork: rankedTherapists.some((m) => inNetwork(m.therapist)),
      };
    }, [rankedTherapists]);

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
    setSubmitted(false);
  };

  const handlePaymentChange = (newPayment: string) => {
    setPayment(newPayment);
    if (newPayment !== "Insurance" && newPayment !== "Both") setInsurance("");
    if (newPayment !== "Private Pay" && newPayment !== "Both") setPrivatePayMax("");
    setSubmitted(false);
  };

  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(() => {
      setSubmitted(true);
      setFormOpen(false);
    });
  };

  const handleEditSearch = () => {
    setSubmitted(false);
    setFormOpen(true);
  };

  const criteriaSummary = [
    levelOfCare,
    clientType,
    selectedPresentingIssue,
    location || null,
    payment || null
  ]
    .filter(Boolean)
    .join(" · ");

  // Derive selected therapist objects from rankedTherapists
  const selectedTherapists = useMemo(() =>
    rankedTherapists
      .map((m) => m.therapist)
      .filter((t) => selectedProfileIds.has(t.profileId)),
    [rankedTherapists, selectedProfileIds]
  );
  const selectedWithEmail = selectedTherapists.filter((t) => Boolean(t.publicEmail));
  const selectedWithoutEmail = selectedTherapists.filter((t) => !t.publicEmail);

  const batchMailtoHref = selectedWithEmail.length > 0
    ? buildBatchMailto(
        senderEmail,
        selectedWithEmail.map((t) => t.publicEmail as string),
        senderName,
        activeBatchCode,
        criteria
      )
    : undefined;

  function handleToggleSelect(profileId: string) {
    setSelectedProfileIds((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  function handleClearSelection() {
    setSelectedProfileIds(new Set());
    setBatchLogState(null);
  }

  function logBatch() {
    startBatchTransition(async () => {
      const emailIds = selectedWithEmail.map((t) => t.profileId);
      const manualIds = selectedWithoutEmail.map((t) => t.profileId);

      const firstIds = emailIds.length ? emailIds : manualIds;
      const firstMethod = emailIds.length ? ("email" as const) : ("manual" as const);

      const result = await logReferralContacts({
        caseId: currentCaseId,
        clientReference: activeBatchCode,
        criteria: {
          levelOfCare: criteria.levelOfCare,
          urgency: criteria.urgency,
          clientType: criteria.clientType,
          presentingIssue: criteria.presentingIssue,
          payment: criteria.payment,
          location: criteria.location,
          insurance: criteria.insurance,
        },
        referredProfileIds: firstIds,
        contactMethod: firstMethod,
      });

      if (!result.ok) return;

      setCurrentCaseId(result.caseId);
      setCurrentCode(result.clientReference);
      let total = result.loggedCount;

      if (emailIds.length > 0 && manualIds.length > 0) {
        const manualResult = await logReferralContacts({
          caseId: result.caseId,
          clientReference: result.clientReference,
          criteria: {
            levelOfCare: criteria.levelOfCare,
            urgency: criteria.urgency,
            clientType: criteria.clientType,
            presentingIssue: criteria.presentingIssue,
            payment: criteria.payment,
            location: criteria.location,
            insurance: criteria.insurance,
          },
          referredProfileIds: manualIds,
          contactMethod: "manual",
        });
        if (manualResult.ok) total += manualResult.loggedCount;
      }

      setBatchLogState({ loggedCount: total, code: result.clientReference });
    });
  }

  return (
    <div className="space-y-6">
      {statusCopy && (
        <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
          {statusCopy}
        </div>
      )}

      <Card className="bg-white/90">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Referral search</CardTitle>
            {submitted && (
              <button
                type="button"
                onClick={handleEditSearch}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
              >
                <Pencil size={12} />
                Edit Search
              </button>
            )}
          </div>
          {submitted && !formOpen && criteriaSummary && (
            <p className="mt-1 text-sm text-muted-foreground">{criteriaSummary}</p>
          )}
        </CardHeader>

        {formOpen && (
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
                    onChange={(e) => { setAdditionalNotes(e.target.value); setSubmitted(false); }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!hasRequiredFields || isPending}
                  className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? "Finding matches…" : "Find Trusted Referrals"}
                </button>
              </>
            )}
          </CardContent>
        )}
      </Card>

      {submitted ? (
        <div className="space-y-6">
          {/* Active case banner + start-new-client control */}
          {currentCode && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-foreground">
                Active case: <span className="font-mono font-semibold">{currentCode}</span>
                <span className="ml-2 text-xs text-muted-foreground">— record this code in your chart</span>
              </p>
              <button
                type="button"
                onClick={() => { setCurrentCaseId(undefined); setCurrentCode(undefined); }}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
              >
                <RefreshCw size={11} />
                Start new client
              </button>
            </div>
          )}

          {/* Multi-select action bar */}
          {selectedProfileIds.size > 0 && (
            <div className="sticky top-4 z-10 rounded-2xl border border-primary/30 bg-white shadow-md px-4 py-3 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {selectedProfileIds.size} selected
                </span>

                {batchMailtoHref ? (
                  <a
                    href={batchMailtoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={logBatch}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    {isBatchPending ? "Logging…" : "Contact selected"}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No email addresses on file for selected therapists — log manually below.
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={12} />
                  Clear selection
                </button>
              </div>

              {/* No-email notice */}
              {selectedWithoutEmail.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span className="font-medium">No email on file — contact manually: </span>
                  {selectedWithoutEmail.map((t) => t.displayName).join(", ")}
                  {". "}
                  These will still be logged as referrals under the shared code.
                </div>
              )}

              {/* Batch log confirmation */}
              {batchLogState && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                  <span className="font-medium">
                    Logged {batchLogState.loggedCount} referral{batchLogState.loggedCount === 1 ? "" : "s"} ·{" "}
                    <span className="font-mono">{batchLogState.code}</span>
                  </span>
                  <span className="ml-1">— record this code in your chart.</span>
                </div>
              )}
            </div>
          )}

          {rankedTherapists.length === 0 ? (
            <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
              No therapists match these criteria yet. Try adjusting your filters or check back as more providers join.
            </div>
          ) : hasAnyNetwork ? (
            <>
              {topMatches.length > 0 && (
                <MatchSection
                  icon={<Target size={16} className="text-primary" />}
                  title="Top Matches"
                  count={topMatches.length}
                  matches={topMatches}
                  criteria={criteria}
                  senderName={senderName}
                  currentCaseId={currentCaseId}
                  currentCode={currentCode}
                  onCaseCreated={(id, code) => { setCurrentCaseId(id); setCurrentCode(code); }}
                  selectedProfileIds={selectedProfileIds}
                  onToggleSelect={handleToggleSelect}
                />
              )}
              {trustedNetworkMatches.length > 0 && (
                <MatchSection
                  icon={<Users size={16} className="text-primary" />}
                  title="Trusted Network"
                  count={trustedNetworkMatches.length}
                  matches={trustedNetworkMatches}
                  criteria={criteria}
                  senderName={senderName}
                  currentCaseId={currentCaseId}
                  currentCode={currentCode}
                  onCaseCreated={(id, code) => { setCurrentCaseId(id); setCurrentCode(code); }}
                  selectedProfileIds={selectedProfileIds}
                  onToggleSelect={handleToggleSelect}
                />
              )}
              {broaderMatches.length > 0 && (
                <MatchSection
                  icon={<Globe size={16} className="text-muted-foreground" />}
                  title="Broader Matches"
                  count={broaderMatches.length}
                  matches={broaderMatches}
                  criteria={criteria}
                  senderName={senderName}
                  currentCaseId={currentCaseId}
                  currentCode={currentCode}
                  onCaseCreated={(id, code) => { setCurrentCaseId(id); setCurrentCode(code); }}
                  selectedProfileIds={selectedProfileIds}
                  onToggleSelect={handleToggleSelect}
                />
              )}
            </>
          ) : (
            <>
              {effectiveTopMatches.length > 0 && (
                <MatchSection
                  icon={<Target size={16} className="text-primary" />}
                  title="Top Matches"
                  count={effectiveTopMatches.length}
                  matches={effectiveTopMatches}
                  criteria={criteria}
                  senderName={senderName}
                  currentCaseId={currentCaseId}
                  currentCode={currentCode}
                  onCaseCreated={(id, code) => { setCurrentCaseId(id); setCurrentCode(code); }}
                  selectedProfileIds={selectedProfileIds}
                  onToggleSelect={handleToggleSelect}
                />
              )}
              {effectiveBroader.length > 0 && (
                <MatchSection
                  icon={<Globe size={16} className="text-muted-foreground" />}
                  title="Other Matches"
                  count={effectiveBroader.length}
                  matches={effectiveBroader}
                  criteria={criteria}
                  senderName={senderName}
                  currentCaseId={currentCaseId}
                  currentCode={currentCode}
                  onCaseCreated={(id, code) => { setCurrentCaseId(id); setCurrentCode(code); }}
                  selectedProfileIds={selectedProfileIds}
                  onToggleSelect={handleToggleSelect}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Complete the required criteria above to see matching therapists.</p>
      )}
    </div>
  );
}

const SECTION_DEFAULT_SHOW = 5;

function MatchSection({
  icon,
  title,
  count,
  matches,
  criteria,
  senderName,
  currentCaseId,
  currentCode,
  onCaseCreated,
  selectedProfileIds,
  onToggleSelect,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  matches: Array<{
    therapist: PublicTherapistSummary;
    confidence: "high" | "medium" | "low";
    dimensions: MatchDimension[];
    score: number;
  }>;
  criteria: ContactCriteria;
  senderName: string;
  currentCaseId?: string;
  currentCode?: string;
  onCaseCreated: (caseId: string, code: string) => void;
  selectedProfileIds: Set<string>;
  onToggleSelect: (profileId: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? matches : matches.slice(0, SECTION_DEFAULT_SHOW);
  const hiddenCount = matches.length - SECTION_DEFAULT_SHOW;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {count}
        </span>
      </div>
      <div className="space-y-3">
        {visible.map(({ therapist, confidence, dimensions }) => (
          <TherapistMatchCard
            key={therapist.profileId}
            therapist={therapist}
            confidence={confidence}
            dimensions={dimensions}
            criteria={criteria}
            senderName={senderName}
            currentCaseId={currentCaseId}
            currentCode={currentCode}
            onCaseCreated={onCaseCreated}
            isSelected={selectedProfileIds.has(therapist.profileId)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
      {!showAll && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-2xl border border-dashed border-slate-300 py-2.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          Show {hiddenCount} more
        </button>
      )}
      {showAll && matches.length > SECTION_DEFAULT_SHOW && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="w-full rounded-2xl border border-dashed border-slate-300 py-2.5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}

function TherapistMatchCard({
  therapist,
  confidence,
  dimensions,
  criteria,
  senderName,
  currentCaseId,
  currentCode,
  onCaseCreated,
  isSelected,
  onToggleSelect,
}: {
  therapist: PublicTherapistSummary;
  confidence: "high" | "medium" | "low";
  dimensions: MatchDimension[];
  criteria: ContactCriteria;
  senderName: string;
  currentCaseId?: string;
  currentCode?: string;
  onCaseCreated: (caseId: string, code: string) => void;
  isSelected: boolean;
  onToggleSelect: (profileId: string) => void;
}) {
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);
  const [logState, setLogState] = useState<LogReferralContactResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Pre-mint a code at render time so the mailto href is fully built before any click.
  // If an active case already exists (currentCode), use that code instead.
  const [pendingCode] = useState(() => mintReferralCode());
  const activeCode = currentCode ?? pendingCode;

  const mailtoHref = therapist.publicEmail
    ? buildMailto(therapist.publicEmail, therapist.displayName, senderName, activeCode, criteria)
    : undefined;

  const confidenceLabel =
    confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low";
  const confidenceColor =
    confidence === "high"
      ? "text-green-600"
      : confidence === "medium"
        ? "text-amber-600"
        : "text-muted-foreground";

  const trustBadges: string[] = [];
  if (therapist.trustedByViewer) trustBadges.push("You Trust");
  else if (therapist.isFollowed) trustBadges.push("In Network");
  else if (therapist.trustedBy.length === 1) {
    trustBadges.push(`${therapist.trustedBy[0]?.name} trusts them`);
  } else if (therapist.trustedBy.length > 1) {
    trustBadges.push(`${therapist.trustedBy[0]?.name} +${therapist.trustedBy.length - 1} trust them`);
  }

  const attributeChips: string[] = [];
  if (therapist.populations.length > 0) {
    attributeChips.push(`Works with ${therapist.populations[0]}`);
  }
  if (therapist.telehealth && therapist.availabilityStatus === "accepting") {
    attributeChips.push("Available via Telehealth");
  } else if (therapist.telehealth) {
    attributeChips.push("Telehealth");
  }
  if (therapist.inPerson && therapist.neighborhoods[0]) {
    attributeChips.push(`Located in ${therapist.neighborhoods[0]}`);
  }
  attributeChips.push(getPaymentModelLabel(therapist.paymentModel));

  const whyExplanations = generateMatchExplanation(
    criteria.levelOfCare,
    criteria.clientType,
    criteria.presentingIssue,
    criteria.payment,
    criteria.location,
    criteria.insurance,
    therapist
  );

  function handleLog() {
    startTransition(async () => {
      const result = await logReferralContact({
        caseId: currentCaseId,
        clientReference: currentCaseId ? undefined : activeCode,
        criteria: {
          levelOfCare: criteria.levelOfCare,
          urgency: criteria.urgency,
          clientType: criteria.clientType,
          presentingIssue: criteria.presentingIssue,
          payment: criteria.payment,
          location: criteria.location,
          insurance: criteria.insurance,
        },
        referredProfileId: therapist.profileId,
        contactMethod: therapist.publicEmail ? "email" : "manual",
      });
      setLogState(result);
      if (result.ok) {
        onCaseCreated(result.caseId, result.clientReference);
      }
    });
  }

  function handleCopyEmail() {
    if (therapist.publicEmail) {
      navigator.clipboard.writeText(therapist.publicEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  }

  function handleCopyTemplate() {
    const code = logState?.ok ? logState.clientReference : activeCode;
    navigator.clipboard.writeText(
      buildMailtoBody(therapist.displayName, senderName, code, criteria)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasEmail = Boolean(therapist.publicEmail);
  const alreadyLogged = logState?.ok === true;

  return (
    <div className={`rounded-2xl border bg-white p-5 transition-colors ${isSelected ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        <div className="pt-1 shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(therapist.profileId)}
            aria-label={`Select ${therapist.displayName}`}
            className="h-4 w-4 rounded accent-primary cursor-pointer"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-semibold text-foreground">{therapist.displayName}</h3>
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary"
              >
                <span className="text-[9px]" aria-hidden>○</span>
                {badge}
              </span>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={12} className="shrink-0" />
            <span>
              {therapist.neighborhoods[0] ?? therapist.city}
              {therapist.telehealth ? " · Telehealth" : ""}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
          <span className={`text-sm font-semibold ${confidenceColor}`}>{confidenceLabel}</span>
          <ConfidenceDots confidence={confidence} />
        </div>
      </div>

      {/* Attribute chips */}
      {attributeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {attributeChips.map((chip) => (
            <span
              key={chip}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Success confirmation */}
      {alreadyLogged && logState.ok && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm">
          <p className="font-medium text-green-700">
            Logged · <span className="font-mono">{logState.clientReference}</span>
          </p>
          <p className="text-xs text-green-600">Record this code in your chart — it is not stored in the email.</p>
          {!hasEmail && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
              >
                <ClipboardCopy size={12} />
                {copied ? "Copied!" : "Copy inquiry template"}
              </button>
              {therapist.bookingUrl && (
                <a
                  href={therapist.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline underline-offset-4"
                >
                  Booking page →
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!alreadyLogged && (
          mailtoHref ? (
            // Native anchor — browser opens mail client without any JavaScript gate
            <Button asChild className="min-w-[120px] flex-1">
              <a href={mailtoHref} target="_blank" rel="noopener noreferrer" onClick={handleLog}>
                {isPending ? "Logging…" : "Contact & log"}
              </a>
            </Button>
          ) : (
            // No email on file — log only
            <Button
              className="min-w-[120px] flex-1"
              disabled={isPending}
              onClick={handleLog}
            >
              {isPending ? "Logging…" : "Log contact"}
            </Button>
          )
        )}

        {/* Always-visible fallback: copy the address, copy the message body */}
        {hasEmail && (
          <>
            <button
              type="button"
              onClick={handleCopyEmail}
              title="Copy email address"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              <ClipboardCopy size={11} className="shrink-0" />
              {copiedEmail ? "Copied!" : therapist.publicEmail}
            </button>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              <ClipboardCopy size={12} />
              {copied ? "Copied!" : "Copy message"}
            </button>
          </>
        )}

        {/* No-email fallback: copy the inquiry template */}
        {!hasEmail && (
          <button
            type="button"
            onClick={handleCopyTemplate}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
          >
            <ClipboardCopy size={12} />
            {copied ? "Copied!" : "Copy template"}
          </button>
        )}

        <Button
          variant="outline"
          className="min-w-[120px] flex-1"
          onClick={() => {
            window.location.href = `/directory/${therapist.slug}?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          }}
        >
          <Eye size={14} className="mr-1.5" />
          View Profile
        </Button>
        <button
          type="button"
          onClick={() => setIsWhyExpanded((v) => !v)}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {isWhyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Why this match?
        </button>
      </div>

      {logState?.ok === false && (
        <p className="mt-2 text-xs text-red-600">Couldn&apos;t log. Try again.</p>
      )}

      {/* Expandable "Why this match?" */}
      {isWhyExpanded && (
        <div className="mt-3 space-y-3 rounded-xl bg-muted/40 px-3 py-3">
          {whyExplanations.length > 0 && (
            <ul className="space-y-1.5">
              {whyExplanations.map((explanation, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  {explanation}
                </li>
              ))}
            </ul>
          )}
          <MatchBreakdown
            dimensions={dimensions}
            availabilityStatus={therapist.availabilityStatus}
          />
        </div>
      )}
    </div>
  );
}
