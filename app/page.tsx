import { redirect } from "next/navigation";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth/session";

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
            {session ? (
              <>
                <Button asChild size="lg">
                  <Link href="/member/referrals">Make a referral</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/directory">Find a therapist</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/member/network">See colleagues</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/directory">Find a therapist</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link href="/join/apply">Request access</Link>
                </Button>
              </>
            )}
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
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Why members use it</p>
          <h2 className="font-serif text-4xl leading-tight text-foreground">Before posting in a group</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/90">
            <CardContent className="space-y-3 pt-6 text-sm leading-7 text-muted-foreground">
              <p><strong>See current availability</strong> — Know who&apos;s accepting new clients right now, not months later when you ask.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90">
            <CardContent className="space-y-3 pt-6 text-sm leading-7 text-muted-foreground">
              <p><strong>Filter by insurance, fit, and location</strong> — Find therapists that match your referral needs quickly.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90">
            <CardContent className="space-y-3 pt-6 text-sm leading-7 text-muted-foreground">
              <p><strong>Understand colleague trust signals</strong> — See who your peers trust, bringing confidence to your referrals.</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90">
            <CardContent className="space-y-3 pt-6 text-sm leading-7 text-muted-foreground">
              <p><strong>Send referrals directly after approval</strong> — Reach therapists without email hunts or tracking lost threads.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-white/70 px-6 py-5">
          <p className="text-sm text-muted-foreground">
            Browse Austin therapists by neighborhood, insurance, specialty, and availability.
          </p>
          <Button asChild variant="outline">
            <Link href="/directory">Browse directory</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
