import { Suspense } from "react";
import { ProfileTabs } from "@/components/domain/profile-tabs";
import { EmptyState } from "@/components/state/empty-state";
import { getSession } from "@/lib/auth/session";
import { getMemberProfileForUser, getRecentlyReportedFull } from "@/lib/data/live-data";

// ─── status copy helpers ──────────────────────────────────────────────────────

function getStatusCopy(error?: string, saved?: string) {
  if (saved) return { text: "Profile saved.", ok: true };
  if (error === "missing-fields") return { text: "Please fill in the required fields (marked *).", ok: false };
  if (error === "save-failed") return { text: "We couldn't save your profile. Please try again.", ok: false };
  return null;
}

function getPasswordSavedCopy(saved?: string) {
  return saved ? "Password updated." : null;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function MemberProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
    passwordSaved?: string;
  }>;
}) {
  const session = await getSession();
  const params = searchParams ? await searchParams : undefined;
  const [profile, recentlyReportedFull] = session
    ? await Promise.all([getMemberProfileForUser(session.userId), getRecentlyReportedFull(session.userId)])
    : [null, false];
  const status = getStatusCopy(params?.error, params?.saved);
  const passwordSavedCopy = getPasswordSavedCopy(params?.passwordSaved);

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

  const bio = String(profile.bio ?? "").trim();
  const showWelcomeBanner = !profile.profileClaimed;

  const agencyLevels = ["Intensive Outpatient (IOP)", "Partial Hospitalization (PHP)", "Residential Treatment"];
  const offeringsArray = Array.isArray(profile.offerings) ? (profile.offerings as string[]) : [];
  const isAgencyLevelOnly = offeringsArray.length > 0 && offeringsArray.every((l: string) => agencyLevels.includes(l));

  const filterFieldChecks = [
    { label: "Profile photo", empty: !profile.avatar_url },
    { label: "Bio", empty: !bio || bio.length < 20 },
    { label: "Approach summary", empty: !profile.approach_summary || String(profile.approach_summary).trim().length < 20 },
    { label: "Gender", empty: !profile.gender && !isAgencyLevelOnly },
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
      {passwordSavedCopy ? (
        <div className="rounded-[24px] border bg-white/90 p-4 text-sm text-green-700 shadow-paper">
          {passwordSavedCopy}
        </div>
      ) : null}
      <Suspense>
        <ProfileTabs
          session={session}
          profile={profile}
          recentlyReportedFull={recentlyReportedFull}
          status={status}
          communities={communities}
          modalities={modalities}
          languages={languages}
          specialties={specialties}
          neighborhoods={neighborhoods}
          insuranceAccepted={insuranceAccepted}
          bio={bio}
          showWelcomeBanner={showWelcomeBanner}
          missingFilterFields={missingFilterFields}
        />
      </Suspense>
    </div>
  );
}
