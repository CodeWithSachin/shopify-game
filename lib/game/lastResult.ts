/**
 * Persistence for the most recent round summary.
 *
 * The end-of-round UI used to live in a dialog inside <GameCanvas>, which
 * kept the Zustand store as the single source of truth. The result is now a
 * full page at `/result`, and we need the summary to survive a route change
 * (and a hard refresh) — so we snapshot it to localStorage when `endGame()`
 * runs and read it back on the result page.
 *
 * If the snapshot is missing or corrupt, the result page redirects to `/`.
 */

import type { LoyaltyTier } from "./tiers";

export interface LastResultSnapshot {
  score: number;
  caughtCount: number;
  /** High score AFTER this round (may equal `score` if it was a new best). */
  highScore: number;
  isNewBest: boolean;
  /** True if the player hit MAX_SCORE. */
  atCap: boolean;
  finalLoyaltyPoints: number;
  finalTier: LoyaltyTier | null;
  /** Unix ms — when this snapshot was written. */
  savedAt: number;
}

const KEY = "spykar:catch:lastResult";

export function saveLastResult(snap: LastResultSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {
    /* ignore — quota / disabled storage */
  }
}

export function readLastResult(): LastResultSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastResultSnapshot>;
    // Minimal shape check — a corrupt snapshot should redirect, not crash.
    if (typeof parsed.score !== "number") return null;
    if (typeof parsed.caughtCount !== "number") return null;
    if (typeof parsed.finalLoyaltyPoints !== "number") return null;
    return parsed as LastResultSnapshot;
  } catch {
    return null;
  }
}

export function clearLastResult(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
