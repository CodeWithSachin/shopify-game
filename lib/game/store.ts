"use client";

import { create } from "zustand";
import type { FallingEntity } from "./physics";
import {
  DEFAULT_LIVES,
  MAX_SCORE,
  ROUND_DURATION_S,
  readLivesSetting,
} from "./difficulty";
import { loyaltyForScore, type LoyaltyTier } from "./tiers";

export type GameState =
  | "idle"
  | "countdown"
  | "playing"
  | "paused"
  | "ended";

interface ScorePop {
  id: string;
  x: number;
  y: number;
  value: number;
}

interface State {
  gameState: GameState;
  score: number;
  combo: number; // catches in a row
  /**
   * Current lives remaining. When `maxLives` is `null` (unlimited),
   * this field is unused and reads as `0` — the HUD checks `maxLives`
   * to decide whether to render the lives indicator at all.
   */
  lives: number;
  /**
   * Lives setting for this round, captured at countdown start so a
   * mid-round admin edit can't shrink the player's life pool. `null`
   * means unlimited (no decrement, no game-over on lives).
   */
  maxLives: number | null;
  timeRemaining: number; // seconds
  elapsed: number; // seconds since game start
  products: FallingEntity[];
  caughtCount: number;
  missedCount: number;
  highScore: number;
  scorePops: ScorePop[];
  caughtFlashKey: number; // bump to trigger cart-bounce animation
  missFlashKey: number; // bump to trigger screen shake
  finalLoyaltyPoints: number | null;
  finalTier: LoyaltyTier | null;
  countdownValue: number; // 3, 2, 1
}

interface Actions {
  startCountdown: () => void;
  tickCountdown: () => void;
  beginPlay: () => void;
  pause: () => void;
  resume: () => void;
  endGame: () => void;
  reset: () => void;

  addProduct: (e: FallingEntity) => void;
  removeProduct: (id: string) => void;
  setProducts: (list: FallingEntity[]) => void;

  recordCatch: (entityId: string, basePoints: number, x: number, y: number) => void;
  recordMiss: () => void;
  /** Generic score-debit action — used by bombs and non-denim catches. */
  recordPenalty: (amount: number, x: number, y: number) => void;

  tickTime: (dtSec: number) => void;
  consumeScorePop: (id: string) => void;
  hydrateHighScore: () => void;
}

const INITIAL: State = {
  gameState: "idle",
  score: 0,
  combo: 0,
  lives: DEFAULT_LIVES ?? 0,
  maxLives: DEFAULT_LIVES,
  timeRemaining: ROUND_DURATION_S,
  elapsed: 0,
  products: [],
  caughtCount: 0,
  missedCount: 0,
  highScore: 0,
  scorePops: [],
  caughtFlashKey: 0,
  missFlashKey: 0,
  finalLoyaltyPoints: null,
  finalTier: null,
  countdownValue: 3,
};

const HIGH_SCORE_KEY = "spykar:catch:hi";

export const useGameStore = create<State & Actions>()((set, get) => ({
  ...INITIAL,

  startCountdown: () => {
    // Snapshot the lives setting at countdown time. If admin changes it
    // mid-round, the change applies next round — not retroactively.
    const setting = readLivesSetting();
    set({
      ...INITIAL,
      highScore: get().highScore,
      gameState: "countdown",
      countdownValue: 3,
      maxLives: setting,
      lives: setting ?? 0,
    });
  },

  tickCountdown: () => {
    const next = get().countdownValue - 1;
    if (next <= 0) {
      get().beginPlay();
    } else {
      set({ countdownValue: next });
    }
  },

  beginPlay: () => set({ gameState: "playing", countdownValue: 0 }),

  pause: () => {
    if (get().gameState === "playing") set({ gameState: "paused" });
  },

  resume: () => {
    if (get().gameState === "paused") set({ gameState: "playing" });
  },

  endGame: () => {
    const { score, highScore } = get();
    const newHi = Math.max(highScore, score);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(newHi));
      } catch {
        /* ignore */
      }
    }
    const tier = loyaltyForScore(score);
    set({
      gameState: "ended",
      highScore: newHi,
      finalLoyaltyPoints: tier.points,
      finalTier: tier,
    });
  },

  reset: () => {
    // Re-read the lives setting on reset so the "Play again" button picks
    // up any admin edits that happened between rounds.
    const setting = readLivesSetting();
    set({
      ...INITIAL,
      highScore: get().highScore,
      maxLives: setting,
      lives: setting ?? 0,
    });
  },

  addProduct: (e) => set((s) => ({ products: [...s.products, e] })),

  removeProduct: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  setProducts: (list) => set({ products: list }),

  recordCatch: (entityId, basePoints, x, y) => {
    const { combo, score } = get();
    // Combo multiplier removed — score = sum of base points so totals match
    // the badges visible on the falling products. `combo` is still tracked
    // as a streak counter for future use, but does not affect points.
    const newScore = Math.min(MAX_SCORE, score + basePoints);
    const actualDelta = newScore - score; // 0 once capped at MAX_SCORE

    const popList: ScorePop[] =
      actualDelta > 0
        ? [
            {
              id: `pop-${Date.now()}-${Math.random()}`,
              x,
              y,
              value: actualDelta,
            },
          ]
        : [];

    set((s) => ({
      score: newScore,
      combo: combo + 1,
      caughtCount: s.caughtCount + 1,
      products: s.products.filter((p) => p.id !== entityId),
      scorePops: [...s.scorePops, ...popList],
      caughtFlashKey: s.caughtFlashKey + 1,
    }));
  },

  recordMiss: () => {
    const { lives, maxLives } = get();

    // Unlimited mode: track the miss for stats and trigger the screen-shake
    // but don't decrement, and don't end the round on lives.
    if (maxLives === null) {
      set((s) => ({
        combo: 0,
        missedCount: s.missedCount + 1,
        missFlashKey: s.missFlashKey + 1,
      }));
      return;
    }

    const remaining = lives - 1;
    set((s) => ({
      lives: remaining,
      combo: 0,
      missedCount: s.missedCount + 1,
      missFlashKey: s.missFlashKey + 1,
    }));
    if (remaining <= 0) {
      get().endGame();
    }
  },

  /**
   * Generic score-debit. Caller passes the absolute penalty amount.
   * Used by bombs (BOMB_PENALTY) and non-denim catches (NON_DENIM_PENALTY).
   * Floors score at 0, resets combo, triggers the screen-shake animation.
   */
  recordPenalty: (amount, x, y) => {
    const { score } = get();
    const newScore = Math.max(0, score - amount);
    const actualDelta = newScore - score; // negative or 0
    const popList: ScorePop[] =
      actualDelta < 0
        ? [
            {
              id: `pop-${Date.now()}-${Math.random()}`,
              x,
              y,
              value: actualDelta,
            },
          ]
        : [];
    set((s) => ({
      score: newScore,
      combo: 0,
      missFlashKey: s.missFlashKey + 1,
      scorePops: [...s.scorePops, ...popList],
    }));
  },

  tickTime: (dtSec) => {
    const { timeRemaining, elapsed, gameState } = get();
    if (gameState !== "playing") return;
    const remaining = Math.max(0, timeRemaining - dtSec);
    set({ timeRemaining: remaining, elapsed: elapsed + dtSec });
    if (remaining <= 0) get().endGame();
  },

  consumeScorePop: (id) =>
    set((s) => ({ scorePops: s.scorePops.filter((p) => p.id !== id) })),

  hydrateHighScore: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
      const n = raw ? parseInt(raw, 10) : 0;
      if (!Number.isNaN(n)) set({ highScore: n });
    } catch {
      /* ignore */
    }
  },
}));
