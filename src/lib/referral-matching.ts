import type { PublicTherapistSummary } from "@/types";

export const AVAILABILITY_STALE_DAYS = 60;

export const AUSTIN_METRO_AREAS = [
  "North Austin",
  "Central Austin",
  "South Austin",
  "East Austin",
  "West Austin",
  "Westlake",
  "Round Rock",
  "Cedar Park",
  "Georgetown",
  "Pflugerville",
  "Leander",
  "Lakeway",
  "Dripping Springs",
  "Buda",
  "Kyle"
] as const;

const REGION_ALIASES: Record<(typeof AUSTIN_METRO_AREAS)[number], string[]> = {
  "North Austin": [
    "North Austin",
    "Northwest Hills",
    "Allandale",
    "Crestview",
    "Brentwood",
    "North Burnet",
    "Arboretum",
    "Domain",
    "Far North Austin",
    "Wells Branch",
    "Anderson Mill",
    "Jollyville"
  ],
  "Central Austin": [
    "Central Austin",
    "Downtown",
    "Clarksville",
    "Hyde Park",
    "Rosedale",
    "Tarrytown",
    "Mueller",
    "North Loop",
    "Hancock",
    "Bouldin Creek",
    "Zilker"
  ],
  "South Austin": [
    "South Austin",
    "South Congress",
    "South Lamar",
    "Travis Heights",
    "Cherry Creek",
    "Circle C",
    "Southpark Meadows",
    "Sunset Valley",
    "Manchaca",
    "Oak Hill"
  ],
  "East Austin": [
    "East Austin",
    "East Cesar Chavez",
    "Holly",
    "Govalle",
    "Montopolis",
    "Del Valle",
    "Pecan Springs",
    "MLK"
  ],
  "West Austin": [
    "West Austin",
    "Northwest Hills",
    "Tarrytown",
    "Westlake Hills",
    "Rollingwood",
    "Barton Creek",
    "Steiner Ranch",
    "Lake Travis",
    "Bee Cave",
    "Oak Hill"
  ],
  Westlake: ["Westlake", "West Lake Hills", "Westlake Hills", "Rollingwood"],
  "Round Rock": ["Round Rock"],
  "Cedar Park": ["Cedar Park"],
  Georgetown: ["Georgetown"],
  Pflugerville: ["Pflugerville"],
  Leander: ["Leander"],
  Lakeway: ["Lakeway"],
  "Dripping Springs": ["Dripping Springs", "Belterra"],
  Buda: ["Buda"],
  Kyle: ["Kyle"]
};

export const LEVELS_OF_CARE = [
  "Weekly Therapy",
  "Group Therapy",
  "Intensive Outpatient (IOP)",
  "Partial Hospitalization (PHP)",
  "Residential Treatment"
] as const;

export const CLIENT_TYPES = [
  "Adult Individual",
  "Child Individual",
  "Adolescent Individual",
  "Couples",
  "Families"
] as const;

export const PRESENTING_ISSUES = [
  "Anxiety",
  "Depression",
  "Trauma / PTSD",
  "OCD",
  "Substance Use",
  "Eating Disorder",
  "Infidelity",
  "Relationship Conflict",
  "Intimacy / Sexual Issues",
  "ADHD",
  "Autism / Neurodivergence",
  "Postpartum / Perinatal",
  "Parenting",
  "Life Transitions",
  "Grief / Bereavement",
  "Anger Management",
  "Bipolar Disorder",
  "Psychosis / Schizophrenia Spectrum",
  "Personality Disorders",
  "Dissociative Disorders",
  "Self-Harm / Suicidality",
] as const;

export const PAYMENT_OPTIONS = [
  "Insurance",
  "Private Pay",
  "Both"
] as const;

export const LOCATION_OPTIONS = [
  "Austin (General)",
  "Central Austin",
  "North Austin",
  "South Austin",
  "East Austin",
  "West Austin",
  "Round Rock",
  "Cedar Park",
  "Georgetown",
  "Pflugerville",
  "Leander",
  "Oak Hill",
  "Westlake Hills",
  "Buda / Kyle",
  "Telehealth Only"
] as const;

export const COMMUNITIES = [
  "LGBTQ+",
  "BIPOC",
  "Veterans",
  "Faith-Based",
  "Neurodivergent",
  "Spanish-Speaking",
  "Latinx",
  "Asian / Pacific Islander",
  "Deaf / Hard of Hearing"
] as const;

export const MODALITIES = [
  "ACT",
  "CBT",
  "DBT",
  "EMDR",
  "Psychodynamic",
  "Relational",
  "Attachment-based",
  "Somatic",
  "EFT",
  "IFS",
  "Solution-focused",
  "Family systems",
  "Gottman",
  "Exposure therapy",
  "Mindfulness-based",
  "Brainspotting",
  "ART",
  "CPT",
  "Ketamine-Assisted"
] as const;

export const INSURANCE_CARRIERS = [
  "Aetna",
  "Blue Cross Blue Shield",
  "Cigna",
  "UnitedHealthcare",
  "Oscar",
  "Sendero",
  "Medicaid",
  "Medicare",
  "Humana",
  "Tricare",
  "Ambetter",
  "Carelon",
  "Magellan",
  "Quest Behavioral Health",
  "Ascension",
  "Scott & White",
  "Curative",
  "Sana",
  "Moda"
] as const;

export const URGENCY_LEVELS = ["Low", "Medium", "High", "Urgent"] as const;

export const LANGUAGES = [
  "English",
  "Spanish",
  "Mandarin",
  "Vietnamese",
  "Korean",
  "Hindi/Urdu",
  "ASL",
  "Other"
] as const;

export const GENDERS = ["Female", "Male", "Non-binary"] as const;

export type ClientType = (typeof CLIENT_TYPES)[number];

/** Drives conditional UI — which presenting issues and modalities to surface per client type.
 *  Empty arrays for Adult Individual = no restriction (all options shown). */
export const CLIENT_TYPE_RELEVANCE: Record<ClientType, { issues: string[]; modalities: string[] }> = {
  "Adult Individual": {
    issues: [],
    modalities: []
  },
  "Child Individual": {
    issues: ["Anxiety", "Depression", "Parenting", "Trauma", "ADHD", "Autism / Neurodivergence"],
    modalities: ["CBT", "DBT", "Family systems"]
  },
  "Adolescent Individual": {
    issues: ["Anxiety", "Depression", "Parenting", "Trauma", "ADHD", "Autism / Neurodivergence"],
    modalities: ["CBT", "DBT", "Family systems"]
  },
  "Couples": {
    issues: [
      "Relationship Conflict",
      "Communication Issues",
      "Infidelity",
      "Separation / Divorce",
      "Premarital",
      "Intimacy / Sexual Issues"
    ],
    modalities: ["Gottman", "EFT", "Relational", "Attachment-based"]
  },
  "Families": {
    issues: ["Parenting", "Communication Issues", "Relationship Conflict"],
    modalities: ["Family systems"]
  }
};

export function normalizeForMatch(value: string) {
  return value.trim().toLowerCase();
}

export function regionMatches(region: string, neighborhoods: string[], city?: string) {
  const normalizedRegion = normalizeForMatch(region);

  if (!normalizedRegion) {
    return true;
  }

  const canonicalRegion = AUSTIN_METRO_AREAS.find((area) => normalizeForMatch(area) === normalizedRegion);
  const aliases = canonicalRegion ? REGION_ALIASES[canonicalRegion] : [];
  const searchTerms = [region, ...aliases].map(normalizeForMatch);
  const haystack = [...neighborhoods, city ?? ""].map(normalizeForMatch);

  return haystack.some((item) =>
    searchTerms.some((term) => item.includes(term) || term.includes(item))
  );
}

export function countOverlappingTerms(selected: string[], candidate: string[]) {
  if (selected.length === 0 || candidate.length === 0) {
    return 0;
  }

  const normalizedCandidate = candidate.map(normalizeForMatch);
  return selected.reduce((count, term) => {
    const normalizedTerm = normalizeForMatch(term);
    return count + (normalizedCandidate.some((item) => item.includes(normalizedTerm)) ? 1 : 0);
  }, 0);
}

export function paymentModelMatchesFilter(
  therapistPaymentModel: "private_pay" | "insurance" | "both",
  requestedPaymentModel?: string
) {
  if (!requestedPaymentModel) {
    return true;
  }

  if (requestedPaymentModel === "both") {
    return therapistPaymentModel === "both";
  }

  if (therapistPaymentModel === "both") {
    return requestedPaymentModel === "private_pay" || requestedPaymentModel === "insurance";
  }

  return therapistPaymentModel === requestedPaymentModel;
}

export function insuranceMatches(
  insurance: string,
  therapistInsuranceAccepted: string[],
  therapistPaymentModel: "private_pay" | "insurance" | "both"
) {
  if (!insurance) {
    return true;
  }

  const normalizedInsurance = normalizeForMatch(insurance);

  if (normalizedInsurance === "not sure") {
    return true;
  }

  // If a specific carrier is requested and therapist is private pay only, exclude them
  if (
    insurance &&
    normalizedInsurance !== "not sure" &&
    normalizedInsurance !== "out of network" &&
    therapistPaymentModel === "private_pay"
  ) {
    return false;
  }

  // Empty list means the therapist's accepted carriers are unknown — never exclude them.
  if (!therapistInsuranceAccepted || therapistInsuranceAccepted.length === 0) {
    return true;
  }

  const normalizedAccepted = therapistInsuranceAccepted.map(normalizeForMatch);

  if (normalizedInsurance === "out of network") {
    return therapistPaymentModel !== "insurance" || normalizedAccepted.includes("out of network");
  }

  return normalizedAccepted.some((item) => item.includes(normalizedInsurance));
}

// New structured matching functions
export function levelOfCareMatches(levelOfCare: string, therapistOfferings: string[], therapistBio: string): boolean {
  if (!levelOfCare) return true;

  const normalizedLevel = normalizeForMatch(levelOfCare);
  const normalizedOfferings = therapistOfferings.map(normalizeForMatch);
  const normalizedBio = normalizeForMatch(therapistBio);

  // Default to weekly therapy if no specific level mentioned
  if (normalizedLevel === "weekly therapy") {
    // Pass if therapist has no offerings listed (individual private practice default)
    if (!therapistOfferings || therapistOfferings.length === 0) return true;

    // Pass if therapist explicitly offers weekly/outpatient therapy
    const offersWeeklyTherapy = normalizedOfferings.some((o) =>
      o.includes("weekly") ||
      o.includes("individual") ||
      o.includes("outpatient") ||
      o.includes("group therapy")
    );
    if (offersWeeklyTherapy) return true;

    // Exclude agency/IOP/PHP/Residential-only accounts
    const agencyOnlyTerms = ["iop", "intensive outpatient", "php", "partial hospitalization", "residential"];
    const isAgencyOnly = normalizedOfferings.every((o) =>
      agencyOnlyTerms.some((term) => o.includes(term))
    );
    return !isAgencyOnly;
  }

  // Check offerings and bio for specific level support
  const levelKeywords: Record<string, string[]> = {
    "group therapy": ["group therapy", "group sessions", "groups"],
    "intensive outpatient (iop)": ["intensive outpatient", "iop", "intensive program"],
    "partial hospitalization (php)": ["partial hospitalization", "php", "day treatment"],
    "residential treatment": ["residential", "inpatient", "treatment center"]
  };

  const keywords = levelKeywords[normalizedLevel] || [];
  return keywords.some(keyword =>
    normalizedOfferings.some(offering => offering.includes(keyword)) ||
    normalizedBio.includes(keyword)
  );
}

export function clientTypeMatches(clientType: string, therapistPopulations: string[]): boolean {
  if (!clientType) return true;

  const normalizedType = normalizeForMatch(clientType);
  const normalizedPopulations = therapistPopulations.map(normalizeForMatch);

  const typeMappings: Record<string, string[]> = {
    "adult individual": ["adults", "adult", "individual"],
    "child individual": ["children", "child", "kids"],
    "adolescent individual": ["teens", "adolescents", "teenagers"],
    "couples": ["couples", "relationship", "marital"],
    "families": ["families", "family", "parenting"]
  };

  const keywords = typeMappings[normalizedType] || [normalizedType];
  return keywords.some(keyword =>
    normalizedPopulations.some(pop => pop.includes(keyword))
  );
}

const LEGACY_SPECIALTY_MAP: Record<string, string[]> = {
  "Trauma / PTSD": ["Trauma", "PTSD", "Trauma / PTSD"],
  "Relationship Conflict": ["Relationship Conflict", "Relationship issues", "Couples", "Communication Issues", "Premarital", "Infidelity"],
  "Life Transitions": ["Life Transitions", "Life transitions", "Burnout", "Self Esteem"],
  "Autism / Neurodivergence": ["Autism / Neurodivergence", "Neurodivergence"],
  "Psychosis / Schizophrenia Spectrum": ["Psychosis", "Schizophrenia / Schizophrenia-Spectrum", "Schizoaffective Disorder"],
  "Infidelity": ["Infidelity"],
  "Anger Management": ["Anger Management"],
};

export function presentingIssueMatches(presentingIssue: string, therapistSpecialties: string[]): boolean {
  if (!presentingIssue) return true;

  const normalizedIssue = normalizeForMatch(presentingIssue);
  const normalizedSpecialties = therapistSpecialties.map(normalizeForMatch);

  const issueMappings: Record<string, string[]> = {
    "anxiety":                          ["anxiety", "panic", "perfectionism", "phobia", "ocd", "social anxiety", "generalized anxiety"],
    "depression":                       ["depression", "mood disorder", "mood disorders", "dysthymia", "seasonal"],
    "trauma / ptsd":                    ["trauma", "ptsd", "post-traumatic", "childhood trauma", "complex trauma",
                                         "dissociat", "domestic violence", "abuse", "reparenting", "somatic experiencing"],
    "ocd":                              ["ocd", "obsessive-compulsive", "obsessive"],
    "substance use":                    ["substance", "addiction", "alcohol", "drugs", "harm reduction",
                                         "relapse", "recovery", "process addiction", "substance use", "substance use disorders"],
    "eating disorder":                  ["eating disorder", "eating disorders", "eating", "anorexia",
                                         "bulimia", "body image", "body dysmorphia"],
    "infidelity":                       ["infidelity", "affairs", "betrayal", "infidelity / affairs"],
    "relationship conflict":            ["relationship conflict", "conflict", "communication", "couple", "couples",
                                         "marital", "relationship issues", "interpersonal"],
    "intimacy / sexual issues":         ["intimacy", "sexual", "sex therapy", "sexuality", "desire",
                                         "dysfunction", "intimacy issues"],
    "adhd":                             ["adhd", "attention deficit", "add", "executive function", "focus", "attention"],
    "autism / neurodivergence":         ["autism", "autistic", "asd", "neurodivergent", "neurodivergence",
                                         "spectrum", "asperger"],
    "postpartum / perinatal":           ["postpartum", "perinatal", "postnatal", "maternal", "pregnancy",
                                         "new mom", "new parent", "birth trauma"],
    "parenting":                        ["parenting", "parent", "family", "maternal", "play therapy", "co-dependency", "codependency"],
    "life transitions":                 ["life transition", "life transitions", "transition", "career",
                                         "relocation", "retirement", "major life change"],
    "grief / bereavement":              ["grief", "loss", "bereavement", "grief / loss", "grief / bereavement"],
    "anger management":                 ["anger", "anger management", "rage", "aggression", "self-harm", "high-conflict", "bpd"],
    "bipolar disorder":                 ["bipolar", "mood disorder", "mood disorders", "bpd", "borderline"],
    "psychosis / schizophrenia spectrum": ["psychosis", "schizophrenia", "schizoaffective", "schizophrenia-spectrum"],
    "personality disorders":            ["personality disorder", "personality disorders", "bpd", "borderline"],
    "dissociative disorders":           ["dissociat"],
    "self-harm / suicidality":          ["self-harm", "suicid", "self harm", "si"],
  };

  const keywords = issueMappings[normalizedIssue] ?? [normalizedIssue];
  if (keywords.some((keyword) =>
    normalizedSpecialties.some((spec) => spec.includes(keyword))
  )) return true;

  const legacyValues = LEGACY_SPECIALTY_MAP[presentingIssue] ?? [];
  return legacyValues.some((val) =>
    normalizedSpecialties.some((spec) => spec.includes(normalizeForMatch(val)))
  );
}

export function locationMatches(location: string, therapistNeighborhoods: string[], therapistCity: string, therapistTelehealth: boolean): boolean {
  if (!location) return true;

  const normalizedLocation = normalizeForMatch(location);

  if (normalizedLocation === "telehealth only") {
    return therapistTelehealth;
  }

  // Check neighborhoods and city for location match
  const normalizedNeighborhoods = therapistNeighborhoods.map(normalizeForMatch);
  const normalizedCity = normalizeForMatch(therapistCity);

  const locationMappings: Record<string, string[]> = {
    "central austin": ["central austin", "downtown", "central"],
    "north austin": ["north austin", "north"],
    "south austin": ["south austin", "south"],
    "east austin": ["east austin", "east"],
    "west austin": ["west austin", "west"],
    "round rock": ["round rock"],
    "cedar park": ["cedar park"],
    "pflugerville": ["pflugerville"],
    "georgetown": ["georgetown"],
    "oak hill": ["oak hill"],
    "westlake hills": ["westlake hills", "westlake"],
    "buda / kyle": ["buda", "kyle"],
    "leander": ["leander"],
    "austin (general)": ["austin", "central", "north", "south", "east", "west"]
  };

  const keywords = locationMappings[normalizedLocation] || [normalizedLocation];
  const keywordMatch = keywords.some(keyword =>
    normalizedNeighborhoods.some(neigh => neigh.includes(keyword)) ||
    normalizedCity.includes(keyword)
  );
  if (keywordMatch) return true;

  // Fall back to REGION_ALIASES so neighborhoods like "Arboretum" match "North Austin"
  const canonicalRegion = AUSTIN_METRO_AREAS.find(area => normalizeForMatch(area) === normalizedLocation);
  const selectedRegionAliases = canonicalRegion ? REGION_ALIASES[canonicalRegion] : [];
  return normalizedNeighborhoods.some(neigh =>
    selectedRegionAliases.some(alias => neigh.includes(normalizeForMatch(alias)))
  );
}

/**
 * Returns a signed score for how well a specific insurance carrier matches a therapist.
 *   +1  — therapist lists the carrier
 *   -1  — therapist lists other carriers but NOT this one
 *    0  — therapist's list is empty/unknown (unknown passes; do not penalize)
 */
export function carrierScore(
  carrier: string,
  therapistInsuranceAccepted: string[]
): number {
  if (!carrier) return 0;
  const normalizedCarrier = normalizeForMatch(carrier);
  if (normalizedCarrier === "not sure" || normalizedCarrier === "out of network") return 0;

  if (!therapistInsuranceAccepted || therapistInsuranceAccepted.length === 0) return 0;

  const normalizedAccepted = therapistInsuranceAccepted.map(normalizeForMatch);
  const found = normalizedAccepted.some(
    (item) => item.includes(normalizedCarrier) || normalizedCarrier.includes(item)
  );
  return found ? 1 : -1;
}

export function calculateMatchConfidence(
  levelOfCare: string,
  clientType: string,
  presentingIssues: string[],
  payment: string,
  location: string,
  _insurance: string,
  therapist: PublicTherapistSummary,
  softCriteria?: { modalities?: string[]; communities?: string[]; languages?: string[] }
): "high" | "medium" | "low" {
  let matches = 0;
  let total = 0;

  // Level of Care
  if (levelOfCare) {
    total++;
    if (levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) {
      matches++;
    }
  }

  // Client Type
  if (clientType) {
    total++;
    if (clientTypeMatches(clientType, therapist.populations)) {
      matches++;
    }
  }

  // Presenting Issues — one dimension; matches if ANY selected issue matches
  if (presentingIssues.length > 0) {
    total++;
    if (presentingIssues.some((issue) => presentingIssueMatches(issue, therapist.specialties))) {
      matches++;
    }
  }

  // Location
  if (location) {
    total++;
    if (locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) {
      matches++;
    }
  }

  // Soft criteria — only counted when the therapist has data for that field.
  // Guard prevents penalising therapists for fields they simply haven't filled in.
  if (softCriteria?.modalities?.length && therapist.modalities.length > 0) {
    total++;
    if (countOverlappingTerms(softCriteria.modalities, therapist.modalities) > 0) matches++;
  }

  if (softCriteria?.communities?.length && therapist.communities.length > 0) {
    total++;
    if (countOverlappingTerms(softCriteria.communities, therapist.communities) > 0) matches++;
  }

  if (softCriteria?.languages?.length && therapist.languages.length > 0) {
    total++;
    if (countOverlappingTerms(softCriteria.languages, therapist.languages) > 0) matches++;
  }

  // Payment: soft factor — mismatch caps confidence at "medium", not excluded from results
  const normalizedPayment = payment ? payment.toLowerCase().replace(/ /g, "_") : "";
  const paymentCompatible =
    !normalizedPayment ||
    paymentModelMatchesFilter(therapist.paymentModel, normalizedPayment);

  const matchRatio = total > 0 ? matches / total : 0;

  if (matchRatio >= 0.8) return paymentCompatible ? "high" : "medium";
  if (matchRatio >= 0.6) return "medium";
  return "low";
}

export type MatchDimension = {
  label: string;
  value: string;
  status: "match" | "gap";
};

/**
 * Returns one entry per criterion the referrer actually set, with a match/gap status.
 * Used to render per-dimension visual breakdowns on therapist match cards.
 */
export function getMatchDimensions(
  levelOfCare: string,
  clientType: string,
  presentingIssues: string[],
  payment: string,
  location: string,
  insurance: string,
  therapist: PublicTherapistSummary,
  softCriteria?: { modalities?: string[]; communities?: string[]; languages?: string[] }
): MatchDimension[] {
  const dimensions: MatchDimension[] = [];

  if (levelOfCare) {
    dimensions.push({
      label: "Level of Care",
      value: levelOfCare,
      status: levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio) ? "match" : "gap"
    });
  }

  if (clientType) {
    dimensions.push({
      label: "Client Type",
      value: clientType,
      status: clientTypeMatches(clientType, therapist.populations) ? "match" : "gap"
    });
  }

  if (presentingIssues.length > 0) {
    const matchedCount = presentingIssues.filter((i) => presentingIssueMatches(i, therapist.specialties)).length;
    dimensions.push({
      label: presentingIssues.length === 1 ? "Issue" : `Issues (${matchedCount}/${presentingIssues.length})`,
      value: presentingIssues.join(", "),
      status: matchedCount > 0 ? "match" : "gap"
    });
  }

  if (payment) {
    dimensions.push({
      label: "Payment",
      value: payment,
      status: paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_")) ? "match" : "gap"
    });
  }

  if (location) {
    dimensions.push({
      label: "Location",
      value: location,
      status: locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth) ? "match" : "gap"
    });
  }

  if (insurance) {
    dimensions.push({
      label: "Insurance",
      value: insurance,
      status: insuranceMatches(insurance, therapist.insuranceAccepted, therapist.paymentModel) ? "match" : "gap"
    });
  }

  if (softCriteria?.modalities?.length) {
    dimensions.push({
      label: softCriteria.modalities.length === 1 ? softCriteria.modalities[0] : `${softCriteria.modalities.length} modalities`,
      value: softCriteria.modalities.join(", "),
      status: countOverlappingTerms(softCriteria.modalities, therapist.modalities) > 0 ? "match" : "gap"
    });
  }

  if (softCriteria?.communities?.length) {
    dimensions.push({
      label: softCriteria.communities.length === 1 ? softCriteria.communities[0] : `${softCriteria.communities.length} communities`,
      value: softCriteria.communities.join(", "),
      status: countOverlappingTerms(softCriteria.communities, therapist.communities) > 0 ? "match" : "gap"
    });
  }

  if (softCriteria?.languages?.length) {
    dimensions.push({
      label: softCriteria.languages.length === 1 ? softCriteria.languages[0] : `${softCriteria.languages.length} languages`,
      value: softCriteria.languages.join(", "),
      status: countOverlappingTerms(softCriteria.languages, therapist.languages) > 0 ? "match" : "gap"
    });
  }

  return dimensions;
}

export function generateMatchExplanation(
  levelOfCare: string,
  clientType: string,
  presentingIssue: string,
  payment: string,
  location: string,
  insurance: string,
  therapist: PublicTherapistSummary
): string[] {
  const explanations: string[] = [];

  // Level of Care
  if (levelOfCare) {
    if (levelOfCareMatches(levelOfCare, therapist.offerings, therapist.bio)) {
      explanations.push(`Supports ${levelOfCare.toLowerCase()}`);
    } else {
      explanations.push(`May not support ${levelOfCare.toLowerCase()}`);
    }
  }

  // Client Type
  if (clientType) {
    if (clientTypeMatches(clientType, therapist.populations)) {
      explanations.push(`Works with ${clientType.toLowerCase()}`);
    } else {
      explanations.push(`May not work with ${clientType.toLowerCase()}`);
    }
  }

  // Presenting Issue
  if (presentingIssue) {
    if (presentingIssueMatches(presentingIssue, therapist.specialties)) {
      explanations.push(`Specializes in ${presentingIssue.toLowerCase()}`);
    } else {
      explanations.push(`May not specialize in ${presentingIssue.toLowerCase()}`);
    }
  }

  // Payment
  if (payment) {
    const paymentMatch = paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"));
    if (paymentMatch) {
      explanations.push(`Accepts ${payment.toLowerCase()}`);
    } else {
      explanations.push(`Payment compatibility unclear`);
    }
  }

  // Location
  if (location) {
    if (locationMatches(location, therapist.neighborhoods, therapist.city, therapist.telehealth)) {
      explanations.push(`Serves ${location.toLowerCase()}`);
    } else {
      explanations.push(`May not serve ${location.toLowerCase()}`);
    }
  }

  // Insurance
  if (insurance) {
    if (insuranceMatches(insurance, therapist.insuranceAccepted, therapist.paymentModel)) {
      explanations.push(`Accepts ${insurance.toLowerCase()}`);
    } else if (normalizeForMatch(insurance) !== "not sure") {
      explanations.push(`Insurance compatibility unclear for ${insurance.toLowerCase()}`);
    }
  }

  // Availability
  if (therapist.availabilityStatus === "accepting") {
    explanations.push("Strong availability signal: accepting new referrals");
  } else if (therapist.availabilityStatus === "waitlist") {
    explanations.push("Limited availability: waitlist only");
  }

  // Trust
  if (therapist.trustedByViewer) {
    explanations.push("Trusted by you");
  } else if (therapist.isFollowed) {
    explanations.push("In your network");
  } else if (therapist.trustedBy.length > 0) {
    explanations.push(`Trusted by ${therapist.trustedBy.length} colleague${therapist.trustedBy.length > 1 ? 's' : ''}`);
  }

  return explanations;
}

export function getDynamicDropdownOptions() {
  return {
    locations: Array.from(LOCATION_OPTIONS).sort(),
    presentingIssues: Array.from(PRESENTING_ISSUES).sort(),
    clientTypes: Array.from(CLIENT_TYPES).sort(),
    levelsOfCare: Array.from(LEVELS_OF_CARE).sort(),
    paymentOptions: Array.from(PAYMENT_OPTIONS).sort(),
    insuranceOptions: Array.from(INSURANCE_CARRIERS).sort(),
    languages: Array.from(LANGUAGES).sort(),
    genders: Array.from(GENDERS).sort()
  };
}

/** Criteria beyond the core six that can narrow or boost matches. All fields optional; omitted = no filter. */
export interface ExtendedCriteria {
  /** Soft — communities the client identifies with; matched against therapist.communities */
  communities?: string[];
  /** Soft — therapeutic modalities preferred; matched against therapist.modalities */
  modalities?: string[];
  /** Soft — language(s) the client needs; matched against therapist.languages */
  languages?: string[];
  /** Soft — additional population signals; matched against therapist.populations */
  populations?: string[];
  /** Hard — "Telehealth" | "In person" | "Both"; empty/omitted = no filter */
  format?: string;
  /** Hard — therapist gender preference; empty / "No preference" / omitted = no filter */
  gender?: string;
  /** Hard — true = only therapists offering sliding scale */
  slidingScale?: boolean;
  /** Hard — true = only therapists currently accepting new clients */
  acceptingNow?: boolean;
}

/**
 * Returns false if any hard criterion is set and the therapist fails it.
 * Call this as a pre-filter before scoring; excluded therapists skip scoring entirely.
 */
export function passesHardFilters(
  criteria: ExtendedCriteria,
  therapist: PublicTherapistSummary
): boolean {
  const { format, gender, slidingScale, acceptingNow } = criteria;

  if (format) {
    const f = normalizeForMatch(format);
    if (f === "telehealth" && !therapist.telehealth) return false;
    if (f === "in person" && !therapist.inPerson) return false;
    if (f === "both" && !(therapist.telehealth && therapist.inPerson)) return false;
  }

  if (gender && normalizeForMatch(gender) !== "no preference") {
    if (therapist.gender && normalizeForMatch(therapist.gender) !== normalizeForMatch(gender)) {
      return false;
    }
  }

  if (slidingScale === true && !therapist.slidingScale) return false;

  if (acceptingNow === true && therapist.availabilityStatus !== "accepting") return false;

  return true;
}

/**
 * Returns a non-negative integer bonus to add to a therapist's total rank score.
 * Each overlapping term in any soft-overlap dimension contributes +1.
 * Add this to trustScore + availabilityScore + confidenceScore in the compose form.
 */
export function softOverlapScore(
  criteria: ExtendedCriteria,
  therapist: PublicTherapistSummary
): number {
  let bonus = 0;

  if (criteria.communities?.length) {
    bonus += countOverlappingTerms(criteria.communities, therapist.communities);
  }

  if (criteria.modalities?.length) {
    bonus += countOverlappingTerms(criteria.modalities, therapist.modalities);
  }

  if (criteria.languages?.length) {
    bonus += countOverlappingTerms(criteria.languages, therapist.languages);
  }

  if (criteria.populations?.length) {
    bonus += countOverlappingTerms(criteria.populations, therapist.populations);
  }

  return bonus;
}
