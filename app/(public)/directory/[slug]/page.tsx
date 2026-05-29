import { notFound } from "next/navigation";
import Link from "next/link";

import { followClinician, unfollowClinician } from "@/app-actions/member-actions";
import { getSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import {
  getAvailabilityLabel,
  getPaymentModelLabelForUi,
  getPublicTherapistBySlug
} from "@/lib/data/live-data";

export default async function TherapistProfilePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  const therapist = await getPublicTherapistBySlug(slug, session?.userId);

  if (!therapist) {
    notFound();
  }

  return (
    <PageShell>
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white/90">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{getAvailabilityLabel(therapist.availabilityStatus)}</Badge>
              <Badge variant="outline">{therapist.membershipTier === "premium" ? "Premium" : "Free"}</Badge>
            </div>
            <CardTitle className="text-4xl">{therapist.displayName}</CardTitle>
            {therapist.headline ? <p className="text-base uppercase tracking-[0.18em] text-muted-foreground">{therapist.headline}</p> : null}
            <p className="text-lg text-muted-foreground">{therapist.title}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {session?.userId && session.userId !== therapist.profileId ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/member/referrals">Make a referral</Link>
                </Button>
                <form action={therapist.isFollowed ? unfollowClinician : followClinician}>
                  <input name="followedProfileId" type="hidden" value={therapist.profileId} />
                  <input name="returnTo" type="hidden" value={`/directory/${therapist.slug}`} />
                  <Button type="submit" variant="outline">
                    {therapist.isFollowed ? "Saved" : "Save"}
                  </Button>
                </form>
                {therapist.publicEmail ? (
                  <Button asChild variant="outline">
                    <a href={`mailto:${therapist.publicEmail}?subject=${encodeURIComponent(`Referral inquiry for ${therapist.displayName}`)}`}>
                      Email clinician
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : !session ? (
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={`/login?returnTo=/directory/${therapist.slug}`}>Sign in to save</Link>
                </Button>
                {therapist.publicEmail ? (
                  <Button asChild variant="outline">
                    <a href={`mailto:${therapist.publicEmail}?subject=${encodeURIComponent(`Referral inquiry for ${therapist.displayName}`)}`}>
                      Email clinician
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
            {session?.userId && session.userId !== therapist.profileId ? (
              <p className="text-sm text-muted-foreground">Save therapists you want to keep close by for future referrals.</p>
            ) : null}
            <p className="leading-7 text-muted-foreground">{therapist.bio}</p>
            {therapist.offerings.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-foreground">Offerings</p>
                <div className="flex flex-wrap gap-2">
                  {therapist.offerings.map((offering) => (
                    <Badge key={offering} variant="muted">
                      {offering}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {therapist.specialties.map((specialty) => (
                <Badge key={specialty}>{specialty}</Badge>
              ))}
              {therapist.communities.map((community) => (
                <Badge key={community} variant="outline" className="border-primary/30 text-primary">{community}</Badge>
              ))}
            </div>
            <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
              <div>
                <p className="font-medium text-foreground">Fit</p>
                <p>{therapist.approachSummary || therapist.populations.join(", ")}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Insurance</p>
                <p>{therapist.insuranceAccepted.length > 0 ? therapist.insuranceAccepted.join(", ") : getPaymentModelLabelForUi(therapist.paymentModel)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Care format</p>
                <p>{therapist.inPerson ? "In person" : ""}{therapist.inPerson && therapist.telehealth ? " + " : ""}{therapist.telehealth ? "Telehealth" : ""}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Availability freshness</p>
                <p>{therapist.availabilityUpdatedAtLabel}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Payment model</p>
                <p>{getPaymentModelLabelForUi(therapist.paymentModel)}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Neighborhoods</p>
                <p>{therapist.neighborhoods.length > 0 ? therapist.neighborhoods.join(", ") : "Austin"}</p>
              </div>
              {therapist.publicEmail ? (
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p>{therapist.publicEmail}</p>
                </div>
              ) : null}
              {therapist.publicPhone ? (
                <div>
                  <p className="font-medium text-foreground">Phone</p>
                  <p>{therapist.publicPhone}</p>
                </div>
              ) : null}
            </div>
            {therapist.featuredLinks.length > 0 ? (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Featured links</p>
                <div className="flex flex-col gap-2">
                  {therapist.featuredLinks.map((link) => (
                    <a className="text-primary hover:text-primary/80" href={link} key={link} target="_blank">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle>Colleague referrals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            {therapist.trustedByViewer ? <p>You have already saved this therapist.</p> : null}
            <p>{therapist.endorsementCount} colleague referral{therapist.endorsementCount === 1 ? "" : "s"} on record.</p>
            {therapist.sponsorName ? <p>Joined through {therapist.sponsorName}.</p> : null}
            <div className="flex flex-wrap gap-2">
              {therapist.trustedBy.map((connection) => (
                <Badge key={connection.id} variant="outline">
                  {connection.name}
                </Badge>
              ))}
            </div>
            {therapist.trustedBy.length === 0 ? <p>No colleague names are listed here yet.</p> : null}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
