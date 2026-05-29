import type {
  AvailabilityStatus,
  EndorsementSummary,
  FeedItem,
  GroupSummary,
  JoinRequestSummary,
  ModerationReportSummary,
  PublicTherapistSummary,
  ReferralLinkSummary
} from "@/types";

function availabilityLabel(status: AvailabilityStatus) {
  if (status === "accepting") return "Accepting new clients";
  if (status === "waitlist") return "Waitlist";
  return "Currently full";
}

export const therapists: PublicTherapistSummary[] = [
  {
    id: "therapist-1",
    profileId: "profile-1",
    slug: "maya-hernandez-lcsw",
    displayName: "Maya Hernandez, LCSW",
    title: "Trauma-informed therapist for adults and couples",
    bio: "Maya supports Austinites navigating life transitions, burnout, and relational repair with grounded, culturally responsive care.",
    approachSummary: "Relational, directive when helpful, and especially strong with clients who want both warmth and structure.",
    specialties: ["Trauma", "Burnout", "Couples"],
    populations: ["Adults", "Couples", "Professionals"],
    communities: [],
    insuranceAccepted: ["Out of network", "Aetna"],
    paymentModel: "both",
    therapyStyleTags: ["Relational", "Trauma-informed", "Directive"],
    neighborhoods: ["Central Austin"],
    endorsementCount: 9,
    membershipLabel: "Active member",
    city: "Austin",
    marketName: "Austin",
    availabilityStatus: "accepting",
    availabilityUpdatedAtLabel: "Updated 2 days ago",
    inPerson: true,
    telehealth: true,
    featuredLinks: [],
    offerings: [],
    curatedListTitles: [],
    membershipTier: "free",
    trustedBy: [
      { id: "therapist-2", name: "Julian Park, LPC", slug: "julian-park-lpc" },
      { id: "therapist-3", name: "Nina Patel, LMFT", slug: "nina-patel-lmft" }
    ],
    sponsorName: "Sponsored by Julian Park"
  },
  {
    id: "therapist-2",
    profileId: "profile-2",
    slug: "julian-park-lpc",
    displayName: "Julian Park, LPC",
    title: "Anxiety, identity, and men’s mental health",
    bio: "Julian works with professionals and creatives looking for practical, emotionally attuned therapy rooted in long-term change.",
    approachSummary: "Insight-oriented, collaborative, and especially effective for clients who want a calm but active therapist presence.",
    specialties: ["Anxiety", "Identity", "Men's mental health"],
    populations: ["Adults", "College students", "Creatives"],
    communities: [],
    insuranceAccepted: ["Private pay", "Blue Cross Blue Shield"],
    paymentModel: "both",
    therapyStyleTags: ["Collaborative", "Insight-oriented", "Relational"],
    neighborhoods: ["South Austin"],
    endorsementCount: 6,
    membershipLabel: "Active member",
    city: "Austin",
    marketName: "Austin",
    availabilityStatus: "waitlist",
    availabilityUpdatedAtLabel: "Updated this week",
    inPerson: false,
    telehealth: true,
    featuredLinks: [],
    offerings: [],
    curatedListTitles: [],
    membershipTier: "free",
    trustedBy: [{ id: "therapist-3", name: "Nina Patel, LMFT", slug: "nina-patel-lmft" }],
    sponsorName: "Sponsored by Maya Hernandez"
  },
  {
    id: "therapist-3",
    profileId: "profile-3",
    slug: "nina-patel-lmft",
    displayName: "Nina Patel, LMFT",
    title: "Family systems and perinatal transitions",
    bio: "Nina helps families and parents move through high-stakes seasons with steadiness, clarity, and warmth.",
    approachSummary: "Grounded, attachment-aware, and especially helpful for families who need steadiness during intense transition periods.",
    specialties: ["Perinatal", "Families", "Attachment"],
    populations: ["Parents", "Families", "New mothers"],
    communities: [],
    insuranceAccepted: ["Out of network", "UnitedHealthcare"],
    paymentModel: "both",
    therapyStyleTags: ["Attachment-based", "Family systems", "Warm"],
    neighborhoods: ["North Austin"],
    endorsementCount: 5,
    membershipLabel: "Active member",
    city: "Austin",
    marketName: "Austin",
    availabilityStatus: "full",
    availabilityUpdatedAtLabel: "Updated yesterday",
    inPerson: true,
    telehealth: true,
    featuredLinks: [],
    offerings: [],
    curatedListTitles: [],
    membershipTier: "free",
    trustedBy: [{ id: "therapist-1", name: "Maya Hernandez, LCSW", slug: "maya-hernandez-lcsw" }],
    sponsorName: "Sponsored by Maya Hernandez"
  }
];

export const publicGroups: GroupSummary[] = [
  {
    id: "group-1",
    slug: "south-austin-peer-consult",
    name: "South Austin Peer Consult",
    description: "An open listing for a recurring consultation circle focused on case reflection and ethical support.",
    visibility: "public",
    memberCount: 18,
    marketName: "Austin"
  },
  {
    id: "group-2",
    slug: "neurodiversity-clinicians",
    name: "Neurodiversity-Affirming Clinicians",
    description: "A public-facing group that helps therapists discover one another before joining the private internal space.",
    visibility: "public",
    memberCount: 22,
    marketName: "Austin"
  }
];

export const memberGroups: GroupSummary[] = [
  ...publicGroups,
  {
    id: "group-3",
    slug: "referral-roundtable",
    name: "Referral Roundtable",
    description: "Private member-only discussion space for warm handoffs, niche matching, and ongoing availability updates.",
    visibility: "private_member_only",
    memberCount: 44,
    marketName: "Austin"
  }
];

export const feedItems: FeedItem[] = [
  {
    id: "feed-1",
    type: "referral_request",
    kindLabel: "Referral request",
    title: "Seeking trauma-informed therapist for teen in Central Austin",
    body: "Need openings within two weeks for a teen client preferring in-person care after school hours. Insurance flexibility helpful.",
    authorName: "Maya Hernandez",
    createdAtLabel: "Today",
    ctaLabel: "Reply in thread",
    status: "open",
    availabilitySignal: "Targeting clinicians currently accepting or on short waitlists"
  },
  {
    id: "feed-2",
    type: "consultation_request",
    kindLabel: "Consultation request",
    title: "Consult needed around OCD treatment planning",
    body: "Looking for a short consult with someone strong in ERP who can weigh in on pacing and readiness for exposure work.",
    authorName: "Julian Park",
    createdAtLabel: "Yesterday",
    ctaLabel: "Offer consult",
    status: "matched"
  },
  {
    id: "feed-3",
    type: "job",
    kindLabel: "Job opening",
    title: "Part-time associate opportunity in North Loop",
    body: "Small group practice seeking a relational clinician comfortable with adults and couples. Hybrid setup, strong supervision culture.",
    authorName: "Nina Patel",
    createdAtLabel: "2 days ago",
    ctaLabel: "View details",
    status: "open"
  }
];

export const endorsements: EndorsementSummary[] = [
  {
    id: "endorsement-1",
    giverSlug: "julian-park-lpc",
    giverName: "Julian Park, LPC",
    receiverSlug: "maya-hernandez-lcsw",
    receiverName: "Maya Hernandez, LCSW",
    quote: "Maya is thoughtful, grounded, and consistently generous with referral care.",
    createdAtLabel: "This month",
    isPublic: true
  },
  {
    id: "endorsement-2",
    giverSlug: "nina-patel-lmft",
    giverName: "Nina Patel, LMFT",
    receiverSlug: "julian-park-lpc",
    receiverName: "Julian Park, LPC",
    quote: "Julian brings clarity, warmth, and excellent discernment to consultation work.",
    createdAtLabel: "Last month",
    isPublic: true
  }
];

export const pendingJoinRequests: JoinRequestSummary[] = [
  {
    id: "join-1",
    fullName: "Elena Brooks",
    email: "elena@example.com",
    credentials: "LPC-S",
    marketName: "Austin",
    sponsorName: "Maya Hernandez, LCSW",
    referralCode: "ATX-MAYA-APRIL",
    createdAtLabel: "Today",
    status: "pending"
  },
  {
    id: "join-2",
    fullName: "Samira Khan",
    email: "samira@example.com",
    credentials: "LMFT",
    marketName: "Austin",
    sponsorName: "Julian Park, LPC",
    referralCode: "ATX-MAYA-CONSULT",
    createdAtLabel: "Yesterday",
    status: "pending"
  }
];

export const moderationReports: ModerationReportSummary[] = [
  {
    id: "report-1",
    targetType: "post",
    reason: "Potentially identifiable client detail",
    reporterName: "Nina Patel",
    createdAtLabel: "2 hours ago",
    status: "open"
  },
  {
    id: "report-2",
    targetType: "endorsement",
    reason: "Public quote needs clarification",
    reporterName: "Maya Hernandez",
    createdAtLabel: "Yesterday",
    status: "reviewing"
  }
];

export const referralLinks: ReferralLinkSummary[] = [
  {
    id: "invite-1",
    code: "ATX-MAYA-APRIL",
    sponsorName: "Maya Hernandez, LCSW",
    invitedEmail: "elena@example.com",
    maxUses: 1,
    useCount: 0,
    expiresAtLabel: "Expires in 10 days",
    isActive: true
  },
  {
    id: "invite-2",
    code: "ATX-MAYA-CONSULT",
    sponsorName: "Maya Hernandez, LCSW",
    maxUses: 3,
    useCount: 1,
    expiresAtLabel: "Expires in 21 days",
    isActive: true
  }
];

export function getReferralLinkByCode(code: string) {
  return referralLinks.find((item) => item.code.toLowerCase() === code.toLowerCase());
}

export function getAvailabilityLabel(status: AvailabilityStatus) {
  return availabilityLabel(status);
}
