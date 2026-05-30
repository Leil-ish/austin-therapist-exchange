import { notFound } from "next/navigation";
import Link from "next/link";

import { requireMember } from "@/lib/auth/guards";
import { getPublicTherapistBySlug } from "@/lib/data/live-data";
import { PageShell } from "@/components/layout/page-shell";
import { QuickReferralForm } from "@/components/domain/quick-referral-form";

export default async function QuickReferralPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireMember(`/member/referrals/to/${slug}`);
  const therapist = await getPublicTherapistBySlug(slug, session.userId);

  if (!therapist || therapist.profileId === session.userId) {
    notFound();
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          href={`/directory/${slug}`}
        >
          ← Back to profile
        </Link>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Make a referral</p>
          <h1 className="font-serif text-3xl text-foreground">{therapist.displayName}</h1>
          <p className="text-muted-foreground">{therapist.title}</p>
        </div>

        <QuickReferralForm
          therapist={{
            profileId: therapist.profileId,
            displayName: therapist.displayName,
            phone: therapist.publicPhone,
            email: therapist.publicEmail
          }}
        />
      </section>
    </PageShell>
  );
}
