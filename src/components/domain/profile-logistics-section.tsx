"use client";

import { INSURANCE_CARRIERS } from "@/lib/referral-matching";
import { useState } from "react";

const INPUT = "w-full rounded-2xl border bg-background px-4 py-3 text-sm";

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-foreground">
      {children}
      {required ? (
        <span className="ml-0.5 text-destructive" aria-hidden="true"> *</span>
      ) : (
        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
      )}
    </label>
  );
}

export function ProfileLogisticsSection({
  defaultPaymentModel,
  defaultAvailabilityStatus,
  defaultOffersInPerson,
  defaultOffersTelehealth,
  defaultInsuranceAccepted,
}: {
  defaultPaymentModel: string;
  defaultAvailabilityStatus: string;
  defaultOffersInPerson: boolean;
  defaultOffersTelehealth: boolean;
  defaultInsuranceAccepted: string[];
}) {
  const [paymentModel, setPaymentModel] = useState(defaultPaymentModel);
  const showInsurance = paymentModel !== "private_pay";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Label htmlFor="paymentModel" required>Payment model</Label>
        <select
          id="paymentModel"
          className={INPUT}
          name="paymentModel"
          value={paymentModel}
          onChange={(e) => setPaymentModel(e.target.value)}
        >
          <option value="private_pay">Private pay only</option>
          <option value="insurance">Insurance only</option>
          <option value="both">Private pay + insurance</option>
        </select>
      </div>
      <div>
        <Label htmlFor="availabilityStatus" required>Availability status</Label>
        <select
          id="availabilityStatus"
          className={INPUT}
          defaultValue={defaultAvailabilityStatus}
          name="availabilityStatus"
        >
          <option value="accepting">Accepting new clients</option>
          <option value="waitlist">Limited openings</option>
          <option value="full">Not accepting referrals</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <p className="mb-2 text-sm font-medium text-foreground">
          Care format <span className="text-destructive" aria-hidden="true"> *</span>
        </p>
        <div className="flex flex-wrap gap-4 rounded-2xl border bg-background px-4 py-3">
          <label
            htmlFor="offersInPerson"
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
          >
            <input
              id="offersInPerson"
              defaultChecked={defaultOffersInPerson}
              name="offersInPerson"
              type="checkbox"
            />
            In person
          </label>
          <label
            htmlFor="offersTelehealth"
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
          >
            <input
              id="offersTelehealth"
              defaultChecked={defaultOffersTelehealth}
              name="offersTelehealth"
              type="checkbox"
            />
            Telehealth
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">At least one is required.</p>
      </div>

      {showInsurance && (
        <div className="md:col-span-2">
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-foreground">
              Insurance accepted
              <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
            </legend>
            <p className="mb-3 text-xs text-muted-foreground">
              Select all plans you accept — used to match referrals by coverage.
            </p>
            <div className="flex flex-wrap gap-3">
              {INSURANCE_CARRIERS.map((carrier) => (
                <label
                  key={carrier}
                  className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                >
                  <input
                    defaultChecked={defaultInsuranceAccepted.includes(carrier)}
                    name="insurance"
                    type="checkbox"
                    value={carrier}
                  />
                  {carrier}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-4">
            <Label htmlFor="insuranceNotes">Insurance notes</Label>
            <input
              id="insuranceNotes"
              className={INPUT}
              name="insuranceNotes"
              placeholder="e.g. EAP accepted, limited spots for certain plans"
            />
          </div>
        </div>
      )}
    </div>
  );
}
