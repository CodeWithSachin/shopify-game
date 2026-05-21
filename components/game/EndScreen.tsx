"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, ShoppingBag, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/lib/game/store";

interface EndScreenProps {
  onPlayAgain: () => void;
  shopUrl?: string;
}

export function EndScreen({ onPlayAgain, shopUrl = "https://www.spykar.com" }: EndScreenProps) {
  const gameState = useGameStore((s) => s.gameState);
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const coupon = useGameStore((s) => s.finalCoupon);
  const tier = useGameStore((s) => s.finalTier);
  const caughtCount = useGameStore((s) => s.caughtCount);

  const [copied, setCopied] = useState(false);

  const isNewBest = score >= highScore && score > 0;

  const copy = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <Dialog open={gameState === "ended"}>
      <DialogContent hideClose className="max-w-md text-center">
        <div className="mx-auto mb-2 inline-flex items-center gap-1 rounded-full bg-spykar-ink/5 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.25em] text-spykar-ink">
          Round complete
        </div>
        <DialogTitle className="text-4xl">
          {isNewBest ? "New personal best." : "Nice catch."}
        </DialogTitle>
        <DialogDescription className="mt-1">
          You caught {caughtCount} {caughtCount === 1 ? "product" : "products"}.
        </DialogDescription>

        <div className="my-4 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-spykar-cream p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Final score
            </div>
            <div className="text-4xl font-black leading-tight text-spykar-red tabular-nums">
              {score}
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

        <div className="rounded-md border border-border bg-card p-4">
          {tier?.reward && coupon ? (
            <>
              <Badge className="mb-2">{tier.reward}</Badge>
              <div className="flex items-center justify-center gap-2">
                <code className="rounded-md border border-dashed border-spykar-red/40 bg-spykar-red/5 px-3 py-2 text-lg font-bold tracking-widest text-spykar-red">
                  {coupon}
                </code>
                <Button size="icon" variant="outline" onClick={copy} aria-label="Copy coupon">
                  {copied ? <Check className="h-4 w-4 text-spykar-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Single-use · 24h expiry · min cart ₹1,499
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tier?.label ?? "Almost! Score 100+ to unlock a coupon."}
            </p>
          )}
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
