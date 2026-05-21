"use client";

import { useCallback, useEffect, useState } from "react";

export type SoundCue = "catch" | "miss" | "tier_up" | "start" | "end" | "combo";

const KEY = "spykar:catch:sound";

/**
 * Phase 1 sound stub. No audio files yet — just console.log the cues so the
 * Phase 4 swap to a real <audio> / WebAudio implementation is mechanical.
 */
export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.localStorage.getItem(KEY);
      if (v != null) setEnabled(v === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((cur) => {
      const next = !cur;
      try {
        window.localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const play = useCallback(
    (cue: SoundCue) => {
      if (!enabled) return;
      // eslint-disable-next-line no-console
      console.log(`[sound] ${cue}`);
    },
    [enabled]
  );

  return { enabled, toggle, play };
}
