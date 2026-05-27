"use client";

import { motion } from "framer-motion";
import { Heart, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useGameStore } from "@/lib/game/store";
import { ROUND_DURATION_S } from "@/lib/game/difficulty";
import { cn } from "@/lib/utils";

interface HUDProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
}

export function HUD({ soundEnabled, onToggleSound, onTogglePause }: HUDProps) {
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const maxLives = useGameStore((s) => s.maxLives);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const gameState = useGameStore((s) => s.gameState);

  const sec = Math.ceil(timeRemaining);
  const lowTime = sec <= 10 && gameState === "playing";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-4 sm:px-6 sm:pt-6">
      {/* left: score */}
      <div className="pointer-events-auto flex flex-col items-start gap-2">
        <div className="rounded-lg bg-white/95 px-4 py-2 shadow-md backdrop-blur">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Score
          </div>
          <motion.div
            key={score}
            initial={{ scale: 1 }}
            animate={{ scale: [1.18, 1] }}
            transition={{ duration: 0.22 }}
            className="text-3xl font-black leading-none text-spykar-red tabular-nums"
          >
            {score}
          </motion.div>
        </div>
      </div>

      {/* center: countdown timer */}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <motion.div
          animate={lowTime ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={lowTime ? { duration: 0.8, repeat: Infinity } : undefined}
          className={cn(
            "rounded-full bg-white/95 px-5 py-2 shadow-md backdrop-blur",
            lowTime && "ring-2 ring-spykar-red"
          )}
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
            Time
          </div>
          <div
            className={cn(
              "text-2xl font-black leading-none tabular-nums",
              lowTime ? "text-spykar-red" : "text-spykar-ink"
            )}
          >
            {String(Math.max(0, sec)).padStart(2, "0")}s
          </div>
        </motion.div>
        <div className="hidden text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:block">
          of {ROUND_DURATION_S}s
        </div>
      </div>

      {/* right: lives + controls */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Lives indicator — only rendered when the merchant has set a finite
            lives count. In unlimited mode (default) the slot is hidden entirely
            so the HUD stays uncluttered. */}
        {maxLives !== null && (
          <div className="flex items-center gap-1 rounded-lg bg-white/95 px-3 py-2 shadow-md backdrop-blur">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "h-5 w-5 transition-colors",
                  i < lives ? "fill-spykar-red text-spykar-red" : "fill-transparent text-muted-foreground/40"
                )}
                strokeWidth={2.2}
              />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            className="rounded-full bg-white/95 p-2 shadow-md backdrop-blur transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={gameState === "paused" ? "Resume" : "Pause"}
            className="rounded-full bg-white/95 p-2 shadow-md backdrop-blur transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {gameState === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
