"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { useGameLoop } from "@/lib/game/useGameLoop";
import { useSound } from "@/lib/game/useSound";
import { usePrefersReducedMotion } from "@/lib/game/useReducedMotion";
import { useAssetPreloader } from "@/lib/game/useAssetPreloader";
import {
	caughtBy,
	randRange,
	smoothDamp,
	stepEntity,
	type FallingEntity,
	type Rect,
} from "@/lib/game/physics";
import {
	BOMB_PENALTY,
	GRAVITY,
	MAX_CONCURRENT_PRODUCTS,
	NON_DENIM_PENALTY,
	ROUND_DURATION_S,
	SPAWN_JITTER_MAX,
	SPAWN_JITTER_MIN,
	SPAWN_X_PADDING_MULT,
	bombChanceAt,
	fallSpeedAt,
	spawnIntervalAt,
} from "@/lib/game/difficulty";
import {
	MOCK_PRODUCTS,
	isPremium,
	type MockProduct,
} from "@/lib/mock-products";
import { Cart } from "./Cart";
import { FallingProduct } from "./FallingProduct";
import { FallingBomb } from "./FallingBomb";
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
	kind: "product";
	product: MockProduct;
}

interface ActiveBomb extends FallingEntity {
	kind: "bomb";
}

type ActiveItem = ActiveProduct | ActiveBomb;

function pickProduct(active: MockProduct[]): MockProduct {
	return active[Math.floor(Math.random() * active.length)];
}

function newEntityId(): string {
	return `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function makeProduct(product: MockProduct, elapsed: number): ActiveProduct {
	const speed = fallSpeedAt(elapsed) * (0.9 + Math.random() * 0.2);
	return {
		id: newEntityId(),
		productId: product.id,
		kind: "product",
		x: 0, // caller sets x with spread check
		y: -PRODUCT_H,
		w: PRODUCT_W,
		h: PRODUCT_H,
		vy: speed,
		product,
	};
}

function makeBomb(elapsed: number): ActiveBomb {
	// Bombs fall slightly slower than products at the same elapsed time so
	// they're catchable to AVOID — not impossible to dodge.
	const speed = fallSpeedAt(elapsed) * (0.85 + Math.random() * 0.15);
	return {
		id: newEntityId(),
		productId: "bomb",
		kind: "bomb",
		x: 0,
		y: -PRODUCT_H,
		w: PRODUCT_W,
		h: PRODUCT_H,
		vy: speed,
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
	const entitiesRef = useRef<ActiveItem[]>([]);
	const [, setFrame] = useState(0);

	const [stage, setStage] = useState({ w: 0, h: 0 });
	const reducedMotion = usePrefersReducedMotion();

	// Background asset download. `assets.ready` gates the START button so the
	// round never begins before the product images are cached. A ref mirror lets
	// the keyboard handler read the latest value without re-binding listeners.
	const assets = useAssetPreloader();
	const assetsReadyRef = useRef(assets.ready);
	assetsReadyRef.current = assets.ready;

	const gameState = useGameStore((s) => s.gameState);
	const caughtFlashKey = useGameStore((s) => s.caughtFlashKey);
	const missFlashKey = useGameStore((s) => s.missFlashKey);
	const startCountdown = useGameStore((s) => s.startCountdown);
	const recordCatch = useGameStore((s) => s.recordCatch);
	const recordMiss = useGameStore((s) => s.recordMiss);
	const recordPenalty = useGameStore((s) => s.recordPenalty);
	const tickTime = useGameStore((s) => s.tickTime);
	const pause = useGameStore((s) => s.pause);
	const resume = useGameStore((s) => s.resume);
	const reset = useGameStore((s) => s.reset);
	const hydrateHighScore = useGameStore((s) => s.hydrateHighScore);
	const scorePops = useGameStore((s) => s.scorePops);
	const consumeScorePop = useGameStore((s) => s.consumeScorePop);
	const finalTier = useGameStore((s) => s.finalTier);

	const {
		enabled: soundEnabled,
		toggle: toggleSound,
		play: playSound,
	} = useSound();

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
			// Only hijack touch (and block native scroll via preventDefault) while
			// a round is live. When the round has ended, the end-screen dialog is
			// open — if we kept calling preventDefault here, the dialog couldn't be
			// scrolled on mobile. Returning early lets those touches scroll natively.
			const gs = useGameStore.getState().gameState;
			if (gs !== "playing" && gs !== "countdown") return;
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
		// Trigger tier_up sound when the round ends on a tier above the base one.
		if (gameState === "ended" && finalTier && finalTier.points > 100) {
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
					// Don't start until the product images have finished downloading.
					if (!assetsReadyRef.current) return;
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
				cartXRef.current = smoothDamp(
					cartXRef.current,
					cartTargetRef.current,
					12,
					dt,
				);
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
								e.y < stage.h * 0.45 && Math.abs(e.x - candidate) < padding,
						);
						if (!crowded) {
							chosenX = candidate;
							break;
						}
						chosenX = candidate; // fall through with last candidate
					}

					// Roll bomb vs product based on the elapsed-time chance curve.
					const isBomb = Math.random() < bombChanceAt(elapsed);
					const item: ActiveItem = isBomb
						? makeBomb(elapsed)
						: makeProduct(pickProduct(activeListRef.current), elapsed);
					item.x = chosenX;
					// y-jitter so simultaneous-ish spawns don't share a release height
					item.y = -PRODUCT_H - randRange(0, PRODUCT_H * 0.6);
					entitiesRef.current.push(item);

					// Schedule next spawn — base interval × jitter ∈ [MIN, MAX].
					const baseInterval = spawnIntervalAt(elapsed);
					const jitter =
						SPAWN_JITTER_MIN +
						Math.random() * (SPAWN_JITTER_MAX - SPAWN_JITTER_MIN);
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
				let penaltyCount = 0;
				const remaining: ActiveItem[] = [];

				for (const e of entitiesRef.current) {
					stepEntity(e, dt, GRAVITY);

					if (caughtBy(e, cartRect)) {
						const popX = e.x + e.w / 2;
						const popY = cartRect.y;
						if (e.kind === "bomb") {
							recordPenalty(BOMB_PENALTY, popX, popY);
							penaltyCount += 1;
						} else if (e.product.category === "Jeans") {
							// Denim catch → positive points.
							const base = isPremium(e.product) ? 25 : 10;
							recordCatch(e.id, base, popX, popY);
							caughtCount += 1;
						} else {
							// Non-denim (belt/cap/hanger/bag/wallet) → penalty.
							recordPenalty(NON_DENIM_PENALTY, popX, popY);
							penaltyCount += 1;
						}
						continue;
					}
					if (e.y > groundY) {
						// Only uncaught DENIM products cost a life — letting a bomb or
						// a non-denim accessory fall past is the correct play.
						if (e.kind === "product" && e.product.category === "Jeans") {
							recordMiss();
							missedCount += 1;
						}
						continue;
					}
					remaining.push(e);
				}
				entitiesRef.current = remaining;

				// Side-effect sounds — fire once per frame, not once per entity, to
				// avoid sound spam when multiple catches/misses happen in one tick.
				if (caughtCount > 0) playSound("catch");
				if (missedCount > 0) playSound("miss");
				if (penaltyCount > 0) playSound("bomb_hit");

				// Trigger a React render so the new entity positions reach the DOM.
				setFrame((f) => (f + 1) % 1_000_000);
			},
			[
				gameState,
				stage.w,
				stage.h,
				recordCatch,
				recordMiss,
				recordPenalty,
				tickTime,
				playSound,
			],
		),
		true,
	);

	const startGame = useCallback(() => {
		// Guard: never start before assets are cached (the START button is also
		// disabled until then, this is belt-and-suspenders for the keyboard /
		// "Play again" paths).
		if (!assetsReadyRef.current) return;
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
				style={{ backgroundImage: "url('/store-bg.webp')" }}
				aria-hidden
			/>

			{/* subtle denim seam */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-spykar-red via-transparent to-spykar-red opacity-40" />

			{/* Falling items — products and bombs. Primitive props so memo() picks
          up position changes from the per-frame physics mutations. */}
			{entitiesRef.current.map((e) =>
				e.kind === "bomb" ? (
					<FallingBomb
						key={e.id}
						x={e.x}
						y={e.y}
						w={e.w}
						h={e.h}
						penalty={BOMB_PENALTY}
					/>
				) : (
					<FallingProduct
						key={e.id}
						x={e.x}
						y={e.y}
						w={e.w}
						h={e.h}
						image={e.product.image}
						silhouette={e.product.silhouette}
						name={e.product.name}
						isDenim={e.product.category === "Jeans"}
						points={isPremium(e.product) ? 25 : 10}
						penalty={NON_DENIM_PENALTY}
					/>
				),
			)}

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

			{/* Score pops — positive in red, negative (bomb) in ink with a -X label */}
			<AnimatePresence>
				{scorePops.map((pop) => (
					<motion.div
						key={pop.id}
						initial={{ opacity: 1, y: 0, scale: 1 }}
						animate={{ opacity: 0, y: -50, scale: 1.2 }}
						transition={{ duration: 0.7, ease: "easeOut" }}
						onAnimationComplete={() => consumeScorePop(pop.id)}
						className={`pointer-events-none absolute z-30 text-2xl font-black drop-shadow-md ${
							pop.value < 0 ? "text-spykar-ink" : "text-spykar-red"
						}`}
						style={{ left: pop.x, top: pop.y, transform: "translateX(-50%)" }}
					>
						{pop.value >= 0 ? `+${pop.value}` : pop.value}
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
			{(gameState === "playing" ||
				gameState === "paused" ||
				gameState === "countdown") && (
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
						<div className="mt-1 text-4xl font-black text-spykar-ink">
							Take a breath.
						</div>
						<Button size="lg" className="mt-5 rounded-full" onClick={resume}>
							<Play className="mr-2 h-5 w-5 fill-current" />
							Resume
						</Button>
						<p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
							Press{" "}
							<kbd className="rounded border border-border bg-white px-1.5 py-0.5">
								Space
							</kbd>{" "}
							to resume
						</p>
					</div>
				</div>
			)}

			<Countdown />

			{gameState === "idle" && (
				<StartScreen
					onStart={startGame}
					assetsReady={assets.ready}
					progress={assets.progress}
				/>
			)}

			<EndScreen onPlayAgain={startGame} />
		</div>
	);
}
