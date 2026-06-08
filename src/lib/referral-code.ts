// Excludes visually ambiguous characters: 0 O 1 I L
const UNAMBIGUOUS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function mintReferralCode(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += UNAMBIGUOUS[Math.floor(Math.random() * UNAMBIGUOUS.length)];
  }
  return `CASE-${suffix}`;
}
