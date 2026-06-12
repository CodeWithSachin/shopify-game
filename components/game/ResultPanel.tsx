"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MAX_SCORE } from "@/lib/game/difficulty";
import { useGameStore } from "@/lib/game/store";
import type { LastResultSnapshot } from "@/lib/game/lastResult";
import { ClaimForm } from "./ClaimForm";

interface ResultPanelProps {
  /** Round summary read by the page from localStorage. */
  snapshot: LastResultSnapshot;
  /** External Spykar store URL — opened by the "Shop now" button. */
  shopUrl?: string;
}

/**
 * Non-dialog version of the round-summary UI. Identical visual content to the
 * old <EndScreen> dialog, but renders inside a page (app/result/page.tsx).
 *
 * - Data source: a snapshot read from localStorage, NOT the Zustand store.
 *   This lets the player refresh /result without losing the result.
 * - "Play again": clears working state via `reset()` then navigates back to
 *   /play so the next round starts on a clean idle state.
 */
export function ResultPanel({
  snapshot: snap,
  shopUrl = "https://www.spykar.com",
}: ResultPanelProps) {
  const router = useRouter();
  const reset = useGameStore((s) => s.reset);

  const onPlayAgain = () => {
    reset();
    router.push("/play");
  };

  return (
    <div className="rounded-lg border border-white/10 bg-spykar-ink/40 p-6 text-center text-white shadow-2xl backdrop-blur sm:p-8">
      <div className="mx-auto mb-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white backdrop-blur">
        Round complete
      </div>

      <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">
        {snap.atCap
          ? "Maxed out."
          : snap.isNewBest
            ? "New personal best."
            : "Nice catch."}
      </h1>
      <p className="mt-1 text-sm text-white/80">
        You caught {snap.caughtCount}{" "}
        {snap.caughtCount === 1 ? "denim piece" : "denim pieces"}.
      </p>

      <div className="my-4 grid grid-cols-2 gap-3">
        <div className="rounded-md bg-spykar-cream p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Final score
          </div>
          <div className="text-4xl font-black leading-tight text-spykar-red tabular-nums">
            {snap.score}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            / {MAX_SCORE}
          </div>
        </div>
        <div className="rounded-md bg-spykar-cream p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Best
          </div>
          <div className="flex items-baseline justify-center gap-1 text-4xl font-black leading-tight text-spykar-ink tabular-nums">
            {snap.highScore}
            {snap.isNewBest && (
              <Trophy className="h-5 w-5 text-spykar-warning" />
            )}
          </div>
        </div>
      </div>

      {/* Loyalty reward — kept on a light surface to pop against denim */}
      <div className="rounded-lg border border-spykar-red/30 bg-gradient-to-b from-white to-spykar-cream p-5 text-spykar-ink">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-spykar-red" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
            {snap.finalTier?.label ?? "Loyalty reward"}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-center gap-2">
          <div className="text-5xl font-black leading-none text-spykar-red tabular-nums">
            {snap.finalLoyaltyPoints}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-spykar-ink">
            Spykar
            <br />
            Loyalty Pts
          </div>
        </div>
        {snap.finalTier?.tagline && (
          <Badge variant="outline" className="mt-3">
            {snap.finalTier.tagline}
          </Badge>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Credited to your Spykar account · redeemable on next purchase
        </p>
      </div>

      {/* Claim form — submits to /api/loyalty/claim, which forwards to Sheets. */}
      <div className="mt-4">
        <ClaimForm
          loyaltyPoints={snap.finalLoyaltyPoints}
          score={snap.score}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={onPlayAgain}
          variant="outline"
          className="w-full border-white/30 bg-white/5 text-white hover:bg-white/10 sm:flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Play again
        </Button>
        <Button asChild className="w-full sm:flex-1">
          <a href={shopUrl} target="_blank" rel="noreferrer">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Shop now
          </a>
        </Button>
      </div>
    </div>
  );
}
