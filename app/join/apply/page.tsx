import { JoinApplicationForm } from "@/components/domain/join-application-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function JoinApplyPage({
  searchParams
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const refId = params?.ref?.trim() ?? "";
  const admin = createSupabaseAdminClient();

  const { data: sponsorProfile } = refId
    ? await admin
        .from("profiles")
        .select("id, full_name")
        .eq("id", refId)
        .eq("membership_state", "active")
        .maybeSingle()
    : { data: null };

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl space-y-8 px-6 py-16">
        {sponsorProfile && (
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <span>Invited by {sponsorProfile.full_name}</span>
          </div>
        )}

        <SectionHeading
          eyebrow="Join"
          title="Join Austin Therapist Exchange"
          description="A private referral network for Austin therapists. Find trusted colleagues, send warm referrals, and build your professional network — all in one place built for clinicians. We review applications to keep the community professional and trustworthy."
        />

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p><strong>Apply:</strong> Fill out the form below. We review submissions before granting access — this usually takes a few business days.</p>
            <p><strong>Approval:</strong> If approved, you&apos;ll receive an email with a link to set your password and access your account.</p>
            <p><strong>After you&apos;re in:</strong> Complete your profile — add your bio, neighborhoods, and insurance carriers — so colleagues can find you in referral searches.</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Your application</CardTitle>
          </CardHeader>
          <CardContent>
            <JoinApplicationForm
              sponsorProfileId={sponsorProfile?.id ?? undefined}
              sponsorName={sponsorProfile?.full_name ?? undefined}
            />
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
