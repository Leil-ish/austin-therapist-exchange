"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMember } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AvailabilityStatus, PaymentModel, PostType } from "@/types";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseCommaSeparatedList(value: FormDataEntryValue | null, limit?: number) {
  const items = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

function parseLineSeparatedList(value: FormDataEntryValue | null, limit?: number) {
  const items = String(value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

function buildReferralCode() {
  return `ATX-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function buildStructuredReferralSummary(formData: FormData) {
  const lines = [
    buildStructuredLine("Region", formData.get("regionWanted"), formData.get("regionPreference")),
    buildStructuredLine("Presenting issues", formData.get("presentingIssues"), formData.get("presentingIssuesPreference")),
    buildStructuredLine("Client type / population", formData.get("populationsWanted"), formData.get("populationsPreference")),
    buildStructuredLine("Modality", formData.get("modalitiesWanted"), formData.get("modalitiesPreference")),
    buildStructuredLine("Insurance", formData.get("insuranceWanted"), formData.get("insurancePreference")),
    buildStructuredLine("Payment model", formData.get("paymentWanted"), formData.get("paymentPreference")),
    buildStructuredLine("Care format", formData.get("formatWanted"), formData.get("formatPreference")),
    buildSimpleLine("Level of care", formData.get("levelOfCare")),
    buildSimpleLine("Urgency", formData.get("urgencyLevel")),
    // New structured fields
    buildSimpleLine("Structured Level of Care", formData.get("levelOfCare")),
    buildSimpleLine("Structured Client Type", formData.get("clientType")),
    buildSimpleLine("Structured Presenting Issue", formData.get("presentingIssue")),
    buildSimpleLine("Structured Payment", formData.get("payment")),
    buildSimpleLine("Structured Location", formData.get("location")),
    buildSimpleLine("Private pay max", formData.get("privatePayMax")),
    buildSimpleLine("Additional Notes", formData.get("additionalNotes"))
  ].filter(Boolean);

  return lines.join("\n");
}

function parseClientDetailsFromFormData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    regionWanted: String(formData.get("regionWanted") ?? "").trim(),
    regionPreference: String(formData.get("regionPreference") ?? "").trim(),
    presentingIssues: String(formData.get("presentingIssues") ?? "").trim(),
    populationsWanted: String(formData.get("populationsWanted") ?? "").trim(),
    modalitiesWanted: String(formData.get("modalitiesWanted") ?? "").trim(),
    insuranceWanted: String(formData.get("insuranceWanted") ?? "").trim(),
    paymentWanted: String(formData.get("paymentWanted") ?? "").trim(),
    formatWanted: String(formData.get("formatWanted") ?? "").trim(),
    levelOfCare: String(formData.get("levelOfCare") ?? "").trim(),
    urgencyLevel: String(formData.get("urgencyLevel") ?? "").trim(),
    // New structured fields
    structuredLevelOfCare: String(formData.get("levelOfCare") ?? "").trim(),
    structuredClientType: String(formData.get("clientType") ?? "").trim(),
    structuredPresentingIssue: String(formData.get("presentingIssue") ?? "").trim(),
    structuredPayment: String(formData.get("payment") ?? "").trim(),
    structuredLocation: String(formData.get("location") ?? "").trim(),
    structuredPrivatePayMax: String(formData.get("privatePayMax") ?? "").trim(),
    structuredAdditionalNotes: String(formData.get("additionalNotes") ?? "").trim()
  };
}

function buildStructuredLine(label: string, value: FormDataEntryValue | null, preference: FormDataEntryValue | null) {
  const text = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");

  if (!text) {
    return null;
  }

  const pref = String(preference ?? "").trim();
  const suffix = pref === "dealbreaker" ? " (dealbreaker)" : pref === "nice_to_have" ? " (nice-to-have)" : "";
  return `${label}: ${text}${suffix}`;
}

function buildSimpleLine(label: string, value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? `${label}: ${text}` : null;
}

export async function createMemberPost(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const type = String(formData.get("type") ?? "referral_request").trim() as PostType;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const insuranceNotes = String(formData.get("insurance") ?? "").trim();
  const styleNotes = String(formData.get("style") ?? "").trim();
  const structuredSummary = buildStructuredReferralSummary(formData);
  const postBody = structuredSummary ? `${structuredSummary}\n\nDetails:\n${body}` : body;

  if (!title || !body) {
    redirect("/member/posts/new?error=missing-fields");
  }

  const { data: post, error: postError } = await admin
    .from("posts")
    .insert({
      author_profile_id: session.userId,
      kind: type,
      title,
      body: postBody,
      market_slug: "austin-tx",
      is_private: true,
      is_published: true
    })
    .select("id")
    .single();

  if (postError || !post) {
    redirect("/member/posts/new?error=save-failed");
  }

  if (type === "referral_request") {
    const { error: referralError } = await admin.from("referral_requests").insert({
      post_id: post.id,
      insurance_notes: insuranceNotes || null,
      urgency: styleNotes || null,
      status: "open"
    });

    if (referralError) {
      await admin.from("posts").delete().eq("id", post.id);
      redirect("/member/posts/new?error=save-failed");
    }
  }

  if (type === "consultation_request") {
    const { error: consultationError } = await admin.from("consultation_requests").insert({
      post_id: post.id,
      topic: styleNotes || null,
      compensation_notes: insuranceNotes || null
    });

    if (consultationError) {
      await admin.from("posts").delete().eq("id", post.id);
      redirect("/member/posts/new?error=save-failed");
    }
  }

  if (type === "job") {
    const { error: jobError } = await admin.from("jobs").insert({
      post_id: post.id,
      organization_name: title,
      compensation_summary: insuranceNotes || null,
      location_summary: styleNotes || null
    });

    if (jobError) {
      await admin.from("posts").delete().eq("id", post.id);
      redirect("/member/posts/new?error=save-failed");
    }
  }

  revalidatePath("/member");
  revalidatePath("/member/feed");
  redirect("/member/feed?created=1");
}

function autoGenerateReferralTitle(formData: FormData) {
  const presentingIssue = String(formData.get("presentingIssue") ?? "").trim();
  const levelOfCare = String(formData.get("levelOfCare") ?? "").trim();
  const clientType = String(formData.get("clientType") ?? "").trim();
  const first = presentingIssue || levelOfCare || clientType;
  return first ? `${first} referral` : "Client referral";
}

export async function sendDirectReferral(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const receiverProfileId = String(formData.get("receiverProfileId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/member").trim();
  const clientDetails = parseClientDetailsFromFormData(formData);

  // Auto-generate title from structured criteria; body is optional
  const title = String(formData.get("title") ?? "").trim() || autoGenerateReferralTitle(formData);
  const body = String(formData.get("body") ?? "").trim();
  const structured = buildStructuredReferralSummary(formData);
  const messageBody = [structured, body ? `\nNotes:\n${body}` : ""].filter(Boolean).join("") || title;

  if (!receiverProfileId || receiverProfileId === session.userId) {
    redirect(`${returnTo}?directReferralError=1` as never);
  }

  const { data: message, error: messageError } = await admin
    .from("referral_messages")
    .insert({
      sender_profile_id: session.userId,
      receiver_profile_id: receiverProfileId,
      body: messageBody
    })
    .select("id")
    .single();

  if (messageError || !message) {
    redirect(`${returnTo}?directReferralError=1` as never);
  }

  const { error: referralError } = await admin.from("direct_referrals").insert({
    sender_profile_id: session.userId,
    receiver_profile_id: receiverProfileId,
    client_details: { ...clientDetails, title },
    status: "open",
    message_id: message.id
  });

  if (referralError) {
    await admin.from("referral_messages").delete().eq("id", message.id);
    redirect(`${returnTo}?directReferralError=1` as never);
  }

  revalidatePath("/member");
  revalidatePath("/member/feed");
  revalidatePath("/member/referrals");
  redirect(`${returnTo}?directReferralSent=1` as never);
}

export type ReferralSendState = { status: "idle" } | { status: "success" } | { status: "error" };

export async function sendDirectReferralInline(
  _prevState: ReferralSendState,
  formData: FormData
): Promise<ReferralSendState> {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const receiverProfileId = String(formData.get("receiverProfileId") ?? "").trim();
  if (!receiverProfileId || receiverProfileId === session.userId) {
    return { status: "error" };
  }

  const title = autoGenerateReferralTitle(formData);
  const structured = buildStructuredReferralSummary(formData);
  const messageBody = structured || title;
  const levelOfCare = String(formData.get("levelOfCare") ?? "").trim();
  const clientType = String(formData.get("clientType") ?? "").trim();
  const presentingIssue = String(formData.get("presentingIssue") ?? "").trim();
  const payment = String(formData.get("payment") ?? "").trim();
  const additionalNotes = String(formData.get("additionalNotes") ?? "").trim();
  const clientDetails = parseClientDetailsFromFormData(formData);

  const { data: message, error: messageError } = await admin
    .from("referral_messages")
    .insert({ sender_profile_id: session.userId, receiver_profile_id: receiverProfileId, body: messageBody })
    .select("id")
    .single();

  if (messageError || !message) return { status: "error" };

  const { error: referralError } = await admin.from("direct_referrals").insert({
    sender_profile_id: session.userId,
    receiver_profile_id: receiverProfileId,
    client_details: { ...clientDetails, title },
    status: "open",
    message_id: message.id
  });

  if (referralError) {
    await admin.from("referral_messages").delete().eq("id", message.id);
    return { status: "error" };
  }

  revalidatePath("/member/referrals");
  return { status: "success" };
}

export async function markReferralsRead(messageIds: string[]) {
  if (!messageIds.length) return;
  const session = await requireMember();
  const admin = createSupabaseAdminClient();
  await admin
    .from("referral_messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", messageIds)
    .eq("receiver_profile_id", session.userId)
    .is("read_at", null);
}

export type JoinApplicationState =
  | { status: "idle" }
  | { status: "error"; code: string; message: string }
  | { status: "success" };

export async function submitJoinApplicationInline(
  _prevState: JoinApplicationState,
  formData: FormData
): Promise<JoinApplicationState> {
  const admin = createSupabaseAdminClient();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const credentials = String(formData.get("credentials") ?? "").trim();
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const referralCode = String(formData.get("referralCode") ?? "").trim().toUpperCase();
  const note = String(formData.get("note") ?? "").trim();

  if (!fullName || !email || !credentials) {
    return { status: "error", code: "missing-fields", message: "Please fill in your name, email, and credentials." };
  }

  if (!referralCode) {
    return { status: "error", code: "missing-code", message: "A referral code is required to apply. Ask a current member for their code." };
  }

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, code, invited_by, invited_email, is_active, use_count, max_uses, expires_at")
    .eq("code", referralCode)
    .maybeSingle();

  if (!invitation) {
    return { status: "error", code: "invalid-code", message: "That referral code could not be found. Check the code and try again." };
  }

  const isExpired =
    typeof invitation.expires_at === "string" && new Date(invitation.expires_at).getTime() < Date.now();

  if (!invitation.is_active || invitation.use_count >= invitation.max_uses || isExpired) {
    return { status: "error", code: "expired-code", message: "That referral code is no longer active. Ask the member for a fresh one." };
  }

  if (invitation.invited_email && normalizeEmail(invitation.invited_email) !== email) {
    return { status: "error", code: "email-mismatch", message: "This code was reserved for a different email address." };
  }

  const { data: existingRequest } = await admin
    .from("join_requests")
    .select("id, status")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequest?.status === "pending" || existingRequest?.status === "active") {
    return { status: "error", code: "already-submitted", message: "An active or pending application already exists for this email." };
  }

  const { error } = await admin.from("join_requests").insert({
    email,
    full_name: fullName,
    city: "Austin",
    state_region: "TX",
    market_slug: "austin-tx",
    credentials,
    license_number: licenseNumber || null,
    website_url: websiteUrl || null,
    note: note || null,
    endorsement_from_profile_id: invitation.invited_by,
    invitation_id: invitation.id,
    status: "pending"
  });

  if (error) {
    return { status: "error", code: "submit-failed", message: "We couldn't submit your application. Please try again." };
  }

  revalidatePath("/admin/join-requests");
  return { status: "success" };
}

export async function submitJoinApplication(formData: FormData) {
  const admin = createSupabaseAdminClient();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const credentials = String(formData.get("credentials") ?? "").trim();
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const referralCode = String(formData.get("referralCode") ?? "").trim().toUpperCase();
  const note = String(formData.get("note") ?? "").trim();

  if (!fullName || !email || !credentials || !referralCode) {
    redirect("/join/apply?error=missing-fields");
  }

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, code, invited_by, invited_email, is_active, use_count, max_uses, expires_at")
    .eq("code", referralCode)
    .maybeSingle();

  if (!invitation) {
    redirect("/join/apply?error=invalid-code");
  }

  const isExpired =
    typeof invitation.expires_at === "string" && new Date(invitation.expires_at).getTime() < Date.now();

  if (!invitation.is_active || invitation.use_count >= invitation.max_uses || isExpired) {
    redirect("/join/apply?error=expired-code");
  }

  if (invitation.invited_email && normalizeEmail(invitation.invited_email) !== email) {
    redirect("/join/apply?error=email-mismatch");
  }

  const { data: existingRequest } = await admin
    .from("join_requests")
    .select("id, status")
    .ilike("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequest?.status === "pending" || existingRequest?.status === "active") {
    redirect("/join/apply?error=already-submitted");
  }

  const { error } = await admin.from("join_requests").insert({
    email,
    full_name: fullName,
    city: "Austin",
    state_region: "TX",
    market_slug: "austin-tx",
    credentials,
    license_number: licenseNumber || null,
    website_url: websiteUrl || null,
    note: note || null,
    endorsement_from_profile_id: invitation.invited_by,
    invitation_id: invitation.id,
    status: "pending"
  });

  if (error) {
    redirect("/join/apply?error=submit-failed");
  }

  revalidatePath("/admin/join-requests");
  redirect("/join/apply?submitted=1");
}

export async function createReferralLink(formData: FormData) {
  const session = await requireMember();

  if (!session.canIssueReferrals) {
    redirect("/member/referrals?error=not-allowed");
  }

  const admin = createSupabaseAdminClient();
  const invitedEmail = normalizeEmail(String(formData.get("invitedEmail") ?? ""));
  const maxUses = Number(formData.get("maxUses") ?? "1");

  if (Number.isNaN(maxUses) || maxUses < 1) {
    redirect("/member/referrals?error=invalid-link");
  }

  const { error } = await admin.from("invitations").insert({
    code: buildReferralCode(),
    invited_email: invitedEmail || null,
    invited_by: session.userId,
    max_uses: maxUses,
    market_slug: "austin-tx",
    is_active: true,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
  });

  if (error) {
    redirect("/member/referrals?error=create-failed");
  }

  revalidatePath("/member/referrals");
  redirect("/member/referrals?created=1");
}

export async function saveMemberProfile(formData: FormData) {
  const session = await requireMember();
  const supabase = await createSupabaseServerClient();

  const publicDisplayName = String(formData.get("publicDisplayName") ?? "").trim();
  const credentials = String(formData.get("credentials") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const approachSummary = String(formData.get("approachSummary") ?? "").trim();
  const publicEmail = normalizeEmail(String(formData.get("publicEmail") ?? ""));
  const publicPhone = String(formData.get("publicPhone") ?? "").trim();
  const specialties = parseCommaSeparatedList(formData.get("specialties"), 5);
  const neighborhoods = parseCommaSeparatedList(formData.get("neighborhoods"), 3);
  const communities = (formData.getAll("communities") as string[]).filter(Boolean);
  const insuranceAccepted = parseCommaSeparatedList(formData.get("insuranceAccepted"), 5);
  const featuredLinks = parseLineSeparatedList(formData.get("featuredLinks"), session.membershipTier === "premium" ? 5 : 2);
  const offerings = parseLineSeparatedList(formData.get("offerings"), session.membershipTier === "premium" ? 8 : 0);
  const availabilityStatus = String(formData.get("availabilityStatus") ?? "waitlist").trim() as AvailabilityStatus;
  const paymentModel = String(formData.get("paymentModel") ?? "both").trim() as PaymentModel;
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const bookingUrl = String(formData.get("bookingUrl") ?? "").trim();
  const offersInPerson = formData.get("offersInPerson") === "on";
  const offersTelehealth = formData.get("offersTelehealth") === "on";
  const isPublic = formData.get("isPublic") === "on";

  if (!publicDisplayName || !credentials || !bio || specialties.length === 0 || (!offersInPerson && !offersTelehealth)) {
    redirect("/member/profile?error=missing-fields");
  }

  const { error: therapistError } = await supabase
    .from("therapist_profiles")
    .update({
      public_display_name: publicDisplayName,
      credentials,
      headline: headline || null,
      bio,
      approach_summary: approachSummary || null,
      public_email: publicEmail || null,
      public_phone: publicPhone || null,
      specialties,
      neighborhoods,
      communities,
      insurance_accepted: insuranceAccepted,
      featured_links: featuredLinks,
      offerings: session.membershipTier === "premium" ? offerings : [],
      availability_status: availabilityStatus,
      offers_in_person: offersInPerson,
      offers_telehealth: offersTelehealth,
      accepting_referrals: availabilityStatus !== "full",
      payment_model: paymentModel,
      website_url: websiteUrl || null,
      booking_url: bookingUrl || null,
      is_public: isPublic
    })
    .eq("profile_id", session.userId);

  if (therapistError) {
    redirect("/member/profile?error=save-failed");
  }

  await supabase
    .from("profiles")
    .update({
      full_name: publicDisplayName,
      city: "Austin",
      state_region: "TX"
    })
    .eq("id", session.userId);

  revalidatePath("/member/profile");
  revalidatePath("/member");
  revalidatePath("/directory");
  redirect("/member/profile?saved=1");
}

export async function createEndorsement(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const endorsedProfileId = String(formData.get("endorsedProfileId") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const isPublic = formData.get("isPublic") === "on";

  if (!endorsedProfileId || !quote || endorsedProfileId === session.userId) {
    redirect("/member/endorsements?error=invalid-endorsement");
  }

  const { data: therapistProfile } = await admin
    .from("therapist_profiles")
    .select("id")
    .eq("profile_id", endorsedProfileId)
    .maybeSingle();

  if (!therapistProfile) {
    redirect("/member/endorsements?error=missing-target");
  }

  const { error } = await admin.from("endorsements").upsert(
    {
      therapist_profile_id: therapistProfile.id,
      endorsed_profile_id: endorsedProfileId,
      endorser_profile_id: session.userId,
      public_quote: quote,
      is_public: isPublic
    },
    {
      onConflict: "endorsed_profile_id,endorser_profile_id"
    }
  );

  if (error) {
    redirect("/member/endorsements?error=save-failed");
  }

  revalidatePath("/member/endorsements");
  revalidatePath("/directory");
  redirect("/member/endorsements?saved=1");
}

export async function followClinician(followedProfileId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  if (!followedProfileId || followedProfileId === session.userId) {
    return { ok: false, error: "Invalid therapist." };
  }

  const { error } = await admin.from("follows").insert({
    follower_profile_id: session.userId,
    followed_profile_id: followedProfileId
  });

  // 23505 = unique_violation: already following — treat as success
  if (error && error.code !== "23505") {
    return { ok: false, error: "Could not save. Please try again." };
  }

  revalidatePath("/directory");
  revalidatePath("/member");
  revalidatePath("/member/feed");
  revalidatePath("/member/following");
  revalidatePath("/member/network");
  return { ok: true };
}

export async function unfollowClinician(followedProfileId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  if (!followedProfileId) {
    return { ok: false, error: "Invalid therapist." };
  }

  const { error } = await admin
    .from("follows")
    .delete()
    .eq("follower_profile_id", session.userId)
    .eq("followed_profile_id", followedProfileId);

  if (error) {
    return { ok: false, error: "Could not remove. Please try again." };
  }

  revalidatePath("/directory");
  revalidatePath("/member");
  revalidatePath("/member/feed");
  revalidatePath("/member/following");
  revalidatePath("/member/network");
  return { ok: true };
}

export async function saveCuratedList(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  if (session.membershipTier !== "premium") {
    redirect("/member/lists?error=premium-required" as never);
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const isPublic = formData.get("isPublic") === "on";
  const noteA = String(formData.get("noteA") ?? "").trim();
  const noteB = String(formData.get("noteB") ?? "").trim();
  const noteC = String(formData.get("noteC") ?? "").trim();
  const profileIds = [formData.get("profileA"), formData.get("profileB"), formData.get("profileC")]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  if (!title || profileIds.length === 0) {
    redirect("/member/lists?error=missing-fields" as never);
  }

  const { data: therapistProfiles, error: profileError } = await admin
    .from("therapist_profiles")
    .select("id, profile_id")
    .in("profile_id", profileIds);

  if (profileError || !therapistProfiles || therapistProfiles.length === 0) {
    redirect("/member/lists?error=save-failed" as never);
  }

  const { data: curatedList, error: listError } = await admin
    .from("curated_lists")
    .insert({
      owner_profile_id: session.userId,
      title,
      description: description || null,
      is_public: isPublic
    })
    .select("id")
    .single();

  if (listError || !curatedList) {
    redirect("/member/lists?error=save-failed" as never);
  }

  const notes = [noteA, noteB, noteC];
  const therapistByProfileId = new Map(
    therapistProfiles.map((profile) => [String(profile.profile_id), String(profile.id)])
  );

  const items = profileIds
    .map((profileId, index) => {
      const therapistProfileId = therapistByProfileId.get(profileId);
      if (!therapistProfileId) {
        return null;
      }

      return {
        list_id: curatedList.id,
        therapist_profile_id: therapistProfileId,
        note: notes[index] || null,
        sort_order: index
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const { error: itemError } = await admin.from("curated_list_items").insert(items);

  if (itemError) {
    await admin.from("curated_lists").delete().eq("id", curatedList.id);
    redirect("/member/lists?error=save-failed" as never);
  }

  revalidatePath("/member");
  revalidatePath("/member/lists");
  revalidatePath("/directory");
  redirect("/member/lists?saved=1" as never);
}

export async function updateAvatarUrl(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (!avatarUrl) {
    return { error: "Missing avatar URL" };
  }

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", session.userId);

  if (error) {
    return { error: "Failed to save avatar" };
  }

  revalidatePath("/member/profile");
  revalidatePath("/directory");
  return { success: true };
}

// ── Case-based referral logging ───────────────────────────────────────────────

export type LogReferralContactResult =
  | { ok: true; caseId: string; clientReference: string }
  | { ok: false; error: string };

export async function logReferralContact(input: {
  caseId?: string;
  clientReference?: string;
  criteria: {
    levelOfCare: string;
    urgency: string;
    clientType: string;
    presentingIssue: string;
    payment: string;
    location: string;
    insurance: string;
  };
  referredProfileId: string;
  contactMethod?: "email" | "manual";
}): Promise<LogReferralContactResult> {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  let caseId = input.caseId;
  let clientReference = "";

  if (!caseId) {
    if (input.clientReference) {
      clientReference = input.clientReference;
    } else {
      const { mintReferralCode } = await import("@/lib/referral-code");
      clientReference = mintReferralCode();
    }
    const { data: newCase, error: caseError } = await admin
      .from("client_cases")
      .insert({
        owner_profile_id: session.userId,
        client_reference: clientReference,
        level_of_care: input.criteria.levelOfCare || null,
        presenting_issue: input.criteria.presentingIssue || null,
        client_type: input.criteria.clientType || null,
        payment_model: input.criteria.payment || null,
        insurance: input.criteria.insurance || null,
        neighborhood: input.criteria.location || null,
        urgency: input.criteria.urgency || null,
        status: "open",
      })
      .select("id, client_reference")
      .single();

    if (caseError || !newCase) {
      return { ok: false, error: caseError?.message ?? "Failed to create case" };
    }
    caseId = newCase.id as string;
    clientReference = newCase.client_reference as string;
  } else {
    const { data: existing } = await admin
      .from("client_cases")
      .select("client_reference")
      .eq("id", caseId)
      .eq("owner_profile_id", session.userId)
      .single();
    clientReference = (existing?.client_reference as string | undefined) ?? "";
  }

  const { error: referralError } = await admin.from("case_referrals").insert({
    case_id: caseId,
    owner_profile_id: session.userId,
    referred_profile_id: input.referredProfileId,
    contact_method: input.contactMethod ?? "email",
    status: "open",
  });

  if (referralError && referralError.code !== "23505") {
    return { ok: false, error: referralError.message };
  }

  revalidatePath("/member/network");
  return { ok: true, caseId, clientReference };
}

export type UpdateReferralResponseResult = { ok: true } | { ok: false; error: string };

export async function updateReferralResponse(
  caseReferralId: string,
  status: "open" | "accepted" | "declined" | "closed" | "completed"
): Promise<UpdateReferralResponseResult> {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const { data: row, error: fetchError } = await admin
    .from("case_referrals")
    .select("id, case_id, owner_profile_id")
    .eq("id", caseReferralId)
    .eq("owner_profile_id", session.userId)
    .single();

  if (fetchError || !row) {
    return { ok: false, error: "Not found or not authorized" };
  }

  const { error: updateError } = await admin
    .from("case_referrals")
    .update({
      status,
      responded_at: status !== "open" ? new Date().toISOString() : null,
    })
    .eq("id", caseReferralId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // When placed or accepting: move parent case to "placed" and close other open referrals.
  if (status === "completed" || status === "accepted") {
    await admin
      .from("client_cases")
      .update({ status: "placed" })
      .eq("id", row.case_id as string)
      .eq("owner_profile_id", session.userId);

    await admin
      .from("case_referrals")
      .update({ status: "closed", responded_at: new Date().toISOString() })
      .eq("case_id", row.case_id as string)
      .eq("status", "open")
      .neq("id", caseReferralId);
  }

  revalidatePath("/member/network");
  return { ok: true };
}

export type LogReferralContactsResult =
  | { ok: true; caseId: string; clientReference: string; loggedCount: number }
  | { ok: false; error: string };

export async function logReferralContacts(input: {
  caseId?: string;
  clientReference: string;
  criteria: {
    levelOfCare: string;
    urgency: string;
    clientType: string;
    presentingIssue: string;
    payment: string;
    location: string;
    insurance: string;
  };
  referredProfileIds: string[];
  contactMethod?: "email" | "manual";
}): Promise<LogReferralContactsResult> {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  if (!input.referredProfileIds.length) {
    return { ok: false, error: "No profiles to log" };
  }

  let caseId = input.caseId;
  let clientReference = input.clientReference;

  if (!caseId) {
    const { data: newCase, error: caseError } = await admin
      .from("client_cases")
      .insert({
        owner_profile_id: session.userId,
        client_reference: clientReference,
        level_of_care: input.criteria.levelOfCare || null,
        presenting_issue: input.criteria.presentingIssue || null,
        client_type: input.criteria.clientType || null,
        payment_model: input.criteria.payment || null,
        insurance: input.criteria.insurance || null,
        neighborhood: input.criteria.location || null,
        urgency: input.criteria.urgency || null,
        status: "open",
      })
      .select("id, client_reference")
      .single();

    if (caseError || !newCase) {
      return { ok: false, error: caseError?.message ?? "Failed to create case" };
    }
    caseId = newCase.id as string;
    clientReference = newCase.client_reference as string;
  } else {
    const { data: existing } = await admin
      .from("client_cases")
      .select("client_reference")
      .eq("id", caseId)
      .eq("owner_profile_id", session.userId)
      .single();
    clientReference = (existing?.client_reference as string | undefined) ?? clientReference;
  }

  let loggedCount = 0;
  for (const profileId of input.referredProfileIds) {
    const { error } = await admin.from("case_referrals").insert({
      case_id: caseId,
      owner_profile_id: session.userId,
      referred_profile_id: profileId,
      contact_method: input.contactMethod ?? "email",
      status: "open",
    });
    if (!error || error.code === "23505") loggedCount++;
  }

  revalidatePath("/member/network");
  revalidatePath("/member/referrals");
  return { ok: true, caseId: caseId as string, clientReference, loggedCount };
}

export async function respondToDirectReferral(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const referralId = String(formData.get("referralId") ?? "");
  const decision = formData.get("decision");

  if (!referralId || (decision !== "accepted" && decision !== "declined")) {
    redirect("/member/referrals?referralError=1" as never);
  }

  const { error } = await admin
    .from("direct_referrals")
    .update({ status: decision })
    .eq("id", referralId)
    .eq("receiver_profile_id", session.userId);

  if (error) {
    redirect("/member/referrals?referralError=1" as never);
  }

  revalidatePath("/member/referrals");
  redirect("/member/referrals?referralResponded=1" as never);
}
