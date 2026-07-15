import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types";

export async function createNotification(args: {
  recipientProfileId: string;
  type: NotificationType;
  title: string;
  message?: string;
  relatedProfileId?: string;
  relatedCaseId?: string;
}): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("notifications").insert({
      recipient_profile_id: args.recipientProfileId,
      type: args.type,
      title: args.title,
      message: args.message ?? null,
      related_profile_id: args.relatedProfileId ?? null,
      related_case_id: args.relatedCaseId ?? null,
    });
  } catch {
    // fire-and-forget — never throw
  }
}
