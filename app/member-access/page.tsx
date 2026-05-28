import { redirect } from "next/navigation";

import { signOut } from "@/app-actions/auth-actions";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getLatestJoinRequestByEmail } from "@/lib/data/live-data";
import type { MembershipState } from "@/types";

function getStateCopy(state: MembershipState, rejectionReason?: string | null) {
  if (state === "active") {
    return {
      title: "Membership active",
      body: "Your membership is active. Welcome to the community! You now have access to the directory, referral tools, network features, and member profiles."
    };
  }

  if (state === "rejected") {
    return {
      title: "Application not approved",
      body:
        rejectionReason?.trim() ||
        "Your application was not approved at this time. If you'd like to discuss this, please reach out to an Austin Therapist Exchange admin."
    };
  }

  if (state === "suspended") {
    return {
      title: "Membership paused",
      body: "Your member access is currently paused. Reach out to an Austin Therapist Exchange admin for more information."
    };
  }

  return {
    title: "Application under review",
    body: "Your application is being reviewed. We usually process submissions within a few business days. Once approved, sign in to finish your profile and access the member workspace."
  };
}

export default async function MemberAccessPage({
  searchParams
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.membershipState === "active" || session.role === "admin") {
    redirect("/member");
  }

  const params = searchParams ? await searchParams : undefined;
  const latestJoinRequest = await getLatestJoinRequestByEmail(session.email);
  const state = (params?.state as MembershipState | undefined) ?? latestJoinRequest?.status ?? session.membershipState;
  const copy = getStateCopy(state, latestJoinRequest?.rejection_reason);

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl space-y-8 px-6 py-16">
        <SectionHeading
          eyebrow="Member access"
          title={copy.title}
          description="Access stays gated by referral and review."
        />

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>{copy.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>{copy.body}</p>
            <p>Signed in as {session.email}.</p>
            {latestJoinRequest ? (
              <div className="rounded-[24px] border bg-background p-4">
                <p className="font-medium text-foreground">Most recent application</p>
                <p>Status: {latestJoinRequest.status}</p>
                {latestJoinRequest.credentials ? <p>Credentials: {latestJoinRequest.credentials}</p> : null}
                {latestJoinRequest.sponsor_name ? <p>Sponsored by: {latestJoinRequest.sponsor_name}</p> : null}
                {latestJoinRequest.referral_code ? <p>Referral code: {latestJoinRequest.referral_code}</p> : null}
                {latestJoinRequest.created_at ? (
                  <p>
                    Submitted:{" "}
                    {new Date(latestJoinRequest.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild variant="outline">
                <a href="/about">See how membership works</a>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="ghost">
                  Sign out
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
