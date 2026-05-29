import Link from "next/link";

import { EmptyState } from "@/components/state/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getAvailabilityLabel, getDirectReferralActivity, getFollowedClinicians, getPublicTherapists } from "@/lib/data/live-data";

function getThisMonthCount(items: Array<{ createdAtLabel: string }>) {
  // createdAtLabel is relative ("2 days ago", "3 months ago"). Instead we track
  // the raw created_at timestamp but it isn't exposed yet — use the label heuristic:
  // items whose label contains "day", "hour", "minute", "just now", or "1 month" = this month.
  return items.filter((item) => {
    const label = item.createdAtLabel.toLowerCase();
    return (
      label.includes("just now") ||
      label.includes("minute") ||
      label.includes("hour") ||
      label.includes("day") ||
      label === "1 month ago"
    );
  }).length;
}

function buildTopPartners(
  outgoing: Array<{ counterpartName: string; counterpartSlug?: string }>,
  incoming: Array<{ counterpartName: string; counterpartSlug?: string }>
) {
  const counts = new Map<string, { name: string; slug?: string; sent: number; received: number }>();
  for (const item of outgoing) {
    const entry = counts.get(item.counterpartName) ?? { name: item.counterpartName, slug: item.counterpartSlug, sent: 0, received: 0 };
    entry.sent += 1;
    counts.set(item.counterpartName, entry);
  }
  for (const item of incoming) {
    const entry = counts.get(item.counterpartName) ?? { name: item.counterpartName, slug: item.counterpartSlug, sent: 0, received: 0 };
    entry.received += 1;
    counts.set(item.counterpartName, entry);
  }
  return [...counts.values()]
    .sort((a, b) => (b.sent + b.received) - (a.sent + a.received))
    .slice(0, 5);
}

function getTrustStrengthLabel(count: number): { label: string; color: string } {
  if (count >= 3) return { label: "Strong", color: "text-green-600" };
  if (count >= 2) return { label: "Medium", color: "text-yellow-600" };
  return { label: "New", color: "text-muted-foreground" };
}

export default async function MemberNetworkPage() {
  const session = await getSession();
  const [following, directReferrals, { therapists }] = await Promise.all([
    session ? getFollowedClinicians(session.userId) : Promise.resolve([]),
    session
      ? getDirectReferralActivity(session.userId)
      : Promise.resolve({ sentCount: 0, receivedCount: 0, exchangedCount: 0, incoming: [], outgoing: [] }),
    getPublicTherapists(session?.userId, 60, 0)
  ]);

  const suggestions = therapists
    .filter((therapist) => !therapist.isFollowed)
    .filter((therapist) => therapist.trustedBy.length > 0)
    .sort((a, b) => b.trustedBy.length - a.trustedBy.length)
    .slice(0, 6);

  const referralsThisMonth = getThisMonthCount(directReferrals.outgoing);
  const topPartners = buildTopPartners(directReferrals.outgoing, directReferrals.incoming);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border bg-white/90 p-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Network</p>
          <h2 className="font-serif text-3xl text-foreground">People you trust and who they trust</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Keep trusted therapists close, see second-degree trust clearly, and remember who you refer to most.
          </p>
        </div>
        <Button asChild>
          <Link href="/member/referrals">Find a therapist match</Link>
        </Button>
      </section>

      {/* Stats dashboard */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{following.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Active connections</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{referralsThisMonth}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Referrals this month</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{directReferrals.exchangedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Mutual referral partners</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{directReferrals.receivedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Incoming referrals</CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* People you trust */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl text-foreground">People you trust</h3>
            <p className="text-sm text-muted-foreground">These therapists stay close at hand while you are making referrals.</p>
          </div>
          {following.length > 0 ? (
            <div className="space-y-3">
              {following.map((clinician) => (
                <Card className="bg-white/90" key={clinician.profileId}>
                  <CardContent className="flex items-start justify-between gap-4 pt-5 pb-5">
                    <div className="space-y-1.5">
                      <div>
                        <p className="font-medium text-foreground">{clinician.displayName}</p>
                        <p className="text-sm text-muted-foreground">{clinician.title}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge>{getAvailabilityLabel(clinician.availabilityStatus)}</Badge>
                        <span className="text-xs text-muted-foreground">Added {clinician.followedAtLabel}</span>
                      </div>
                    </div>
                    <Link className="shrink-0 text-sm font-medium text-primary hover:text-primary/80" href={`/directory/${clinician.slug}`}>
                      View profile
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No trusted therapists saved yet"
              description="Save therapists from the directory and they will appear here for quicker referrals."
            />
          )}
        </div>

        {/* Top referral partners leaderboard */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl text-foreground">Top referral partners</h3>
            <p className="text-sm text-muted-foreground">The colleagues you exchange referrals with most.</p>
          </div>
          {topPartners.length > 0 ? (
            <Card className="bg-white/90">
              <CardContent className="divide-y pt-4">
                {topPartners.map((partner, index) => {
                  const total = partner.sent + partner.received;
                  const { label: strengthLabel, color: strengthColor } = getTrustStrengthLabel(total);
                  return (
                    <div className="flex items-center justify-between gap-3 py-3" key={partner.name}>
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{index + 1}</span>
                        <div>
                          {partner.slug ? (
                            <Link className="font-medium text-foreground hover:underline underline-offset-4" href={`/directory/${partner.slug}`}>
                              {partner.name}
                            </Link>
                          ) : (
                            <p className="font-medium text-foreground">{partner.name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {partner.sent} sent · {partner.received} received
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${strengthColor}`}>{strengthLabel}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No referral partners yet"
              description="Once you start exchanging referrals, your top partners will appear here."
            />
          )}
        </div>
      </section>

      {/* People you may want to trust */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl text-foreground">People you may want to trust</h3>
          <p className="text-sm text-muted-foreground">Vouched for by colleagues you already trust — good next connections to review.</p>
        </div>
        {suggestions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((therapist) => {
              const voucherNames = therapist.trustedBy.map((t) => t.name);
              const voucherCopy =
                voucherNames.length === 1
                  ? `Trusted by ${voucherNames[0]}`
                  : voucherNames.length === 2
                    ? `Trusted by ${voucherNames[0]} and ${voucherNames[1]}`
                    : `Trusted by ${voucherNames[0]} and ${voucherNames.length - 1} others you trust`;

              return (
                <Card className="bg-white/90" key={therapist.profileId}>
                  <CardContent className="space-y-3 pt-6">
                    <div>
                      <p className="font-medium text-foreground">{therapist.displayName}</p>
                      <p className="text-sm text-muted-foreground">{therapist.title}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{getAvailabilityLabel(therapist.availabilityStatus)}</Badge>
                      <Badge variant="outline">{therapist.neighborhoods[0] ?? therapist.city}</Badge>
                    </div>
                    <p className="text-xs font-medium text-primary">{voucherCopy}</p>
                    <Link className="text-sm font-medium text-primary hover:text-primary/80" href={`/directory/${therapist.slug}`}>
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
