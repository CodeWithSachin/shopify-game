/**
 * Pure physics helpers. No React, no Zustand — easy to unit-test later.
 */

export interface Rect {
  x: number; // top-left
  y: number; // top-left
  w: number;
  h: number;
}

export interface FallingEntity {
  id: string;
  productId: string;
  x: number; // top-left, px
  y: number; // top-left, px
  w: number;
  h: number;
  vy: number; // px / second
}

/** AABB hit-test: does point (px, py) lie inside rect? */
export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** Does the bottom-center of `entity` overlap with `cart` rect? */
export function caughtBy(entity: FallingEntity, cart: Rect): boolean {
  const cx = entity.x + entity.w / 2;
  const cy = entity.y + entity.h * 0.85; // a bit above the bottom edge
  return pointInRect(cx, cy, cart);
}

/** Integrate vertical velocity over a frame. Mutates the entity. */
export function stepEntity(entity: FallingEntity, dtSec: number, gravity: number): void {
  entity.vy += gravity * dtSec;
  entity.y += entity.vy * dtSec;
}

/** Random number in [min, max). */
export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Lerp from `current` to `target` by smoothing factor `t` ∈ [0, 1]. */
export function lerp(current: number, target: number, t: number): number {
  return current + (target - current) * t;
}

/** Frame-rate independent lerp: t ≈ 1 - exp(-k * dt). */
export function smoothDamp(current: number, target: number, k: number, dtSec: number): number {
  return lerp(current, target, 1 - Math.exp(-k * dtSec));
}
