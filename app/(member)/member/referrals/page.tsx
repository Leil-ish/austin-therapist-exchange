import Link from "next/link";

import { ReferralComposeForm } from "@/components/domain/referral-compose-form";
import { EmptyState } from "@/components/state/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getDirectReferralActivity, getReferralCandidateTherapists } from "@/lib/data/live-data";

function getStatusCopy(sent?: string, error?: string) {
  if (sent === "1") {
    return "Referral sent.";
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
  searchParams?: Promise<{ directReferralSent?: string; directReferralError?: string }>;
}) {
  const session = await getSession();
  const params = searchParams ? await searchParams : undefined;
  const statusCopy = getStatusCopy(params?.directReferralSent, params?.directReferralError);
  const [therapists, directReferrals] = await Promise.all([
    getReferralCandidateTherapists(session?.userId),
    session
      ? getDirectReferralActivity(session.userId)
      : Promise.resolve({ sentCount: 0, receivedCount: 0, exchangedCount: 0, incoming: [], outgoing: [] })
  ]);

  return (
    <div className="space-y-8">
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Send referral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ReferralComposeForm senderEmail={session?.email} statusCopy={statusCopy} therapists={therapists} />
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
    </div>
  );
}
