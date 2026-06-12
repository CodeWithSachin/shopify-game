"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  readLastResult,
  type LastResultSnapshot,
} from "@/lib/game/lastResult";
import { ResultPanel } from "@/components/game/ResultPanel";

/**
 * /result — full page version of what used to be the EndScreen dialog.
 *
 * Loads the round summary from localStorage (written by the store's
 * `endGame()` action). If nothing is found — e.g. someone deep-linked here
 * without playing — we redirect to the landing page.
 *
 * We deliberately do NOT read from the Zustand store here: that state doesn't
 * survive a hard refresh, so the localStorage snapshot is the canonical source.
 */
export default function ResultPage() {
  const router = useRouter();
  const [snap, setSnap] = useState<LastResultSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const s = readLastResult();
    if (!s) {
      router.replace("/");
      return;
    }
    setSnap(s);
    setHydrated(true);
  }, [router]);

  // Brief blank while we check storage / redirect.
  if (!hydrated || !snap) return null;

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: "url('/Game-BG-2.webp')" }}
    >
      {/* Tint over the bg so type stays legible regardless of local contrast. */}
      <div
        className="pointer-events-none absolute inset-0 bg-spykar-ink/40"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        <ResultPanel snapshot={snap} />
      </div>
    </main>
  );
}
