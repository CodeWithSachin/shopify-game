/**
 * Difficulty curve.
 *
 * - Spawn interval shrinks by 50ms every 15s (floor 350ms).
 * - Fall speed multiplier +10% every 30s.
 */

export const BASE_SPAWN_MS = 1100;
export const MIN_SPAWN_MS = 500;
export const SPAWN_STEP_MS = 60;
export const SPAWN_STEP_INTERVAL_S = 15;

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

export const BASE_FALL_SPEED = 220; // px / sec
export const FALL_SPEED_BUMP = 0.1;
export const FALL_BUMP_INTERVAL_S = 30;

export const GRAVITY = 80; // px / sec^2 (mild extra acceleration on top of base fall)

export const ROUND_DURATION_S = 60;
export const STARTING_LIVES = 3;

export function spawnIntervalAt(elapsedSec: number): number {
  const steps = Math.floor(elapsedSec / SPAWN_STEP_INTERVAL_S);
  const ms = BASE_SPAWN_MS - steps * SPAWN_STEP_MS;
  return Math.max(MIN_SPAWN_MS, ms);
}

export function fallSpeedAt(elapsedSec: number): number {
  const steps = Math.floor(elapsedSec / FALL_BUMP_INTERVAL_S);
  return BASE_FALL_SPEED * Math.pow(1 + FALL_SPEED_BUMP, steps);
}
