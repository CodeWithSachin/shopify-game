"use client";

import { create } from "zustand";
import type { FallingEntity } from "./physics";
import { STARTING_LIVES } from "./difficulty";
import { makeCouponCode, tierForScore, type Tier } from "./tiers";

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
  lives: number;
  timeRemaining: number; // seconds
  elapsed: number; // seconds since game start
  products: FallingEntity[];
  caughtCount: number;
  missedCount: number;
  highScore: number;
  scorePops: ScorePop[];
  caughtFlashKey: number; // bump to trigger cart-bounce animation
  missFlashKey: number; // bump to trigger screen shake
  finalCoupon: string | null;
  finalTier: Tier | null;
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

  tickTime: (dtSec: number) => void;
  consumeScorePop: (id: string) => void;
  hydrateHighScore: () => void;
}

const INITIAL: State = {
  gameState: "idle",
  score: 0,
  combo: 0,
  lives: STARTING_LIVES,
  timeRemaining: 60,
  elapsed: 0,
  products: [],
  caughtCount: 0,
  missedCount: 0,
  highScore: 0,
  scorePops: [],
  caughtFlashKey: 0,
  missFlashKey: 0,
  finalCoupon: null,
  finalTier: null,
  countdownValue: 3,
};

const HIGH_SCORE_KEY = "spykar:catch:hi";

export const useGameStore = create<State & Actions>()((set, get) => ({
  ...INITIAL,

  startCountdown: () =>
    set({
      ...INITIAL,
      highScore: get().highScore,
      gameState: "countdown",
      countdownValue: 3,
    }),

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
    const tier = tierForScore(score);
    set({
      gameState: "ended",
      highScore: newHi,
      finalCoupon: makeCouponCode(score),
      finalTier: tier,
    });
  },

  reset: () => set({ ...INITIAL, highScore: get().highScore }),

  addProduct: (e) => set((s) => ({ products: [...s.products, e] })),

  removeProduct: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

  setProducts: (list) => set({ products: list }),

  recordCatch: (entityId, basePoints, x, y) => {
    const { combo, score } = get();
    const newCombo = combo + 1;
    const multiplier = newCombo >= 3 ? 2 : 1;
    const points = basePoints * multiplier;
    const pop: ScorePop = {
      id: `pop-${Date.now()}-${Math.random()}`,
      x,
      y,
      value: points,
    };
    set((s) => ({
      score: score + points,
      combo: newCombo,
      caughtCount: s.caughtCount + 1,
      products: s.products.filter((p) => p.id !== entityId),
      scorePops: [...s.scorePops, pop],
      caughtFlashKey: s.caughtFlashKey + 1,
    }));
  },

  recordMiss: () => {
    const { lives } = get();
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
