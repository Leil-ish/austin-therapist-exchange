"use client";

import { useState } from "react";
import { ChevronDown, ClipboardCopy, Eye, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

// Static mock of what a TherapistMatchCard action row looks like after the fallback update.
// Not connected to real data — just for visual verification.

const MOCK_EMAIL = "sarahchen@therapyatx.com";

function MockCard({ hasEmail }: { hasEmail: boolean }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);

  const mailtoHref = hasEmail
    ? `mailto:${MOCK_EMAIL}?subject=Referral%20for%20You%20-%20Via%20Austin%20Therapist%20Exchange&body=Hi%20Dr.%20Sarah%20Chen%2C%0D%0A%0D%0AMock%20body.`
    : undefined;

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Dr. Sarah Chen, LPC</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
              <span className="text-[9px]" aria-hidden>○</span>You Trust
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={12} />
            <span>South Congress · Telehealth</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm font-semibold text-green-600">High</span>
          <div className="flex gap-1">
            {[1,2,3].map(i => <div key={i} className="h-2 w-2 rounded-full bg-green-500" />)}
          </div>
        </div>
      </div>

      {/* Attribute chips */}
      <div className="flex flex-wrap gap-1.5">
        {["Works with Adults", "Available via Telehealth", "Accepts Private Pay"].map(c => (
          <span key={c} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">{c}</span>
        ))}
      </div>

      {/* Success banner (shown after logging) */}
      {logged && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm">
          <p className="font-medium text-green-700">Logged · <span className="font-mono">CASE-A7K9</span></p>
          <p className="text-xs text-green-600">Record this code in your chart — it is not stored in the email.</p>
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2">
        {!logged && (
          mailtoHref ? (
            <Button asChild className="min-w-[120px] flex-1">
              <a href={mailtoHref} onClick={() => setTimeout(() => setLogged(true), 800)}>
                Contact &amp; log
              </a>
            </Button>
          ) : (
            <Button className="min-w-[120px] flex-1" onClick={() => setLogged(true)}>
              Log contact
            </Button>
          )
        )}

        {/* Always-visible fallback */}
        {hasEmail && (
          <>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(MOCK_EMAIL); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }}
              title="Copy email address"
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              <ClipboardCopy size={11} className="shrink-0" />
              {copiedEmail ? "Copied!" : MOCK_EMAIL}
            </button>
            <button
              type="button"
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
            >
              <ClipboardCopy size={12} />
              {copied ? "Copied!" : "Copy message"}
            </button>
          </>
        )}

        {!hasEmail && (
          <button
            type="button"
            onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors"
          >
            <ClipboardCopy size={12} />
            {copied ? "Copied!" : "Copy template"}
          </button>
        )}

        <Button variant="outline" className="min-w-[120px] flex-1">
          <Eye size={14} className="mr-1.5" />
          View Profile
        </Button>
        <button type="button" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown size={14} />
          Why this match?
        </button>
      </div>
    </div>
  );
}

export default function ReferralCardPreview() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
        <h1 className="font-serif text-3xl text-foreground">Referral match card</h1>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Therapist with email on file</p>
        <MockCard hasEmail={true} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Therapist with no email on file</p>
        <MockCard hasEmail={false} />
      </div>
    </main>
  );
}
