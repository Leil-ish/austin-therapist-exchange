import Link from "next/link";

import { EmptyState } from "@/components/state/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustedClinicianList } from "@/components/domain/trusted-clinician-list";
import { getSession } from "@/lib/auth/session";
import { getAvailabilityLabel, getFollowedClinicians, getPublicTherapists } from "@/lib/data/live-data";
import { NetworkInsights } from "@/components/domain/network-insights";
import { NetworkTabs } from "./network-tabs";

// TODO: "Top referral partners" section was removed because buildTopPartners depended on
// directReferrals.outgoing/incoming (the direct_referrals table, System 1). Restore it once
// an equivalent is built over case_referrals (System 2, case_id + referred_profile_id).

type Tab = "network" | "discover" | "insights";

function resolveTab(param?: string): Tab {
  if (param === "discover" || param === "insights") return param;
  return "network";
}

export default async function MemberNetworkPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  const params = searchParams ? await searchParams : undefined;
  const defaultTab = resolveTab(params?.tab);

  const [following, { therapists }] = await Promise.all([
    session ? getFollowedClinicians(session.userId) : Promise.resolve([]),
    getPublicTherapists(session?.userId, 60, 0),
  ]);

  const suggestions = therapists
    .filter((therapist) => therapist.profileId !== session?.userId)
    .filter((therapist) => !therapist.isFollowed)
    .filter((therapist) => therapist.trustedBy.length > 0)
    .sort((a, b) => b.trustedBy.length - a.trustedBy.length)
    .slice(0, 6);

  const networkContent = following.length > 0 ? (
    <TrustedClinicianList following={following} />
  ) : (
    <EmptyState
      title="No trusted therapists saved yet"
      description="Save therapists from the directory and they will appear here for quicker referrals."
    />
  );

  const discoverContent = suggestions.length > 0 ? (
    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
      {suggestions.map((therapist) => {
        const voucherNames = therapist.trustedBy.map((t) => t.name);
        const voucherCopy =
          voucherNames.length === 1
            ? `Trusted by ${voucherNames[0]}`
            : voucherNames.length === 2
              ? `Trusted by ${voucherNames[0]} and ${voucherNames[1]}`
              : `Trusted by ${voucherNames[0]} and ${voucherNames.length - 1} others you trust`;

        const availLabel = getAvailabilityLabel(therapist.availabilityStatus);

        return (
          <Card className="bg-white/90" key={therapist.profileId}>
            <CardContent className="space-y-3 pt-7">
              <div className="flex items-start gap-3">
                <Avatar avatarUrl={therapist.avatarUrl} name={therapist.displayName} size="sm" />
                <div>
                  <Link
                    href={`/directory/${therapist.slug}?returnTo=/member/network`}
                    className="text-base font-semibold leading-snug text-foreground hover:underline underline-offset-4"
                  >
                    {therapist.displayName}
                  </Link>
                  <p className="text-sm text-muted-foreground">{therapist.title}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="muted">{availLabel}</Badge>
                {(therapist.neighborhoods[0] ?? therapist.city) && (
                  <Badge variant="outline">{therapist.neighborhoods[0] ?? therapist.city}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{voucherCopy}</p>
              <Link className="text-sm font-medium text-primary transition-colors hover:text-primary/70" href={`/directory/${therapist.slug}`}>
                View profile
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  ) : (
    <EmptyState
      title="No second-degree trust matches yet"
      description="As your network grows, trusted introductions from your contacts will show up here."
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/member/referrals">Find a therapist match</Link>
        </Button>
      </div>

      <NetworkTabs
        defaultTab={defaultTab}
        networkContent={networkContent}
        discoverContent={discoverContent}
        insightsContent={
          session ? (
            <NetworkInsights profileId={session.userId} follows={following} />
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to see your insights.</p>
          )
        }
      />
    </div>
  );
}
