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
 * A falling product. The source photos are PNG cutouts, so we render the
 * image directly — no card, no ring, no overflow clipping. A soft
 * drop-shadow lifts the product off the canvas. If the photo 404s, the
 * inline-SVG silhouette is swapped in via <img onError>.
 *
 * IMPORTANT: takes primitive x/y/w/h so memo() picks up per-frame mutations
 * (passing the whole entity object would share a reference and skip renders).
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
      {premium && (
        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-spykar-red px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md">
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
        className="h-full w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
      />
    </div>
  );
}

export const FallingProduct = memo(FallingProductInner);
