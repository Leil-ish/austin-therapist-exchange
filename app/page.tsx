import { redirect } from "next/navigation";
import Link from "next/link";

import { TherapistCard } from "@/components/domain/therapist-card";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";
import { getPublicTherapists } from "@/lib/data/live-data";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ code?: string; next?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const code = params?.code?.trim();
  const next = params?.next?.trim();

  if (code) {
    const callbackUrl = next
      ? `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
      : `/auth/callback?code=${encodeURIComponent(code)}`;
    redirect(callbackUrl as never);
  }

  const session = await getSession();
  const { therapists } = await getPublicTherapists(session?.userId, 3, 0, undefined, undefined, undefined, undefined);

  return (
    <PageShell>
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-[1.25fr_0.75fr] md:py-18">
        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">For Austin therapists</p>
            <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-foreground md:text-6xl">
              Know exactly who to trust with your referrals, before you reach out
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              See who your colleagues trust, find the right fit instantly, and send referrals with confidence. All in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/directory">Find a therapist</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={(session ? "/member/referrals" : "/login") as never}>{session ? "Make a referral" : "Sign in"}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href={(session ? "/member/network" : "/join/apply") as never}>{session ? "See colleagues" : "Request access"}</Link>
            </Button>
          </div>
        </div>

        <Card className="border-primary/10 bg-white/70 shadow-none">
          <CardHeader>
            <CardTitle>Local referrals, in one place</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>Look for a therapist by neighborhood, insurance, specialty, and openings.</p>
            <p>See who you know, and who your colleagues know.</p>
            <p>Send a referral without digging through old posts, texts, or listserv threads.</p>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl space-y-8 px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Directory</p>
            <h2 className="font-serif text-4xl leading-tight text-foreground">Austin therapists</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/directory">View directory</Link>
          </Button>
        </div>
        {therapists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {therapists.map((therapist) => (
              <TherapistCard key={therapist.slug} therapist={therapist} currentProfileId={session?.userId} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Profiles will appear here"
            description="As more therapists join and complete their profiles, they will appear here."
          />
        )}
      </section>
    </PageShell>
  );
}
