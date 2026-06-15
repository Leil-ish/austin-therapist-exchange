import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrustToggleButton } from "@/components/domain/trust-toggle-button";
import { getPaymentModelLabelForUi } from "@/lib/data/live-data";
import type { AvailabilityStatus, PublicTherapistSummary } from "@/types";

function AvailabilityDot({ status, stale }: { status: AvailabilityStatus; stale: boolean }) {
  if (stale) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
        Unconfirmed
      </span>
    );
  }
  if (status === "accepting") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
        Accepting
      </span>
    );
  }
  if (status === "waitlist") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
        Limited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
      Not accepting
    </span>
  );
}

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
  const dim = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

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
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary/8 font-medium text-primary/70`}
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
  const specialtyTags = therapist.specialties.slice(0, 2);
  const communityTags = therapist.communities.slice(0, 1);

  return (
    <div className="group relative h-full">
      <Card className="flex h-full flex-col bg-white/90 transition-shadow group-hover:shadow-paper-hover">
        <CardHeader className="pb-3">
          {/* Name + avatar row */}
          <div className="flex items-start gap-3">
            <TherapistAvatar avatarUrl={therapist.avatarUrl} name={therapist.displayName} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-base font-semibold leading-snug text-foreground">{therapist.displayName}</p>
                <AvailabilityDot status={therapist.availabilityStatus} stale={therapist.availabilityIsStale} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{therapist.title}</p>
              {therapist.recentlyReportedFull && (
                <p className="mt-1 text-xs text-amber-600">Recently reported full by a colleague</p>
              )}
            </div>
          </div>

          {therapist.headline ? (
            <p className="mt-1 text-sm italic text-muted-foreground/70">&ldquo;{therapist.headline}&rdquo;</p>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-1 flex-col pt-0">
          <div className="space-y-3">
            {/* Specialty + community tags */}
            {specialtyTags.length > 0 || communityTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {specialtyTags.map((tag) => (
                  <Badge key={tag} variant="muted">
                    {tag}
                  </Badge>
                ))}
                {communityTags.map((community) => (
                  <Badge key={community} variant="outline" className="text-primary/70">
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
          </div>

          {/* Trust action — pinned to bottom, floats above the card link */}
          {canFollow ? (
            <div className="relative z-10 mt-auto pt-4">
              <TrustToggleButton
                followedProfileId={therapist.profileId}
                initialIsFollowed={therapist.isFollowed ?? false}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stretched link — covers the full card; trust button floats above via z-10 */}
      <Link
        aria-label={`View ${therapist.displayName}'s profile`}
        className="absolute inset-0 cursor-pointer rounded-[24px]"
        href={`/directory/${therapist.slug}`}
      />
    </div>
  );
}
