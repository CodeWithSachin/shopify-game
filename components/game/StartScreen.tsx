"use client";

import { motion } from "framer-motion";
import { Play, Smartphone, Mouse, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const highScore = useGameStore((s) => s.highScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-spykar-cream/95 backdrop-blur-sm"
    >
      <div className="mx-6 max-w-md text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-spykar-ink px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-spykar-red" />
          Young &amp; Restless
        </div>
        <h1 className="text-5xl font-black leading-[0.95] text-spykar-ink sm:text-6xl">
          Catch the
          <span className="block text-spykar-red">Drop.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground sm:text-base">
          Catch <span className="font-semibold text-spykar-ink">denim only</span> in
          30 seconds. Accessories and bombs deduct score. Score 400+ to earn
          400 Spykar Loyalty Points.
        </p>

        <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3 text-left text-xs">
          <div className="rounded-md border border-border bg-card p-3">
            <Mouse className="h-4 w-4 text-spykar-red" />
            <div className="mt-1 font-semibold">Desktop</div>
            <div className="text-muted-foreground">Move with the mouse</div>
          </div>
          <div className="rounded-md border border-border bg-card p-3">
            <Smartphone className="h-4 w-4 text-spykar-red" />
            <div className="mt-1 font-semibold">Mobile</div>
            <div className="text-muted-foreground">Drag your finger</div>
          </div>
        </div>

        {highScore > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-spykar-ink/5 px-3 py-1 text-xs font-semibold text-spykar-ink">
            <Trophy className="h-3.5 w-3.5 text-spykar-warning" />
            Your best: <span className="font-extrabold">{highScore}</span>
          </div>
        )}

        <div className="mt-7">
          <Button size="xl" onClick={onStart} className="rounded-full px-12 shadow-lg">
            <Play className="mr-2 h-5 w-5 fill-current" />
            START
          </Button>
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          Press <kbd className="rounded border border-border bg-white px-1.5 py-0.5 font-semibold">Space</kbd> to start
        </p>
      </div>
    </motion.div>
  );
}
