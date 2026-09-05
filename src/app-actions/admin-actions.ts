"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { sendApprovalEmail, sendDenialEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) return null;
  const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
}

export async function reviewJoinRequest(formData: FormData) {
  const session = await requireAdmin();
  const admin = createSupabaseAdminClient();

  const requestId = String(formData.get("requestId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const grantReferrals = formData.get("grantReferrals") === "on";
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!requestId || !["approve", "reject"].includes(decision)) {
    redirect("/admin/join-requests?error=invalid-review");
  }

  const { data: joinRequest } = await admin
    .from("join_requests")
    .select(
      "id, email, full_name, credentials, website_url, sponsor_profile_id, level_of_care, specialties, payment_model, availability, care_format, status"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (!joinRequest) {
    redirect("/admin/join-requests?error=missing-request");
  }

  const nextStatus = decision === "approve" ? "active" : "rejected";
  const reviewedAt = new Date().toISOString();

  const { error: updateError } = await admin
    .from("join_requests")
    .update({
      grant_referral_access: decision === "approve" ? grantReferrals : false,
      status: nextStatus,
      reviewed_by: session.userId,
      reviewed_at: reviewedAt,
      rejection_reason:
        decision === "reject" ? rejectionReason || "Not approved at this time." : null,
    })
    .eq("id", requestId);

  if (updateError) {
    redirect("/admin/join-requests?error=review-failed");
  }

  const applicantEmail = String(joinRequest.email ?? "");
  const applicantName = String(joinRequest.full_name ?? "");

  // ── Rejection path ────────────────────────────────────────────────────────
  if (decision === "reject") {
    let denialEmailFailed = false;
    try {
      await sendDenialEmail(applicantEmail, rejectionReason || undefined);
    } catch (err) {
      denialEmailFailed = true;
      console.error("[reviewJoinRequest] denial email failed:", err);
    }
    revalidatePath("/admin/join-requests");
    redirect(
      denialEmailFailed
        ? "/admin/join-requests?reviewed=rejected&emailWarning=denial"
        : "/admin/join-requests?reviewed=rejected"
    );
  }

  // ── Approval path ─────────────────────────────────────────────────────────
  let approvalEmailFailed = false;
  try {
    // 1. Find or create the auth user
    let authUserId = await findAuthUserIdByEmail(applicantEmail);

    if (!authUserId) {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: applicantEmail,
        email_confirm: true,
        user_metadata: { full_name: applicantName },
      });

      if (createError || !newUser?.user) {
        console.error("[reviewJoinRequest] createUser failed:", createError);
        redirect("/admin/join-requests?error=review-failed");
      }

      authUserId = newUser.user.id;
    }

    // 2. Generate a password-set link for the welcome email
    //
    // We deliberately do NOT send GoTrue's raw `action_link` (which points straight at
    // /verify and gets consumed by the first thing that loads it — e.g. Gmail/Outlook
    // link-scanning proxies — before the real recipient clicks). Instead we build our own
    // link to /auth/confirm, which only calls verifyOtp on an explicit user click.
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://austintherapistexchange.com";
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: applicantEmail,
      options: {
        redirectTo: `${appBaseUrl}/auth/callback?next=/reset-password?then=/member/profile`,
      },
    });
    if (linkError) {
      console.error("[reviewJoinRequest] generateLink failed:", linkError);
    }
    const hashedToken = (linkData as { properties?: { hashed_token?: string } } | null)?.properties
      ?.hashed_token;
    const setPasswordLink = hashedToken
      ? `${appBaseUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=recovery&next=${encodeURIComponent(
          "/reset-password?then=/member/profile"
        )}`
      : `${appBaseUrl}/login`;

    // 3. Create profiles row (skip if it already exists)
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, slug")
      .eq("id", authUserId)
      .maybeSingle();

    const baseSlug = slugify(applicantName) || "therapist";
    const uniqueSlug = `${baseSlug}-${authUserId.slice(0, 8)}`;

    if (!existingProfile) {
      const { error: profileError } = await admin.from("profiles").insert({
        id: authUserId,
        role: "therapist",
        membership_state: "active",
        full_name: applicantName,
        slug: uniqueSlug,
        country_code: "US",
        market_slug: "austin-tx",
        can_issue_referrals: grantReferrals,
        approved_at: reviewedAt,
        approved_by: session.userId,
      });
      if (profileError) {
        console.error("[reviewJoinRequest] profiles insert failed:", profileError);
        redirect("/admin/join-requests?error=review-failed");
      }
    } else {
      // A profile can already exist here (pre-created placeholder, prior signup,
      // etc.) without ever having had a slug assigned — nothing else backfills
      // it, and a NULL slug breaks every /directory/[slug] link built from this
      // profile. Assign one now if it's still missing.
      const { error: profileError } = await admin
        .from("profiles")
        .update({
          membership_state: "active",
          full_name: applicantName,
          can_issue_referrals: grantReferrals,
          approved_at: reviewedAt,
          approved_by: session.userId,
          ...(existingProfile.slug ? {} : { slug: uniqueSlug }),
        })
        .eq("id", authUserId);
      if (profileError) {
        console.error("[reviewJoinRequest] profiles update failed:", profileError);
        redirect("/admin/join-requests?error=review-failed");
      }
    }

    // 4. Map onboarding fields to therapist_profiles column types
    const rawPaymentModel = String(joinRequest.payment_model ?? "");
    const therapistPaymentModel =
      rawPaymentModel === "private_pay" || rawPaymentModel === "insurance" || rawPaymentModel === "both"
        ? rawPaymentModel
        : "both";

    const rawAvailability = String(joinRequest.availability ?? "");
    const therapistAvailability =
      rawAvailability === "accepting" || rawAvailability === "waitlist" || rawAvailability === "full"
        ? rawAvailability
        : "waitlist";

    const rawCareFormat = String(joinRequest.care_format ?? "");
    const offersInPerson = rawCareFormat === "in_person" || rawCareFormat === "both";
    const offersTelehealth = rawCareFormat === "telehealth" || rawCareFormat === "both";

    const levelOfCare: string[] = Array.isArray(joinRequest.level_of_care)
      ? (joinRequest.level_of_care as string[])
      : [];
    const specialties: string[] = Array.isArray(joinRequest.specialties)
      ? (joinRequest.specialties as string[])
      : [];

    // 5. Create or update therapist_profiles
    const { data: existingTherapistProfile } = await admin
      .from("therapist_profiles")
      .select("id")
      .eq("profile_id", authUserId)
      .maybeSingle();

    const therapistData = {
      public_display_name: applicantName,
      credentials: String(joinRequest.credentials ?? "") || null,
      website_url: String(joinRequest.website_url ?? "") || null,
      specialties,
      offerings: levelOfCare,
      payment_model: therapistPaymentModel,
      availability_status: therapistAvailability,
      offers_in_person: offersInPerson || (!offersInPerson && !offersTelehealth),
      offers_telehealth: offersTelehealth,
      is_public: true,
    };

    if (!existingTherapistProfile) {
      const { error: tpError } = await admin
        .from("therapist_profiles")
        .insert({ profile_id: authUserId, ...therapistData });
      if (tpError) {
        console.error("[reviewJoinRequest] therapist_profiles insert failed:", tpError);
        redirect("/admin/join-requests?error=review-failed");
      }
    } else {
      const { error: tpError } = await admin
        .from("therapist_profiles")
        .update(therapistData)
        .eq("profile_id", authUserId);
      if (tpError) {
        console.error("[reviewJoinRequest] therapist_profiles update failed:", tpError);
        redirect("/admin/join-requests?error=review-failed");
      }
    }

    // 6. Auto-follow: sponsor follows the new member so they appear in sponsor's trusted network
    const sponsorProfileId = joinRequest.sponsor_profile_id
      ? String(joinRequest.sponsor_profile_id)
      : null;

    if (sponsorProfileId) {
      const { error: followError } = await admin
        .from("follows")
        .upsert(
          { follower_profile_id: sponsorProfileId, followed_profile_id: authUserId },
          { onConflict: "follower_profile_id,followed_profile_id", ignoreDuplicates: true }
        );
      if (followError) {
        console.error("[reviewJoinRequest] follows upsert failed:", followError);
      }

      // Awaited (not fire-and-forget) for the same reason as the approval email below:
      // an un-awaited promise kicked off right before redirect() can be dropped when the
      // Cloudflare Workers isolate tears down after the response is sent.
      try {
        await createNotification({
          recipientProfileId: sponsorProfileId,
          type: "network_added",
          title: `${applicantName} accepted your invitation`,
          message: `${applicantName} joined Austin Therapist Exchange and was added to your trusted network.`,
          relatedProfileId: authUserId,
        });
      } catch (err) {
        console.error("[reviewJoinRequest] sponsor notification failed:", err);
      }
    }

    // 7. Send approval email. Must be awaited, not fire-and-forget: on Cloudflare
    // Workers an un-awaited promise kicked off right before redirect() can be
    // dropped when the isolate tears down after the response is sent, so the
    // send never actually reaches the provider. A failed send here should not
    // roll back the approval — profile/therapist_profile/follow rows above are
    // already committed — so catch locally and surface a warning instead.
    try {
      await sendApprovalEmail(applicantEmail, applicantName, setPasswordLink);
    } catch (err) {
      approvalEmailFailed = true;
      console.error("[reviewJoinRequest] approval email failed:", err);
    }

    revalidatePath("/admin/join-requests");
    revalidatePath("/member");
  } catch (error) {
    unstable_rethrow(error);
    console.error("[reviewJoinRequest] approval action failed:", error);
    redirect("/admin/join-requests?error=approval-failed");
  }

  redirect(
    approvalEmailFailed
      ? "/admin/join-requests?reviewed=active&emailWarning=approval"
      : "/admin/join-requests?reviewed=active"
  );
}
