"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AUSTIN_METRO_AREAS } from "@/lib/referral-matching";

export function DirectoryFilters({
  query,
  region,
  availability,
  payment,
  format
}: {
  query: string;
  region: string;
  availability: string;
  payment: string;
  format: string;
}) {
  const router = useRouter();

  // Local state gives instant visual feedback before the navigation round-trip completes
  const [localQuery, setLocalQuery] = useState(query);
  const [localRegion, setLocalRegion] = useState(region);
  const [localAvailability, setLocalAvailability] = useState(availability);
  const [localPayment, setLocalPayment] = useState(payment);
  const [localFormat, setLocalFormat] = useState(format);

  function buildUrl(overrides: Record<string, string>) {
    const merged = {
      q: localQuery,
      region: localRegion,
      availability: localAvailability,
      payment: localPayment,
      format: localFormat,
      ...overrides
    };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return `/directory?${params.toString()}`;
  }

  function applyDropdown(key: string, value: string) {
    router.push(buildUrl({ [key]: value, page: "" }) as never);
  }

  function applySearch() {
    router.push(buildUrl({ q: localQuery, page: "" }) as never);
  }

  const hasFilters = localQuery || localRegion || localAvailability || localPayment || localFormat;

  return (
    <div className="space-y-4">
      {/* Filter inputs */}
      <div className="grid gap-4 rounded-[28px] border bg-white/90 p-5 md:grid-cols-[1.6fr_repeat(4,1fr)]">
        {/* Text search — navigate on Enter or search button click */}
        <div className="relative flex items-center">
          <input
            className="w-full rounded-2xl border bg-background px-4 py-3 pr-10 text-sm"
            placeholder="Search by name, specialty, neighborhood, or referral need"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch();
              }
            }}
          />
          {localQuery && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-3 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setLocalQuery("");
                router.push(buildUrl({ q: "", page: "" }) as never);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdowns — apply immediately on change */}
        <select
          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
          value={localRegion}
          onChange={(e) => {
            setLocalRegion(e.target.value);
            applyDropdown("region", e.target.value);
          }}
        >
          <option value="">All Austin metro areas</option>
          {AUSTIN_METRO_AREAS.map((area) => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>

        <select
          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
          value={localAvailability}
          onChange={(e) => {
            setLocalAvailability(e.target.value);
            applyDropdown("availability", e.target.value);
          }}
        >
          <option value="">Any availability</option>
          <option value="accepting">Accepting new clients</option>
          <option value="waitlist">Limited openings</option>
          <option value="full">Not accepting referrals</option>
        </select>

        <select
          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
          value={localPayment}
          onChange={(e) => {
            setLocalPayment(e.target.value);
            applyDropdown("payment", e.target.value);
          }}
        >
          <option value="">Any payment model</option>
          <option value="private_pay">Private pay</option>
          <option value="insurance">Insurance</option>
          <option value="both">Private pay + insurance</option>
        </select>

        <select
          className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
          value={localFormat}
          onChange={(e) => {
            setLocalFormat(e.target.value);
            applyDropdown("format", e.target.value);
          }}
        >
          <option value="">Any care format</option>
          <option value="telehealth">Telehealth</option>
          <option value="in_person">In person</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Clear all — only shown when something is active */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/directory"
            onClick={() => {
              setLocalQuery("");
              setLocalRegion("");
              setLocalAvailability("");
              setLocalPayment("");
              setLocalFormat("");
            }}
            className="rounded-xl border border-foreground px-5 py-2.5 text-sm font-medium text-foreground hover:bg-background/50"
          >
            Clear all filters
          </Link>
        </div>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {localQuery && (
            <button
              type="button"
              onClick={() => { setLocalQuery(""); router.push(buildUrl({ q: "", page: "" }) as never); }}
              className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm hover:border-foreground"
            >
              Search: <span className="font-medium">{localQuery}</span> <span className="text-muted-foreground">✕</span>
            </button>
          )}
          {localRegion && (
            <button
              type="button"
              onClick={() => { setLocalRegion(""); applyDropdown("region", ""); }}
              className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm hover:border-foreground"
            >
              Region: <span className="font-medium">{localRegion}</span> <span className="text-muted-foreground">✕</span>
            </button>
          )}
          {localAvailability && (
            <button
              type="button"
              onClick={() => { setLocalAvailability(""); applyDropdown("availability", ""); }}
              className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm hover:border-foreground"
            >
              Availability:{" "}
              <span className="font-medium">
                {localAvailability === "accepting" ? "Accepting new" : localAvailability === "waitlist" ? "Limited openings" : "Not accepting"}
              </span>{" "}
              <span className="text-muted-foreground">✕</span>
            </button>
          )}
          {localPayment && (
            <button
              type="button"
              onClick={() => { setLocalPayment(""); applyDropdown("payment", ""); }}
              className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm hover:border-foreground"
            >
              Payment:{" "}
              <span className="font-medium">
                {localPayment === "private_pay" ? "Private pay" : localPayment === "insurance" ? "Insurance" : "Both"}
              </span>{" "}
              <span className="text-muted-foreground">✕</span>
            </button>
          )}
          {localFormat && (
            <button
              type="button"
              onClick={() => { setLocalFormat(""); applyDropdown("format", ""); }}
              className="inline-flex items-center gap-2 rounded-full border border-muted-foreground bg-background px-3 py-1 text-sm hover:border-foreground"
            >
              Format:{" "}
              <span className="font-medium">
                {localFormat === "telehealth" ? "Telehealth" : localFormat === "in_person" ? "In person" : "Both"}
              </span>{" "}
              <span className="text-muted-foreground">✕</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
