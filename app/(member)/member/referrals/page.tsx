import { requireMember } from "@/lib/auth/guards";
import { getReferralCandidateTherapists } from "@/lib/data/live-data";
import { getIncomingReferrals, getReferralTracking } from "@/lib/data/referral-tracking";
import { getThisMonthCount } from "@/lib/referral-utils";
import { ReferralsTabs } from "./referrals-tabs";

type Tab = "incoming" | "search" | "sent";

type SearchParams = {
  tab?: string;
  directReferralSent?: string;
  directReferralError?: string;
  referralResponded?: string;
};

function resolveTab(params?: SearchParams): Tab {
  if (params?.directReferralSent === "1" || params?.directReferralError === "1") return "search";
  if (params?.tab === "incoming" || params?.tab === "sent") return params.tab;
  return "search";
}

function getStatusCopy(sent?: string, error?: string, responded?: string) {
  if (sent === "1") return "Referral sent.";
  if (responded === "1") return "Response recorded.";
  if (error === "1") return "We couldn't send that referral. Please try again.";
  return null;
}

export default async function MemberReferralsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await requireMember();
  const params = searchParams ? await searchParams : undefined;
  const defaultTab = resolveTab(params);
  const statusCopy = getStatusCopy(params?.directReferralSent, params?.directReferralError, params?.referralResponded);

  const [therapists, incomingReferrals, referralCases] = await Promise.all([
    getReferralCandidateTherapists(session.userId),
    getIncomingReferrals(session.userId),
    getReferralTracking(session.userId),
  ]);

  const openIncomingCount = incomingReferrals.filter((r) => r.status === "open").length;
  const awaitingCount = referralCases.filter((c) => c.status === "open").length;
  const sentThisMonth = getThisMonthCount(referralCases);

  return (
    <ReferralsTabs
      defaultTab={defaultTab}
      openIncomingCount={openIncomingCount}
      therapists={therapists}
      incomingReferrals={incomingReferrals}
      referralCases={referralCases}
      statusCopy={statusCopy}
      sentThisMonth={sentThisMonth}
      awaitingCount={awaitingCount}
      senderName={session.fullName ?? ""}
      senderEmail={session.email ?? ""}
    />
  );
}
