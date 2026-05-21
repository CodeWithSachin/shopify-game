"use client";

import { useEffect, useRef } from "react";

type LoopFn = (dtSec: number) => void;

/**
 * requestAnimationFrame loop with capped delta-time. Calls `fn` once per
 * frame while `active` is true. dt is clamped to 32ms (≈30fps) so tab-switch
 * gaps don't cause big physics jumps.
 *
 * The latest `fn` is read via a ref so callers don't have to memoize.
 */
export function useGameLoop(fn: LoopFn, active: boolean): void {
  const fnRef = useRef<LoopFn>(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dtMs = Math.min(32, now - last);
      last = now;
      fnRef.current(dtMs / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [active]);
}
