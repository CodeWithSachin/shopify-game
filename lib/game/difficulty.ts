/**
 * Difficulty curve.
 *
 * Round is short (30s), so spawn interval and fall speed compress more
 * aggressively than a typical 60s arcade round.
 */

export const BASE_SPAWN_MS = 1100;
export const MIN_SPAWN_MS = 500;
export const SPAWN_STEP_MS = 70;
export const SPAWN_STEP_INTERVAL_S = 7; // step every 7s so we get ~4 steps in 30s

/**
 * Random spawn jitter multiplier — actual interval = base * randIn(MIN, MAX).
 * Keeps the cadence from feeling like a metronome and spreads landing times.
 */
export const SPAWN_JITTER_MIN = 0.65;
export const SPAWN_JITTER_MAX = 1.45;

/** Hard cap on simultaneous falling products. */
export const MAX_CONCURRENT_PRODUCTS = 4;

/** Minimum x-distance between a new spawn and an existing product still
 *  in the top portion of the stage. Expressed as multiplier of product width. */
export const SPAWN_X_PADDING_MULT = 1.25;

export const BASE_FALL_SPEED = 220; // px / sec at t=0
/** Multiplier applied to BASE_FALL_SPEED at t=ROUND_DURATION_S. */
export const FALL_SPEED_PEAK_MULT = 2.3;

export const GRAVITY = 80; // px / sec^2 — mild extra accel on top of base

export const ROUND_DURATION_S = 30;

// ---- Lives ---------------------------------------------------------------
/**
 * Lives are dynamic and configured by the merchant from /admin/products.
 *
 *   null  → unlimited (default). Missed denim still costs the combo and
 *           triggers a screen-shake, but does NOT end the round.
 *   number → finite. Missing this many denim items ends the round.
 *
 * Persisted in localStorage under LIVES_STORAGE_KEY. The store reads this
 * value at the start of every round so admin changes apply immediately.
 */
export const DEFAULT_LIVES: number | null = null;
export const LIVES_STORAGE_KEY = "spykar:catch:lives";
/** Hard cap so the admin form doesn't accept "1,000,000". */
export const MAX_LIVES_SETTING = 99;

export function readLivesSetting(): number | null {
  if (typeof window === "undefined") return DEFAULT_LIVES;
  try {
    const raw = window.localStorage.getItem(LIVES_STORAGE_KEY);
    if (raw === null || raw === "unlimited") return null;
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 1) return null;
    return Math.min(n, MAX_LIVES_SETTING);
  } catch {
    return DEFAULT_LIVES;
  }
}

// ---- Scoring -------------------------------------------------------------
/** Hard cap on score. Reaching MAX_SCORE caps additional catches silently. */
export const MAX_SCORE = 500;
/** Catching a non-denim product (belt, cap, hanger, bag, wallet) deducts this. */
export const NON_DENIM_PENALTY = 10;

// ---- Bombs ---------------------------------------------------------------
export const BOMB_PENALTY = 20; // score deducted when a bomb is caught

/**
 * Bomb spawn probability as a function of elapsed time.
 *
 * Thresholds are proportional to the round duration so the curve auto-scales
 * if you tweak ROUND_DURATION_S:
 *   [0,    10%) → 0%   grace period
 *   [10%,  30%) → 15%
 *   [30%,  55%) → 25%
 *   [55%,  ∞)   → 35%
 */
export function bombChanceAt(elapsedSec: number): number {
  const t = elapsedSec / ROUND_DURATION_S;
  if (t < 0.1) return 0;
  if (t < 0.3) return 0.15;
  if (t < 0.55) return 0.25;
  return 0.35;
}

export function spawnIntervalAt(elapsedSec: number): number {
  const steps = Math.floor(elapsedSec / SPAWN_STEP_INTERVAL_S);
  const ms = BASE_SPAWN_MS - steps * SPAWN_STEP_MS;
  return Math.max(MIN_SPAWN_MS, ms);
}

/**
 * Continuous fall-speed ramp.
 *
 * Linearly accelerates from BASE_FALL_SPEED at t=0 to
 * BASE_FALL_SPEED × FALL_SPEED_PEAK_MULT at t=ROUND_DURATION_S, then caps.
 */
export function fallSpeedAt(elapsedSec: number): number {
  const t = Math.min(1, Math.max(0, elapsedSec / ROUND_DURATION_S));
  return BASE_FALL_SPEED * (1 + t * (FALL_SPEED_PEAK_MULT - 1));
}
