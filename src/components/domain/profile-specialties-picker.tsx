"use client";

import { PRESENTING_ISSUES } from "@/lib/referral-matching";
import { useState } from "react";

const MAX = 5;

export function ProfileSpecialtiesPicker({ defaultSelected }: { defaultSelected: string[] }) {
  const [selected, setSelected] = useState<string[]>(
    defaultSelected.filter((s): s is typeof PRESENTING_ISSUES[number] =>
      (PRESENTING_ISSUES as readonly string[]).includes(s)
    ).slice(0, MAX)
  );

  function toggle(issue: string) {
    setSelected((prev) =>
      prev.includes(issue)
        ? prev.filter((s) => s !== issue)
        : prev.length < MAX
        ? [...prev, issue]
        : prev
    );
  }

  const atMax = selected.length >= MAX;

  return (
    <div role="group" aria-labelledby="specialties-label">
      <div className="mb-1 flex items-center justify-between">
        <span id="specialties-label" className="text-sm font-medium text-foreground">
          Specialties
          <span className="ml-0.5 text-destructive" aria-hidden="true"> *</span>
        </span>
        <span className={atMax ? "text-xs font-medium text-amber-600" : "text-xs text-muted-foreground"}>
          {selected.length} / {MAX} selected
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Select up to 5 — your strongest areas. Used to match referrals by presenting issue.
      </p>
      <div className="flex flex-wrap gap-3">
        {PRESENTING_ISSUES.map((issue) => {
          const checked = selected.includes(issue);
          const disabled = !checked && atMax;
          return (
            <label
              key={issue}
              className={
                disabled
                  ? "flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground opacity-40"
                  : "flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
              }
            >
              <input
                checked={checked}
                disabled={disabled}
                name="specialties"
                onChange={() => toggle(issue)}
                type="checkbox"
                value={issue}
              />
              {issue}
            </label>
          );
        })}
      </div>
    </div>
  );
}
