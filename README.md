# Spykar — Catch the Drop

Phase 1 MVP of the "Catch the Drop" falling-product catcher game, eventually to be embedded on spykar.com (Shopify). See [`PLAN.md`](./PLAN.md) for the full build plan and roadmap.

This phase is intentionally self-contained: no Shopify, no backend, no env vars. Everything runs locally with mocked products.

## Stack

- **Next.js 14** (App Router, TypeScript strict)
- **Tailwind CSS 3.4** + custom shadcn-style primitives (`components/ui/*`)
- **Framer Motion** for catch bounce, score pops, screen shake, countdown
- **Zustand** for game state
- **Radix UI** primitives for Dialog / Progress
- **lucide-react** icons
- Game loop: `requestAnimationFrame` with delta-time capped at 32ms

> The plan called for Tailwind v4 + pnpm. We shipped on **Tailwind v3.4** + **npm** for stability — both swap-outs are mechanical and can happen any time. Notes are in `tailwind.config.ts`.

## Setup

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

- `/` — landing page with the brand swatch and Start CTA
- `/play` — the game
- `/admin/products` — toggle which mock products drop in the game (state persists in localStorage)

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # next lint
```

## What's mocked vs. stubbed

| Area | Status |
|---|---|
| Brand color tokens | **Inferred** — see warning below. Hex values live in `lib/design-tokens.ts` + `tailwind.config.ts` (`colors.spykar.*`) and CSS variables in `app/globals.css`. |
| Font | **Inter** loaded from `rsms.me/inter`. Swap to the brand font in `app/layout.tsx`. |
| Product catalog | 13 mock products in `lib/mock-products.ts`. Each entry references a real photo at `public/products/<file>.jpg`, with an inline-SVG silhouette as automatic fallback when the photo is missing. See [`public/products/ASSETS.md`](./public/products/ASSETS.md) for the expected filenames. |
| Sound | Stub: `lib/game/useSound.ts` console.logs cue names. Add `<audio>` or WebAudio in Phase 4. |
| Coupons | Generated client-side as `CATCH{tier}-XXXX` for display. Phase 3 replaces with Shopify Admin API. |
| Leaderboard | Local-only best score in `localStorage`. |
| Bombs | Skipped (plan calls them v2). |

> ⚠️ **Brand colors are inferred.** Confirm `#E4002B`, `#1B2845`, etc. against the official Spykar brand kit before launch — see `lib/design-tokens.ts` and the corresponding HSL triplets in `app/globals.css`. The structure is correct; only the values need verification.

## Game spec (as built)

- **Duration**: 60s or until 3 misses.
- **Cart**: bottom-pinned, follows pointer/touch with frame-rate-independent smoothing (`smoothDamp(k=12)`).
- **Drops**: spawn from a random x at the top, fall with initial velocity + mild gravity.
- **Scoring**: base 10 / premium (price ≥ ₹2,500) = 25. Combo ×2 after 3 catches in a row, resets on miss.
- **Difficulty**: spawn interval ‑50ms every 15s (floor 350ms); fall speed +10% every 30s.
- **Lives**: 3 hearts in the HUD.
- **Tiers**: `0–99` no coupon · `100–249` 5% · `250–499` 10% · `500+` 15% + free shipping. Configurable in `lib/game/tiers.ts`.
- **Controls**: mouse / touch for cart. **Space** to start / resume, **Esc** to pause.
- **Accessibility**: focus rings on all interactive UI, `prefers-reduced-motion` disables shake and dampens animations.

## How to swap mock products for real Shopify products (Phase 2)

1. Create a Shopify custom app, grant `unauthenticated_read_product_listings` on the Storefront API.
2. Add a public collection with handle `game-active`. Drop the products you want falling in the game.
3. Set env vars:
   ```bash
   SHOPIFY_STORE_DOMAIN=your-shop.myshopify.com
   SHOPIFY_STOREFRONT_TOKEN=...
   ```
4. Create `lib/shopify/storefront.ts` that calls `https://${domain}/api/2024-10/graphql.json` for `collectionByHandle(handle: "game-active")`. Return objects shaped like `MockProduct` (id, handle, name/title, price.amount, featuredImage.url, productType→category).
5. In `components/game/GameCanvas.tsx`, replace `readActiveProducts()` with a `useEffect` that fetches once via `/api/products` (a Next route handler that proxies the Storefront query so the token stays server-side).

The shape boundary is intentionally tiny — only `lib/mock-products.ts` knows about the mock implementation.

## Project layout

```
app/
  page.tsx                    landing
  play/page.tsx               game route (mounts GameCanvas)
  admin/products/page.tsx     toggle which products drop
  globals.css                 Tailwind layers + shadcn HSL token mapping
  layout.tsx                  root, fonts, metadata
components/
  ui/                         button, card, badge, dialog, progress (shadcn-style)
  game/
    GameCanvas.tsx            stage, loop, spawn, collision, render orchestration
    Cart.tsx                  denim cart pinned to bottom
    FallingProduct.tsx        single drop
    HUD.tsx                   score / combo / lives / timer / pause + mute
    StartScreen.tsx           idle screen
    Countdown.tsx             3-2-1
    EndScreen.tsx             final dialog with coupon
lib/
  design-tokens.ts            single source of truth for hex values
  mock-products.ts            8 products with SVG silhouettes
  utils.ts                    cn() classname helper
  game/
    store.ts                  Zustand store
    physics.ts                pure collision + smoothing fns
    difficulty.ts             spawn / speed curves
    tiers.ts                  score → coupon mapping
    useGameLoop.ts            RAF + capped dt
    useSound.ts               cue stub
    useReducedMotion.ts       respects prefers-reduced-motion
```

## Open questions before launch

These are the §8 items from `PLAN.md` that still need product/brand input:

1. Confirm exact brand hex values and font family.
2. Shopify Storefront + Admin API tokens.
3. Product source: `game-active` collection (recommended) or this app's `/admin`?
4. Embed strategy: subdomain MVP or Theme App Extension straight away?
5. Coupon rules: tier amounts, min cart value, expiry, single-use, stackable y/n.
6. Abuse prevention: login / OTP / email-gate for coupon claim?

## Next phases (sketch)

- **Phase 2** — Shopify Storefront API + `game-active` collection wiring.
- **Phase 3** — Server-side coupon issuance via Shopify Admin API, Upstash rate limiting.
- **Phase 4** — Theme App Extension App Embed Block + real sound + leaderboard + analytics.
# shopify-game
