import "server-only";

import type {
  AvailabilityStatus,
  CuratedListSummary,
  DirectReferralActivitySummary,
  EndorsementSummary,
  FeedItem,
  FollowedClinicianSummary,
  GroupSummary,
  JoinRequestSummary,
  MembershipTier,
  ModerationReportSummary,
  PaymentModel,
  PublicTherapistSummary,
  ReferralLinkSummary,
  ReferralMessage
} from "@/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AVAILABILITY_STALE_DAYS } from "@/lib/referral-matching";

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatRelativeDateLabel(value?: string | null) {
  if (!value) {
    return "Not yet confirmed";
  }

  const then = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Confirmed today";
  }

  if (diffDays === 1) {
    return "Confirmed yesterday";
  }

  if (diffDays < 7) {
    return `Confirmed ${diffDays} days ago`;
  }

  if (diffDays < 14) {
    return "Confirmed last week";
  }

  return `Confirmed ${Math.floor(diffDays / 7)} weeks ago`;
}

function formatCreatedAtLabel(value?: string | null) {
  if (!value) {
    return "Recently";
  }

  const then = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function getAvailabilityLabel(status: AvailabilityStatus) {
  if (status === "accepting") return "Accepting new clients";
  if (status === "waitlist") return "Limited openings";
  return "Not accepting referrals";
}

function getPaymentModelLabel(value?: string | null) {
  if (value === "private_pay") return "Private pay";
  if (value === "insurance") return "Insurance";
  return "Private pay + insurance";
}

function buildTherapistTitle(row: Record<string, unknown>) {
  const explicitTitle = typeof row.title === "string" ? row.title.trim() : "";
  if (explicitTitle) {
    return explicitTitle;
  }

  const credentials = typeof row.credentials === "string" ? row.credentials.trim() : "";
  const specialties = asArray(row.specialties);

  if (credentials && specialties.length > 0) {
    return `${credentials} specializing in ${specialties.slice(0, 2).join(" and ")}`;
  }

  if (credentials) {
    return credentials;
  }

  return "Austin therapist";
}

async function getEndorserConnections(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, { id: string; name: string; slug: string }[]>();
  }

  const admin = createSupabaseAdminClient();
  const { data: rawEndorsements } = await admin
    .from("endorsements")
    .select("endorsed_profile_id, endorser_profile_id, is_public")
    .in("endorsed_profile_id", profileIds)
    .eq("is_public", true);

  const endorsements = (rawEndorsements ?? []) as Array<{
    endorsed_profile_id: string;
    endorser_profile_id: string;
    is_public: boolean;
  }>;

  const endorserIds = [...new Set(endorsements.map((item) => item.endorser_profile_id))];
  const { data: rawProfiles } = endorserIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, slug, membership_state, role")
        .in("id", endorserIds)
    : { data: [] as unknown[] };

  const activeEndorsers = new Map(
    ((rawProfiles ?? []) as Array<Record<string, unknown>>)
      .filter((profile) => profile.membership_state === "active")
      .filter((profile) => profile.role === "therapist" || profile.role === "admin")
      .map((profile) => [
        String(profile.id),
        {
          id: String(profile.id),
          name: String(profile.full_name ?? "Therapist"),
          slug: String(profile.slug ?? "")
        }
      ])
  );

  const grouped = new Map<string, { id: string; name: string; slug: string }[]>();

  for (const endorsement of endorsements) {
    const endorser = activeEndorsers.get(endorsement.endorser_profile_id);

    if (!endorser) {
      continue;
    }

    const current = grouped.get(endorsement.endorsed_profile_id) ?? [];
    current.push(endorser);
    grouped.set(endorsement.endorsed_profile_id, current);
  }

  return grouped;
}

async function getFollowedProfileIds(viewerProfileId?: string) {
  if (!viewerProfileId) {
    return new Set<string>();
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("follows")
    .select("followed_profile_id")
    .eq("follower_profile_id", viewerProfileId);

  if (error) {
    return new Set<string>();
  }

  return new Set(
    ((data ?? []) as Array<Record<string, unknown>>).map((item) => String(item.followed_profile_id))
  );
}

async function getPublicCuratedListTitles(profileIds: string[]) {
  if (profileIds.length === 0) {
    return new Map<string, string[]>();
  }

  const admin = createSupabaseAdminClient();
  const { data: rawItems, error } = await admin
    .from("curated_list_items")
    .select("therapist_profile_id, curated_lists!inner(title, is_public)")
    .in("therapist_profile_id", profileIds);

  if (error) {
    return new Map<string, string[]>();
  }

  const grouped = new Map<string, string[]>();

  for (const item of (rawItems ?? []) as Array<Record<string, unknown>>) {
    const therapistProfileId = String(item.therapist_profile_id);
    const list = item.curated_lists as Record<string, unknown> | null;

    if (!list || list.is_public !== true) {
      continue;
    }

    const title = String(list.title ?? "").trim();
    if (!title) {
      continue;
    }

    const current = grouped.get(therapistProfileId) ?? [];
    if (!current.includes(title)) {
      current.push(title);
      grouped.set(therapistProfileId, current);
    }
  }

  return grouped;
}

async function getSupplementalTherapistFields(
  therapistProfileIds: string[],
  profileIds: string[]
) {
  const admin = createSupabaseAdminClient();

  const [{ data: rawTherapistProfiles, error: therapistError }, { data: rawProfiles, error: profileError }] = await Promise.all([
    therapistProfileIds.length
      ? admin
          .from("therapist_profiles")
          .select("id, public_email, public_phone, communities, modalities")
          .in("id", therapistProfileIds)
      : Promise.resolve({ data: [] as unknown[], error: null }),
    profileIds.length
      ? admin
          .from("profiles")
          .select("id")
          .in("id", profileIds)
      : Promise.resolve({ data: [] as unknown[], error: null })
  ]);

  const therapistFields = new Map<string, Record<string, unknown>>();
  if (!therapistError) {
    for (const row of (rawTherapistProfiles ?? []) as Array<Record<string, unknown>>) {
      therapistFields.set(String(row.id), row);
    }
  }

  const profileFields = new Map<string, Record<string, unknown>>();
  if (!profileError) {
    for (const row of (rawProfiles ?? []) as Array<Record<string, unknown>>) {
      profileFields.set(String(row.id), row);
    }
  }

  return { therapistFields, profileFields };
}

function isAvailabilityStale(isoDate: string | null | undefined): boolean {
  if (!isoDate) return false;
  const diffMs = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) > AVAILABILITY_STALE_DAYS;
}

function mapTherapistSummary(
  row: Record<string, unknown>,
  trustedBy: Map<string, { id: string; name: string; slug: string }[]>,
  followedProfileIds: Set<string>,
  curatedListTitles: Map<string, string[]>,
  viewerProfileId?: string,
  recentlyReportedFull: boolean = false
): PublicTherapistSummary {
  const profileId = String(row.profile_id);
  const paymentModel = (row.payment_model as PaymentModel | null) ?? "both";
  const therapistProfileId = String(row.therapist_profile_id);
  const trustedConnections = trustedBy.get(profileId) ?? [];
  const availabilityUpdatedAt = typeof row.availability_updated_at === "string" ? row.availability_updated_at : null;

  return {
    id: therapistProfileId,
    profileId,
    slug: String(row.slug),
    displayName: String(row.public_display_name ?? "Therapist"),
    title: buildTherapistTitle(row),
    headline: typeof row.headline === "string" ? row.headline : undefined,
    bio: String(row.bio ?? "Profile in progress."),
    approachSummary: String(row.approach_summary ?? "Approach summary coming soon."),
    specialties: asArray(row.specialties),
    populations: asArray(row.populations),
    communities: asArray(row.communities),
    insuranceAccepted: asArray(row.insurance_accepted),
    paymentModel,
    therapyStyleTags: asArray(row.therapy_style_tags),
    neighborhoods: asArray(row.neighborhoods),
    endorsementCount: Number(row.public_endorsement_count ?? 0),
    membershipLabel: "Active member",
    city: String(row.city ?? "Austin"),
    marketName: "Austin",
    availabilityStatus: (row.availability_status as AvailabilityStatus | null) ?? "waitlist",
    availabilityUpdatedAtLabel: formatRelativeDateLabel(availabilityUpdatedAt),
    availabilityUpdatedAt,
    availabilityIsStale: isAvailabilityStale(availabilityUpdatedAt),
    recentlyReportedFull,
    modalities: asArray(row.modalities),
    gender: typeof row.gender === "string" && row.gender ? row.gender : undefined,
    languages: asArray(row.languages),
    slidingScale: Boolean(row.offers_sliding_scale),
    inPerson: Boolean(row.offers_in_person),
    telehealth: Boolean(row.offers_telehealth),
    trustedBy: trustedConnections,
    featuredLinks: asArray(row.featured_links),
    offerings: asArray(row.offerings),
    curatedListTitles: curatedListTitles.get(therapistProfileId) ?? [],
    publicEmail: typeof row.public_email === "string" ? row.public_email : undefined,
    publicPhone: typeof row.public_phone === "string" ? row.public_phone : undefined,
    bookingUrl: typeof row.booking_url === "string" && row.booking_url ? row.booking_url : undefined,
    avatarUrl: typeof row.avatar_url === "string" && row.avatar_url ? row.avatar_url : undefined,
    isFollowed: followedProfileIds.has(profileId),
    trustedByViewer: viewerProfileId ? trustedConnections.some((connection) => connection.id === viewerProfileId) : false,
    membershipTier: (row.membership_tier as MembershipTier | null) ?? "free",
    sponsorName: undefined
  };
}

export async function getPublicTherapists(
  viewerProfileId?: string,
  limit: number = 50,
  offset: number = 0,
  query?: string,
  availability?: string,
  payment?: string,
  format?: string
): Promise<{ therapists: PublicTherapistSummary[]; totalCount: number }> {
  const admin = createSupabaseAdminClient();
  let queryBuilder = admin
    .from("public_therapist_directory")
    .select(
      "therapist_profile_id, profile_id, slug, city, public_display_name, credentials, title, bio, specialties, insurance_accepted, therapy_style_tags, populations, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, availability_updated_at, public_endorsement_count, payment_model, public_email, public_phone",
      { count: "exact" }
    )

  if (query) {
    const search = `%${query.toLowerCase()}%`;
    queryBuilder = queryBuilder.or(
      `public_display_name.ilike.${search},bio.ilike.${search},approach_summary.ilike.${search},specialties.ilike.${search},populations.ilike.${search},neighborhoods.ilike.${search},therapy_style_tags.ilike.${search}`
    );
  }

  if (availability) {
    queryBuilder = queryBuilder.eq("availability_status", availability);
  }

  if (payment) {
    queryBuilder = queryBuilder.in(
      "payment_model",
      payment === "both" ? ["both"] : [payment, "both"]
    );
  }

  if (format) {
    if (format === "telehealth") {
      queryBuilder = queryBuilder.eq("offers_telehealth", true);
    } else if (format === "in_person") {
      queryBuilder = queryBuilder.eq("offers_in_person", true);
    } else if (format === "both") {
      queryBuilder = queryBuilder.eq("offers_telehealth", true).eq("offers_in_person", true);
    }
  }

  const { data: rawRows, count } = await queryBuilder
    .order("availability_updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const rows = (rawRows ?? []) as Array<Record<string, unknown>>;
  const [{ therapistFields, profileFields }, trustedBy, followedProfileIds, curatedListTitles] = await Promise.all([
    getSupplementalTherapistFields(
      rows.map((row) => String(row.therapist_profile_id)),
      rows.map((row) => String(row.profile_id))
    ),
    getEndorserConnections(rows.map((row) => String(row.profile_id))),
    getFollowedProfileIds(viewerProfileId),
    getPublicCuratedListTitles(rows.map((row) => String(row.therapist_profile_id)))
  ]);

  return {
    therapists: rows
      .map((row) =>
        mapTherapistSummary(
          {
            ...row,
            ...therapistFields.get(String(row.therapist_profile_id)),
            ...profileFields.get(String(row.profile_id))
          },
          trustedBy,
          followedProfileIds,
          curatedListTitles,
          viewerProfileId
        )
      )
      .sort((a, b) => {
        const trustA = Number(Boolean(a.isFollowed || a.trustedByViewer));
        const trustB = Number(Boolean(b.isFollowed || b.trustedByViewer));

        if (trustA !== trustB) {
          return trustB - trustA;
        }

        const effectiveAvailScore = (t: PublicTherapistSummary) => {
          const base = ({ accepting: 2, waitlist: 1, full: 0 } as const)[t.availabilityStatus];
          return (t.availabilityIsStale || t.recentlyReportedFull) ? Math.max(base - 1, 0) : base;
        };
        const scoreA = effectiveAvailScore(a);
        const scoreB = effectiveAvailScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;

        return b.endorsementCount - a.endorsementCount;
      }),
    totalCount: count ?? 0
  };
}

export async function getPublicTherapistBySlug(slug: string, viewerProfileId?: string) {
  const admin = createSupabaseAdminClient();
  const { data: rawRow } = await admin
    .from("public_therapist_directory")
    .select(
      "therapist_profile_id, profile_id, slug, city, public_display_name, credentials, title, bio, specialties, insurance_accepted, therapy_style_tags, populations, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, availability_updated_at, public_endorsement_count, payment_model, public_email, public_phone"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!rawRow) {
    return null;
  }

  const [{ therapistFields, profileFields }, trustedBy, followedProfileIds, curatedListTitles] = await Promise.all([
    getSupplementalTherapistFields([String(rawRow.therapist_profile_id)], [String(rawRow.profile_id)]),
    getEndorserConnections([String(rawRow.profile_id)]),
    getFollowedProfileIds(viewerProfileId),
    getPublicCuratedListTitles([String(rawRow.therapist_profile_id)])
  ]);
  return mapTherapistSummary(
    {
      ...(rawRow as Record<string, unknown>),
      ...therapistFields.get(String(rawRow.therapist_profile_id)),
      ...profileFields.get(String(rawRow.profile_id))
    },
    trustedBy,
    followedProfileIds,
    curatedListTitles,
    viewerProfileId
  );
}

export async function getReferralCandidateTherapists(
  viewerProfileId?: string
): Promise<PublicTherapistSummary[]> {
  const admin = createSupabaseAdminClient();
  const { data: rawProfiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, slug, city, role, membership_state")
    .in("membership_state", ["active", "pending"])
    .in("role", ["therapist", "admin"]);

  const profiles = ((rawProfiles ?? []) as Array<Record<string, unknown>>).filter((profile) =>
    viewerProfileId ? String(profile.id) !== viewerProfileId : true
  );

  if (profiles.length === 0) {
    return [];
  }

  const profileIds = profiles.map((profile) => String(profile.id));
  const { data: rawTherapistProfiles, error: tpError } = await admin
    .from("therapist_profiles")
    .select(
      "id, profile_id, public_display_name, credentials, title, bio, specialties, insurance_accepted, therapy_style_tags, populations, neighborhoods, approach_summary, offers_in_person, offers_telehealth, availability_status, availability_updated_at, payment_model, public_email, public_phone, communities, modalities"
    )
    .in("profile_id", profileIds);

  const rows = (rawTherapistProfiles ?? []) as Array<Record<string, unknown>>;
  const profileById = new Map(profiles.map((profile) => [String(profile.id), profile]));
  const rowProfileIds = rows.map((row) => String(row.profile_id));

  const [{ therapistFields, profileFields }, trustedBy, followedProfileIds, curatedListTitles, rawResponses] = await Promise.all([
    getSupplementalTherapistFields(
      rows.map((row) => String(row.id)),
      rowProfileIds
    ),
    getEndorserConnections(rowProfileIds),
    getFollowedProfileIds(viewerProfileId),
    getPublicCuratedListTitles(rows.map((row) => String(row.id))),
    rowProfileIds.length
      ? admin
          .from("case_referrals")
          .select("referred_profile_id, status, responded_at")
          .in("referred_profile_id", rowProfileIds)
          .not("responded_at", "is", null)
          .order("responded_at", { ascending: false })
      : Promise.resolve({ data: [] as unknown[], error: null })
  ]);

  // Build most-recent-response map (aggregate, anonymous — status + date only)
  const recentResponseByProfileId = new Map<string, { status: string; responded_at: string }>();
  for (const resp of ((rawResponses.data ?? []) as Array<Record<string, unknown>>)) {
    const pid = String(resp.referred_profile_id);
    if (!recentResponseByProfileId.has(pid)) {
      recentResponseByProfileId.set(pid, {
        status: String(resp.status),
        responded_at: String(resp.responded_at)
      });
    }
  }

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  return rows
    .map((row) => {
      const profile = profileById.get(String(row.profile_id));

      if (!profile) {
        return null;
      }

      // Compute soft-signal: declined recently AND more recent than self-reported update
      const recentResp = recentResponseByProfileId.get(String(row.profile_id));
      const availabilityUpdatedAt = typeof row.availability_updated_at === "string" ? row.availability_updated_at : null;
      const recentlyReportedFull = (() => {
        if (!recentResp || recentResp.status !== "declined") return false;
        const respondedMs = new Date(recentResp.responded_at).getTime();
        if (Date.now() - respondedMs > thirtyDaysMs) return false;
        if (availabilityUpdatedAt && new Date(availabilityUpdatedAt).getTime() > respondedMs) return false;
        return true;
      })();

      return mapTherapistSummary(
        {
          therapist_profile_id: row.id,
          profile_id: row.profile_id,
          slug: profile.slug,
          city: profile.city ?? "Austin",
          public_endorsement_count: 0,
          ...row,
          ...therapistFields.get(String(row.id)),
          ...profileFields.get(String(row.profile_id))
        },
        trustedBy,
        followedProfileIds,
        curatedListTitles,
        viewerProfileId,
        recentlyReportedFull
      );
    })
    .filter((therapist): therapist is PublicTherapistSummary => Boolean(therapist))
    .sort((a, b) => {
      const trustA = Number(Boolean(a.isFollowed || a.trustedByViewer));
      const trustB = Number(Boolean(b.isFollowed || b.trustedByViewer));

      if (trustA !== trustB) {
        return trustB - trustA;
      }

      const effectiveAvailScore = (t: PublicTherapistSummary) => {
        const base = ({ accepting: 2, waitlist: 1, full: 0 } as const)[t.availabilityStatus];
        return (t.availabilityIsStale || t.recentlyReportedFull) ? Math.max(base - 1, 0) : base;
      };
      const scoreA = effectiveAvailScore(a);
      const scoreB = effectiveAvailScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;

      return b.trustedBy.length - a.trustedBy.length;
    });
}

export async function getMemberFeedItems(profileId?: string) {
  const admin = createSupabaseAdminClient();
  const { data: rawPosts } = await admin
    .from("posts")
    .select("id, kind, title, body, author_profile_id, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const posts = (rawPosts ?? []) as Array<Record<string, unknown>>;
  const postIds = posts.map((post) => String(post.id));
  const authorIds = [...new Set(posts.map((post) => String(post.author_profile_id)))];

  const { data: rawAuthors } = authorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", authorIds)
    : { data: [] as unknown[] };
  const authors = new Map(
    ((rawAuthors ?? []) as Array<Record<string, unknown>>).map((author) => [
      String(author.id),
      String(author.full_name ?? "Therapist")
    ])
  );

  const { data: rawReferralDetails } = postIds.length
    ? await admin
        .from("referral_requests")
        .select("post_id, insurance_notes, status")
        .in("post_id", postIds)
    : { data: [] as unknown[] };
  const referralDetails = new Map(
    ((rawReferralDetails ?? []) as Array<Record<string, unknown>>).map((detail) => [
      String(detail.post_id),
      detail
    ])
  );
  const followedProfileIds = await getFollowedProfileIds(profileId);

  return posts
    .map((post) => {
    const type = String(post.kind) as FeedItem["type"];
    const referralDetail = referralDetails.get(String(post.id));
    const authorProfileId = String(post.author_profile_id);
    const isFollowedAuthor = followedProfileIds.has(authorProfileId);

    return {
      id: String(post.id),
      type,
      kindLabel:
        type === "consultation_request"
          ? "Consultation request"
          : type === "job"
            ? "Job opening"
            : "Referral request",
      title: String(post.title ?? "Untitled post"),
      body: String(post.body ?? ""),
      authorName: authors.get(String(post.author_profile_id)) ?? "Therapist",
      createdAtLabel: formatCreatedAtLabel(post.created_at as string | null),
      ctaLabel:
        type === "consultation_request"
          ? "I'm open to consult"
          : type === "job"
            ? "Review this opening"
            : "I'm available for this referral",
      status: String(referralDetail?.status ?? "open") as FeedItem["status"],
      availabilitySignal:
        typeof referralDetail?.insurance_notes === "string" && referralDetail.insurance_notes.trim().length > 0
          ? `Insurance notes: ${referralDetail.insurance_notes.trim()}`
          : undefined,
      isFollowedAuthor
    } satisfies FeedItem;
  })
    .sort((a, b) => Number(Boolean(b.isFollowedAuthor)) - Number(Boolean(a.isFollowedAuthor)));
}

export async function getReferralLinksForMember(userId: string, sponsorName: string) {
  const admin = createSupabaseAdminClient();
  const appUrl = getAppUrl();
  const { data: rawInvitations } = await admin
    .from("invitations")
    .select("id, code, invited_email, max_uses, use_count, is_active, expires_at")
    .eq("invited_by", userId)
    .order("created_at", { ascending: false });

  return ((rawInvitations ?? []) as Array<Record<string, unknown>>).map((invitation) => {
    const code = String(invitation.code);
    const invitedEmail =
      typeof invitation.invited_email === "string" && invitation.invited_email.length > 0
        ? invitation.invited_email
        : undefined;
    const inviteUrl = `${appUrl}/join/apply?code=${encodeURIComponent(code)}`;
    const emailInviteHref = invitedEmail
      ? `mailto:${encodeURIComponent(invitedEmail)}?subject=${encodeURIComponent(
          "Invitation to join Austin Therapist Exchange"
        )}&body=${encodeURIComponent(
          `Hi,\n\nI'd love to invite you to join Austin Therapist Exchange.\n\nUse this referral link to apply:\n${inviteUrl}\n\nIf the link does not prefill the code, use: ${code}\n\nBest,\n${sponsorName}`
        )}`
      : undefined;

    return {
      id: String(invitation.id),
      code,
      sponsorName,
      invitedEmail,
      maxUses: Number(invitation.max_uses ?? 1),
      useCount: Number(invitation.use_count ?? 0),
      expiresAtLabel:
        invitation.expires_at && typeof invitation.expires_at === "string"
          ? `Expires ${new Date(invitation.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "No expiration",
      isActive: Boolean(invitation.is_active),
      inviteUrl,
      emailInviteHref
    };
  }) satisfies ReferralLinkSummary[];
}

export async function getEndorsementsForMember(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data: rawEndorsements } = await admin
    .from("endorsements")
    .select("id, endorser_profile_id, endorsed_profile_id, public_quote, is_public, created_at")
    .or(`endorsed_profile_id.eq.${profileId},endorser_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false });

  const endorsements = (rawEndorsements ?? []) as Array<Record<string, unknown>>;
  const relatedProfileIds = [
    ...new Set(
      endorsements.flatMap((endorsement) => [
        String(endorsement.endorser_profile_id),
        String(endorsement.endorsed_profile_id)
      ])
    )
  ];

  const { data: rawProfiles } = relatedProfileIds.length
    ? await admin.from("profiles").select("id, full_name, slug").in("id", relatedProfileIds)
    : { data: [] as unknown[] };
  const profiles = new Map(
    ((rawProfiles ?? []) as Array<Record<string, unknown>>).map((profile) => [
      String(profile.id),
      {
        name: String(profile.full_name ?? "Therapist"),
        slug: typeof profile.slug === "string" ? profile.slug : undefined
      }
    ])
  );

  return endorsements.map((endorsement) => ({
    id: String(endorsement.id),
    giverSlug: profiles.get(String(endorsement.endorser_profile_id))?.slug,
    giverName: profiles.get(String(endorsement.endorser_profile_id))?.name ?? "Therapist",
    receiverSlug: profiles.get(String(endorsement.endorsed_profile_id))?.slug,
    receiverName: profiles.get(String(endorsement.endorsed_profile_id))?.name ?? "Therapist",
    quote: String(endorsement.public_quote ?? ""),
    createdAtLabel: formatCreatedAtLabel(endorsement.created_at as string | null),
    isPublic: Boolean(endorsement.is_public)
  })) satisfies EndorsementSummary[];
}

export async function sendReferralMessage(
  senderProfileId: string,
  receiverProfileId: string,
  body: string,
  referralRequestId?: string
): Promise<ReferralMessage | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("referral_messages")
    .insert({
      sender_profile_id: senderProfileId,
      receiver_profile_id: receiverProfileId,
      referral_request_id: referralRequestId,
      body: body
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending referral message:", error);
    return null;
  }

  return {
    id: data.id,
    senderProfileId: data.sender_profile_id,
    receiverProfileId: data.receiver_profile_id,
    referralRequestId: data.referral_request_id ?? undefined,
    body: data.body,
    readAt: data.read_at ?? undefined,
    createdAt: data.created_at
  };
}

export async function getDirectReferralActivity(profileId: string): Promise<DirectReferralActivitySummary> {
  const admin = createSupabaseAdminClient();
  const { data: rawReferrals, error } = await admin
    .from("direct_referrals")
    .select("id, sender_profile_id, receiver_profile_id, client_details, status, created_at, updated_at, message_id")
    .or(`sender_profile_id.eq.${profileId},receiver_profile_id.eq.${profileId}`)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      sentCount: 0,
      receivedCount: 0,
      exchangedCount: 0,
      incoming: [],
      outgoing: []
    };
  }

  const referrals = (rawReferrals ?? []) as Array<Record<string, unknown>>;
  const messageIds = referrals
    .map((referral) => (typeof referral.message_id === "string" ? referral.message_id : null))
    .filter((value): value is string => Boolean(value));
  const counterpartIds = [
    ...new Set(
      referrals.map((referral) =>
        String(
          String(referral.sender_profile_id) === profileId
            ? referral.receiver_profile_id
            : referral.sender_profile_id
        )
      )
    )
  ];

  const { data: rawProfiles } = counterpartIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, slug, therapist_profiles(public_display_name, public_email, public_phone)")
        .in("id", counterpartIds)
    : { data: [] as unknown[] };
  const { data: rawMessages } = messageIds.length
    ? await admin.from("referral_messages").select("id, read_at").in("id", messageIds)
    : { data: [] as unknown[] };

  const profiles = new Map(
    ((rawProfiles ?? []) as Array<Record<string, unknown>>).map((profile) => {
      const tp = Array.isArray(profile.therapist_profiles)
        ? (profile.therapist_profiles[0] as Record<string, unknown> | undefined)
        : undefined;
      return [
        String(profile.id),
        {
          name: (typeof tp?.public_display_name === "string" && tp.public_display_name)
            ? tp.public_display_name
            : String(profile.full_name ?? "Clinician"),
          slug: typeof profile.slug === "string" ? profile.slug : undefined,
          phone: typeof tp?.public_phone === "string" ? tp.public_phone : undefined,
          email: typeof tp?.public_email === "string" ? tp.public_email : undefined
        }
      ];
    })
  );
  const messages = new Map(
    ((rawMessages ?? []) as Array<Record<string, unknown>>).map((message) => [
      String(message.id),
      typeof message.read_at === "string" ? message.read_at : undefined
    ])
  );

  const incoming = referrals
    .filter((referral) => String(referral.receiver_profile_id) === profileId)
    .map((referral) => {
      const details = (referral.client_details as Record<string, unknown> | null) ?? {};
      const counterpartId = String(referral.sender_profile_id);
      const counterpart = profiles.get(counterpartId);
      return {
        id: String(referral.id),
        messageId: typeof referral.message_id === "string" ? referral.message_id : undefined,
        direction: "incoming" as const,
        counterpartId,
        counterpartName: counterpart?.name ?? "Clinician",
        counterpartSlug: counterpart?.slug,
        counterpartPhone: counterpart?.phone,
        counterpartEmail: counterpart?.email,
        title: String(details.title ?? "Referral"),
        region: typeof details.regionWanted === "string" ? details.regionWanted : undefined,
        paymentModel: typeof details.paymentWanted === "string" ? getPaymentModelLabel(details.paymentWanted) : undefined,
        status: String(referral.status ?? "open") as FeedItem["status"],
        readAt: typeof referral.message_id === "string" ? messages.get(referral.message_id) : undefined,
        createdAt: String(referral.created_at ?? ""),
        createdAtLabel: formatCreatedAtLabel(referral.created_at as string | null)
      };
    });

  const outgoing = referrals
    .filter((referral) => String(referral.sender_profile_id) === profileId)
    .map((referral) => {
      const details = (referral.client_details as Record<string, unknown> | null) ?? {};
      const counterpartId = String(referral.receiver_profile_id);
      const counterpart = profiles.get(counterpartId);
      return {
        id: String(referral.id),
        direction: "outgoing" as const,
        counterpartId,
        counterpartName: counterpart?.name ?? "Clinician",
        counterpartSlug: counterpart?.slug,
        counterpartPhone: counterpart?.phone,
        counterpartEmail: counterpart?.email,
        title: String(details.title ?? "Referral"),
        region: typeof details.regionWanted === "string" ? details.regionWanted : undefined,
        paymentModel: typeof details.paymentWanted === "string" ? getPaymentModelLabel(details.paymentWanted) : undefined,
        status: String(referral.status ?? "open") as FeedItem["status"],
        readAt: typeof referral.message_id === "string" ? messages.get(referral.message_id) : undefined,
        createdAt: String(referral.created_at ?? ""),
        createdAtLabel: formatCreatedAtLabel(referral.created_at as string | null)
      };
    });

  const sentTo = new Set(outgoing.map((item) => item.counterpartId));
  const receivedFrom = new Set(incoming.map((item) => item.counterpartId));
  const exchangedCount = [...sentTo].filter((id) => receivedFrom.has(id)).length;

  return {
    sentCount: outgoing.length,
    receivedCount: incoming.length,
    exchangedCount,
    incoming,
    outgoing
  };
}

export async function getReferralMessages(
  referralRequestId: string,
  viewerProfileId: string
): Promise<ReferralMessage[]> {
  const admin = createSupabaseAdminClient();
  const { data: rawMessages, error } = await admin
    .from("referral_messages")
    .select("*")
    .eq("referral_request_id", referralRequestId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching referral messages:", error);
    return [];
  }

  // Mark messages as read if the viewer is the receiver and the message hasn't been read yet
  const unreadMessages = (rawMessages ?? []).filter(
    (message) =>
      message.receiver_profile_id === viewerProfileId && message.read_at === null
  );

  if (unreadMessages.length > 0) {
    const messageIdsToMarkRead = unreadMessages.map((message) => message.id);
    await admin
      .from("referral_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", messageIdsToMarkRead);
  }

  return (rawMessages ?? []).map((message) => ({
    id: message.id,
    senderProfileId: message.sender_profile_id,
    receiverProfileId: message.receiver_profile_id,
    referralRequestId: message.referral_request_id ?? undefined,
    body: message.body,
    readAt: message.read_at ?? undefined,
    createdAt: message.created_at
  }));
}


export async function getEndorsementCandidates(currentProfileId: string) {
  const { therapists } = await getPublicTherapists(undefined, 1000, 0);
  return therapists
    .filter((therapist) => therapist.profileId !== currentProfileId)
    .map((therapist) => ({
      profileId: therapist.profileId,
      label: therapist.displayName
    }));
}

export async function getAdminJoinRequests() {
  const admin = createSupabaseAdminClient();
  const { data: rawRequests } = await admin
    .from("join_requests")
    .select("id, full_name, email, credentials, license_number, endorsement_from_profile_id, invitation_id, status, created_at")
    .order("created_at", { ascending: false });

  const requests = (rawRequests ?? []) as Array<Record<string, unknown>>;
  const sponsorIds = [...new Set(requests.map((request) => String(request.endorsement_from_profile_id)))];
  const invitationIds = [...new Set(requests.map((request) => String(request.invitation_id)))];

  const { data: rawSponsors } = sponsorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", sponsorIds)
    : { data: [] as unknown[] };
  const sponsors = new Map(
    ((rawSponsors ?? []) as Array<Record<string, unknown>>).map((profile) => [
      String(profile.id),
      String(profile.full_name ?? "Trusted member")
    ])
  );

  const { data: rawInvitations } = invitationIds.length
    ? await admin.from("invitations").select("id, code, market_slug").in("id", invitationIds)
    : { data: [] as unknown[] };
  const invitations = new Map(
    ((rawInvitations ?? []) as Array<Record<string, unknown>>).map((invitation) => [
      String(invitation.id),
      {
        code: String(invitation.code ?? ""),
        marketSlug: String(invitation.market_slug ?? "austin-tx")
      }
    ])
  );

  return requests.map((request) => {
    const invitation = invitations.get(String(request.invitation_id));

    return {
      id: String(request.id),
      fullName: String(request.full_name ?? "Applicant"),
      email: String(request.email ?? ""),
      credentials: String(request.credentials ?? ""),
      licenseNumber:
        typeof request.license_number === "string" && request.license_number.length > 0
          ? request.license_number
          : undefined,
      marketName: invitation?.marketSlug === "austin-tx" ? "Austin" : invitation?.marketSlug ?? "Austin",
      sponsorName: sponsors.get(String(request.endorsement_from_profile_id)) ?? "Trusted member",
      referralCode: invitation?.code ?? "",
      createdAtLabel: formatCreatedAtLabel(request.created_at as string | null),
      status: String(request.status ?? "pending") as JoinRequestSummary["status"]
    } satisfies JoinRequestSummary;
  });
}

export async function getLatestJoinRequestByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data } = await admin
    .from("join_requests")
    .select("id, status, reviewed_at, rejection_reason, created_at, invitation_id, endorsement_from_profile_id, credentials")
    .ilike("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const [invitationResult, sponsorResult] = await Promise.all([
    admin
      .from("invitations")
      .select("id, code")
      .eq("id", String(data.invitation_id))
      .maybeSingle(),
    admin
      .from("profiles")
      .select("id, full_name")
      .eq("id", String(data.endorsement_from_profile_id))
      .maybeSingle()
  ]);

  return {
    id: String(data.id),
    status: String(data.status ?? "pending") as "pending" | "active" | "rejected" | "suspended",
    reviewed_at: (data.reviewed_at as string | null) ?? null,
    rejection_reason: (data.rejection_reason as string | null) ?? null,
    created_at: (data.created_at as string | null) ?? null,
    referral_code: invitationResult.data?.code ?? null,
    sponsor_name: sponsorResult.data?.full_name ?? null,
    credentials: (data.credentials as string | null) ?? null
  };
}

export async function getMemberProfileForUser(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("therapist_profiles")
    .select(
      "id, profile_id, public_display_name, credentials, title, bio, specialties, insurance_accepted, modalities, therapy_style_tags, populations, communities, neighborhoods, approach_summary, website_url, booking_url, public_email, public_phone, offers_in_person, offers_telehealth, availability_status, availability_updated_at, accepting_referrals, is_public, payment_model"
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const { therapistFields, profileFields } = await getSupplementalTherapistFields([String(data.id)], [profileId]);
  return {
    ...(data as Record<string, unknown>),
    ...therapistFields.get(String(data.id)),
    ...profileFields.get(profileId)
  } as Record<string, unknown>;
}

export function getPaymentModelLabelForUi(value: PaymentModel) {
  return getPaymentModelLabel(value);
}

export async function getFollowedClinicians(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data: rawFollows, error } = await admin
    .from("follows")
    .select("followed_profile_id, created_at")
    .eq("follower_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    return [] as FollowedClinicianSummary[];
  }

  const followedProfileIds = ((rawFollows ?? []) as Array<Record<string, unknown>>).map((follow) =>
    String(follow.followed_profile_id)
  );

  if (followedProfileIds.length === 0) {
    return [] as FollowedClinicianSummary[];
  }

  // Query therapist_profiles and profiles directly so that therapists with
  // is_public=false (filtered out of the public directory view) are still included.
  const [{ data: rawTherapistProfiles }, { data: rawProfiles }] = await Promise.all([
    admin
      .from("therapist_profiles")
      .select("profile_id, public_display_name, credentials, title, specialties, availability_status")
      .in("profile_id", followedProfileIds),
    admin
      .from("profiles")
      .select("id, slug")
      .in("id", followedProfileIds)
  ]);

  const therapistByProfileId = new Map(
    ((rawTherapistProfiles ?? []) as Array<Record<string, unknown>>).map((tp) => [String(tp.profile_id), tp])
  );
  const slugByProfileId = new Map(
    ((rawProfiles ?? []) as Array<Record<string, unknown>>).map((p) => [String(p.id), String(p.slug ?? "")])
  );

  return ((rawFollows ?? []) as Array<Record<string, unknown>>)
    .map((follow) => {
      const pid = String(follow.followed_profile_id);
      const tp = therapistByProfileId.get(pid);
      if (!tp) {
        return null;
      }

      return {
        profileId: pid,
        slug: slugByProfileId.get(pid) ?? "",
        displayName: String(tp.public_display_name ?? "Therapist"),
        title: buildTherapistTitle(tp),
        availabilityStatus: (tp.availability_status as AvailabilityStatus | null) ?? "waitlist",
        followedAtLabel: formatCreatedAtLabel(follow.created_at as string | null)
      } satisfies FollowedClinicianSummary;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function getCuratedListsForMember(ownerProfileId?: string) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("curated_lists")
    .select("id, owner_profile_id, title, description, is_public, created_at")
    .order("created_at", { ascending: false });

  if (ownerProfileId) {
    query = query.eq("owner_profile_id", ownerProfileId);
  }

  const { data: rawLists, error } = await query;

  if (error) {
    return [] as CuratedListSummary[];
  }

  const lists = (rawLists ?? []) as Array<Record<string, unknown>>;
  if (lists.length === 0) {
    return [] as CuratedListSummary[];
  }

  const ownerIds = [...new Set(lists.map((list) => String(list.owner_profile_id)))];
  const listIds = lists.map((list) => String(list.id));

  const [{ data: rawOwners }, { data: rawItems }] = await Promise.all([
    ownerIds.length ? admin.from("profiles").select("id, full_name, slug").in("id", ownerIds) : Promise.resolve({ data: [] as unknown[] }),
    listIds.length
      ? admin
          .from("curated_list_items")
          .select("id, list_id, therapist_profile_id, note, sort_order")
          .in("list_id", listIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] as unknown[] })
  ]);

  const owners = new Map(
    ((rawOwners ?? []) as Array<Record<string, unknown>>).map((owner) => [
      String(owner.id),
      {
        name: String(owner.full_name ?? "Clinician"),
        slug: typeof owner.slug === "string" ? owner.slug : undefined
      }
    ])
  );

  const therapistProfileIds = [
    ...new Set(((rawItems ?? []) as Array<Record<string, unknown>>).map((item) => String(item.therapist_profile_id)))
  ];
  const therapists = therapistProfileIds.length
    ? await admin
        .from("public_therapist_directory")
        .select("therapist_profile_id, profile_id, slug, public_display_name, credentials, title")
        .in("therapist_profile_id", therapistProfileIds)
    : { data: [] as unknown[] };

  const therapistMap = new Map(
    ((therapists.data ?? []) as Array<Record<string, unknown>>).map((therapist) => [
      String(therapist.therapist_profile_id),
      {
        therapistProfileId: String(therapist.therapist_profile_id),
        profileId: String(therapist.profile_id),
        slug: String(therapist.slug ?? ""),
        displayName: String(therapist.public_display_name ?? "Therapist"),
        title: buildTherapistTitle(therapist)
      }
    ])
  );

  const itemsByList = new Map<string, CuratedListSummary["items"]>();
  for (const item of (rawItems ?? []) as Array<Record<string, unknown>>) {
    const listId = String(item.list_id);
    const therapist = therapistMap.get(String(item.therapist_profile_id));
    if (!therapist) {
      continue;
    }
    const current = itemsByList.get(listId) ?? [];
    current.push({
      ...therapist,
      note: typeof item.note === "string" ? item.note : undefined
    });
    itemsByList.set(listId, current);
  }

  return lists.map((list) => ({
    id: String(list.id),
    title: String(list.title ?? "Untitled list"),
    description: String(list.description ?? ""),
    ownerProfileId: String(list.owner_profile_id),
    ownerName: owners.get(String(list.owner_profile_id))?.name ?? "Clinician",
    ownerSlug: owners.get(String(list.owner_profile_id))?.slug,
    isPublic: Boolean(list.is_public),
    createdAtLabel: formatCreatedAtLabel(list.created_at as string | null),
    items: itemsByList.get(String(list.id)) ?? []
  })) satisfies CuratedListSummary[];
}

export async function getPublicGroups() {
  const admin = createSupabaseAdminClient();

  const { data: rawGroups } = await admin
    .from("groups")
    .select("id, slug, name, description, visibility, market_slug")
    .eq("visibility", "public")
    .order("created_at", { ascending: true });

  const groups = (rawGroups ?? []) as Array<Record<string, unknown>>;
  const groupIds = groups.map((g) => String(g.id));

  const { data: rawCounts } = groupIds.length
    ? await admin.from("group_memberships").select("group_id").in("group_id", groupIds)
    : { data: [] as unknown[] };

  const countsByGroup = new Map<string, number>();
  for (const row of (rawCounts ?? []) as Array<Record<string, unknown>>) {
    const gid = String(row.group_id);
    countsByGroup.set(gid, (countsByGroup.get(gid) ?? 0) + 1);
  }

  return groups.map((group) => ({
    id: String(group.id),
    slug: String(group.slug),
    name: String(group.name ?? "Untitled group"),
    description: String(group.description ?? ""),
    visibility: "public" as GroupSummary["visibility"],
    memberCount: countsByGroup.get(String(group.id)) ?? 0,
    marketName: String(group.market_slug) === "austin-tx" ? "Austin" : String(group.market_slug ?? "Austin")
  })) satisfies GroupSummary[];
}

export async function getMemberGroups(profileId: string) {
  const admin = createSupabaseAdminClient();

  const { data: memberGroupIds } = await admin
    .from("group_memberships")
    .select("group_id")
    .eq("profile_id", profileId);

  const memberIds = (memberGroupIds ?? []).map((row) => String((row as Record<string, unknown>).group_id));

  const { data: rawGroups } = await admin
    .from("groups")
    .select("id, slug, name, description, visibility, market_slug")
    .or(`visibility.eq.public${memberIds.length ? `,id.in.(${memberIds.join(",")})` : ""}`);

  const groups = (rawGroups ?? []) as Array<Record<string, unknown>>;
  const groupIds = groups.map((g) => String(g.id));

  const { data: rawCounts } = groupIds.length
    ? await admin.from("group_memberships").select("group_id").in("group_id", groupIds)
    : { data: [] as unknown[] };

  const countsByGroup = new Map<string, number>();
  for (const row of (rawCounts ?? []) as Array<Record<string, unknown>>) {
    const gid = String(row.group_id);
    countsByGroup.set(gid, (countsByGroup.get(gid) ?? 0) + 1);
  }

  return groups.map((group) => ({
    id: String(group.id),
    slug: String(group.slug),
    name: String(group.name ?? "Untitled group"),
    description: String(group.description ?? ""),
    visibility: (group.visibility === "public" ? "public" : "private_member_only") as GroupSummary["visibility"],
    memberCount: countsByGroup.get(String(group.id)) ?? 0,
    marketName: String(group.market_slug) === "austin-tx" ? "Austin" : String(group.market_slug ?? "Austin")
  })) satisfies GroupSummary[];
}

export async function getGroupBySlug(slug: string) {
  const admin = createSupabaseAdminClient();

  const { data: rawGroup } = await admin
    .from("groups")
    .select("id, slug, name, description, visibility, market_slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!rawGroup) return null;

  const group = rawGroup as Record<string, unknown>;

  const { data: rawCount } = await admin
    .from("group_memberships")
    .select("id")
    .eq("group_id", String(group.id));

  return {
    id: String(group.id),
    slug: String(group.slug),
    name: String(group.name ?? "Untitled group"),
    description: String(group.description ?? ""),
    visibility: (group.visibility === "public" ? "public" : "private_member_only") as GroupSummary["visibility"],
    memberCount: (rawCount ?? []).length,
    marketName: String(group.market_slug) === "austin-tx" ? "Austin" : String(group.market_slug ?? "Austin")
  } satisfies GroupSummary;
}

export async function getAdminModerationReports() {
  const admin = createSupabaseAdminClient();

  const { data: rawReports } = await admin
    .from("moderation_reports")
    .select("id, reporter_profile_id, target_type, reason, status, created_at")
    .order("created_at", { ascending: false });

  const reports = (rawReports ?? []) as Array<Record<string, unknown>>;
  const reporterIds = [...new Set(reports.map((r) => String(r.reporter_profile_id)).filter(Boolean))];

  const { data: rawReporters } = reporterIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", reporterIds)
    : { data: [] as unknown[] };

  const reporters = new Map(
    ((rawReporters ?? []) as Array<Record<string, unknown>>).map((p) => [String(p.id), String(p.full_name ?? "Member")])
  );

  return reports.map((report) => ({
    id: String(report.id),
    targetType: String(report.target_type ?? "post") as ModerationReportSummary["targetType"],
    reason: String(report.reason ?? ""),
    reporterName: reporters.get(String(report.reporter_profile_id)) ?? "Anonymous",
    createdAtLabel: formatCreatedAtLabel(report.created_at as string | null),
    status: (report.status ?? "open") as ModerationReportSummary["status"]
  })) satisfies ModerationReportSummary[];
}
