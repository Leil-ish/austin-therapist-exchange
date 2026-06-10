import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDisplayName(user: User) {
  const metadataName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name);

  if (metadataName) {
    return metadataName;
  }

  return user.email?.split("@")[0] ?? "New Therapist";
}

async function getLatestJoinRequestForUser(user: User) {
  if (!user.email) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("join_requests")
    .select("id, full_name, credentials, invitation_id, status, reviewed_by, reviewed_at, grant_referral_access")
    .ilike("email", user.email.trim().toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as
    | {
        id: string;
        full_name?: string | null;
        credentials?: string | null;
        invitation_id: string;
        grant_referral_access?: boolean | null;
        status: "pending" | "active" | "rejected" | "suspended";
        reviewed_by?: string | null;
        reviewed_at?: string | null;
      }
    | null;
}

async function getInvitationCode(invitationId?: string | null) {
  if (!invitationId) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("id, code")
    .eq("id", invitationId)
    .maybeSingle();

  return data as { id: string; code: string } | null;
}

export async function syncMembershipStateForUser(user: User) {
  const admin = createSupabaseAdminClient();
  const joinRequest = await getLatestJoinRequestForUser(user);

  if (!joinRequest) {
    return;
  }

  const invitation = await getInvitationCode(joinRequest.invitation_id);
  const nextState = joinRequest.status;
  const nextName = joinRequest.full_name?.trim() || getDisplayName(user);

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, membership_state, invite_code_used")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    return;
  }

  const profilePatch: Record<string, unknown> = {
    full_name: nextName,
    invite_code_used: invitation?.code ?? existingProfile.invite_code_used ?? null,
    can_issue_referrals: nextState === "active" ? Boolean(joinRequest.grant_referral_access) : false
  };

  if (existingProfile.membership_state !== nextState) {
    profilePatch.membership_state = nextState;
  }

  if (nextState === "active") {
    profilePatch.approved_at = joinRequest.reviewed_at ?? new Date().toISOString();
    profilePatch.approved_by = joinRequest.reviewed_by ?? null;
  }

  if (nextState === "rejected") {
    profilePatch.rejected_at = joinRequest.reviewed_at ?? new Date().toISOString();
  }

  if (nextState === "suspended") {
    profilePatch.suspended_at = joinRequest.reviewed_at ?? new Date().toISOString();
  }

  await admin.from("profiles").update(profilePatch).eq("id", user.id);

  const therapistPatch: Record<string, unknown> = {};
  if (joinRequest.credentials?.trim()) {
    therapistPatch.credentials = joinRequest.credentials.trim();
  }
  if (nextName) {
    therapistPatch.public_display_name = nextName;
  }
  if (Object.keys(therapistPatch).length > 0) {
    await admin.from("therapist_profiles").update(therapistPatch).eq("profile_id", user.id);
  }

  if (nextState === "active" && joinRequest.invitation_id) {
    await admin
      .from("invitations")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq("id", joinRequest.invitation_id)
      .is("accepted_by", null);
  }
}

// First successful auth should materialize the app-level profile rows.
// New therapists still default to `pending` until your invite/admin workflow activates them.
export async function bootstrapProfileForUser(user: User) {
  const admin = createSupabaseAdminClient();
  const joinRequest = await getLatestJoinRequestForUser(user);
  const displayName = getDisplayName(user);
  const nextName = joinRequest?.full_name?.trim() || displayName;
  const invitation = joinRequest ? await getInvitationCode(joinRequest.invitation_id) : null;
  const baseSlug = slugify(displayName) || `therapist-${user.id.slice(0, 8)}`;
  const fallbackSlug = `${baseSlug}-${user.id.slice(0, 8)}`;

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    await admin.from("profiles").insert({
      id: user.id,
      role: "therapist",
      membership_state: joinRequest?.status ?? "pending",
      full_name: nextName,
      slug: fallbackSlug,
      country_code: "US",
      market_slug: "austin-tx",
      invite_code_used: invitation?.code ?? null,
      approved_at: joinRequest?.status === "active" ? joinRequest.reviewed_at ?? new Date().toISOString() : null,
      approved_by: joinRequest?.status === "active" ? joinRequest.reviewed_by ?? null : null,
      rejected_at: joinRequest?.status === "rejected" ? joinRequest.reviewed_at ?? new Date().toISOString() : null,
      suspended_at: joinRequest?.status === "suspended" ? joinRequest.reviewed_at ?? new Date().toISOString() : null
    });
  }

  const { data: existingTherapistProfile } = await admin
    .from("therapist_profiles")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!existingTherapistProfile) {
    await admin.from("therapist_profiles").insert({
      profile_id: user.id,
      public_display_name: nextName,
      credentials: joinRequest?.credentials?.trim() || null,
      is_public: false
    });
  }

  await syncMembershipStateForUser(user);
}
