"use client";

import { RotateCcw, ShoppingBag, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/lib/game/store";
import { MAX_SCORE } from "@/lib/game/difficulty";
import { ClaimForm } from "./ClaimForm";

interface EndScreenProps {
  onPlayAgain: () => void;
  shopUrl?: string;
}

export function EndScreen({
  onPlayAgain,
  shopUrl = "https://www.spykar.com",
}: EndScreenProps) {
  const gameState = useGameStore((s) => s.gameState);
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const loyaltyPoints = useGameStore((s) => s.finalLoyaltyPoints);
  const tier = useGameStore((s) => s.finalTier);
  const caughtCount = useGameStore((s) => s.caughtCount);

  const isNewBest = score >= highScore && score > 0;
  const atCap = score >= MAX_SCORE;

  return (
    <Dialog open={gameState === "ended"}>
      <DialogContent
        hideClose
        className="max-h-[92vh] max-w-md overflow-y-auto text-center sm:max-w-lg"
      >
        <div className="mx-auto mb-2 inline-flex items-center gap-1 rounded-full bg-spykar-ink/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-spykar-ink">
          Round complete
        </div>
        <DialogTitle className="text-4xl">
          {atCap ? "Maxed out." : isNewBest ? "New personal best." : "Nice catch."}
        </DialogTitle>
        <DialogDescription className="mt-1">
          You caught {caughtCount}{" "}
          {caughtCount === 1 ? "denim piece" : "denim pieces"}.
        </DialogDescription>

        <div className="my-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-spykar-cream p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Final score
            </div>
            <div className="text-4xl font-black leading-tight text-spykar-red tabular-nums">
              {score}
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
              {highScore}
              {isNewBest && <Trophy className="h-5 w-5 text-spykar-warning" />}
            </div>
          </div>
        </div>

        {/* Loyalty reward */}
        <div className="rounded-lg border border-spykar-red/30 bg-gradient-to-b from-spykar-red/5 to-transparent p-5">
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-spykar-red" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
              {tier?.label ?? "Loyalty reward"}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <div className="text-5xl font-black leading-none text-spykar-red tabular-nums">
              {loyaltyPoints ?? 0}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-spykar-ink">
              Spykar
              <br />
              Loyalty Pts
            </div>
          </div>
          {tier?.tagline && (
            <Badge variant="outline" className="mt-3">
              {tier.tagline}
            </Badge>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Credited to your Spykar account · redeemable on next purchase
          </p>
        </div>

        {/* Claim form — Phase 1 simulates submit + shows toast. Phase 3 wires
            the POST to /api/loyalty/claim. */}
        <div className="mt-1">
          <ClaimForm loyaltyPoints={loyaltyPoints ?? 0} score={score} />
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button onClick={onPlayAgain} variant="outline" className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Play again
          </Button>
          <Button asChild className="flex-1">
            <a href={shopUrl} target="_blank" rel="noreferrer">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Shop now
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
