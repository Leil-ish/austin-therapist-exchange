import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrustToggleButton } from "@/components/domain/trust-toggle-button";
import { getAvailabilityLabel, getPaymentModelLabelForUi } from "@/lib/data/live-data";
import type { PublicTherapistSummary } from "@/types";

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getCompactMeta(therapist: PublicTherapistSummary) {
  const parts: string[] = [];

  if (therapist.neighborhoods.length > 0) {
    parts.push(therapist.neighborhoods[0]!);
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

function TherapistAvatar({
  name,
  avatarUrl,
  size = "md"
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover`}
        src={avatarUrl}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary`}
    >
      {getInitials(name)}
    </span>
  );
}

export function TherapistCard({
  therapist,
  currentProfileId
}: {
  therapist: PublicTherapistSummary;
  currentProfileId?: string;
}) {
  const canFollow = currentProfileId && currentProfileId !== therapist.profileId;
  const trustContext = getTrustContext(therapist, !!currentProfileId);
  const meta = getCompactMeta(therapist);
  const tags = [
    ...therapist.specialties.slice(0, 2),
  ];

  return (
    <Card className="h-full bg-white/90">
      <CardHeader className="pb-3">
        {/* Name + avatar row */}
        <div className="flex items-start gap-3">
          <TherapistAvatar avatarUrl={therapist.avatarUrl} name={therapist.displayName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-lg font-semibold leading-tight">{therapist.displayName}</p>
              <Badge className="shrink-0 text-xs">{getAvailabilityLabel(therapist.availabilityStatus)}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{therapist.title}</p>
          </div>
        </div>

        {therapist.headline ? (
          <p className="mt-1 text-sm italic text-primary/80">&ldquo;{therapist.headline}&rdquo;</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Specialty + community tags */}
        {tags.length > 0 || therapist.communities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="muted" className="text-xs">
                {tag}
              </Badge>
            ))}
            {therapist.communities.slice(0, 1).map((community) => (
              <Badge key={community} variant="outline" className="border-primary/30 text-xs text-primary">
                {community}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Meta + trust */}
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <p>{meta}</p>
          <p>{trustContext}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          {canFollow ? (
            <TrustToggleButton
              followedProfileId={therapist.profileId}
              initialIsFollowed={therapist.isFollowed ?? false}
            />
          ) : null}
          <Link className="text-sm font-medium text-primary hover:text-primary/80" href={`/directory/${therapist.slug}`}>
            View profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
