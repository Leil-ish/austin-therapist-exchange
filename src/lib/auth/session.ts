import type { AppSession } from "@/types";
import { bootstrapProfileForUser, syncMembershipStateForUser } from "@/lib/auth/bootstrap";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSession(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  await syncMembershipStateForUser(user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, membership_state, full_name, can_issue_referrals")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await bootstrapProfileForUser(user);

    const { data: bootstrappedProfile } = await supabase
      .from("profiles")
      .select("id, role, membership_state, full_name, can_issue_referrals")
      .eq("id", user.id)
      .maybeSingle();

    if (!bootstrappedProfile) {
      return null;
    }

    return {
      userId: bootstrappedProfile.id,
      role: bootstrappedProfile.role,
      membershipState: bootstrappedProfile.membership_state,
      membershipTier: "free",
      fullName: bootstrappedProfile.full_name,
      email: user.email ?? "",
      canIssueReferrals: bootstrappedProfile.can_issue_referrals
    };
  }

  return {
    userId: profile.id,
    role: profile.role,
    membershipState: profile.membership_state,
    membershipTier: "free",
    fullName: profile.full_name,
    email: user.email ?? "",
    canIssueReferrals: profile.can_issue_referrals
  };
}
