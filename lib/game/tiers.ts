export interface Tier {
  /** inclusive lower bound */
  min: number;
  label: string;
  reward: string | null;
  /** coupon code prefix, e.g. "CATCH10" — null = no coupon */
  prefix: string | null;
}

export const TIERS: Tier[] = [
  { min: 0, label: "Almost! Try again", reward: null, prefix: null },
  { min: 100, label: "5% off", reward: "5% off", prefix: "CATCH5" },
  { min: 250, label: "10% off", reward: "10% off", prefix: "CATCH10" },
  { min: 500, label: "15% off + free shipping", reward: "15% off + free shipping", prefix: "CATCH15" },
];

export function tierForScore(score: number): Tier {
  // TIERS sorted ascending; find the highest min ≤ score.
  let match = TIERS[0];
  for (const t of TIERS) {
    if (score >= t.min) match = t;
  }
  return match;
}

/** Returns null if the tier offers no coupon. */
export function makeCouponCode(score: number): string | null {
  const t = tierForScore(score);
  if (!t.prefix) return null;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${t.prefix}-${rand}`;
}
