"use client";

import { memo } from "react";
import { Bomb as BombIcon } from "lucide-react";

interface FallingBombProps {
  x: number;
  y: number;
  w: number;
  h: number;
  penalty: number;
}

/**
 * A falling bomb. Catching it costs `penalty` points and resets the combo.
 * Visually distinct from the cutout product photos — pulsing red glow,
 * ink body, bomb icon — so the player can read it instantly.
 */
function FallingBombInner({ x, y, w, h, penalty }: FallingBombProps) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-10 select-none"
      style={{
        width: w,
        height: h,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        willChange: "transform",
      }}
      aria-hidden
    >
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Pulsing red halo */}
        <div className="absolute inset-3 rounded-full bg-spykar-red opacity-60 blur-md animate-pulse" />
        {/* Bomb body */}
        <div className="relative flex h-[78%] w-[78%] items-center justify-center rounded-full bg-spykar-ink shadow-[0_0_24px_-2px_rgba(228,0,43,0.85)] ring-2 ring-spykar-red">
          <BombIcon
            className="h-1/2 w-1/2 text-spykar-red"
            strokeWidth={2.5}
            aria-hidden
          />
        </div>
        {/* Penalty badge */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-spykar-red px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-md">
          -{penalty}
        </div>
      </div>
    </div>
  );
}

export const FallingBomb = memo(FallingBombInner);
