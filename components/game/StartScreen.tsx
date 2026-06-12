"use client";

import { motion } from "framer-motion";
import { Loader2, Play, Smartphone, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";

interface StartScreenProps {
  onStart: () => void;
  /** False while game assets are still downloading — disables START. */
  assetsReady?: boolean;
  /** 0..1 asset download progress, shown while not ready. */
  progress?: number;
}

/**
 * Idle screen. Matches the dark denim mockup: Game-BG-2 as the backdrop, the
 * Feed-Your-Greed wordmark as the hero, white body copy, single mobile-hint
 * card, and the START button. Asset-preload state takes over the button copy
 * while images are still downloading.
 */
export function StartScreen({
  onStart,
  assetsReady = true,
  progress = 1,
}: StartScreenProps) {
  const highScore = useGameStore((s) => s.highScore);
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/Game-BG-2.webp')" }}
    >
      {/* Tint over the bg so type stays legible regardless of the image's
          local contrast. */}
      <div className="absolute inset-0 bg-spykar-ink/30" aria-hidden />

      <div className="relative mx-6 max-w-md text-center">
        {/* Feed Your Greed wordmark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Feed-Your-Greed-Logo-Unit.webp"
          alt="Feed Your Greed"
          className="mx-auto h-auto w-full max-w-sm select-none drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:max-w-md"
          draggable={false}
        />

        <p className="mx-auto mt-5 max-w-sm text-sm text-white/90 sm:text-base">
          Catch <span className="font-semibold text-white">DENIM ONLY</span> in
          30 seconds. Accessories and bombs deduct score. Score 400+ to earn 500
          Spykar Loyalty Points.
        </p>

        <div className="mx-auto mt-6 flex justify-center">
          <div className="rounded-md border border-white/10 bg-white p-3 text-left text-xs shadow-md">
            <Smartphone className="h-4 w-4 text-spykar-red" />
            <div className="mt-1 font-semibold text-spykar-ink">Mobile</div>
            <div className="text-muted-foreground">Drag your finger</div>
          </div>
        </div>

        {highScore > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            <Trophy className="h-3.5 w-3.5 text-spykar-warning" />
            Your best: <span className="font-extrabold">{highScore}</span>
          </div>
        )}

        <div className="mt-7">
          <Button
            size="xl"
            onClick={onStart}
            disabled={!assetsReady}
            className="rounded-full px-12 shadow-lg"
          >
            {assetsReady ? (
              <>
                <Play className="mr-2 h-5 w-5 fill-current" />
                START
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading {pct}%
              </>
            )}
          </Button>
        </div>

        {/* Asset download progress — only while still loading. */}
        {!assetsReady && (
          <div
            className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-label="Loading game assets"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="h-full bg-spykar-red transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        <p className="mt-3 text-[11px] uppercase tracking-widest text-white/70">
          {assetsReady ? (
            <span className="sr-only">
              Press{" "}
              <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-semibold">
                Space
              </kbd>{" "}
              to start
            </span>
          ) : (
            "Downloading game assets…"
          )}
        </p>
      </div>
    </motion.div>
  );
}
