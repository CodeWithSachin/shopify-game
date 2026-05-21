"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { useGameLoop } from "@/lib/game/useGameLoop";
import { useSound } from "@/lib/game/useSound";
import { usePrefersReducedMotion } from "@/lib/game/useReducedMotion";
import {
  caughtBy,
  randRange,
  smoothDamp,
  stepEntity,
  type FallingEntity,
  type Rect,
} from "@/lib/game/physics";
import {
  GRAVITY,
  MAX_CONCURRENT_PRODUCTS,
  ROUND_DURATION_S,
  SPAWN_JITTER_MAX,
  SPAWN_JITTER_MIN,
  SPAWN_X_PADDING_MULT,
  fallSpeedAt,
  spawnIntervalAt,
} from "@/lib/game/difficulty";
import { MOCK_PRODUCTS, isPremium, type MockProduct } from "@/lib/mock-products";
import { Cart } from "./Cart";
import { FallingProduct } from "./FallingProduct";
import { HUD } from "./HUD";
import { StartScreen } from "./StartScreen";
import { Countdown } from "./Countdown";
import { EndScreen } from "./EndScreen";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const PRODUCT_W = 92;
const PRODUCT_H = 120;
const CART_W = 150;
const CART_H = 64;
const CART_BOTTOM_OFFSET = 48; // matches Tailwind bottom-12

interface ActiveProduct extends FallingEntity {
  product: MockProduct;
}

function pickProduct(active: MockProduct[]): MockProduct {
  return active[Math.floor(Math.random() * active.length)];
}

/**
 * Read which product IDs the merchant has toggled "in game".
 *
 * Phase 1: localStorage written by /admin/products.
 * Phase 2: this lookup is replaced by a fetch of the `game-active` Shopify
 * collection (see lib/shopify/storefront.ts stub).
 */
function readActiveProducts(): MockProduct[] {
  if (typeof window === "undefined") return MOCK_PRODUCTS;
  try {
    const raw = window.localStorage.getItem("spykar:catch:activeProducts");
    if (!raw) return MOCK_PRODUCTS;
    const ids = JSON.parse(raw) as string[];
    const filtered = MOCK_PRODUCTS.filter((p) => ids.includes(p.id));
    return filtered.length > 0 ? filtered : MOCK_PRODUCTS;
  } catch {
    return MOCK_PRODUCTS;
  }
}

function spawnEntity(
  stageW: number,
  product: MockProduct,
  elapsed: number
): ActiveProduct {
  const speed = fallSpeedAt(elapsed) * (0.85 + Math.random() * 0.3);
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    x: randRange(8, Math.max(16, stageW - PRODUCT_W - 8)),
    y: -PRODUCT_H,
    w: PRODUCT_W,
    h: PRODUCT_H,
    vy: speed,
    product,
  };
}

export function GameCanvas() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  const cartXRef = useRef(0); // current actual x
  const cartTargetRef = useRef(0); // where the pointer is
  /**
   * Next spawn time, in game-elapsed milliseconds. We schedule each spawn
   * relative to the elapsed clock so pauses freeze the cadence and jitter
   * naturally spreads landings across time.
   */
  const nextSpawnAtMsRef = useRef(0);
  const activeListRef = useRef<MockProduct[]>(MOCK_PRODUCTS);

  /**
   * Falling entities live in a ref (mutable for physics) and we bump
   * `frame` once per RAF tick to push them through React's render. Using
   * primitive x/y props on `<FallingProduct>` (instead of the whole entity
   * object) is what makes memo() pick up the new positions — passing the
   * mutated object would compare equal and skip the re-render, leaving
   * cards glued to their spawn position above the stage.
   */
  const entitiesRef = useRef<ActiveProduct[]>([]);
  const [, setFrame] = useState(0);

  const [stage, setStage] = useState({ w: 0, h: 0 });
  const reducedMotion = usePrefersReducedMotion();

  const gameState = useGameStore((s) => s.gameState);
  const caughtFlashKey = useGameStore((s) => s.caughtFlashKey);
  const missFlashKey = useGameStore((s) => s.missFlashKey);
  const startCountdown = useGameStore((s) => s.startCountdown);
  const recordCatch = useGameStore((s) => s.recordCatch);
  const recordMiss = useGameStore((s) => s.recordMiss);
  const tickTime = useGameStore((s) => s.tickTime);
  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const reset = useGameStore((s) => s.reset);
  const hydrateHighScore = useGameStore((s) => s.hydrateHighScore);
  const scorePops = useGameStore((s) => s.scorePops);
  const consumeScorePop = useGameStore((s) => s.consumeScorePop);
  const finalTier = useGameStore((s) => s.finalTier);

  const { enabled: soundEnabled, toggle: toggleSound, play: playSound } = useSound();

  // Hydrate high score + lock body scroll while game is mounted
  useEffect(() => {
    hydrateHighScore();
    document.body.classList.add("no-bounce");
    return () => {
      document.body.classList.remove("no-bounce");
    };
  }, [hydrateHighScore]);

  // Measure the stage
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setStage({ w: rect.width, h: rect.height });
      if (cartXRef.current === 0) {
        cartXRef.current = rect.width / 2 - CART_W / 2;
        cartTargetRef.current = cartXRef.current;
        if (cartRef.current) {
          cartRef.current.style.transform = `translate3d(${cartXRef.current}px, 0, 0)`;
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pointer handling
  const handlePointer = useCallback((clientX: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const localX = clientX - rect.left - CART_W / 2;
    cartTargetRef.current = Math.max(0, Math.min(rect.width - CART_W, localX));
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => handlePointer(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointer(e.touches[0].clientX);
        e.preventDefault();
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [handlePointer]);

  // Snapshot active products + reset state at countdown start.
  useEffect(() => {
    if (gameState === "countdown") {
      activeListRef.current = readActiveProducts();
      // First spawn fires on frame 1 of "playing" (elapsed ≥ 0).
      nextSpawnAtMsRef.current = 0;
      entitiesRef.current = [];
      setFrame((f) => f + 1);
    }
  }, [gameState]);

  // Tier-up sound (only once per round end)
  const lastTierLabel = useRef<string | null>(null);
  useEffect(() => {
    if (gameState === "ended" && finalTier?.prefix) {
      if (lastTierLabel.current !== finalTier.label) {
        playSound("tier_up");
        lastTierLabel.current = finalTier.label;
      }
    } else if (gameState !== "ended") {
      lastTierLabel.current = null;
    }
  }, [gameState, finalTier, playSound]);

  // Keyboard: Space = start/resume, Esc = pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        if (gameState === "idle" || gameState === "ended") {
          e.preventDefault();
          reset();
          startCountdown();
          playSound("start");
        } else if (gameState === "paused") {
          e.preventDefault();
          resume();
        }
      } else if (e.key === "Escape") {
        if (gameState === "playing") pause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState, startCountdown, reset, resume, pause, playSound]);

  // The frame loop
  useGameLoop(
    useCallback(
      (dt: number) => {
        // Cart lerp — always active so the cart tracks the pointer even pre-game.
        cartXRef.current = smoothDamp(cartXRef.current, cartTargetRef.current, 12, dt);
        if (cartRef.current) {
          cartRef.current.style.transform = `translate3d(${cartXRef.current}px, 0, 0)`;
        }

        if (gameState !== "playing") return;

        tickTime(dt);

        const stateNow = useGameStore.getState();
        const elapsed = ROUND_DURATION_S - stateNow.timeRemaining;
        const elapsedMs = elapsed * 1000;

        // Spawn ONE product when scheduled, respecting concurrent cap and
        // an x-spread check so we don't pile up directly above an existing
        // drop. If too crowded, push the schedule forward slightly.
        if (
          elapsedMs >= nextSpawnAtMsRef.current &&
          entitiesRef.current.length < MAX_CONCURRENT_PRODUCTS
        ) {
          const padding = PRODUCT_W * SPAWN_X_PADDING_MULT;
          const maxX = Math.max(16, stage.w - PRODUCT_W - 8);

          // Try up to 6 candidate x's; pick one that's clear of any product
          // still in the upper 45% of the stage (recent spawns).
          let chosenX = randRange(8, maxX);
          for (let attempt = 0; attempt < 6; attempt += 1) {
            const candidate = randRange(8, maxX);
            const crowded = entitiesRef.current.some(
              (e) =>
                e.y < stage.h * 0.45 && Math.abs(e.x - candidate) < padding
            );
            if (!crowded) {
              chosenX = candidate;
              break;
            }
            chosenX = candidate; // fall through with last candidate
          }

          const product = pickProduct(activeListRef.current);
          const e = spawnEntity(stage.w, product, elapsed);
          e.x = chosenX;
          // y-jitter so simultaneous-ish spawns don't share a release height
          e.y = -PRODUCT_H - randRange(0, PRODUCT_H * 0.6);
          entitiesRef.current.push(e);

          // Schedule next spawn — base interval × jitter ∈ [MIN, MAX].
          const baseInterval = spawnIntervalAt(elapsed);
          const jitter =
            SPAWN_JITTER_MIN + Math.random() * (SPAWN_JITTER_MAX - SPAWN_JITTER_MIN);
          nextSpawnAtMsRef.current = elapsedMs + baseInterval * jitter;
        }

        // Step + collision + miss check
        const cartRect: Rect = {
          x: cartXRef.current,
          y: stage.h - CART_BOTTOM_OFFSET - CART_H,
          w: CART_W,
          h: CART_H,
        };
        const groundY = stage.h - 8;

        let caughtCount = 0;
        let missedCount = 0;
        const remaining: ActiveProduct[] = [];

        for (const e of entitiesRef.current) {
          stepEntity(e, dt, GRAVITY);

          if (caughtBy(e, cartRect)) {
            const base = isPremium(e.product) ? 25 : 10;
            recordCatch(e.id, base, e.x + e.w / 2, cartRect.y);
            caughtCount += 1;
            continue;
          }
          if (e.y > groundY) {
            recordMiss();
            missedCount += 1;
            continue;
          }
          remaining.push(e);
        }
        entitiesRef.current = remaining;

        // Side-effect sounds — fire once per frame, not once per entity, to
        // avoid sound spam when multiple catches/misses happen in one tick.
        if (caughtCount > 0) playSound("catch");
        if (missedCount > 0) playSound("miss");

        // Trigger a React render so the new entity positions reach the DOM.
        setFrame((f) => (f + 1) % 1_000_000);
      },
      [gameState, stage.w, stage.h, recordCatch, recordMiss, tickTime, playSound]
    ),
    true
  );

  const startGame = useCallback(() => {
    reset();
    startCountdown();
    playSound("start");
  }, [reset, startCountdown, playSound]);

  const togglePause = useCallback(() => {
    if (gameState === "playing") pause();
    else if (gameState === "paused") resume();
  }, [gameState, pause, resume]);

  return (
    <div
      ref={stageRef}
      className="relative h-screen-dvh w-full overflow-hidden bg-gradient-to-b from-spykar-cream via-white to-spykar-cream/40 touch-none select-none"
    >
      {/* Spykar store backdrop @ 20% — drop /public/store-bg.jpg in to enable.
          CSS background-image fails silently if the file is missing, so the
          gradient just shows through. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/store-bg.png')" }}
        aria-hidden
      />

      {/* subtle denim seam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-spykar-red via-transparent to-spykar-red opacity-40" />

      {/* Falling products — primitive props so memo() picks up position changes */}
      {entitiesRef.current.map((e) => (
        <FallingProduct
          key={e.id}
          x={e.x}
          y={e.y}
          w={e.w}
          h={e.h}
          image={e.product.image}
          silhouette={e.product.silhouette}
          name={e.product.name}
          premium={isPremium(e.product)}
        />
      ))}

      {/* Cart */}
      {stage.w > 0 && (
        <Cart
          ref={cartRef}
          width={CART_W}
          height={CART_H}
          bounceKey={caughtFlashKey}
          reducedMotion={reducedMotion}
        />
      )}

      {/* Score pops */}
      <AnimatePresence>
        {scorePops.map((pop) => (
          <motion.div
            key={pop.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            onAnimationComplete={() => consumeScorePop(pop.id)}
            className="pointer-events-none absolute z-30 text-2xl font-black text-spykar-red drop-shadow-md"
            style={{ left: pop.x, top: pop.y, transform: "translateX(-50%)" }}
          >
            +{pop.value}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Screen shake on miss */}
      <motion.div
        key={`shake-${missFlashKey}`}
        initial={reducedMotion ? false : { x: 0 }}
        animate={reducedMotion ? undefined : { x: [0, -8, 8, -5, 5, 0] }}
        transition={{ duration: 0.28 }}
        className="pointer-events-none absolute inset-0"
        aria-hidden
      />

      {/* HUD */}
      {(gameState === "playing" || gameState === "paused" || gameState === "countdown") && (
        <HUD
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onTogglePause={togglePause}
        />
      )}

      {/* Pause overlay */}
      {gameState === "paused" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-spykar-cream/85 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Paused
            </div>
            <div className="mt-1 text-4xl font-black text-spykar-ink">Take a breath.</div>
            <Button size="lg" className="mt-5 rounded-full" onClick={resume}>
              <Play className="mr-2 h-5 w-5 fill-current" />
              Resume
            </Button>
            <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Press <kbd className="rounded border border-border bg-white px-1.5 py-0.5">Space</kbd> to resume
            </p>
          </div>
        </div>
      )}

      <Countdown />

      {gameState === "idle" && <StartScreen onStart={startGame} />}

      <EndScreen onPlayAgain={startGame} />
    </div>
  );
}
