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

export async function sendDirectReferral(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();

  const receiverProfileId = String(formData.get("receiverProfileId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/member").trim();
  const clientDetails = parseClientDetailsFromFormData(formData);
  const messageBody = [buildStructuredReferralSummary(formData), "", "Details:", body].filter(Boolean).join("\n");

  if (!receiverProfileId || !title || !body || receiverProfileId === session.userId) {
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
    client_details: clientDetails,
    status: "open",
    message_id: message.id
  });

  if (referralError) {
    await admin.from("referral_messages").delete().eq("id", message.id);
    redirect(`${returnTo}?directReferralError=1` as never);
  }

  revalidatePath("/member");
  revalidatePath("/member/feed");
  revalidatePath("/member/posts/new");
  redirect(`${returnTo}?directReferralSent=1` as never);
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

export async function followClinician(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();
  const followedProfileId = String(formData.get("followedProfileId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/directory").trim();

  if (!followedProfileId || followedProfileId === session.userId) {
    redirect(returnTo as never);
  }

  const { error } = await admin.from("follows").upsert(
    {
      follower_profile_id: session.userId,
      followed_profile_id: followedProfileId
    },
    {
      onConflict: "follower_profile_id,followed_profile_id"
    }
  );

  if (error) {
    redirect(`${returnTo}?followError=1` as never);
  }

  revalidatePath("/directory");
  revalidatePath("/member");
  revalidatePath("/member/feed");
  revalidatePath("/member/following");
  redirect(returnTo as never);
}

export async function unfollowClinician(formData: FormData) {
  const session = await requireMember();
  const admin = createSupabaseAdminClient();
  const followedProfileId = String(formData.get("followedProfileId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/member/following").trim();

  if (!followedProfileId) {
    redirect(returnTo as never);
  }

  await admin
    .from("follows")
    .delete()
    .eq("follower_profile_id", session.userId)
    .eq("followed_profile_id", followedProfileId);

  revalidatePath("/directory");
  revalidatePath("/member");
  revalidatePath("/member/feed");
  revalidatePath("/member/following");
  redirect(returnTo as never);
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
