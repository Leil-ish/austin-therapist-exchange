import { saveMemberProfile } from "@/app-actions/member-actions";
import { updatePassword } from "@/app-actions/auth-actions";
import { COMMUNITIES, GENDERS, LANGUAGES, LOCATION_OPTIONS, MODALITIES } from "@/lib/referral-matching";
import { ProfileLogisticsSection } from "@/components/domain/profile-logistics-section";
import { ProfileSpecialtiesPicker } from "@/components/domain/profile-specialties-picker";
import { AvatarUpload } from "@/components/domain/avatar-upload";
import { AvailabilityFreshnessBanner } from "@/components/domain/availability-freshness-banner";
import { EmptyState } from "@/components/state/empty-state";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileForUser, getRecentlyReportedFull } from "@/lib/data/live-data";
import { cn } from "@/lib/utils";

// ─── tiny helpers ────────────────────────────────────────────────────────────

const INPUT = "w-full rounded-2xl border bg-background px-4 py-3 text-sm";
const LOCKED_INPUT = cn(INPUT, "cursor-not-allowed opacity-50");

function SectionCard({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="rounded-[28px] border bg-white/90 shadow-paper"
    >
      <div className="p-6">
        <h3 className="mb-5 font-serif text-2xl tracking-[0.01em]">{title}</h3>
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
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

function PremiumLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
      </label>
      <Badge variant="muted" className="py-0 text-xs">Premium</Badge>
    </div>
  );
}

// ─── status copy helpers ──────────────────────────────────────────────────────

function getStatusCopy(error?: string, saved?: string) {
  if (saved) return { text: "Profile saved.", ok: true };
  if (error === "missing-fields") return { text: "Please fill in the required fields (marked *).", ok: false };
  if (error === "save-failed") return { text: "We couldn't save your profile. Please try again.", ok: false };
  return null;
}

function getPasswordStatusCopy(error?: string, saved?: string) {
  if (saved) return "Password updated.";
  if (error === "missing-password") return "Please enter and confirm your new password.";
  if (error === "password-mismatch") return "The password fields did not match.";
  if (error === "password-too-short") return "Use at least 10 characters for your password.";
  return error ? `Password update error: ${error}` : null;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
    passwordSaved?: string;
    passwordError?: string;
  }>;
}) {
  const session = await getSession();
  const params = searchParams ? await searchParams : undefined;
  const [profile, recentlyReportedFull] = session
    ? await Promise.all([getMemberProfileForUser(session.userId), getRecentlyReportedFull(session.userId)])
    : [null, false];
  const status = getStatusCopy(params?.error, params?.saved);
  const passwordStatusCopy = getPasswordStatusCopy(params?.passwordError, params?.passwordSaved);
  const isPremium = session?.membershipTier === "premium";

  if (!session || !profile) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="Profile data is not available yet."
      />
    );
  }

  const communities = Array.isArray(profile.communities) ? (profile.communities as string[]) : [];
  const modalities = Array.isArray(profile.modalities) ? (profile.modalities as string[]) : [];
  const languages = Array.isArray(profile.languages) ? (profile.languages as string[]) : [];
  const specialties = Array.isArray(profile.specialties) ? (profile.specialties as string[]) : [];
  const neighborhoods = Array.isArray(profile.neighborhoods) ? (profile.neighborhoods as string[]) : [];
  const insuranceAccepted = Array.isArray(profile.insurance_accepted) ? (profile.insurance_accepted as string[]) : [];

  const profileCreatedAt =
    typeof profile.created_at === "string" ? new Date(profile.created_at) : null;
  const accountAgeInDays = profileCreatedAt
    ? (Date.now() - profileCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    : null;
  const isNewAccount = accountAgeInDays !== null && accountAgeInDays <= 7;
  const bio = String(profile.bio ?? "").trim();
  const showWelcomeBanner = !bio && neighborhoods.length === 0 && isNewAccount;

  const filterFieldChecks = [
    { label: "Gender", empty: !profile.gender },
    { label: "Languages", empty: languages.length === 0 },
    { label: "Modalities", empty: modalities.length === 0 },
    { label: "Communities served", empty: communities.length === 0 },
    { label: "Specialties", empty: specialties.length === 0 },
    { label: "Insurance accepted", empty: profile.payment_model !== "private_pay" && insuranceAccepted.length === 0 },
    { label: "In-person or telehealth format", empty: !profile.offers_in_person && !profile.offers_telehealth },
  ];
  const missingFilterFields = filterFieldChecks.filter((f) => f.empty).map((f) => f.label);

  return (
    <div className="space-y-6">

      {/* ── new-member welcome banner ── */}
      {showWelcomeBanner && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <p className="font-medium">Welcome to Austin Therapist Exchange — finish setting up your profile</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Add your bio, neighborhoods you serve, and insurance carriers to appear in more referral searches.
          </p>
        </div>
      )}

      {/* ── freshness + completeness banners ── */}
      <AvailabilityFreshnessBanner
        availabilityStatus={String(profile.availability_status ?? "waitlist")}
        availabilityUpdatedAt={
          typeof profile.availability_updated_at === "string"
            ? profile.availability_updated_at
            : null
        }
      />

      {missingFilterFields.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Complete your profile to appear in more referral searches</p>
          <p className="mt-1">
            Missing:{" "}
            {missingFilterFields.map((f, i) => (
              <span key={f}>
                {i > 0 && ", "}
                {f === "Gender" || f === "Languages" || f === "Modalities" || f === "Communities served" ? (
                  <a href="#matching-attributes" className="underline underline-offset-2">{f}</a>
                ) : (
                  f
                )}
              </span>
            ))}.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Fill in these fields in the form below to help colleagues find you when their client criteria match your practice.
          </p>
        </div>
      )}

      {/* ── avatar — separate from the profile form ── */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            currentAvatarUrl={
              typeof profile.avatar_url === "string" && profile.avatar_url
                ? profile.avatar_url
                : undefined
            }
            displayName={String(profile.public_display_name ?? session.fullName)}
            userId={session.userId}
          />
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════
          Main profile form
          All name= attributes are unchanged.
          ════════════════════════════════════════ */}
      <form action={saveMemberProfile} className="space-y-6">

        {/* ── BASICS ── */}
        <SectionCard title="Basics">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="publicDisplayName" required>Full name</FieldLabel>
              <input
                id="publicDisplayName"
                className={INPUT}
                defaultValue={String(profile.public_display_name ?? session.fullName)}
                name="publicDisplayName"
                placeholder="e.g. Sarah Chen"
              />
            </div>
            <div>
              <FieldLabel htmlFor="credentials" required>Credentials / title</FieldLabel>
              <input
                id="credentials"
                className={INPUT}
                defaultValue={String(profile.credentials ?? "")}
                name="credentials"
                placeholder="e.g. LPC, LCSW"
              />
            </div>
            <div className="md:col-span-2">
              <PremiumLabel htmlFor="headline" label="Tagline" />
              <input
                id="headline"
                className={isPremium ? INPUT : LOCKED_INPUT}
                disabled={!isPremium}
                defaultValue={String(profile.headline ?? "")}
                name="headline"
                placeholder={
                  isPremium
                    ? "Something personal — e.g. \"I help people find calm after chaos\""
                    : "Upgrade to Premium to add a tagline"
                }
              />
            </div>
          </div>
        </SectionCard>

        {/* ── CONTACT & LINKS ── */}
        <SectionCard title="Contact & links">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="publicEmail">Public email</FieldLabel>
              <input
                id="publicEmail"
                className={INPUT}
                defaultValue={String(profile.public_email ?? "")}
                name="publicEmail"
                placeholder="Shown on your profile"
                type="email"
              />
            </div>
            <div>
              <FieldLabel htmlFor="publicPhone">Public phone</FieldLabel>
              <input
                id="publicPhone"
                className={INPUT}
                defaultValue={String(profile.public_phone ?? "")}
                name="publicPhone"
                placeholder="Shown on your profile"
              />
            </div>
            <div>
              <FieldLabel htmlFor="websiteUrl">Website URL</FieldLabel>
              <input
                id="websiteUrl"
                className={INPUT}
                defaultValue={String(profile.website_url ?? "")}
                name="websiteUrl"
                placeholder="https://yourpractice.com"
              />
            </div>
            <div>
              <FieldLabel htmlFor="bookingUrl">Booking URL</FieldLabel>
              <input
                id="bookingUrl"
                className={INPUT}
                defaultValue={String(profile.booking_url ?? "")}
                name="bookingUrl"
                placeholder="e.g. Jane App, SimplePractice link"
              />
            </div>
          </div>
        </SectionCard>

        {/* ── PRACTICE & LOCATION ── */}
        <SectionCard title="Practice & location">
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-foreground">
                Neighborhoods / area
                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
              </legend>
              <p className="mb-3 text-xs text-muted-foreground">
                Select all areas where you see clients in person.
              </p>
              <div className="flex flex-wrap gap-3">
                {LOCATION_OPTIONS.filter((l) => l !== "Telehealth Only").map((location) => (
                  <label
                    key={location}
                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      defaultChecked={neighborhoods.includes(location)}
                      name="neighborhoods"
                      type="checkbox"
                      value={location}
                    />
                    {location}
                  </label>
                ))}
              </div>
            </fieldset>

            <ProfileSpecialtiesPicker defaultSelected={specialties} />
          </div>
        </SectionCard>

        {/* ── MATCHING ATTRIBUTES ── */}
        <SectionCard id="matching-attributes" title="Matching attributes">
          <p className="mb-5 text-sm text-muted-foreground">
            These fields power the referral search filters — keeping them filled helps colleagues find you when their client&apos;s needs match your practice.
          </p>

          <div className="space-y-6">
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-foreground">
                Communities served
                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
              </legend>
              <p className="mb-3 text-xs text-muted-foreground">
                Select all communities you serve or identify with — helps with culturally-informed referrals.
              </p>
              <div className="flex flex-wrap gap-3">
                {COMMUNITIES.map((community) => (
                  <label
                    key={community}
                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      defaultChecked={communities.includes(community)}
                      name="communities"
                      type="checkbox"
                      value={community}
                    />
                    {community}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-foreground">
                Modalities
                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
              </legend>
              <p className="mb-3 text-xs text-muted-foreground">
                Select your primary therapeutic modalities — used to match referrals by treatment approach.
              </p>
              <div className="flex flex-wrap gap-3">
                {MODALITIES.map((modality) => (
                  <label
                    key={modality}
                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      defaultChecked={modalities.includes(modality)}
                      name="modalities"
                      type="checkbox"
                      value={modality}
                    />
                    {modality}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-foreground">
                Languages
                <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
              </legend>
              <p className="mb-3 text-xs text-muted-foreground">
                Languages you can provide therapy in — helps match clients who need services in a specific language.
              </p>
              <div className="flex flex-wrap gap-3">
                {LANGUAGES.map((language) => (
                  <label
                    key={language}
                    className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      defaultChecked={languages.includes(language)}
                      name="languages"
                      type="checkbox"
                      value={language}
                    />
                    {language}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="gender">Gender (self-declared)</FieldLabel>
                <select
                  id="gender"
                  className={INPUT}
                  defaultValue={String(profile.gender ?? "")}
                  name="gender"
                >
                  <option value="">Prefer not to say</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label
                  htmlFor="offersSlidingScale"
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background px-4 py-3 text-sm text-muted-foreground w-full"
                >
                  <input
                    id="offersSlidingScale"
                    defaultChecked={Boolean(profile.offers_sliding_scale)}
                    name="offersSlidingScale"
                    type="checkbox"
                  />
                  Offers sliding scale fees
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── LOGISTICS & AVAILABILITY ── */}
        <SectionCard title="Logistics & availability">
          {recentlyReportedFull && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">A colleague recently indicated you may be full</p>
              <p className="mt-1 text-xs text-amber-700">
                Update your availability below to clear this flag from your directory listing.
              </p>
            </div>
          )}
          <ProfileLogisticsSection
            defaultPaymentModel={String(profile.payment_model ?? "both")}
            defaultAvailabilityStatus={String(profile.availability_status ?? "waitlist")}
            defaultOffersInPerson={Boolean(profile.offers_in_person)}
            defaultOffersTelehealth={Boolean(profile.offers_telehealth)}
            defaultInsuranceAccepted={insuranceAccepted}
          />
        </SectionCard>

        {/* ── ABOUT YOUR WORK ── */}
        <SectionCard title="About your work">
          <div className="space-y-4">
            <div>
              <FieldLabel htmlFor="bio" required>Bio</FieldLabel>
              <textarea
                id="bio"
                className={cn(INPUT, "min-h-32")}
                defaultValue={String(profile.bio ?? "")}
                name="bio"
                placeholder="A short professional bio — who you work with and what you bring to the room."
              />
            </div>
            <div>
              <FieldLabel htmlFor="approachSummary">Therapy approach</FieldLabel>
              <textarea
                id="approachSummary"
                className={cn(INPUT, "min-h-28")}
                defaultValue={String(profile.approach_summary ?? "")}
                name="approachSummary"
                placeholder="How would you describe your approach to therapy?"
              />
            </div>
            <div>
              <FieldLabel htmlFor="featuredLinks">Featured links</FieldLabel>
              <textarea
                id="featuredLinks"
                className={cn(INPUT, "min-h-20")}
                defaultValue={(Array.isArray(profile.featured_links) ? profile.featured_links : []).join("\n")}
                name="featuredLinks"
                placeholder="One URL per line — articles, podcast episodes, Psychology Today, etc."
              />
            </div>
            <div>
              <PremiumLabel htmlFor="offerings" label="Offerings" />
              <textarea
                id="offerings"
                className={cn(isPremium ? INPUT : LOCKED_INPUT, "min-h-20")}
                disabled={!isPremium}
                defaultValue={(Array.isArray(profile.offerings) ? profile.offerings : []).join("\n")}
                name="offerings"
                placeholder={
                  isPremium
                    ? "Groups, workshops, or resources — one per line"
                    : "Upgrade to Premium to list offerings, groups, and resources"
                }
              />
            </div>
          </div>
        </SectionCard>

        {/* ── VISIBILITY ── */}
        <SectionCard title="Visibility">
          <label
            htmlFor="isPublic"
            className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground"
          >
            <input
              id="isPublic"
              defaultChecked={Boolean(profile.is_public)}
              name="isPublic"
              type="checkbox"
            />
            <span>
              <span className="font-medium text-foreground">Show this profile in the public directory</span>
              <span className="ml-2 text-xs">(visible to non-members at austintherapistexchange.com)</span>
            </span>
          </label>
        </SectionCard>

        {/* ── STICKY SAVE BAR ── */}
        <div className="sticky bottom-0 z-20 rounded-[28px] border bg-white/95 px-6 py-4 shadow-paper backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={cn(
              "text-sm",
              !status ? "text-muted-foreground" : status.ok ? "text-green-700" : "text-destructive"
            )}>
              {status
                ? status.text
                : "Fields marked * are required."}
            </p>
            <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
          </div>
        </div>

      </form>

      {/* ── PASSWORD ── */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Password login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>Password sign-in avoids email delays.</p>
          {passwordStatusCopy ? (
            <div className="rounded-[24px] border bg-background p-4">{passwordStatusCopy}</div>
          ) : null}
          <form action={updatePassword} className="space-y-4">
            <input
              className={INPUT}
              name="password"
              placeholder="New password"
              type="password"
            />
            <input
              className={INPUT}
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
