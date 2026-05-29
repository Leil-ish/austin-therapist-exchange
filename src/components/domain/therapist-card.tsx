import Link from "next/link";

import { followClinician, unfollowClinician } from "@/app-actions/member-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailabilityLabel, getPaymentModelLabelForUi } from "@/lib/data/live-data";
import type { PublicTherapistSummary } from "@/types";

function getCompactMeta(therapist: PublicTherapistSummary) {
  const parts: string[] = [];

  if (therapist.neighborhoods.length > 0) {
    parts.push(therapist.neighborhoods[0]);
  } else if (therapist.city) {
    parts.push(therapist.city);
  }

  if (therapist.inPerson && therapist.telehealth) {
    parts.push("In person + telehealth");
  } else if (therapist.telehealth) {
    parts.push("Telehealth");
  } else {
    parts.push("In person");
  }

  parts.push(getPaymentModelLabelForUi(therapist.paymentModel));

  return parts.join(" · ");
}

function getTrustContext(therapist: PublicTherapistSummary, isSignedIn: boolean = false) {
  if (therapist.trustedByViewer) {
    return "You would refer here";
  }

  if (therapist.trustedBy.length === 1) {
    return isSignedIn
      ? `${therapist.trustedBy[0]?.name} would refer here`
      : "A trusted colleague would refer here";
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
  const meta = getCompactMeta(therapist);

  return (
    <Card className="h-full bg-white/90">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{therapist.displayName}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">{therapist.title}</p>
          </div>
          <Badge className="shrink-0 text-xs">{getAvailabilityLabel(therapist.availabilityStatus)}</Badge>
        </div>
        {therapist.headline ? (
          <p className="mt-1 text-sm italic text-primary/80">&ldquo;{therapist.headline}&rdquo;</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {(therapist.specialties.length > 0 || therapist.communities.length > 0) ? (
          <div className="flex flex-wrap gap-1.5">
            {therapist.specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="muted" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {therapist.communities.slice(0, 2).map((community) => (
              <Badge key={community} variant="outline" className="border-primary/30 text-xs text-primary">
                {community}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{meta}</p>
          <p>{trustContext}</p>
        </div>
        <div className="flex items-center gap-3 pt-1 text-sm">
          {canFollow ? (
            <form action={therapist.isFollowed ? unfollowClinician : followClinician}>
              <input name="followedProfileId" type="hidden" value={therapist.profileId} />
              <input name="returnTo" type="hidden" value={returnTo} />
              <Button size="sm" type="submit" variant={therapist.isFollowed ? "outline" : "ghost"}>
                {therapist.isFollowed ? "Saved" : "Save"}
              </Button>
            </form>
          ) : null}
          <Link className="text-sm font-medium text-primary hover:text-primary/80" href={`/directory/${therapist.slug}`}>
            View profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
