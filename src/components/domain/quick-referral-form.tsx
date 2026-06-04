"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { sendDirectReferralInline } from "@/app-actions/member-actions";
import type { ReferralSendState } from "@/app-actions/member-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLIENT_TYPES, LEVELS_OF_CARE, PRESENTING_ISSUES } from "@/lib/referral-matching";

export interface QuickReferralTherapist {
  profileId: string;
  displayName: string;
  phone?: string;
  email?: string;
}

function buildOutreachMessage(
  therapist: QuickReferralTherapist,
  fields: { levelOfCare: string; clientType: string; presentingIssue: string; urgency: string; notes: string }
) {
  const firstName = therapist.displayName.split(",")[0]?.split(" ")[0] ?? therapist.displayName;
  const lines: string[] = [
    `Hi ${firstName},`,
    "",
    "I'm a discharge coordinator at Lucent and I'm reaching out about a potential client referral."
  ];

  if (fields.levelOfCare || fields.clientType || fields.presentingIssue) {
    lines.push("", "Client profile:");
    if (fields.levelOfCare)      lines.push(`  Level of care: ${fields.levelOfCare}`);
    if (fields.clientType)       lines.push(`  Client type: ${fields.clientType}`);
    if (fields.presentingIssue)  lines.push(`  Presenting issue: ${fields.presentingIssue}`);
    if (fields.urgency)          lines.push(`  Urgency: ${fields.urgency}`);
  }

  if (fields.notes) {
    lines.push("", `Additional context: ${fields.notes}`);
  }

  lines.push(
    "",
    "Please let me know if you have availability and I'll send over more details.",
    "",
    "Thank you,"
  );

  return lines.join("\n");
}

export function QuickReferralForm({ therapist }: { therapist: QuickReferralTherapist }) {
  const [state, formAction] = useActionState<ReferralSendState, FormData>(
    sendDirectReferralInline,
    { status: "idle" }
  );
  const [levelOfCare, setLevelOfCare]       = useState("");
  const [clientType, setClientType]         = useState("");
  const [presentingIssue, setPresentingIssue] = useState("");
  const [urgency, setUrgency]               = useState("");
  const [notes, setNotes]                   = useState("");
  const [copied, setCopied]                 = useState(false);
  const [isLogging, setIsLogging]           = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "idle") setIsLogging(false);
  }, [state.status]);

  const hasRequired = Boolean(levelOfCare && clientType && presentingIssue && urgency);
  const referralTitle = [
    clientType,
    presentingIssue ? `for ${presentingIssue}` : ""
  ].filter(Boolean).join(" ") + " referral";
  const outreachMessage = buildOutreachMessage(therapist, { levelOfCare, clientType, presentingIssue, urgency, notes });

  function handleCopy() {
    navigator.clipboard.writeText(outreachMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {/* best-effort */});
  }

  function handleLog() {
    setIsLogging(true);
    formRef.current?.requestSubmit();
  }

  if (state.status === "success") {
    return (
      <div className="rounded-3xl border bg-green-50 p-8 text-center space-y-4">
        <p className="text-lg font-semibold text-green-800">Referral logged</p>
        <p className="text-sm text-green-700">Recorded in your referral history. The therapist was not notified.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/member/referrals">View referral history</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/directory">Back to directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hidden form — submitted programmatically when coordinator clicks Log */}
      <form ref={formRef} action={formAction}>
        <input name="receiverProfileId" type="hidden" value={therapist.profileId} />
        <input name="title"             type="hidden" value={referralTitle || "Client referral"} />
        <input name="body"              type="hidden" value={notes || "Quick referral from profile page."} />
        <input name="levelOfCare"       type="hidden" value={levelOfCare} />
        <input name="urgencyLevel"      type="hidden" value={urgency} />
        <input name="clientType"        type="hidden" value={clientType} />
        <input name="presentingIssue"   type="hidden" value={presentingIssue} />
        <input name="additionalNotes"   type="hidden" value={notes} />
      </form>

      {/* Contact info */}
      <Card className="bg-white/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {therapist.phone ? (
            <ContactRow label="Phone">
              <a className="font-medium text-foreground hover:text-primary" href={`tel:${therapist.phone}`}>
                {therapist.phone}
              </a>
            </ContactRow>
          ) : null}
          {therapist.email ? (
            <ContactRow label="Email">
              <a
                className="font-medium text-foreground hover:text-primary"
                href={`mailto:${therapist.email}?subject=${encodeURIComponent("Referral inquiry from Lucent")}`}
              >
                {therapist.email}
              </a>
            </ContactRow>
          ) : null}
          {!therapist.phone && !therapist.email ? (
            <p className="text-sm text-muted-foreground">No contact info on file.</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Client details */}
      <Card className="bg-white/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Client details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Level of care <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LEVELS_OF_CARE.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLevelOfCare(levelOfCare === level ? "" : level)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    levelOfCare === level
                      ? "bg-primary text-white shadow-sm"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="qr-clientType">
                Client type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="qr-clientType"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
              >
                <option value="">Select type</option>
                {CLIENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="qr-presentingIssue">
                Presenting issue <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="qr-presentingIssue"
                value={presentingIssue}
                onChange={(e) => setPresentingIssue(e.target.value)}
              >
                <option value="">Select issue</option>
                {PRESENTING_ISSUES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="qr-urgency">
                Urgency <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="qr-urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="">Select urgency</option>
                <option value="Urgent - needs care in the next few days">Urgent — needs care in the next few days</option>
                <option value="Moderately Urgent - needs care in the next week">Moderately urgent — needs care in the next week</option>
                <option value="Low Urgency - needs care in the next few weeks">Low urgency — needs care in the next few weeks</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="qr-notes">
                Additional notes
              </label>
              <textarea
                className="min-h-20 w-full rounded-2xl border bg-white px-4 py-3 text-sm"
                id="qr-notes"
                placeholder="Any additional context about the client or the referral…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outreach message — live preview */}
      <Card className="bg-white/90">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Outreach message</CardTitle>
            <button
              className="text-xs font-medium text-primary transition hover:text-primary/80"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-2xl border bg-muted/30 p-4 font-sans text-xs leading-5 text-muted-foreground">
            {outreachMessage}
          </pre>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!hasRequired || isLogging} onClick={handleLog}>
          {isLogging ? "Logging…" : "Log this referral"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/directory">Cancel</Link>
        </Button>
        {!hasRequired && (
          <p className="text-xs text-muted-foreground">Fill in the required fields above first.</p>
        )}
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600">Couldn&apos;t log referral. Please try again.</p>
      )}

      <p className="text-xs text-muted-foreground">
        Logging records this referral in your history. The therapist is not notified.
      </p>
    </div>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-10 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}
