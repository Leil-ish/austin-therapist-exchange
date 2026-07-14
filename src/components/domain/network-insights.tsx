import { getIncomingReferrals, getReferralTracking } from "@/lib/data/referral-tracking";
import { PRESENTING_ISSUES, presentingIssueMatches } from "@/lib/referral-matching";
import type { FollowedClinicianSummary } from "@/types";

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function topEntry(counts: Map<string, number>): { name: string; count: number } | null {
  let top: { name: string; count: number } | null = null;
  for (const [name, count] of counts) {
    if (!top || count > top.count) top = { name, count };
  }
  return top;
}

function InsightCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 p-5 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
        {label}
      </p>
      {children}
    </div>
  );
}

function StatValue({ value, sub }: { value: string; sub?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-base font-semibold leading-snug text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export async function NetworkInsights({
  profileId,
  follows,
}: {
  profileId: string;
  follows: FollowedClinicianSummary[];
}) {
  const [incomingReferrals, outboundCases] = await Promise.all([
    getIncomingReferrals(profileId),
    getReferralTracking(profileId),
  ]);

  const hasReferralData = incomingReferrals.length > 0 || outboundCases.length > 0;
  const hasNetworkData = follows.length > 0;

  if (!hasReferralData && !hasNetworkData) {
    return (
      <p className="text-sm text-muted-foreground">
        Your referral insights will appear here once you start sending and receiving referrals.
      </p>
    );
  }

  // ── Outbound aggregates ────────────────────────────────────────────────────
  const allOutboundReferrals = outboundCases.flatMap((c) => c.referrals);
  const outboundCounts = countBy(allOutboundReferrals, (r) => r.therapistName);
  const topRecipient = topEntry(outboundCounts);

  // ── Inbound aggregates ─────────────────────────────────────────────────────
  const inboundCounts = countBy(incomingReferrals, (r) => r.referringClinicianName);
  const topSender = topEntry(inboundCounts);

  // ── Reciprocity gaps ───────────────────────────────────────────────────────
  const reciprocityGaps: Array<{ name: string; inbound: number; outbound: number }> = [];
  for (const [name, inboundCount] of inboundCounts) {
    if (name === "A colleague") continue;
    const outboundCount = outboundCounts.get(name) ?? 0;
    if (inboundCount > outboundCount) {
      reciprocityGaps.push({ name, inbound: inboundCount, outbound: outboundCount });
    }
  }
  reciprocityGaps.sort((a, b) => (b.inbound - b.outbound) - (a.inbound - a.outbound));
  const topGaps = reciprocityGaps.slice(0, 3);

  // ── Response rate ──────────────────────────────────────────────────────────
  const totalIncoming = incomingReferrals.length;
  const respondedCount = incomingReferrals.filter((r) => r.status !== "open").length;
  const responseRate = totalIncoming > 0 ? Math.round((respondedCount / totalIncoming) * 100) : null;

  // ── Network availability snapshot ─────────────────────────────────────────
  let accepting = 0, waitlist = 0, full = 0;
  for (const f of follows) {
    if (f.availabilityStatus === "accepting") accepting++;
    else if (f.availabilityStatus === "waitlist") waitlist++;
    else full++;
  }

  // ── Network coverage gaps ──────────────────────────────────────────────────
  const coverageGaps = Array.from(PRESENTING_ISSUES).filter((issue) =>
    !follows.some((f) => presentingIssueMatches(issue, f.specialties ?? []))
  ).slice(0, 3);

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
      {/* Top Referral Recipient */}
      <InsightCard label="Top referral recipient">
        {topRecipient ? (
          <StatValue
            value={topRecipient.name}
            sub={`You refer to them most — ${topRecipient.count} referral${topRecipient.count === 1 ? "" : "s"} sent`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No sent referrals yet</p>
        )}
      </InsightCard>

      {/* Top Referral Sender */}
      <InsightCard label="Top referral sender">
        {topSender ? (
          <StatValue
            value={topSender.name}
            sub={`Refers to you most — ${topSender.count} referral${topSender.count === 1 ? "" : "s"} received`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No incoming referrals yet</p>
        )}
      </InsightCard>

      {/* Response Rate */}
      <InsightCard label="Referral response rate">
        {responseRate !== null ? (
          <StatValue
            value={`${responseRate}%`}
            sub={`You responded to ${respondedCount} of ${totalIncoming} incoming referral${totalIncoming === 1 ? "" : "s"}`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No incoming referrals yet</p>
        )}
      </InsightCard>

      {/* Network Availability Snapshot */}
      <InsightCard label="Network availability">
        {hasNetworkData ? (
          <StatValue
            value={`${accepting} accepting`}
            sub={`${waitlist} waitlist · ${full} full`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No trusted colleagues yet</p>
        )}
      </InsightCard>

      {/* Reciprocity Gaps */}
      <InsightCard label="Consider referring back">
        {topGaps.length > 0 ? (
          <ul className="space-y-2">
            {topGaps.map(({ name, inbound, outbound }) => (
              <li key={name} className="text-xs text-foreground leading-snug">
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground">
                  {" "}has sent you {inbound} referral{inbound === 1 ? "" : "s"}
                  {outbound === 0 ? " — you haven't referred back yet" : ` — you've sent ${outbound} back`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {incomingReferrals.length === 0 ? "No incoming referrals yet" : "All caught up!"}
          </p>
        )}
      </InsightCard>

      {/* Coverage Gaps */}
      <InsightCard label="Coverage gaps">
        {hasNetworkData ? (
          coverageGaps.length > 0 ? (
            <ul className="space-y-2">
              {coverageGaps.map((issue) => (
                <li key={issue} className="text-xs text-foreground leading-snug">
                  <span className="text-muted-foreground">No one in your network specializes in </span>
                  <span className="font-medium">{issue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Your network covers all areas</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Add colleagues to see gaps</p>
        )}
      </InsightCard>
    </div>
  );
}
