"use client";

import { useTransition, useState } from "react";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import Link from "next/link";

import { updateReferralResponse } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CaseStatus, ClientCase, ReferralStatus } from "@/lib/data/referral-tracking";

function caseStatusClasses(status: CaseStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-700";
    case "placed":
      return "bg-green-100 text-green-700";
    case "closed":
      return "bg-gray-100 text-gray-500";
  }
}

function referralStatusClasses(status: ReferralStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-100 text-amber-700";
    case "accepted":
    case "matched":
      return "bg-blue-100 text-blue-700";
    case "declined":
      return "bg-red-100 text-red-600";
    case "closed":
      return "bg-gray-100 text-gray-500";
    case "completed":
      return "bg-green-100 text-green-700";
  }
}

function StatusPill({ label, classes }: { label: string; classes: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}
    >
      {label}
    </span>
  );
}

const RESPONSE_OPTIONS: Array<{ value: ReferralStatus; label: string }> = [
  { value: "open", label: "Awaiting" },
  { value: "accepted", label: "Accepting" },
  { value: "declined", label: "Full" },
  { value: "completed", label: "Placed" },
  { value: "closed", label: "No reply" },
];

function ReferralResponseControl({
  referralId,
  caseId,
  currentStatus,
  onUpdate,
}: {
  referralId: string;
  caseId: string;
  currentStatus: ReferralStatus;
  onUpdate: (referralId: string, status: ReferralStatus, caseId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: ReferralStatus) {
    if (newStatus === currentStatus) return;
    onUpdate(referralId, newStatus, caseId);
    startTransition(async () => {
      await updateReferralResponse(referralId, newStatus);
    });
  }

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Response status">
      {RESPONSE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={isPending}
          onClick={() => handleChange(opt.value)}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
            currentStatus === opt.value
              ? "border-primary bg-primary text-white"
              : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ReferralTracker({ cases: initialCases }: { cases: ClientCase[] }) {
  const [cases, setCases] = useState<ClientCase[]>(initialCases);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const INITIAL_VISIBLE = 5;
  const visibleCases = showAll ? cases : cases.slice(0, INITIAL_VISIBLE);
  const hiddenCount = cases.length - INITIAL_VISIBLE;

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyRef(ref: string, id: string) {
    navigator.clipboard.writeText(ref);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function applyResponseUpdate(referralId: string, status: ReferralStatus, caseId: string) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updatedReferrals = c.referrals.map((r) => {
          if (r.id === referralId) {
            return { ...r, status, respondedAtLabel: status !== "open" ? "just now" : undefined };
          }
          if ((status === "completed" || status === "accepted") && r.status === "open") {
            return { ...r, status: "closed" as ReferralStatus };
          }
          return r;
        });
        const newCaseStatus: CaseStatus =
          status === "completed" || status === "accepted" ? "placed" : c.status;
        return { ...c, status: newCaseStatus, referrals: updatedReferrals };
      })
    );
  }

  function closeCase(caseId: string) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          status: "closed" as CaseStatus,
          referrals: c.referrals.map((r) => ({
            ...r,
            status: r.status === "open" ? ("closed" as ReferralStatus) : r.status,
          })),
        };
      })
    );
  }

  return (
    <div className="space-y-2">
      {visibleCases.map((c) => {
        const isOpen = expanded.has(c.id);
        const recipientSummary =
          c.referrals.length === 1
            ? c.referrals[0].therapistName
            : `${c.referrals.length} therapists`;

        return (
          <Card className="bg-white/90" key={c.id}>
            {/* Collapsed row — full-width click target */}
            <div
              className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4"
              onClick={() => toggleExpanded(c.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleExpanded(c.id);
              }}
              role="button"
              tabIndex={0}
            >
              <span className="flex items-center gap-1">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-mono text-sm font-medium">{c.clientReference}</span>
              </span>

              {/* Copy icon — stopPropagation so it doesn't toggle the accordion */}
              <button
                aria-label="Copy case reference"
                className="-ml-1 rounded p-0.5 hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  copyRef(c.clientReference, c.id);
                }}
                type="button"
              >
                {copiedId === c.id ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              <StatusPill label={c.status} classes={caseStatusClasses(c.status)} />

              <span className="text-sm text-muted-foreground">{recipientSummary}</span>

              <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                {c.levelOfCare} · {c.presentingIssue}
              </span>

              <span className="ml-auto text-xs text-muted-foreground">{c.createdAtLabel}</span>
            </div>

            {/* Expanded panel */}
            {isOpen && (
              <div className="space-y-5 border-t px-5 pb-5 pt-4">
                {/* De-identified criteria chips */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{c.levelOfCare}</Badge>
                  <Badge variant="outline">{c.presentingIssue}</Badge>
                  <Badge variant="outline">{c.clientType}</Badge>
                  <Badge variant="outline">{c.paymentModel.replace("_", " ")}</Badge>
                  <Badge variant="outline">{c.insurance}</Badge>
                  <Badge variant="outline">{c.neighborhood}</Badge>
                  <Badge variant="muted">{c.urgency} urgency</Badge>
                </div>

                {/* Fan-out referrals */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Referrals sent
                  </p>
                  {c.referrals.map((r) => (
                    <div
                      className="space-y-2 rounded-xl bg-muted/30 px-4 py-3"
                      key={r.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {/* TODO: add slug to case_referral query to enable profile links */}
                            {r.therapistSlug ? (
                              <Link
                                href={`/directory/${r.therapistSlug}`}
                                className="hover:underline underline-offset-4 text-foreground"
                              >
                                {r.therapistName}
                              </Link>
                            ) : (
                              r.therapistName
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sent {r.sentAtLabel}
                            {r.respondedAtLabel && ` · Responded ${r.respondedAtLabel}`}
                          </p>
                        </div>
                        <StatusPill label={r.status} classes={referralStatusClasses(r.status)} />
                      </div>
                      <ReferralResponseControl
                        referralId={r.id}
                        caseId={c.id}
                        currentStatus={r.status}
                        onUpdate={applyResponseUpdate}
                      />
                    </div>
                  ))}
                </div>

                {/* Case actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {c.status !== "closed" && (
                    <Button
                      onClick={() => closeCase(c.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Close case
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
      {hiddenCount > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Show {hiddenCount} more
        </button>
      )}
      {showAll && cases.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Show less
        </button>
      )}
    </div>
  );
}
