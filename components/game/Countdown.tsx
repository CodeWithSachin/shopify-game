"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";

export function Countdown() {
  const value = useGameStore((s) => s.countdownValue);
  const tick = useGameStore((s) => s.tickCountdown);
  const state = useGameStore((s) => s.gameState);

  useEffect(() => {
    if (state !== "countdown") return;
    const id = window.setTimeout(() => tick(), 800);
    return () => window.clearTimeout(id);
  }, [state, value, tick]);

  if (state !== "countdown") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-spykar-cream/70 backdrop-blur-sm">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-[12rem] font-black leading-none text-spykar-red drop-shadow-md"
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
