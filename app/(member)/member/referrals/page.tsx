import { IncomingReferrals } from "@/components/domain/incoming-referrals";
import { ReferralComposeForm } from "@/components/domain/referral-compose-form";
import { ReferralTracker } from "@/components/domain/referral-tracker";
import { EmptyState } from "@/components/state/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/guards";
import { getReferralCandidateTherapists } from "@/lib/data/live-data";
import { getIncomingReferrals, getReferralTracking } from "@/lib/data/referral-tracking";
import { getThisMonthCount } from "@/lib/referral-utils";

function getStatusCopy(sent?: string, error?: string, responded?: string) {
  if (sent === "1") {
    return "Referral sent.";
  }

  if (responded === "1") {
    return "Response recorded.";
  }

  if (error === "1") {
    return "We couldn't send that referral. Please try again.";
  }

  return null;
}

export default async function MemberReferralsPage({
  searchParams
}: {
  searchParams?: Promise<{ directReferralSent?: string; directReferralError?: string; referralResponded?: string }>;
}) {
  const session = await requireMember();
  const params = searchParams ? await searchParams : undefined;
  const statusCopy = getStatusCopy(params?.directReferralSent, params?.directReferralError, params?.referralResponded);

  const [therapists, incomingReferrals, referralCases] = await Promise.all([
    getReferralCandidateTherapists(session.userId),
    getIncomingReferrals(session.userId),
    getReferralTracking(session.userId),
  ]);

  // Cases with status "open" have not yet been placed or closed — still awaiting a response.
  const openIncomingCount = incomingReferrals.filter((r) => r.status === "open").length;
  const awaitingCount = referralCases.filter((c) => c.status === "open").length;
  const sentThisMonth = getThisMonthCount(referralCases);

  return (
    <div className="space-y-8">
      {/* Incoming referrals */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl text-foreground">
            Incoming referrals
            {openIncomingCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {openIncomingCount} open
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">{incomingReferrals.length} received total</p>
        </div>
        {incomingReferrals.length > 0 ? (
          <IncomingReferrals referrals={incomingReferrals} />
        ) : (
          <EmptyState
            title="No incoming referrals yet"
            description="Referrals sent to you by colleagues will appear here."
          />
        )}
      </section>

      {/* Referral compose form */}
      <Card className="bg-white/90">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Start with structured referral criteria and see therapist matches before reviewing referral activity.
          </p>
          <ReferralComposeForm
            statusCopy={statusCopy}
            therapists={therapists}
            senderName={session.fullName ?? ""}
            senderEmail={session.email ?? ""}
          />
        </CardContent>
      </Card>

      {/* Sent referrals */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl text-foreground">Sent referrals</h3>
          <p className="text-sm text-muted-foreground">
            {referralCases.length} sent total · {sentThisMonth} this month
            {awaitingCount > 0 && (
              <> · <span className="text-amber-600">{awaitingCount} awaiting response</span></>
            )}
          </p>
        </div>
        {referralCases.length > 0 ? (
          <ReferralTracker cases={referralCases} />
        ) : (
          <EmptyState
            title="No referrals sent yet"
            description="Your sent referrals will appear here with clear status updates."
          />
        )}
      </section>
    </div>
  );
}
