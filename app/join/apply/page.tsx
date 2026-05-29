import { JoinApplicationForm } from "@/components/domain/join-application-form";
import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function JoinApplyPage({
  searchParams
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const referralCode = params?.code?.trim() ?? "";
  const admin = createSupabaseAdminClient();

  const { data: referralLink } = referralCode
    ? await admin
        .from("invitations")
        .select("invited_by")
        .eq("code", referralCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  const sponsor = referralLink?.invited_by
    ? await admin.from("profiles").select("full_name").eq("id", referralLink.invited_by).maybeSingle()
    : { data: null };

  return (
    <PageShell>
      <section className="mx-auto max-w-3xl space-y-8 px-6 py-16">
        <SectionHeading
          eyebrow="Join"
          title="Request access with a referral code"
          description="Austin Therapist Exchange is invite-only. We review applications to keep the network professional and trustworthy."
        />

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>About this application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p><strong>How it works:</strong> Austin Therapist Exchange is referral-based. If a current member invited you, enter their referral code below.</p>
            <p><strong>Your application:</strong> We review submissions before granting member access. This usually takes a few business days.</p>
            <p><strong>After approval:</strong> Sign in and finish your profile. Then you&apos;ll have full access to the directory, referral tools, and member network.</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Referral application</CardTitle>
          </CardHeader>
          <CardContent>
            <JoinApplicationForm
              defaultCode={referralCode || undefined}
              sponsorName={sponsor.data?.full_name}
            />
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Don&apos;t have a referral code?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>Referral code access is currently required. Check if any colleagues you know are members and ask them to share a code.</p>
            <p>We&apos;re working on expanding access pathways. Questions? <a href="mailto:hello@austintherapistexchange.com" className="text-primary hover:underline">Get in touch</a>.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
