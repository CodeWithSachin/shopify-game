# Spykar — "Catch the Drop" Game
**Build Plan + Kickoff Prompt**

A falling-product catcher game embedded into spykar.com (Shopify), with admin-managed product feed and score-based coupon rewards.

---

## 1. Brand snapshot (pulled from spykar.com)

| | |
|---|---|
| Brand voice | "Young & Restless at heart" — denim heritage (est. 1992), playful, bold, urban |
| Currency | ₹ INR |
| Product taxonomy | Men • Women • Underjeans • Accessories (Jeans, Shirts, T-shirts, Jackets, etc.) |
| Existing promo style | `SPYKAR10`, `SPYKAR15` — short, ALL CAPS, brand-prefixed |
| Tone cues | "Made to chill, built to last" / "Rhapsodic Route" / "Heritage & Horizons" — heritage × contemporary |

> ⚠️ **Verify before coding:** I inferred the palette below from typical Spykar branding (denim brand, red/charcoal/white identity). Open spykar.com in DevTools and grab the actual hex values from their CSS, or ask the brand team for the official tokens. The structure below is correct — only the hex values need to be confirmed.

### Inferred design tokens

```css
/* Confirm hex values against spykar.com */
--spykar-red:       #E4002B;  /* primary CTA / score / impact */
--spykar-ink:       #0A0A0A;  /* foreground, headlines */
--spykar-indigo:    #1B2845;  /* denim accent, secondary surfaces */
--spykar-cream:     #F7F5F0;  /* off-white background */
--spykar-paper:     #FFFFFF;  /* card surface */
--spykar-stone:     #6B6B6B;  /* muted text */
--spykar-success:   #2E7D32;
--spykar-warning:   #E08B00;
```

Typography: Spykar uses a clean modern sans (Inter/Manrope-class) for body, with heavier display weight for headlines. Use **Inter** (variable) as a safe default; swap to the brand font when known.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router, TS) | Easy hosting, API routes for Shopify, SSR for SEO if needed |
| Styling | **Tailwind v4 + shadcn/ui** | Token-driven, matches the brief, fast component scaffolding |
| Animation | **Framer Motion** | Smooth drops, cart bounce, score pops |
| Game loop | `requestAnimationFrame` + custom hook (no game engine needed for this scope) |
| State | **Zustand** | Lightweight global store for game state, leaderboard, settings |
| Backend | Next.js Route Handlers | Talk to Shopify Storefront + Admin API |
| Storage | **Vercel KV / Upstash Redis** | Score persistence, rate-limit coupon generation |
| Hosting | **Vercel** | Edge functions for Shopify API proxying |
| Shopify integration | **Theme App Extension** (App Embed Block) | Cleanest embed, no theme.liquid edits |

---

## 3. Architecture

```
spykar-catch-game/
├── app/
│   ├── (game)/
│   │   └── play/page.tsx          # The game canvas
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx           # Dashboard
│   │       ├── products/page.tsx  # Pick which products drop
│   │       └── rewards/page.tsx   # Configure score → coupon tiers
│   └── api/
│       ├── products/route.ts      # GET active game products (Shopify Storefront)
│       ├── score/route.ts         # POST score, returns coupon if earned
│       ├── coupon/route.ts        # Server-side: Shopify Admin API price-rule create
│       └── leaderboard/route.ts
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx         # Main loop, RAF
│   │   ├── FallingProduct.tsx     # Product card that drops
│   │   ├── Cart.tsx               # Mouse/touch-controlled cart
│   │   ├── HUD.tsx                # Score, lives, timer
│   │   ├── StartScreen.tsx
│   │   └── EndScreen.tsx          # Score + coupon reveal
│   └── ui/                        # shadcn primitives
├── lib/
│   ├── shopify/
│   │   ├── storefront.ts          # Public product fetch
│   │   └── admin.ts               # Server-only: create discount codes
│   ├── game/
│   │   ├── physics.ts             # Velocity, gravity, collision
│   │   ├── difficulty.ts          # Speed/spawn-rate scaling
│   │   └── store.ts               # Zustand store
│   └── design-tokens.ts
├── tailwind.config.ts
└── theme-app-extension/           # Shopify Theme App Extension (embed block)
    └── blocks/
        └── catch-game.liquid
```

---

## 4. Game mechanics (MVP spec)

| Element | Behavior |
|---|---|
| Start | Big red **START** button. Tap → 3-2-1 countdown → game begins |
| Cart | Bottom of screen, follows mouse (desktop) / touch (mobile). Smooth lerp, not 1:1 |
| Drops | Spykar product images fall from top. Random x, downward velocity (gravity + initial speed) |
| Catch | If product center is inside cart bounds at any frame → +points, bounce animation, product image briefly appears in cart |
| Miss | Product falls past cart → -1 life. 3 lives total |
| Bombs (optional v2) | Non-Spykar items (e.g., rival logos blurred, or generic "junk" icons) — catching them costs a life. Skip for MVP |
| Difficulty | Spawn rate +1 every 15s. Fall speed × 1.1 every 30s |
| Duration | 60 seconds OR until 3 misses (whichever first) |
| Points | Per product: base 10. Premium category (Jeans ≥ ₹2,500) = 25. Combo multiplier: 3 catches in a row = ×2 |
| End | Score reveal → coupon tier reveal → "Copy code" + "Shop now" CTA |

### Score → coupon tier table (configurable in admin)

| Score band | Reward | Coupon |
|---|---|---|
| 0–99 | "Nice try, captain" | No coupon, soft CTA to shop |
| 100–249 | 5% off | `CATCH5-{random}` |
| 250–499 | 10% off | `CATCH10-{random}` |
| 500+ | 15% off + free shipping | `CATCH15-{random}` |

Coupons are **single-use, expire in 24h, min cart ₹1,499** — generated server-side via Shopify Admin API. Rate-limit by IP/customer to prevent abuse.

---

## 5. Product team configuration — how products get added

Two viable approaches; pick **Option B** unless the team specifically wants a separate admin.

**Option A — Custom admin in this app**
- `/admin` route, password-protected (Shopify OAuth or simple basic auth for MVP)
- UI to browse Shopify products, toggle "in game" per product
- Store the toggled IDs in Vercel KV or a Shopify metafield
- Pros: Full control, custom UX. Cons: Yet another dashboard.

**Option B — Shopify-native (recommended)**
- Create a Shopify **collection** called `game-active`
- Product team adds/removes products from that collection in Shopify admin (a workflow they already know)
- Our app fetches `collections/game-active/products.json` via Storefront API
- Pros: Zero new admin, product team uses tools they know. Cons: Less flexibility.

Either way, the product card in-game uses the product's primary image, name, and price — pulled live.

---

## 6. Embedding into the Shopify store

| Method | Effort | Trade-off |
|---|---|---|
| **Theme App Extension (App Embed Block)** ⭐ | Medium | Cleanest. Merchant toggles it on in theme editor. Renders an iframe to your Next.js app |
| App Proxy (`/apps/catch-game`) | Medium | Routes look native (`spykar.com/apps/catch-game`). Good for SEO |
| Standalone subdomain (`play.spykar.com`) | Low | Easiest, but feels detached |
| Custom Liquid section | High | Touches the theme, fragile across theme updates |

**Recommendation:** Start with a **standalone subdomain** for the MVP (fastest path to validate), then graduate to a **Theme App Extension** for production.

---

## 7. Phased rollout

**Phase 1 — Local MVP (week 1)**
- Next.js scaffold, Tailwind + shadcn, design tokens
- Game loop with mocked product images
- Start screen, end screen, score, lives
- Deployable to Vercel

**Phase 2 — Live products (week 2)**
- Shopify Storefront API integration
- Either admin UI or `game-active` collection wiring
- Real product images falling

**Phase 3 — Coupons (week 3)**
- Shopify Admin API: create price rules + discount codes server-side
- Rate-limit per IP/session
- Email coupon (optional: Klaviyo/Shopify Email)

**Phase 4 — Embed & polish (week 4)**
- Theme App Extension build
- Mobile testing (touch controls, perf on mid-range Android)
- Sound FX, particle effects, leaderboard
- Analytics events (game_start, game_end, coupon_claimed, coupon_redeemed)

---

## 8. Things to confirm before kickoff

1. **Exact brand hex codes + font family** — from Spykar brand team or DevTools on spykar.com
2. **Shopify access** — Storefront API token (read) + Admin API token (write, for coupons). Custom app in Shopify admin.
3. **Product source** — Option A (custom admin) or Option B (`game-active` collection)?
4. **Embed strategy** — Subdomain MVP, or jump straight to Theme App Extension?
5. **Coupon rules** — confirm tiers, min cart value, expiry, single-use, stackable y/n
6. **Abuse prevention** — login required to claim? OTP? Email-gate the coupon?

---

## 9. The kickoff prompt

Paste this into Claude Code, Cursor, or your coding assistant of choice to scaffold the project. **Replace the bracketed `[CONFIRM: …]` placeholders with the answers from §8 before running.**

```
You are building "Spykar Catch the Drop" — a falling-product catcher game
to be embedded on spykar.com (Shopify). I want a Next.js 14 (App Router, TS)
project with Tailwind v4 + shadcn/ui, animated with Framer Motion, state in
Zustand. Target: desktop + mobile web. Hosting: Vercel.

== BRAND ==
Spykar is India's denim heritage brand (est. 1992), voice "Young & Restless".
Use this design token set in `lib/design-tokens.ts` and wire into Tailwind
theme + shadcn CSS variables:

  --spykar-red:    #E4002B   (primary, CTAs, score)
  --spykar-ink:    #0A0A0A   (foreground)
  --spykar-indigo: #1B2845   (secondary surfaces, denim accent)
  --spykar-cream:  #F7F5F0   (background)
  --spykar-paper:  #FFFFFF
  --spykar-stone:  #6B6B6B   (muted)
  --spykar-success:#2E7D32
  font-sans: Inter Variable
  radius: 12px default, 20px for cards, 999px for pills

Match shadcn conventions: `--background`, `--foreground`, `--primary`,
`--primary-foreground`, `--muted`, `--card`, etc. — map them to the tokens
above. Dark mode is NOT required for v1.

[CONFIRM: replace hex + font with values from brand team]

== SCOPE — PHASE 1 ONLY (local MVP, no Shopify yet) ==

1. Next.js 14 + TS + Tailwind v4 + shadcn init (Button, Card, Dialog, Badge,
   Progress, Sonner toast).
2. Routes:
   - `/` — landing with hero + START button → routes to `/play`
   - `/play` — the game
   - `/admin/products` — admin page with a table of mock products and a
     toggle "in game" per row (state in localStorage for now)
3. Game in `/play`:
   - Mouse on desktop, touch on mobile, control a denim-textured shopping cart
     pinned to the bottom (60px tall, smooth lerp follow, not 1:1)
   - Products spawn at random x along the top every 800ms (initial), falling
     downward with gravity. Use 6–8 hardcoded mock products from
     `lib/mock-products.ts` with placeholder images (`/images/jeans-1.png`,
     etc. — use Unsplash placeholders OR data-uri SVG silhouettes for now)
   - Collision: AABB on cart vs product center → catch
   - Score: +10 base. If product.price >= 2500 → +25. Combo multiplier ×2
     after 3 catches in a row, reset on miss
   - Lives: 3. Miss = product falls past cart. Show heart icons in HUD
   - Difficulty: spawn interval -50ms every 15s (floor 350ms). Fall speed
     +10% every 30s
   - Duration: 60s OR 3 misses, whichever first
4. HUD (top bar): score (Spykar red, bold), combo multiplier pill, lives,
   countdown timer (animated when <10s)
5. Start screen: brand-styled, big red START button, brief "How to play" copy,
   high-score from localStorage
6. End screen modal: final score, tier reached (mock coupon code like
   `CATCH10-XXXX`), "Copy code" + "Play again" + "Shop now" CTAs.
   Tier table (configurable later, hardcoded for now):
     0–99   → no coupon, "Almost! Try again"
     100–249 → 5%  off, code `CATCH5-{random4}`
     250–499 → 10% off, code `CATCH10-{random4}`
     500+    → 15% off + free shipping, code `CATCH15-{random4}`
7. Animation polish: cart bounce on catch (Framer Motion `whileTap`-style
   scale pulse), caught product shrinks into the cart, score-pop +N floats up
   and fades, screen shake on miss (subtle), confetti on tier upgrade.
8. Sound: stub a `useSound` hook with toggle in HUD, no actual audio files
   yet — just console.log the cue names ("catch", "miss", "tier_up").
9. Mobile: 100vh / 100dvh handling, prevent scroll-bounce on iOS, touch
   controls must work cleanly. Cart follows finger x with same lerp.
10. Accessibility: ESC to pause, SPACE to start/resume, focus rings on all
    interactive UI, prefers-reduced-motion respected (no shake, faster fades).

== STRUCTURE ==
Match the directory layout shown in the plan. Use a Zustand store
`lib/game/store.ts` with: gameState ('idle'|'countdown'|'playing'|'paused'|
'ended'), score, combo, lives, timeRemaining, products[] (live falling),
caughtCount, missedCount. Pure functions in `lib/game/physics.ts` for
collision + velocity update — keep them testable.

The render loop lives in a `useGameLoop` hook using `requestAnimationFrame`
with delta-time, NOT setInterval. Cap dt at 32ms to avoid tab-switch jumps.

== DELIVERABLES ==
- Working dev server: `pnpm dev` → game playable end-to-end at /play
- README with: setup, run, env vars (none required in phase 1), what's mocked,
  what's stubbed for phase 2 (Shopify), how to swap mock products for real
- All code TypeScript strict, no `any`, ESLint clean

Start by:
1. Scaffolding the Next.js project + Tailwind + shadcn
2. Setting up design tokens and a minimal landing page so I can see the
   palette is right
3. Then build the game

Show me the landing page first — I want to confirm the brand vibe before you
build the game loop. Ask me clarifying questions only if a requirement is
genuinely ambiguous; otherwise make a sensible call and note it in the README.
```

---

## 10. After Phase 1 — incremental prompts

When Phase 1 lands, the follow-ups are short:

- **Phase 2 prompt:** "Wire up Shopify Storefront API. Read products from collection handle `game-active`. Replace mock products. Env vars: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`."
- **Phase 3 prompt:** "Add `/api/coupon` route that creates a Shopify price rule + discount code via Admin API (env: `SHOPIFY_ADMIN_TOKEN`). Rate-limit 1 coupon per IP per 24h via Upstash. Single-use, 24h expiry, min cart ₹1,499."
- **Phase 4 prompt:** "Convert this app into a Shopify Theme App Extension App Embed Block that iframes the `/play` route, with merchant-configurable title/CTA copy."

---

**TL;DR — start here:**
1. Confirm the six items in §8 with your team
2. Plug confirmed values into the prompt in §9
3. Paste into Claude Code / Cursor
4. Review the landing page before letting it build the game loop
