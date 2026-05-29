"use client";

import { useActionState } from "react";

import { submitJoinApplicationInline } from "@/app-actions/member-actions";
import type { JoinApplicationState } from "@/app-actions/member-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function JoinApplicationForm({
  defaultCode,
  sponsorName
}: {
  defaultCode?: string;
  sponsorName?: string | null;
}) {
  const [state, formAction] = useActionState<JoinApplicationState, FormData>(
    submitJoinApplicationInline,
    { status: "idle" }
  );

  if (state.status === "success") {
    return (
      <div className="rounded-[24px] border bg-background p-6 text-sm leading-7 text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Application submitted.</p>
        <p>We&apos;ll review your application and follow up by email. It usually takes a few business days. After approval, sign in and finish your profile.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-[24px] border border-red-100 bg-red-50/60 p-4 text-sm text-red-700"
        >
          {state.message}
        </div>
      )}

      {defaultCode && state.status === "idle" && (
        <div className="rounded-[24px] border bg-background p-4 text-sm leading-7 text-muted-foreground">
          <p>Referral code recognized{sponsorName ? ` — sponsored by ${sponsorName}` : ""}.</p>
        </div>
      )}

      <input
        className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="fullName"
        placeholder="Full name"
        required
        autoComplete="name"
      />
      <input
        className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="email"
        placeholder="Email"
        type="email"
        required
        autoComplete="email"
      />
      <input
        className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="credentials"
        placeholder="Credentials (e.g. LPC, LCSW, LMFT)"
        required
      />
      <input
        className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="licenseNumber"
        placeholder="License number (optional)"
      />
      <input
        className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="websiteUrl"
        placeholder="Practice website (optional)"
        type="url"
      />
      <div className="space-y-1">
        <input
          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
          defaultValue={defaultCode?.toUpperCase()}
          name="referralCode"
          placeholder="Referral code"
          required
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="px-1 text-xs text-muted-foreground">
          Required — get this from the member who invited you.
        </p>
      </div>
      <textarea
        className="min-h-32 w-full rounded-2xl border bg-background px-4 py-3 text-sm"
        name="note"
        placeholder="Short note about your practice"
      />
      <SubmitButton pendingLabel="Submitting…">Submit application</SubmitButton>
    </form>
  );
}
