import Link from "next/link";

import { followClinician, unfollowClinician } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailabilityLabel, getPaymentModelLabelForUi } from "@/lib/data/live-data";
import type { PublicTherapistSummary } from "@/types";

function getCareFormatLabel(therapist: PublicTherapistSummary) {
  if (therapist.inPerson && therapist.telehealth) {
    return "In person and telehealth";
  }

  if (therapist.telehealth) {
    return "Telehealth";
  }

  return "In person";
}

function getTrustContext(therapist: PublicTherapistSummary, isSignedIn: boolean = false) {
  if (therapist.trustedByViewer) {
    return "You would refer here";
  }

  if (therapist.trustedBy.length === 1) {
    return isSignedIn 
      ? `${therapist.trustedBy[0]?.name} would refer here`
      : `A trusted colleague would refer here`;
  }

  if (therapist.trustedBy.length > 1) {
    return isSignedIn
      ? `${therapist.trustedBy[0]?.name} and ${therapist.trustedBy.length - 1} other colleagues would refer here`
      : `Colleague referrals on record (${therapist.trustedBy.length})`;
  }

  return therapist.endorsementCount > 0
    ? `${therapist.endorsementCount} colleague referral${therapist.endorsementCount === 1 ? "" : "s"} on record`
    : "New to Austin Therapist Exchange";
}

export function TherapistCard({
  therapist,
  currentProfileId,
  returnTo = "/directory"
}: {
  therapist: PublicTherapistSummary;
  currentProfileId?: string;
  returnTo?: string;
}) {
  const canFollow = currentProfileId && currentProfileId !== therapist.profileId;
  const trustContext = getTrustContext(therapist, !!currentProfileId);

  return (
    <Card className="h-full bg-white/90">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{therapist.displayName}</CardTitle>
            <CardDescription>{therapist.title}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge>{getAvailabilityLabel(therapist.availabilityStatus)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {therapist.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="muted">
              {specialty}
            </Badge>
          ))}
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {therapist.neighborhoods.length > 0 ? <p>{therapist.neighborhoods.join(", ")}</p> : <p>{therapist.city}</p>}
          <p>{getCareFormatLabel(therapist)}</p>
          <p>{getPaymentModelLabelForUi(therapist.paymentModel)}</p>
          <p>{trustContext}</p>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            {canFollow ? (
              <form action={therapist.isFollowed ? unfollowClinician : followClinician}>
                <input name="followedProfileId" type="hidden" value={therapist.profileId} />
                <input name="returnTo" type="hidden" value={returnTo} />
                <Button size="sm" type="submit" variant={therapist.isFollowed ? "outline" : "ghost"}>
                  {therapist.isFollowed ? "Saved" : "Save"}
                </Button>
              </form>
            ) : null}
            <Link className="font-medium text-primary hover:text-primary/80" href={`/directory/${therapist.slug}`}>
              View profile
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
