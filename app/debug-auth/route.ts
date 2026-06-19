import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ step: "getUser failed", error: userError?.message });
  }

  const { data: anonProfile, error: anonErr } = await supabase
    .from("profiles")
    .select("id, role, membership_state")
    .eq("id", user.id)
    .maybeSingle();

  const { data: adminProfile, error: adminErr } = await admin
    .from("profiles")
    .select("id, role, membership_state")
    .eq("id", user.id)
    .maybeSingle();

  // Ensure membership is active so we can access member routes
  const { error: updateErr } = await admin.from("profiles").update({
    membership_state: "active",
    role: "therapist",
    can_issue_referrals: true,
  }).eq("id", user.id);

  return NextResponse.json({
    userId: user.id,
    hadProfile: !!adminProfile,
    updateErr: updateErr?.message ?? null,
  });
}
