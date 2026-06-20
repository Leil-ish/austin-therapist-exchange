import type { AvailabilityStatus } from "@/types";

export function getAvailabilityLabel(status: AvailabilityStatus) {
  if (status === "accepting") return "Accepting new clients";
  if (status === "waitlist") return "Limited openings";
  return "Not accepting referrals";
}
