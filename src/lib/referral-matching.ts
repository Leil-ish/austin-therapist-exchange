import type { PublicTherapistSummary } from "@/types";

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
  "Outpatient",
  "Group",
  "IOP",
  "PHP",
  "Residential"
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
  "Trauma",
  "PTSD",
  "OCD",
  "SUD",
  "Eating Disorder",
  "Infidelity",
  "Parenting",
  "Self Esteem",
  "Grief Loss",
  "Burnout",
  "Sleep",
  "Bipolar Disorder",
  "Anger"
] as const;

export const PAYMENT_OPTIONS = [
  "Insurance",
  "Private Pay",
  "Both"
] as const;

export const LOCATION_OPTIONS = [
  "Central Austin",
  "North Austin",
  "South Austin",
  "East Austin",
  "West Austin",
  "Round Rock",
  "Cedar Park",
  "Telehealth Only"
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
  "Mindfulness-based"
] as const;

export const INSURANCE_CARRIERS = [
  "Aetna",
  "Blue Cross Blue Shield",
  "Cigna",
  "UnitedHealthcare",
  "Oscar",
  "Oxford",
  "UMR",
  "Magellan",
  "Scott & White",
  "Tricare",
  "Medicare",
  "Medicaid",
  "Out of network"
] as const;

export const URGENCY_LEVELS = ["Low", "Medium", "High", "Urgent"] as const;

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

// New structured matching functions
export function levelOfCareMatches(levelOfCare: string, therapistOfferings: string[], therapistBio: string): boolean {
  if (!levelOfCare) return true;

  const normalizedLevel = normalizeForMatch(levelOfCare);
  const normalizedOfferings = therapistOfferings.map(normalizeForMatch);
  const normalizedBio = normalizeForMatch(therapistBio);

  // Default to outpatient if no specific level mentioned
  if (normalizedLevel === "outpatient") {
    return true;
  }

  // Check offerings and bio for specific level support
  const levelKeywords: Record<string, string[]> = {
    "group": ["group therapy", "group sessions", "groups"],
    "iop": ["intensive outpatient", "iop", "intensive program"],
    "php": ["partial hospitalization", "php", "day treatment"],
    "residential": ["residential", "inpatient", "treatment center"]
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

export function presentingIssueMatches(presentingIssue: string, therapistSpecialties: string[]): boolean {
  if (!presentingIssue) return true;

  const normalizedIssue = normalizeForMatch(presentingIssue);
  const normalizedSpecialties = therapistSpecialties.map(normalizeForMatch);

  const issueMappings: Record<string, string[]> = {
    "anxiety": ["anxiety", "panic"],
    "depression": ["depression", "mood"],
    "trauma": ["trauma", "ptsd", "post-traumatic"],
    "ptsd": ["ptsd", "post-traumatic", "trauma"],
    "ocd": ["ocd", "obsessive-compulsive"],
    "sud": ["addiction", "substance", "alcohol", "drugs"],
    "eating disorder": ["eating disorder", "eating", "anorexia", "bulimia"],
    "infidelity": ["infidelity", "affairs", "betrayal"],
    "parenting": ["parenting", "parent", "family"],
    "self esteem": ["self-esteem", "self worth", "confidence"],
    "grief loss": ["grief", "loss", "bereavement"],
    "burnout": ["burnout", "stress", "work-life"],
    "sleep": ["sleep", "insomnia"],
    "bipolar disorder": ["bipolar", "mood disorder"],
    "anger": ["anger", "rage", "aggression"]
  };

  const keywords = issueMappings[normalizedIssue] || [normalizedIssue];
  return keywords.some(keyword =>
    normalizedSpecialties.some(spec => spec.includes(keyword))
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
    "cedar park": ["cedar park"]
  };

  const keywords = locationMappings[normalizedLocation] || [normalizedLocation];
  return keywords.some(keyword =>
    normalizedNeighborhoods.some(neigh => neigh.includes(keyword)) ||
    normalizedCity.includes(keyword)
  );
}

export function calculateMatchConfidence(
  levelOfCare: string,
  clientType: string,
  presentingIssue: string,
  payment: string,
  location: string,
  therapist: PublicTherapistSummary
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

  // Presenting Issue
  if (presentingIssue) {
    total++;
    if (presentingIssueMatches(presentingIssue, therapist.specialties)) {
      matches++;
    }
  }

  // Payment
  if (payment) {
    total++;
    if (paymentModelMatchesFilter(therapist.paymentModel, payment.toLowerCase().replace(" ", "_"))) {
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

  const matchRatio = total > 0 ? matches / total : 0;

  if (matchRatio >= 0.8) return "high";
  if (matchRatio >= 0.6) return "medium";
  return "low";
}

export function generateMatchExplanation(
  levelOfCare: string,
  clientType: string,
  presentingIssue: string,
  payment: string,
  location: string,
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

export function getDynamicDropdownOptions(therapists: PublicTherapistSummary[]) {
  const locations = new Set<string>();
  const presentingIssues = new Set<string>();
  const clientTypes = new Set<string>();
  const levelsOfCare = new Set<string>();
  const paymentOptions = new Set<string>();

  therapists.forEach(therapist => {
    // Locations
    therapist.neighborhoods.forEach(neigh => {
      const normalized = normalizeForMatch(neigh);
      // Map to our canonical options
      if (normalized.includes("central") || normalized.includes("downtown")) {
        locations.add("Central Austin");
      } else if (normalized.includes("north")) {
        locations.add("North Austin");
      } else if (normalized.includes("south")) {
        locations.add("South Austin");
      } else if (normalized.includes("east")) {
        locations.add("East Austin");
      } else if (normalized.includes("west")) {
        locations.add("West Austin");
      }
    });

    if (therapist.city) {
      const normalizedCity = normalizeForMatch(therapist.city);
      if (normalizedCity.includes("round rock")) locations.add("Round Rock");
      if (normalizedCity.includes("cedar park")) locations.add("Cedar Park");
    }

    if (therapist.telehealth) {
      locations.add("Telehealth Only");
    }

    // Presenting Issues - map specialties to our canonical issues
    therapist.specialties.forEach(specialty => {
      const normalized = normalizeForMatch(specialty);
      if (normalized.includes("anxiety")) presentingIssues.add("Anxiety");
      if (normalized.includes("depression")) presentingIssues.add("Depression");
      if (normalized.includes("trauma") || normalized.includes("ptsd")) {
        presentingIssues.add("Trauma");
        presentingIssues.add("PTSD");
      }
      if (normalized.includes("ocd")) presentingIssues.add("OCD");
      if (normalized.includes("addiction") || normalized.includes("substance")) presentingIssues.add("SUD");
      if (normalized.includes("eating")) presentingIssues.add("Eating Disorder");
      if (normalized.includes("infidelity") || normalized.includes("affair")) presentingIssues.add("Infidelity");
      if (normalized.includes("parenting")) presentingIssues.add("Parenting");
      if (normalized.includes("self") && normalized.includes("esteem")) presentingIssues.add("Self Esteem");
      if (normalized.includes("grief")) presentingIssues.add("Grief Loss");
      if (normalized.includes("burnout")) presentingIssues.add("Burnout");
      if (normalized.includes("sleep") || normalized.includes("insomnia")) presentingIssues.add("Sleep");
      if (normalized.includes("bipolar")) presentingIssues.add("Bipolar Disorder");
      if (normalized.includes("anger")) presentingIssues.add("Anger");
    });

    // Client Types - map populations to our canonical types
    therapist.populations.forEach(population => {
      const normalized = normalizeForMatch(population);
      if (normalized.includes("adult") && !normalized.includes("child") && !normalized.includes("teen")) {
        clientTypes.add("Adult Individual");
      }
      if (normalized.includes("child")) clientTypes.add("Child Individual");
      if (normalized.includes("adolescent") || normalized.includes("teen")) clientTypes.add("Adolescent Individual");
      if (normalized.includes("couples")) clientTypes.add("Couples");
      if (normalized.includes("families") || normalized.includes("family")) clientTypes.add("Families");
    });

    // Levels of Care - check offerings and bio
    const combinedText = [...therapist.offerings, therapist.bio].join(" ").toLowerCase();
    if (combinedText.includes("group")) levelsOfCare.add("Group");
    if (combinedText.includes("intensive outpatient") || combinedText.includes("iop")) levelsOfCare.add("IOP");
    if (combinedText.includes("partial") || combinedText.includes("php")) levelsOfCare.add("PHP");
    if (combinedText.includes("residential")) levelsOfCare.add("Residential");
    // Always include Outpatient as default
    levelsOfCare.add("Outpatient");

    // Payment Options
    if (therapist.paymentModel === "private_pay") paymentOptions.add("Private Pay");
    if (therapist.paymentModel === "insurance") paymentOptions.add("Insurance");
    if (therapist.paymentModel === "both") {
      paymentOptions.add("Private Pay");
      paymentOptions.add("Insurance");
      paymentOptions.add("Both");
    }
  });

  return {
    locations: Array.from(locations).sort(),
    presentingIssues: Array.from(presentingIssues).sort(),
    clientTypes: Array.from(clientTypes).sort(),
    levelsOfCare: Array.from(levelsOfCare).sort(),
    paymentOptions: Array.from(paymentOptions).sort()
  };
}
