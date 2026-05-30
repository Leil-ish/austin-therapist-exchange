"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { PublicTherapistSummary } from "@/types";

interface Criteria {
  levelOfCare: string;
  urgency: string;
  clientType: string;
  presentingIssue: string;
  payment: string;
  insurance: string;
  location: string;
  additionalNotes: string;
}

interface Props {
  therapist: PublicTherapistSummary;
  criteria: Criteria;
  onLog: () => void;
  onClose: () => void;
  isLogging: boolean;
}

function buildOutreachMessage(therapist: PublicTherapistSummary, criteria: Criteria) {
  const firstName = therapist.displayName.split(",")[0]?.split(" ")[0] ?? therapist.displayName;
  const lines: string[] = [
    `Hi ${firstName},`,
    "",
    "I'm a discharge coordinator at Lucent and I'm reaching out about a potential client referral.",
    "",
    "Client profile:"
  ];

  if (criteria.levelOfCare) lines.push(`  Level of care: ${criteria.levelOfCare}`);
  if (criteria.clientType)  lines.push(`  Client type: ${criteria.clientType}`);
  if (criteria.presentingIssue) lines.push(`  Presenting issue: ${criteria.presentingIssue}`);
  if (criteria.payment)    lines.push(`  Payment: ${criteria.payment}`);
  if (criteria.insurance)  lines.push(`  Insurance: ${criteria.insurance}`);
  if (criteria.location)   lines.push(`  Preferred area: ${criteria.location}`);
  if (criteria.urgency)    lines.push(`  Urgency: ${criteria.urgency}`);

  if (criteria.additionalNotes) {
    lines.push("", `Additional context: ${criteria.additionalNotes}`);
  }

  lines.push(
    "",
    "Please let me know if you have availability and I'll send over more details.",
    "",
    "Thank you,"
  );

  return lines.join("\n");
}

export function ReferralContactModal({ therapist, criteria, onLog, onClose, isLogging }: Props) {
  const [copied, setCopied] = useState(false);

  const outreachMessage = buildOutreachMessage(therapist, criteria);

  function handleCopy() {
    navigator.clipboard.writeText(outreachMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {/* best-effort */});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Referral contact</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">{therapist.displayName}</h2>
            <p className="text-sm text-muted-foreground">{therapist.title}</p>
          </div>
          <button
            aria-label="Close"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <svg fill="none" height="18" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-6 pt-2">
          {/* Contact details */}
          <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
            <Row label="Phone">
              {therapist.publicPhone ? (
                <a className="font-medium text-foreground hover:text-primary" href={`tel:${therapist.publicPhone}`}>
                  {therapist.publicPhone}
                </a>
              ) : (
                <span className="text-muted-foreground">Not listed</span>
              )}
            </Row>
            <Row label="Email">
              {therapist.publicEmail ? (
                <a
                  className="font-medium text-foreground hover:text-primary"
                  href={`mailto:${therapist.publicEmail}?subject=${encodeURIComponent("Referral inquiry from Lucent")}`}
                >
                  {therapist.publicEmail}
                </a>
              ) : (
                <span className="text-muted-foreground">Not listed</span>
              )}
            </Row>
            {therapist.neighborhoods.length > 0 && (
              <Row label="Area">
                <span className="text-foreground">{therapist.neighborhoods.join(", ")}</span>
              </Row>
            )}
          </div>

          {/* Outreach message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Outreach message</p>
              <button
                className="text-xs font-medium text-primary transition hover:text-primary/80"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
            </div>
            <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-2xl border bg-muted/30 p-4 font-sans text-xs leading-5 text-muted-foreground">
              {outreachMessage}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" disabled={isLogging} onClick={onLog}>
              {isLogging ? "Logging…" : "Log this referral"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Logging records this referral in your history. The therapist is not notified.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-10 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 text-sm">{children}</span>
    </div>
  );
}
