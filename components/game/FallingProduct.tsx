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
  /** Denim catches reward points; everything else penalizes */
  isDenim: boolean;
  /** Points awarded for catching this item — positive for denim, must be passed
   *  alongside `penalty` for non-denim. */
  points: number;
  /** Score deduction when a non-denim item is caught */
  penalty: number;
}

/**
 * A falling product. PNG cutouts are rendered directly (no card), with a
 * soft drop-shadow. Visual hints to teach the scoring rule:
 *
 * - Premium denim: red "+25" badge.
 * - Non-denim accessories/packaging: ink "-X" badge + slightly dimmed image.
 *   You want to AVOID catching these.
 *
 * IMPORTANT: takes primitive props (x/y/w/h) so memo() picks up the
 * per-frame mutations — passing the entity object would share a reference
 * and skip renders.
 */
function FallingProductInner({
  x,
  y,
  w,
  h,
  image,
  silhouette,
  name,
  isDenim,
  points,
  penalty,
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
      {/* Point badge — every product shows what catching it scores. */}
      {isDenim ? (
        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-spykar-red px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md">
          +{points}
        </div>
      ) : (
        <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-spykar-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-md ring-1 ring-spykar-red">
          −{penalty}
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
        className={
          "h-full w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]" +
          (isDenim ? "" : " opacity-75 saturate-75")
        }
      />
    </div>
  );
}

export const FallingProduct = memo(FallingProductInner);
