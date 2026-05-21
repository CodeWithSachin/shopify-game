"use client";

import { memo, useState } from "react";

interface FallingProductProps {
  /** Primitive geometry — keeps memo() effective across in-place physics updates */
  x: number;
  y: number;
  w: number;
  h: number;
  image: string;
  silhouette: string;
  name: string;
  premium: boolean;
}

/**
 * A falling product card.
 *
 * Renders inside a dark rounded card with a subtle red ring. The Spykar
 * product photos are shot on solid black backgrounds — embedding them in a
 * black card makes that background blend seamlessly so the product appears
 * to float. If the photo file is missing, the <img> onError swaps to the
 * inline-SVG silhouette so the game keeps working before assets are added.
 *
 * IMPORTANT: receives primitive `x, y, w, h` props instead of an entity
 * object. The game loop mutates entities in place for perf, so passing the
 * object would defeat memo() — primitives let React detect the position
 * change every frame and apply the new transform.
 */
function FallingProductInner({
  x,
  y,
  w,
  h,
  image,
  silhouette,
  name,
  premium,
}: FallingProductProps) {
  const [src, setSrc] = useState(image);

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
      <div className="relative h-full w-full overflow-hidden rounded-lg bg-spykar-ink shadow-[0_10px_30px_-8px_rgba(228,0,43,0.4),0_4px_12px_rgba(0,0,0,0.45)] ring-1 ring-spykar-red/35">
        {/* subtle top sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />
        {premium && (
          <div className="absolute left-1.5 top-1.5 z-10 rounded-full bg-spykar-red px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-md">
            +25
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          width={w}
          height={h}
          draggable={false}
          onError={() => {
            if (src !== silhouette) setSrc(silhouette);
          }}
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

export const FallingProduct = memo(FallingProductInner);
