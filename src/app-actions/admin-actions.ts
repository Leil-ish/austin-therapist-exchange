"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import { notifyApplicantOfDecision } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function findAuthUserIdByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });

  if (error) {
    return null;
  }

  const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
}

export async function reviewJoinRequest(formData: FormData) {
  const session = await requireAdmin();
  const admin = createSupabaseAdminClient();

  const requestId = String(formData.get("requestId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const grantReferrals = formData.get("grantReferrals") === "on";
  const grantPremium = formData.get("grantPremium") === "on";
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!requestId || !["approve", "reject"].includes(decision)) {
    redirect("/admin/join-requests?error=invalid-review");
  }

  const { data: joinRequest } = await admin
    .from("join_requests")
    .select("id, email, full_name")
    .eq("id", requestId)
    .maybeSingle();

  if (!joinRequest) {
    redirect("/admin/join-requests?error=missing-request");
  }

  const nextStatus = decision === "approve" ? "active" : "rejected";
  const reviewedAt = new Date().toISOString();

  const { error } = await admin
    .from("join_requests")
    .update({
      grant_referral_access: decision === "approve" ? grantReferrals : false,
      status: nextStatus,
      reviewed_by: session.userId,
      reviewed_at: reviewedAt,
      rejection_reason: decision === "reject" ? rejectionReason || "Not approved for launch cohort." : null
    })
    .eq("id", requestId);

  if (error) {
    redirect("/admin/join-requests?error=review-failed");
  }

  const authUserId = await findAuthUserIdByEmail(joinRequest.email);

  if (authUserId) {
    await admin
      .from("profiles")
      .update({
        membership_state: nextStatus,
        approved_at: nextStatus === "active" ? reviewedAt : null,
        approved_by: nextStatus === "active" ? session.userId : null,
        rejected_at: nextStatus === "rejected" ? reviewedAt : null,
        can_issue_referrals: nextStatus === "active" ? grantReferrals : false,
        membership_tier: nextStatus === "active" ? (grantPremium ? "premium" : "free") : "free"
      })
      .eq("id", authUserId);
  }

  revalidatePath("/admin/join-requests");
  revalidatePath("/member");
  await notifyApplicantOfDecision({
    email: joinRequest.email,
    fullName: joinRequest.full_name ?? joinRequest.email,
    decision: decision as "approve" | "reject",
    rejectionReason: decision === "reject" ? rejectionReason || undefined : undefined
  });
  redirect(`/admin/join-requests?reviewed=${nextStatus}`);
}
