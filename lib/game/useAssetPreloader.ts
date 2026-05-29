"use client";

import { useEffect, useRef, useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-products";

/**
 * Asset preloading.
 *
 * The game shows falling product PNGs. If they haven't downloaded yet, the
 * first few drops would pop in late (or briefly show the inline-SVG fallback).
 * To avoid that, we download every product image up front — in the background
 * when the player lands — and gate the START button until they're all resolved.
 *
 * Inline-SVG silhouettes are `data:` URIs (no network) so they're skipped.
 * The optional store backdrop (`/store-bg.png`) is loaded lazily via CSS and is
 * allowed to be missing, so it is intentionally NOT part of the blocking set.
 */
export function collectGameAssetUrls(): string[] {
  const urls = new Set<string>();
  for (const p of MOCK_PRODUCTS) {
    if (p.image && !p.image.startsWith("data:")) urls.add(p.image);
  }
  return Array.from(urls);
}

/**
 * Preload one image. Resolves on BOTH load and error: a product photo that
 * 404s falls back to its inline silhouette at render time, so a missing file
 * must never block the game from starting (otherwise `ready` would hang).
 */
function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Fire-and-forget cache warm. Safe to call from any client component (e.g. the
 * landing page) so assets are already in the browser cache by the time the
 * player reaches /play. No-ops during SSR.
 */
export function preloadGameAssets(): Promise<boolean[]> {
  if (typeof window === "undefined") return Promise.resolve([]);
  return Promise.all(collectGameAssetUrls().map(preloadImage));
}

export interface PreloadState {
  total: number;
  loaded: number;
  /** True once every asset has resolved (loaded or errored). */
  ready: boolean;
  /** 0..1 download progress. */
  progress: number;
}

/**
 * Tracks the background download of all game assets. Use `ready` to gate the
 * START button and `progress` to show a loading indicator.
 */
export function useAssetPreloader(): PreloadState {
  // Collect URLs once. Stored in a ref so the list (and `total`) is stable
  // across renders and the effect runs exactly once.
  const urlsRef = useRef<string[] | null>(null);
  if (urlsRef.current === null) {
    urlsRef.current = collectGameAssetUrls();
  }
  const total = urlsRef.current.length;

  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const urls = urlsRef.current ?? [];
    if (urls.length === 0) return;

    urls.forEach((url) => {
      preloadImage(url).then(() => {
        if (!cancelled) setLoaded((n) => n + 1);
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    total,
    loaded,
    ready: total === 0 || loaded >= total,
    progress: total === 0 ? 1 : loaded / total,
  };
}
