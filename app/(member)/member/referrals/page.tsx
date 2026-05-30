import Link from "next/link";

import { respondToDirectReferral } from "@/app-actions/member-actions";
import { MarkReferralsRead } from "@/components/domain/mark-referrals-read";
import { ReferralComposeForm } from "@/components/domain/referral-compose-form";
import { EmptyState } from "@/components/state/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMember } from "@/lib/auth/guards";
import { getDirectReferralActivity, getReferralCandidateTherapists } from "@/lib/data/live-data";
import type { DirectReferralActivityItem } from "@/types";

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

function getReferralStage(status: string, readAt?: string) {
  if (status === "accepted" || status === "matched" || status === "completed" || status === "declined" || status === "closed") {
    return "Responded";
  }

  if (readAt) {
    return "Viewed";
  }

  return "Pending";
}

export default async function MemberReferralsPage({
  searchParams
}: {
  searchParams?: Promise<{ directReferralSent?: string; directReferralError?: string; referralResponded?: string }>;
}) {
  const session = await requireMember();
  const params = searchParams ? await searchParams : undefined;
  const statusCopy = getStatusCopy(params?.directReferralSent, params?.directReferralError, params?.referralResponded);
  const [therapists, directReferrals] = await Promise.all([
    getReferralCandidateTherapists(session.userId),
    getDirectReferralActivity(session.userId)
  ]);

  // Group outgoing referrals by therapist for the "Referred to" tracker
  const referredToMap = new Map<string, {
    counterpartId: string;
    name: string;
    slug?: string;
    phone?: string;
    email?: string;
    referrals: DirectReferralActivityItem[];
    lastReferralAt: string;
    lastReferralLabel: string;
  }>();
  for (const item of directReferrals.outgoing) {
    const key = item.counterpartId;
    const existing = referredToMap.get(key);
    if (!existing) {
      referredToMap.set(key, {
        counterpartId: item.counterpartId,
        name: item.counterpartName,
        slug: item.counterpartSlug,
        phone: item.counterpartPhone,
        email: item.counterpartEmail,
        referrals: [item],
        lastReferralAt: item.createdAt,
        lastReferralLabel: item.createdAtLabel
      });
    } else {
      existing.referrals.push(item);
      // keep the most recent
      if (item.createdAt > existing.lastReferralAt) {
        existing.lastReferralAt = item.createdAt;
        existing.lastReferralLabel = item.createdAtLabel;
      }
    }
  }
  const referredTo = [...referredToMap.values()].sort(
    (a, b) => b.referrals.length - a.referrals.length || b.lastReferralAt.localeCompare(a.lastReferralAt)
  );

  const unreadMessageIds = directReferrals.incoming
    .filter(item => item.messageId && !item.readAt)
    .map(item => item.messageId as string);

  return (
    <div className="space-y-8">
      <MarkReferralsRead messageIds={unreadMessageIds} />
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Referral search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start with structured referral criteria and see therapist matches before reviewing referral activity.
          </p>
          <ReferralComposeForm senderEmail={session.email} statusCopy={statusCopy} therapists={therapists} />
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{directReferrals.sentCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sent referrals</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{directReferrals.incoming.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Incoming referrals</CardContent>
        </Card>
        <Card className="bg-white/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{directReferrals.exchangedCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Two-way referral relationships</CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Sent referrals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {directReferrals.outgoing.length > 0 ? (
              directReferrals.outgoing.slice(0, 6).map((item) => (
                <div className="rounded-2xl border bg-background p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent to{" "}
                        {item.counterpartSlug ? (
                          <Link className="underline-offset-4 hover:underline" href={`/directory/${item.counterpartSlug}`}>
                            {item.counterpartName}
                          </Link>
                        ) : (
                          item.counterpartName
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">{getReferralStage(item.status, item.readAt)}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.region ? <span>{item.region}</span> : null}
                    {item.paymentModel ? <span>{item.paymentModel}</span> : null}
                    <span>{item.createdAtLabel}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No referrals sent yet"
                description="Your sent referrals will appear here with clear status updates."
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Incoming referrals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {directReferrals.incoming.length > 0 ? (
              directReferrals.incoming.slice(0, 6).map((item) => (
                <div className="rounded-2xl border bg-background p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        From{" "}
                        {item.counterpartSlug ? (
                          <Link className="underline-offset-4 hover:underline" href={`/directory/${item.counterpartSlug}`}>
                            {item.counterpartName}
                          </Link>
                        ) : (
                          item.counterpartName
                        )}
                      </p>
                    </div>
                    <Badge variant="outline">{getReferralStage(item.status, item.readAt)}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {item.region ? <span>{item.region}</span> : null}
                    {item.paymentModel ? <span>{item.paymentModel}</span> : null}
                    <span>{item.createdAtLabel}</span>
                  </div>
                  {item.status === "open" && (
                    <div className="mt-3 flex gap-2">
                      <form action={respondToDirectReferral}>
                        <input name="referralId" type="hidden" value={item.id} />
                        <input name="decision" type="hidden" value="accepted" />
                        <SubmitButton pendingLabel="Accepting…" size="sm">Accept</SubmitButton>
                      </form>
                      <form action={respondToDirectReferral}>
                        <input name="referralId" type="hidden" value={item.id} />
                        <input name="decision" type="hidden" value="declined" />
                        <SubmitButton pendingLabel="Declining…" size="sm" variant="outline">Decline</SubmitButton>
                      </form>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState
                title="No incoming referrals yet"
                description="When another clinician refers to you, it will appear here."
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Referred-to therapist tracker */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Referred to</CardTitle>
        </CardHeader>
        <CardContent>
          {referredTo.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {referredTo.map((entry) => (
                <div key={entry.counterpartId} className="rounded-2xl border bg-background p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {entry.slug ? (
                        <Link
                          className="font-medium text-foreground hover:text-primary truncate block"
                          href={`/directory/${entry.slug}`}
                        >
                          {entry.name}
                        </Link>
                      ) : (
                        <p className="font-medium text-foreground truncate">{entry.name}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                      {entry.referrals.length} referral{entry.referrals.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {entry.phone ? (
                      <a
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        href={`tel:${entry.phone}`}
                      >
                        <span className="text-xs font-medium uppercase tracking-wider w-10 shrink-0">Phone</span>
                        <span>{entry.phone}</span>
                      </a>
                    ) : null}
                    {entry.email ? (
                      <a
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                        href={`mailto:${entry.email}`}
                      >
                        <span className="text-xs font-medium uppercase tracking-wider w-10 shrink-0">Email</span>
                        <span className="truncate">{entry.email}</span>
                      </a>
                    ) : null}
                    {!entry.phone && !entry.email ? (
                      <p className="text-xs text-muted-foreground">No contact info on file</p>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted-foreground">Last referral {entry.lastReferralLabel}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No referrals logged yet"
              description="Therapists you refer to will appear here with their contact info for easy follow-up."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
