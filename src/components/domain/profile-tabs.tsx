"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { saveMemberProfile } from "@/app-actions/member-actions";
import { updatePassword } from "@/app-actions/auth-actions";
import { COMMUNITIES, GENDERS, LANGUAGES, LOCATION_OPTIONS, MODALITIES } from "@/lib/referral-matching";
import { ProfileLogisticsSection } from "@/components/domain/profile-logistics-section";
import { ProfileSpecialtiesPicker } from "@/components/domain/profile-specialties-picker";
import { AvatarUpload } from "@/components/domain/avatar-upload";
import { AvailabilityFreshnessBanner } from "@/components/domain/availability-freshness-banner";
import { ClaimProfileButton } from "@/components/domain/claim-profile-button";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const INPUT = "w-full rounded-2xl border bg-background px-4 py-3 text-sm";

const TAB_KEYS = ["start", "basics", "practice", "filters", "about"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return !!value && (TAB_KEYS as readonly string[]).includes(value);
}

function SectionCard({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-[28px] border bg-white/90 shadow-paper">
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

export type ProfileTabsProps = {
  session: { userId: string; fullName: string };
  profile: Record<string, unknown>;
  recentlyReportedFull: boolean;
  status: { text: string; ok: boolean } | null;
  passwordStatusCopy: string | null;
  communities: string[];
  modalities: string[];
  languages: string[];
  specialties: string[];
  neighborhoods: string[];
  insuranceAccepted: string[];
  bio: string;
  showWelcomeBanner: boolean;
  missingFilterFields: string[];
};

export function ProfileTabs({
  session,
  profile,
  recentlyReportedFull,
  status,
  passwordStatusCopy,
  communities,
  modalities,
  languages,
  specialties,
  neighborhoods,
  insuranceAccepted,
  bio,
  showWelcomeBanner,
  missingFilterFields,
}: ProfileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTabState] = useState<TabKey>(() => {
    const fromUrl = searchParams.get("tab");
    if (isTabKey(fromUrl)) return fromUrl;
    return showWelcomeBanner ? "start" : "basics";
  });

  useEffect(() => {
    const fromUrl = searchParams.get("tab");
    if (isTabKey(fromUrl) && fromUrl !== activeTab) {
      setActiveTabState(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function setActiveTab(tab: TabKey) {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push((`${pathname}?${params.toString()}`) as never, { scroll: false });
  }

  const publicDisplayName = String(profile.public_display_name ?? session.fullName);
  const profileClaimed = Boolean(profile.profileClaimed);
  const paymentModel = profile.payment_model;
  const offersInPerson = Boolean(profile.offers_in_person);
  const offersTelehealth = Boolean(profile.offers_telehealth);

  const tabComplete: Record<TabKey, boolean> = {
    start: profileClaimed,
    basics: !!publicDisplayName && !!profile.public_email,
    practice: !!paymentModel && (offersInPerson || offersTelehealth),
    filters: specialties.length > 0 && modalities.length > 0,
    about: bio.length >= 20,
  };

  function TabCheck({ tab }: { tab: TabKey }) {
    return tabComplete[tab] ? <CheckCircle className="ml-1.5 h-3 w-3 text-green-500" /> : null;
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="start">
          Getting started <TabCheck tab="start" />
        </TabsTrigger>
        <TabsTrigger value="basics">
          Basics <TabCheck tab="basics" />
        </TabsTrigger>
        <TabsTrigger value="practice">
          Practice <TabCheck tab="practice" />
        </TabsTrigger>
        <TabsTrigger value="filters">
          Search filters <TabCheck tab="filters" />
        </TabsTrigger>
        <TabsTrigger value="about">
          About & publish <TabCheck tab="about" />
        </TabsTrigger>
      </TabsList>

      {/* ── STEP 1 — Welcome & Security ── */}
      <TabsContent value="start" className="space-y-6">
        {showWelcomeBanner && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h2 className="font-serif text-xl text-primary mb-1">Welcome to Austin Therapist Exchange</h2>
            <p className="text-sm text-muted-foreground mb-4">
              We&apos;ve pre-built your profile based on publicly available information.
              Please review everything below, fill in any gaps, and confirm your details are accurate before your profile goes live to colleagues.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ Update your bio and approach summary so colleagues know how you work</li>
              <li>✓ Add a profile photo</li>
              <li>✓ Confirm your specialties, availability, and insurance are accurate</li>
              <li>✓ Add your session rates (used for referral filtering — not shown publicly)</li>
            </ul>
          </div>
        )}

        <AvailabilityFreshnessBanner
          availabilityStatus={String(profile.availability_status ?? "waitlist")}
          availabilityUpdatedAt={
            typeof profile.availability_updated_at === "string" ? profile.availability_updated_at : null
          }
        />

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Set your password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>Set a password so you don&apos;t need a magic link every time you log in.</p>
            {passwordStatusCopy ? (
              <div className="rounded-[24px] border bg-background p-4">{passwordStatusCopy}</div>
            ) : null}
            <form action={updatePassword} className="space-y-4">
              <input className={INPUT} name="password" placeholder="New password" type="password" />
              <input className={INPUT} name="confirmPassword" placeholder="Confirm new password" type="password" />
              <SubmitButton pendingLabel="Saving…" variant="outline">Save password</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Button type="button" onClick={() => setActiveTab("basics")} className="mt-4">
          Continue to your profile →
        </Button>
      </TabsContent>

      {/* ── STEPS 2–5 share the main profile form ── */}
      <form action={saveMemberProfile} className="space-y-6">
        {/* ── STEP 2 — Your Basics ── */}
        <TabsContent value="basics" forceMount className={cn("space-y-6", activeTab !== "basics" && "hidden")}>
          <Card className="bg-white/90">
            <CardHeader>
              <CardTitle>Profile photo</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload
                currentAvatarUrl={
                  typeof profile.avatar_url === "string" && profile.avatar_url ? profile.avatar_url : undefined
                }
                displayName={publicDisplayName}
                userId={session.userId}
              />
            </CardContent>
          </Card>

          <SectionCard title="Basics">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="publicDisplayName" required>Full name</FieldLabel>
                <input
                  id="publicDisplayName"
                  className={INPUT}
                  defaultValue={publicDisplayName}
                  name="publicDisplayName"
                  placeholder="e.g. Sarah Chen"
                />
              </div>
              <div>
                <FieldLabel htmlFor="credentials">Credentials / title</FieldLabel>
                <input
                  id="credentials"
                  className={INPUT}
                  defaultValue={String(profile.credentials ?? "")}
                  name="credentials"
                  placeholder="e.g. LPC, LCSW"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Contact information">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="publicEmail">Professional email</FieldLabel>
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
                <FieldLabel htmlFor="publicPhone">Professional phone</FieldLabel>
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
            </div>
          </SectionCard>

          <SectionCard title="Practice & location">
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
                  <label key={location} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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
          </SectionCard>

          <input type="hidden" name="nextTab" value="practice" />
          <Button type="submit" className="mt-4">
            Save &amp; continue
          </Button>
        </TabsContent>

        {/* ── STEP 3 — Your Practice ── */}
        <TabsContent value="practice" forceMount className={cn("space-y-6", activeTab !== "practice" && "hidden")}>
          {missingFilterFields.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Help colleagues find you</p>
              <p className="mt-1">
                Missing:{" "}
                {missingFilterFields.map((f, i) => (
                  <span key={f}>
                    {i > 0 && ", "}
                    {f === "Gender" || f === "Languages" || f === "Modalities" || f === "Communities served" ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("filters")}
                        className="underline underline-offset-2"
                      >
                        {f}
                      </button>
                    ) : (
                      f
                    )}
                  </span>
                ))}.
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Fill in these fields to help colleagues find you when their client criteria match your practice.
              </p>
            </div>
          )}

          {recentlyReportedFull && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">A colleague recently indicated you may be full</p>
              <p className="mt-1 text-xs text-amber-700">
                Update your availability below to clear this flag from your directory listing.
              </p>
            </div>
          )}

          <SectionCard title="Logistics & availability">
            <ProfileLogisticsSection
              defaultPaymentModel={String(profile.payment_model ?? "both")}
              defaultAvailabilityStatus={String(profile.availability_status ?? "waitlist")}
              defaultOffersInPerson={offersInPerson}
              defaultOffersTelehealth={offersTelehealth}
              defaultInsuranceAccepted={insuranceAccepted}
            />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="individualRate" className="text-sm font-medium">
                  Individual session rate
                  <span className="ml-1 text-xs text-muted-foreground">(optional — used for referral filtering only, not shown publicly)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    id="individualRate"
                    name="individualRate"
                    type="number"
                    min="0"
                    max="1000"
                    defaultValue={typeof profile.individual_rate === "number" ? profile.individual_rate : ""}
                    placeholder="150"
                    className="w-full rounded-xl border bg-background pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="couplesRate" className="text-sm font-medium">
                  Couples / family rate
                  <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    id="couplesRate"
                    name="couplesRate"
                    type="number"
                    min="0"
                    max="1000"
                    defaultValue={typeof profile.couples_rate === "number" ? profile.couples_rate : ""}
                    placeholder="175"
                    className="w-full rounded-xl border bg-background pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="slidingScaleMin" className="text-sm font-medium">
                  Sliding scale minimum
                  <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    id="slidingScaleMin"
                    name="slidingScaleMin"
                    type="number"
                    min="0"
                    max="1000"
                    defaultValue={typeof profile.sliding_scale_min === "number" ? profile.sliding_scale_min : ""}
                    placeholder="80"
                    className="w-full rounded-xl border bg-background pl-7 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <input type="hidden" name="nextTab" value="filters" />
          <Button type="submit" className="mt-4">
            Save &amp; continue
          </Button>
        </TabsContent>

        {/* ── STEP 4 — How Colleagues Find You ── */}
        <TabsContent value="filters" forceMount className={cn("space-y-6", activeTab !== "filters" && "hidden")}>
          <p className="text-sm text-muted-foreground">
            These fields power the referral search filters. The more complete they are, the more often colleagues will find you when their client&apos;s needs match your practice.
          </p>

          <SectionCard id="matching-attributes" title="How colleagues find you">
            <div className="space-y-6">
              <ProfileSpecialtiesPicker defaultSelected={specialties} />

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
                    <label key={community} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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
                    <label key={modality} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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
                    <label key={language} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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
                  <select id="gender" className={INPUT} defaultValue={String(profile.gender ?? "")} name="gender">
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

          <input type="hidden" name="nextTab" value="about" />
          <Button type="submit" className="mt-4">
            Save &amp; continue
          </Button>
        </TabsContent>

        {/* ── STEP 5 — About Your Work & Publish ── */}
        <TabsContent value="about" forceMount className={cn("space-y-6", activeTab !== "about" && "hidden")}>
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
            </div>
          </SectionCard>

          <SectionCard title="Visibility">
            <label htmlFor="isPublic" className="flex cursor-pointer items-center gap-3 text-sm text-muted-foreground">
              <input id="isPublic" defaultChecked={Boolean(profile.is_public)} name="isPublic" type="checkbox" />
              <span>
                <span className="font-medium text-foreground">Show this profile in the public directory</span>
                <span className="ml-2 text-xs">(visible to non-members at austintherapistexchange.com)</span>
              </span>
            </label>
          </SectionCard>

          {!profileClaimed && (
            <Card className="bg-white/90">
              <CardHeader>
                <CardTitle>My profile looks accurate — publish it</CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimProfileButton />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={cn(
              "text-sm",
              !status ? "text-muted-foreground" : status.ok ? "text-green-700" : "text-destructive"
            )}>
              {status ? status.text : "Fields marked * are required."}
            </p>
            <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
          </div>
        </TabsContent>
      </form>
    </Tabs>
  );
}
