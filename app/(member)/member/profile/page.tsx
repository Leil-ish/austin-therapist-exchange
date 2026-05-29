import { saveMemberProfile } from "@/app-actions/member-actions";
import { updatePassword } from "@/app-actions/auth-actions";
import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileForUser } from "@/lib/data/live-data";

function getStatusCopy(error?: string, saved?: string) {
  if (saved) {
    return "Profile saved.";
  }

  if (error === "missing-fields") {
    return "Please complete the required referral-facing profile fields.";
  }

  if (error === "save-failed") {
    return "We couldn't save your profile. Please try again.";
  }

  return null;
}

function getPasswordStatusCopy(error?: string, saved?: string) {
  if (saved) {
    return "Password updated.";
  }

  if (error === "missing-password") {
    return "Please enter and confirm your new password.";
  }

  if (error === "password-mismatch") {
    return "The password fields did not match.";
  }

  if (error === "password-too-short") {
    return "Use at least 10 characters for your password.";
  }

  return error ? `Password update error: ${error}` : null;
}

export default async function MemberProfilePage({
  searchParams
}: {
  searchParams?: Promise<{ saved?: string; error?: string; passwordSaved?: string; passwordError?: string }>;
}) {
  const session = await getSession();
  const params = searchParams ? await searchParams : undefined;
  const profile = session ? await getMemberProfileForUser(session.userId) : null;
  const statusCopy = getStatusCopy(params?.error, params?.saved);
  const passwordStatusCopy = getPasswordStatusCopy(params?.passwordError, params?.passwordSaved);

  if (!session || !profile) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="Profile data is not available yet."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-white/90 lg:col-span-2">
        <CardHeader>
          <CardTitle>Professional profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>Availability, fit, neighborhoods, payment, and a clear sense of your work.</p>
          {statusCopy ? <div className="rounded-[24px] border bg-background p-4">{statusCopy}</div> : null}
        </CardContent>
      </Card>

      <Card className="bg-white/90 lg:col-span-2">
        <CardHeader>
          <CardTitle>Edit public profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={saveMemberProfile} className="grid gap-4 md:grid-cols-2">
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.public_display_name ?? session.fullName)}
              name="publicDisplayName"
              placeholder="Public display name"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.credentials ?? "")}
              name="credentials"
              placeholder="Credentials"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm md:col-span-2"
              defaultValue={String(profile.headline ?? "")}
              name="headline"
              placeholder={session.membershipTier === "premium" ? "Your tagline — something personal (e.g. \"I help people find calm after chaos\")" : "Premium members can add a tagline"}
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.website_url ?? "")}
              name="websiteUrl"
              placeholder="Website URL"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.booking_url ?? "")}
              name="bookingUrl"
              placeholder="Booking URL (optional)"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.public_email ?? "")}
              name="publicEmail"
              placeholder="Public email"
              type="email"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.public_phone ?? "")}
              name="publicPhone"
              placeholder="Public phone"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={(Array.isArray(profile.neighborhoods) ? profile.neighborhoods : []).join(", ")}
              name="neighborhoods"
              placeholder="Primary neighborhood or area"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={(Array.isArray(profile.specialties) ? profile.specialties : []).join(", ")}
              name="specialties"
              placeholder="Specialties (comma separated)"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={(Array.isArray(profile.insurance_accepted) ? profile.insurance_accepted : []).join(", ")}
              name="insuranceAccepted"
              placeholder="Insurance carriers or notes (optional)"
            />
            <select
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.payment_model ?? "both")}
              name="paymentModel"
            >
              <option value="private_pay">Private pay</option>
              <option value="insurance">Insurance</option>
              <option value="both">Private pay + insurance</option>
            </select>
            <select
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              defaultValue={String(profile.availability_status ?? "waitlist")}
              name="availabilityStatus"
            >
              <option value="accepting">Accepting new clients</option>
              <option value="waitlist">Limited openings</option>
              <option value="full">Not accepting referrals</option>
            </select>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground">
              <label className="flex items-center gap-2">
                <input defaultChecked={Boolean(profile.offers_in_person)} name="offersInPerson" type="checkbox" />
                In person
              </label>
              <label className="flex items-center gap-2">
                <input defaultChecked={Boolean(profile.offers_telehealth)} name="offersTelehealth" type="checkbox" />
                Telehealth
              </label>
            </div>
            <textarea
              className="min-h-32 w-full rounded-2xl border bg-background px-4 py-3 text-sm md:col-span-2"
              defaultValue={String(profile.bio ?? "")}
              name="bio"
              placeholder="Short bio"
            />
            <textarea
              className="min-h-32 w-full rounded-2xl border bg-background px-4 py-3 text-sm md:col-span-2"
              defaultValue={String(profile.approach_summary ?? "")}
              name="approachSummary"
              placeholder="How would you describe your approach to therapy?"
            />
            <textarea
              className="min-h-24 w-full rounded-2xl border bg-background px-4 py-3 text-sm md:col-span-2"
              defaultValue={(Array.isArray(profile.featured_links) ? profile.featured_links : []).join("\n")}
              name="featuredLinks"
              placeholder="Featured links, one per line"
            />
            <textarea
              className="min-h-24 w-full rounded-2xl border bg-background px-4 py-3 text-sm md:col-span-2"
              defaultValue={(Array.isArray(profile.offerings) ? profile.offerings : []).join("\n")}
              name="offerings"
              placeholder={session.membershipTier === "premium" ? "Offerings, groups, workshops, or resources (one per line)" : "Premium members can add offerings and resources"}
            />
            <label className="flex items-center gap-2 rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground md:col-span-2">
              <input defaultChecked={Boolean(profile.is_public)} name="isPublic" type="checkbox" />
              Show this profile in the public directory
            </label>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Password login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>Password sign-in avoids email delays.</p>
          {passwordStatusCopy ? <div className="rounded-[24px] border bg-background p-4">{passwordStatusCopy}</div> : null}
          <form action={updatePassword} className="space-y-4">
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              name="password"
              placeholder="New password"
              type="password"
            />
            <input
              className="w-full rounded-2xl border bg-background px-4 py-3 text-sm"
              name="confirmPassword"
              placeholder="Confirm new password"
              type="password"
            />
            <SubmitButton pendingLabel="Saving…" variant="outline">Save password</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
