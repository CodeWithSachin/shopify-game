"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";

interface CartProps {
  width: number;
  height: number;
  bounceKey: number; // changing this triggers the catch bounce
  reducedMotion: boolean;
}

/**
 * The cart is positioned absolutely. The parent handles X translation via
 * inline transform on the outer element through the forwarded ref so we can
 * update position at 60fps without React re-renders.
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
          reducedMotion
            ? undefined
            : { scale: [1, 1.12, 1], y: [0, -6, 0] }
        }
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="denim-texture relative h-full w-full overflow-hidden rounded-md shadow-xl ring-2 ring-spykar-red/60"
      >
        {/* stitched edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 border-b border-spykar-red/30 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-white/90">
          <ShoppingCart className="h-7 w-7" strokeWidth={2.5} aria-hidden />
        </div>
        {/* spykar tab */}
        <div className="absolute right-1.5 top-1.5 rounded-sm bg-spykar-red px-1.5 py-0.5 text-[9px] font-extrabold tracking-widest text-white">
          SPYKAR
        </div>
      </motion.div>
    </div>
  );
});
