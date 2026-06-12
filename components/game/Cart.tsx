"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";

interface CartProps {
  width: number;
  height: number;
  bounceKey: number; // changing this triggers the catch bounce
  reducedMotion: boolean;
}

/**
 * The cart sprite. Renders the brand-supplied PNG (public/Cart.webp) — the
 * artwork already includes the Spykar swoosh and red body, so the wrapper is
 * intentionally minimal (no denim texture, ring, or stitched-edge overlays).
 *
 * Positioning: this element is absolutely placed; the parent updates the
 * outer transform via the forwarded ref at 60fps without re-renders. The inner
 * <motion.div> only handles the per-catch bounce animation.
 */
export const Cart = forwardRef<HTMLDivElement, CartProps>(function Cart(
  { width, height, bounceKey, reducedMotion },
  ref
) {
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute bottom-12 left-0 z-20"
      style={{ width, height, transform: "translate3d(0,0,0)" }}
    >
      <motion.div
        key={bounceKey}
        initial={false}
        animate={
          reducedMotion ? undefined : { scale: [1, 1.12, 1], y: [0, -6, 0] }
        }
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative h-full w-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Cart.webp"
          alt="Cart"
          width={width}
          height={height}
          draggable={false}
          className="h-full w-full select-none object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
        />
      </motion.div>
    </div>
  );
});
