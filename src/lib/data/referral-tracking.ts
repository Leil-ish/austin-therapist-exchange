export type CaseStatus = "open" | "placed" | "closed";
export type ReferralStatus = "open" | "accepted" | "declined" | "closed" | "completed";

export interface CaseReferral {
  id: string;
  therapistName: string;
  therapistSlug?: string;
  status: ReferralStatus;
  sentAtLabel: string;
  respondedAtLabel?: string;
}

export interface ClientCase {
  id: string;
  clientReference: string;
  levelOfCare: "outpatient" | "group" | "iop" | "php" | "residential";
  presentingIssue: string;
  clientType: string;
  paymentModel: "insurance" | "private_pay" | "both";
  insurance: string;
  neighborhood: string;
  urgency: "low" | "medium" | "high";
  status: CaseStatus;
  createdAtLabel: string;
  referrals: CaseReferral[];
}

export const MOCK_REFERRAL_CASES: ClientCase[] = [
  {
    id: "case-1",
    clientReference: "CASE-A7K9",
    levelOfCare: "outpatient",
    presentingIssue: "Anxiety",
    clientType: "Adult",
    paymentModel: "insurance",
    insurance: "BCBS",
    neighborhood: "North Austin",
    urgency: "medium",
    status: "open",
    createdAtLabel: "3 days ago",
    referrals: [
      {
        id: "ref-1a",
        therapistName: "Dr. Sarah Chen",
        therapistSlug: "sarah-chen",
        status: "open",
        sentAtLabel: "3 days ago",
      },
      {
        id: "ref-1b",
        therapistName: "Marcus Williams, LPC",
        therapistSlug: "marcus-williams",
        status: "declined",
        sentAtLabel: "3 days ago",
        respondedAtLabel: "2 days ago",
      },
      {
        id: "ref-1c",
        therapistName: "Priya Nair, LMFT",
        therapistSlug: "priya-nair",
        status: "open",
        sentAtLabel: "1 day ago",
      },
    ],
  },
  {
    id: "case-2",
    clientReference: "CASE-B3M2",
    levelOfCare: "iop",
    presentingIssue: "Depression",
    clientType: "Adolescent",
    paymentModel: "private_pay",
    insurance: "N/A",
    neighborhood: "South Austin",
    urgency: "high",
    status: "open",
    createdAtLabel: "1 day ago",
    referrals: [
      {
        id: "ref-2a",
        therapistName: "Jordan Park, LCSW",
        status: "open",
        sentAtLabel: "1 day ago",
      },
    ],
  },
  {
    id: "case-3",
    clientReference: "CASE-C5P8",
    levelOfCare: "outpatient",
    presentingIssue: "Trauma / PTSD",
    clientType: "Adult",
    paymentModel: "both",
    insurance: "Aetna",
    neighborhood: "Central Austin",
    urgency: "medium",
    status: "placed",
    createdAtLabel: "2 weeks ago",
    referrals: [
      {
        id: "ref-3a",
        therapistName: "Elena Torres, PhD",
        therapistSlug: "elena-torres",
        status: "completed",
        sentAtLabel: "2 weeks ago",
        respondedAtLabel: "10 days ago",
      },
      {
        id: "ref-3b",
        therapistName: "David Kwan, LPC",
        status: "declined",
        sentAtLabel: "2 weeks ago",
        respondedAtLabel: "12 days ago",
      },
    ],
  },
  {
    id: "case-4",
    clientReference: "CASE-D9R4",
    levelOfCare: "group",
    presentingIssue: "Grief / Loss",
    clientType: "Adult",
    paymentModel: "insurance",
    insurance: "United",
    neighborhood: "East Austin",
    urgency: "low",
    status: "open",
    createdAtLabel: "5 days ago",
    referrals: [
      {
        id: "ref-4a",
        therapistName: "Amara Osei, LCSW",
        therapistSlug: "amara-osei",
        status: "accepted",
        sentAtLabel: "5 days ago",
        respondedAtLabel: "4 days ago",
      },
    ],
  },
  {
    id: "case-5",
    clientReference: "CASE-E2W6",
    levelOfCare: "php",
    presentingIssue: "Mood Disorder",
    clientType: "Adult",
    paymentModel: "private_pay",
    insurance: "N/A",
    neighborhood: "West Austin",
    urgency: "high",
    status: "closed",
    createdAtLabel: "1 month ago",
    referrals: [
      {
        id: "ref-5a",
        therapistName: "Nina Patel, PhD",
        status: "closed",
        sentAtLabel: "1 month ago",
        respondedAtLabel: "3 weeks ago",
      },
      {
        id: "ref-5b",
        therapistName: "Tom Reyes, LMFT",
        status: "declined",
        sentAtLabel: "1 month ago",
        respondedAtLabel: "4 weeks ago",
      },
    ],
  },
  {
    id: "case-6",
    clientReference: "CASE-F7X3",
    levelOfCare: "outpatient",
    presentingIssue: "OCD",
    clientType: "Adolescent",
    paymentModel: "insurance",
    insurance: "Cigna",
    neighborhood: "North Austin",
    urgency: "medium",
    status: "open",
    createdAtLabel: "4 days ago",
    referrals: [
      {
        id: "ref-6a",
        therapistName: "Alex Guo, LPC",
        therapistSlug: "alex-guo",
        status: "open",
        sentAtLabel: "4 days ago",
      },
      {
        id: "ref-6b",
        therapistName: "Rachel Stone, PhD",
        status: "declined",
        sentAtLabel: "4 days ago",
        respondedAtLabel: "3 days ago",
      },
      {
        id: "ref-6c",
        therapistName: "Ben Okafor, LMFT",
        status: "open",
        sentAtLabel: "2 days ago",
      },
    ],
  },
  {
    id: "case-7",
    clientReference: "CASE-G1Y5",
    levelOfCare: "residential",
    presentingIssue: "Substance Use",
    clientType: "Adult",
    paymentModel: "both",
    insurance: "BCBS",
    neighborhood: "Central Austin",
    urgency: "high",
    status: "placed",
    createdAtLabel: "3 weeks ago",
    referrals: [
      {
        id: "ref-7a",
        therapistName: "Jasmine Hart, LCSW",
        therapistSlug: "jasmine-hart",
        status: "completed",
        sentAtLabel: "3 weeks ago",
        respondedAtLabel: "2 weeks ago",
      },
    ],
  },
];

function relativeLabel(ts: string | null | undefined): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) === 1 ? "" : "s"} ago`;
}

export async function getReferralTracking(profileId?: string): Promise<ClientCase[]> {
  if (!profileId) return [];

  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const admin = createSupabaseAdminClient();

  const { data: cases, error } = await admin
    .from("client_cases")
    .select(`
      id,
      client_reference,
      level_of_care,
      presenting_issue,
      client_type,
      payment_model,
      insurance,
      neighborhood,
      urgency,
      status,
      created_at,
      case_referrals (
        id,
        status,
        contact_method,
        responded_at,
        created_at,
        referred_profile_id,
        profiles:referred_profile_id (
          therapist_profiles ( public_display_name )
        )
      )
    `)
    .eq("owner_profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error || !cases) return [];

  return cases.map((c) => {
    const referrals: CaseReferral[] = (c.case_referrals ?? []).map((r: Record<string, unknown>) => {
      const profile = r.profiles as { therapist_profiles?: { public_display_name?: string | null } | null } | null;
      const displayName = profile?.therapist_profiles?.public_display_name ?? "Unknown therapist";
      return {
        id: String(r.id),
        therapistName: displayName,
        status: (r.status as ReferralStatus) ?? "open",
        sentAtLabel: relativeLabel(r.created_at as string | null),
        respondedAtLabel: r.responded_at ? relativeLabel(r.responded_at as string) : undefined,
      };
    });

    return {
      id: String(c.id),
      clientReference: String(c.client_reference),
      levelOfCare: (c.level_of_care ?? "outpatient") as ClientCase["levelOfCare"],
      presentingIssue: String(c.presenting_issue ?? ""),
      clientType: String(c.client_type ?? ""),
      paymentModel: (c.payment_model ?? "both") as ClientCase["paymentModel"],
      insurance: String(c.insurance ?? ""),
      neighborhood: String(c.neighborhood ?? ""),
      urgency: (c.urgency ?? "medium") as ClientCase["urgency"],
      status: (c.status ?? "open") as CaseStatus,
      createdAtLabel: relativeLabel(c.created_at),
      referrals,
    };
  });
}
