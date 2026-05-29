"use client";

import { useEffect } from "react";
import { preloadGameAssets } from "@/lib/game/useAssetPreloader";

/**
 * Renders nothing. Warms the browser cache with the game's product images as
 * soon as the player lands on the platform, so by the time they navigate to
 * /play the assets are already downloaded and the START button is ready
 * immediately. Safe to drop anywhere in a server-rendered page.
 */
export function AssetPreloader() {
  useEffect(() => {
    preloadGameAssets();
  }, []);
  return null;
}
