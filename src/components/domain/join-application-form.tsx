"use client";

import { useActionState, useState } from "react";

import { submitJoinApplicationInline, type JoinApplicationState } from "@/app-actions/member-actions";
import { Button } from "@/components/ui/button";
import { LEVELS_OF_CARE, PRESENTING_ISSUES } from "@/lib/referral-matching";

const PAYMENT_MODEL_OPTIONS = [
  { label: "Private pay only", value: "private_pay" },
  { label: "Insurance only", value: "insurance" },
  { label: "Private pay + insurance", value: "both" },
] as const;

const AVAILABILITY_OPTIONS = [
  { label: "Accepting new clients", value: "accepting" },
  { label: "Waitlist", value: "waitlist" },
  { label: "Not accepting referrals", value: "full" },
] as const;

const CARE_FORMAT_OPTIONS = [
  { label: "In person", value: "in_person" },
  { label: "Telehealth", value: "telehealth" },
  { label: "Both", value: "both" },
] as const;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1 block text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
    </span>
  );
}

function ChipGroup({
  label,
  required,
  options,
  selected,
  onToggle,
  max,
  singleSelect,
}: {
  label: string;
  required?: boolean;
  options: readonly string[] | readonly { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  max?: number;
  singleSelect?: boolean;
}) {
  const normalized = (options as readonly (string | { label: string; value: string })[]).map((o) =>
    typeof o === "string" ? { label: o, value: o } : o
  );

  return (
    <div className="space-y-2">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {normalized.map(({ label: optLabel, value }) => {
          const isSelected = selected.includes(value);
          const isDisabled = !isSelected && typeof max === "number" && selected.length >= max;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (isDisabled) return;
                if (singleSelect) {
                  onToggle(value);
                } else {
                  onToggle(value);
                }
              }}
              aria-pressed={isSelected}
              disabled={isDisabled}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-white shadow-sm"
                  : isDisabled
                  ? "cursor-not-allowed border border-slate-100 bg-slate-50 text-slate-300"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
              }`}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const INPUT = "w-full rounded-2xl border bg-background px-4 py-3 text-sm";

export function JoinApplicationForm({
  sponsorProfileId,
  sponsorName,
}: {
  sponsorProfileId?: string;
  sponsorName?: string | null;
}) {
  const [state, dispatch, isPending] = useActionState<JoinApplicationState, FormData>(
    submitJoinApplicationInline,
    { status: "idle" }
  );

  const [section, setSection] = useState<1 | 2>(1);

  // Section 1 state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [credentials, setCredentials] = useState("");
  const [website, setWebsite] = useState("");
  const [levelOfCare, setLevelOfCare] = useState<string[]>([]);
  const [s1Errors, setS1Errors] = useState<Record<string, string>>({});

  // Section 2 state
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [paymentModel, setPaymentModel] = useState("");
  const [availability, setAvailability] = useState("");
  const [careFormat, setCareFormat] = useState("");

  if (state.status === "success") {
    return (
      <div className="rounded-[24px] border bg-background p-6 text-sm leading-7 text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Application submitted — we&apos;ll be in touch within a few business days.</p>
      </div>
    );
  }

  function handleNext() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (levelOfCare.length === 0) errs.levelOfCare = "Select at least one level of care.";

    if (Object.keys(errs).length > 0) {
      setS1Errors(errs);
      return;
    }
    setS1Errors({});
    setSection(2);
  }

  function handleSubmit() {
    const fd = new FormData();
    fd.append("fullName", fullName.trim());
    fd.append("email", email.trim());
    fd.append("credentials", credentials.trim());
    fd.append("website", website.trim());
    for (const l of levelOfCare) fd.append("levelOfCare", l);
    for (const s of specialties) fd.append("specialties", s);
    fd.append("paymentModel", paymentModel);
    fd.append("availability", availability);
    fd.append("careFormat", careFormat);
    if (sponsorProfileId) fd.append("sponsorProfileId", sponsorProfileId);
    dispatch(fd);
  }

  // ── Section 2 ────────────────────────────────────────────────────────────────
  if (section === 2) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSection(1)}
          className="text-sm text-primary hover:underline"
        >
          ← Back
        </button>

        <h2 className="font-serif text-2xl">Your practice</h2>

        {state.status === "error" && (
          <div
            role="alert"
            className="rounded-[24px] border border-red-100 bg-red-50/60 p-4 text-sm text-red-700"
          >
            {state.message}
          </div>
        )}

        <ChipGroup
          label={`Specialties — select up to 5${specialties.length > 0 ? ` (${specialties.length} of 5 selected)` : ""}`}
          options={PRESENTING_ISSUES}
          selected={specialties}
          onToggle={(v) =>
            setSpecialties((prev) =>
              prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
            )
          }
          max={5}
        />

        <ChipGroup
          label="Payment model"
          required
          options={PAYMENT_MODEL_OPTIONS}
          selected={paymentModel ? [paymentModel] : []}
          onToggle={(v) => setPaymentModel((prev) => (prev === v ? "" : v))}
          singleSelect
        />

        <ChipGroup
          label="Current availability"
          required
          options={AVAILABILITY_OPTIONS}
          selected={availability ? [availability] : []}
          onToggle={(v) => setAvailability((prev) => (prev === v ? "" : v))}
          singleSelect
        />

        <ChipGroup
          label="Care format"
          required
          options={CARE_FORMAT_OPTIONS}
          selected={careFormat ? [careFormat] : []}
          onToggle={(v) => setCareFormat((prev) => (prev === v ? "" : v))}
          singleSelect
        />

        <Button
          type="button"
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || !paymentModel || !availability || !careFormat}
        >
          {isPending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    );
  }

  // ── Section 1 ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {sponsorName && (
        <p className="text-sm text-muted-foreground">You were invited by {sponsorName}</p>
      )}

      <h2 className="font-serif text-2xl">About you</h2>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-[24px] border border-red-100 bg-red-50/60 p-4 text-sm text-red-700"
        >
          {state.message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <FieldLabel required>Full name</FieldLabel>
          <input
            className={INPUT}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
          />
          {s1Errors.fullName && (
            <p className="mt-1 text-xs text-red-600">{s1Errors.fullName}</p>
          )}
        </div>

        <div>
          <FieldLabel required>Email address</FieldLabel>
          <input
            className={INPUT}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {s1Errors.email && (
            <p className="mt-1 text-xs text-red-600">{s1Errors.email}</p>
          )}
        </div>

        <div>
          <FieldLabel>Credentials</FieldLabel>
          <input
            className={INPUT}
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            placeholder="LPC, LMFT, LCSW…"
          />
          <p className="mt-1 px-1 text-xs text-muted-foreground">
            Your license type and number (e.g. LPC #12345) — helps us verify your membership
          </p>
        </div>

        <div>
          <FieldLabel>Website</FieldLabel>
          <input
            className={INPUT}
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
          />
        </div>

        <div>
          <ChipGroup
            label="Level of care — select all that apply"
            required
            options={LEVELS_OF_CARE}
            selected={levelOfCare}
            onToggle={(v) =>
              setLevelOfCare((prev) =>
                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
              )
            }
          />
          {s1Errors.levelOfCare && (
            <p className="mt-1 text-xs text-red-600">{s1Errors.levelOfCare}</p>
          )}
        </div>
      </div>

      <Button type="button" className="w-full" onClick={handleNext}>
        Next →
      </Button>
    </div>
  );
}
