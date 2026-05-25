/**
 * Loyalty-points reward tiers.
 *
 *   score ∈ [0, 100)   → Tier 1 → 100 LP
 *   score ∈ [100, 300) → Tier 2 → 200 LP
 *   score ∈ [300, 400) → Tier 3 → 350 LP
 *   score ∈ [400, ∞)   → Tier 4 → 400 LP
 *
 * Note `tierForScore` is the public lookup. The legacy `makeCouponCode` /
 * `Tier` exports were removed when we switched from discount coupons to
 * loyalty points — search & replace if you still see them referenced.
 */

export interface LoyaltyTier {
  /** Inclusive lower score bound */
  min: number;
  label: string;
  /** Loyalty points awarded */
  points: number;
  /** Optional short marketing tagline */
  tagline?: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { min: 0,   label: "Tier 1", points: 100, tagline: "Nice catch — keep going" },
  { min: 100, label: "Tier 2", points: 200, tagline: "Solid haul" },
  { min: 300, label: "Tier 3", points: 350, tagline: "Denim devotee" },
  { min: 400, label: "Tier 4", points: 400, tagline: "Spykar royalty" },
];

/** Return the highest tier whose `min` is ≤ score. */
export function loyaltyForScore(score: number): LoyaltyTier {
  let match = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) {
    if (score >= t.min) match = t;
  }
  return match;
}
