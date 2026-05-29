"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Infinity as InfinityIcon, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_PRODUCTS, isPremium } from "@/lib/mock-products";
import {
  LIVES_STORAGE_KEY,
  MAX_LIVES_SETTING,
  readLivesSetting,
} from "@/lib/game/difficulty";

const STORAGE_KEY = "spykar:catch:activeProducts";

/** Default value shown in the limited-lives number input. */
const DEFAULT_LIMITED_LIVES = 3;

export default function AdminProductsPage() {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(MOCK_PRODUCTS.map((p) => p.id))
  );
  const [saved, setSaved] = useState(false);

  /**
   * Lives setting — drives whether the player sees a hearts HUD and whether
   * missing denim ends the round.
   *
   *   livesMode === "unlimited" → game ignores lives (default).
   *   livesMode === "limited"   → game uses `livesCount` as the cap.
   *
   * Persisted under LIVES_STORAGE_KEY. We track the input value separately
   * from the live setting so clearing the input doesn't immediately persist
   * a 0 / NaN.
   */
  const [livesMode, setLivesMode] = useState<"unlimited" | "limited">(
    "unlimited"
  );
  const [livesCount, setLivesCount] = useState<number>(DEFAULT_LIMITED_LIVES);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        setActive(new Set(ids));
      }
    } catch {
      /* ignore */
    }

    const livesSetting = readLivesSetting();
    if (livesSetting === null) {
      setLivesMode("unlimited");
    } else {
      setLivesMode("limited");
      setLivesCount(livesSetting);
    }
  }, []);

  const toggle = (id: string) => {
    setActive((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Clamp a free-typed value into the supported range. */
  const clampLives = (n: number): number => {
    if (Number.isNaN(n) || n < 1) return 1;
    return Math.min(n, MAX_LIVES_SETTING);
  };

  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(active)));
      if (livesMode === "unlimited") {
        window.localStorage.setItem(LIVES_STORAGE_KEY, "unlimited");
      } else {
        window.localStorage.setItem(
          LIVES_STORAGE_KEY,
          String(clampLives(livesCount))
        );
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const allOn = () => setActive(new Set(MOCK_PRODUCTS.map((p) => p.id)));
  const allOff = () => setActive(new Set());

  return (
    <main className="min-h-screen bg-spykar-cream">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground">
                Spykar × Feed Your Greed
              </div>
              <h1 className="text-lg font-bold leading-tight">Game catalog</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={allOff}>Disable all</Button>
            <Button variant="outline" size="sm" onClick={allOn}>Enable all</Button>
            <Button size="sm" onClick={save}>
              {saved ? <Check className="mr-1.5 h-4 w-4" /> : <Save className="mr-1.5 h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <Card className="mb-6 border-l-4 border-l-spykar-red">
          <CardHeader>
            <CardTitle className="text-base">Phase 1 — mock catalog</CardTitle>
            <CardDescription>
              Toggle which products drop in the game. Selection persists in
              browser localStorage and is read by <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/play</code>.
              In Phase 2 this is replaced by the <code className="rounded bg-muted px-1.5 py-0.5 text-xs">game-active</code> Shopify collection.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Game settings — lives configuration. Applies to the next round
            started after Save. */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Game settings</CardTitle>
            <CardDescription>
              Configure round mechanics. Changes apply on the next round.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Lives per round</Label>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Unlimited option */}
                <label
                  className={
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors " +
                    (livesMode === "unlimited"
                      ? "border-spykar-red bg-spykar-red/5 ring-1 ring-spykar-red"
                      : "border-border hover:bg-muted/40")
                  }
                >
                  <input
                    type="radio"
                    name="lives-mode"
                    value="unlimited"
                    checked={livesMode === "unlimited"}
                    onChange={() => setLivesMode("unlimited")}
                    className="mt-1 accent-spykar-red"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-spykar-ink">
                      <InfinityIcon className="h-4 w-4 text-spykar-red" />
                      Unlimited
                      <Badge variant="outline" className="ml-1 text-[9px]">
                        Default
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Missed denim only resets the combo. Round ends on the
                      30-second timer.
                    </div>
                  </div>
                </label>

                {/* Limited option */}
                <label
                  className={
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors " +
                    (livesMode === "limited"
                      ? "border-spykar-red bg-spykar-red/5 ring-1 ring-spykar-red"
                      : "border-border hover:bg-muted/40")
                  }
                >
                  <input
                    type="radio"
                    name="lives-mode"
                    value="limited"
                    checked={livesMode === "limited"}
                    onChange={() => setLivesMode("limited")}
                    className="mt-1 accent-spykar-red"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-spykar-ink">
                      <Heart className="h-4 w-4 fill-spykar-red text-spykar-red" />
                      Limited
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Round ends when the player misses this many denim items.
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        id="lives-count"
                        type="number"
                        min={1}
                        max={MAX_LIVES_SETTING}
                        step={1}
                        value={livesCount}
                        disabled={livesMode !== "limited"}
                        onChange={(e) => {
                          // Allow the user to type freely; we clamp on save.
                          const n = parseInt(e.target.value, 10);
                          setLivesCount(Number.isNaN(n) ? 1 : n);
                        }}
                        onBlur={() => setLivesCount((n) => clampLives(n))}
                        onFocus={() => setLivesMode("limited")}
                        className="w-20 tabular-nums"
                        aria-label="Number of lives"
                      />
                      <span className="text-xs text-muted-foreground">
                        1 – {MAX_LIVES_SETTING}
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-16 px-4 py-3"></th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price (₹)</th>
                <th className="px-4 py-3 text-center">In game</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCTS.map((p) => {
                const isActive = active.has(p.id);
                return (
                  <tr key={p.id} className="border-t border-border last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.name}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src !== p.silhouette) img.src = p.silhouette;
                        }}
                        className="h-14 w-11 rounded-md bg-spykar-ink object-contain p-0.5 ring-1 ring-spykar-red/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{p.name}</div>
                      {p.tagline && (
                        <div className="text-xs italic text-muted-foreground">{p.tagline}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {p.price.toLocaleString("en-IN")}
                      {isPremium(p) && (
                        <Badge variant="default" className="ml-2 bg-spykar-red">+25</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggle(p.id)}
                          className="peer sr-only"
                        />
                        <span className="relative h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-spykar-red peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" style={{ transform: isActive ? "translateX(20px)" : undefined }} />
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <div>{active.size} of {MOCK_PRODUCTS.length} active</div>
          <div>Reward tiers configured in <code className="rounded bg-muted px-1.5 py-0.5">lib/game/tiers.ts</code></div>
        </div>
      </section>
    </main>
  );
}
