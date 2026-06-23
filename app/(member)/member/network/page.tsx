import Link from "next/link";

import { EmptyState } from "@/components/state/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustedClinicianList } from "@/components/domain/trusted-clinician-list";
import { getSession } from "@/lib/auth/session";
import { getAvailabilityLabel, getFollowedClinicians, getPublicTherapists } from "@/lib/data/live-data";

// TODO: "Top referral partners" section was removed because buildTopPartners depended on
// directReferrals.outgoing/incoming (the direct_referrals table, System 1). Restore it once
// an equivalent is built over case_referrals (System 2, case_id + referred_profile_id).

export default async function MemberNetworkPage() {
  const session = await getSession();
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

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl bg-white/80 p-7 shadow-paper">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">Network</p>
          <h2 className="font-serif text-2xl leading-tight text-foreground">People you trust and who they trust</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Keep trusted therapists close, see second-degree trust clearly, and remember who you refer to most.
          </p>
        </div>
        <Button asChild>
          <Link href="/member/referrals">Find a therapist match</Link>
        </Button>
      </section>

      {/* People you trust */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-xl text-foreground">
            People you trust
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              · {following.length} colleagues
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">These therapists stay close at hand while you are making referrals.</p>
        </div>
        {following.length > 0 ? (
          <TrustedClinicianList following={following} />
        ) : (
          <EmptyState
            title="No trusted therapists saved yet"
            description="Save therapists from the directory and they will appear here for quicker referrals."
          />
        )}
      </section>

      {/* People you may want to trust */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-xl text-foreground">People you may want to trust</h3>
          <p className="text-sm text-muted-foreground">Vouched for by colleagues you already trust — good next connections to review.</p>
        </div>
        {suggestions.length > 0 ? (
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
        )}
      </section>
    </div>
  );
}
