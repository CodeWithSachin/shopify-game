/**
 * Phase 1 mock catalog — 12 products matching the uploaded asset set.
 *
 * Image strategy
 * --------------
 * Each product has TWO image sources:
 *   1. `image`       → expected file path under /public/products/
 *   2. `silhouette`  → inline-SVG fallback (always available)
 *
 * If the photo file exists, the FallingProduct component uses it.
 * If it 404s, it falls back to the silhouette. So the game works whether
 * or not you've dropped the real images in yet.
 *
 * See `public/products/ASSETS.md` for the exact filenames expected here.
 *
 * In Phase 2 these are replaced by Shopify Storefront API results — keep the
 * shape compatible with what `lib/shopify/storefront.ts` will return.
 */

export type ProductCategory =
  | "Jeans"
  | "Shirts"
  | "T-Shirts"
  | "Jackets"
  | "Accessories"
  | "Packaging";

export interface MockProduct {
  id: string;
  handle: string;
  name: string;
  category: ProductCategory;
  /** INR price */
  price: number;
  /** Real photo (expected at public/products/...). 404 → falls back to silhouette. */
  image: string;
  /** Inline-SVG fallback. Always renders. */
  silhouette: string;
  /** Spykar tone tag — purely cosmetic */
  tagline?: string;
}

// ---------- SVG silhouettes (single-color, monogram-style) -----------------
//
// 200×260, single fill, denim-y. Use as <img src>. We use `data:image/svg+xml,`
// (no `;utf8`) for max browser compatibility.

const wrap = (body: string, accent = "#1B2845") =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" fill="none">
      <rect x="0" y="0" width="200" height="260" rx="20" fill="#0A0A0A"/>
      <g fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linejoin="round">${body}</g>
      <text x="100" y="248" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" letter-spacing="2">SPYKAR</text>
    </svg>`
  );

const JEANS = (denim: string) =>
  wrap(
    `<path d="M55 30 L145 30 L150 80 L150 220 L115 220 L105 100 L95 100 L85 220 L50 220 L50 80 Z"/>
     <circle cx="155" cy="38" r="3" fill="#E4B644"/>
     <line x1="100" y1="30" x2="100" y2="100" stroke="#0A0A0A" stroke-width="2.5"/>`,
    denim
  );

const BELT = wrap(
  `<rect x="20" y="120" width="160" height="22" rx="3" fill="#1B1B1B" stroke="#3A3A3A"/>
   <rect x="120" y="116" width="22" height="30" rx="3" fill="none" stroke="#9C9C9C" stroke-width="2.5"/>
   <circle cx="50" cy="131" r="2" fill="#3A3A3A"/>
   <circle cx="70" cy="131" r="2" fill="#3A3A3A"/>
   <circle cx="90" cy="131" r="2" fill="#3A3A3A"/>`,
  "#1B1B1B"
);

const CAP = wrap(
  `<path d="M40 150 Q40 90 100 90 Q160 90 160 150 L160 165 L40 165 Z" fill="#E4002B"/>
   <path d="M30 165 L170 165 L170 180 L30 180 Z" fill="#E4002B"/>
   <text x="118" y="135" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#0A0A0A" font-style="italic">spykar</text>`,
  "#E4002B"
);

const HANGER = wrap(
  `<line x1="100" y1="60" x2="100" y2="100" stroke="#FFFFFF" stroke-width="3"/>
   <circle cx="100" cy="55" r="6" fill="none" stroke="#FFFFFF" stroke-width="3"/>
   <rect x="40" y="100" width="120" height="20" rx="4" fill="#222"/>
   <text x="100" y="115" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" letter-spacing="2">SPYKAR</text>
   <line x1="60" y1="120" x2="60" y2="150" stroke="#FFFFFF" stroke-width="2"/>
   <line x1="140" y1="120" x2="140" y2="150" stroke="#FFFFFF" stroke-width="2"/>`,
  "#222"
);

const BAG = wrap(
  `<path d="M55 95 L55 75 Q55 60 70 60 L130 60 Q145 60 145 75 L145 95" stroke="#C8A878" stroke-width="3" fill="none"/>
   <rect x="40" y="95" width="120" height="135" fill="#C8A878"/>
   <rect x="80" y="135" width="40" height="40" rx="6" fill="#E4002B"/>
   <path d="M88 158 Q100 140 112 158" stroke="#C8A878" stroke-width="3" fill="none"/>`,
  "#C8A878"
);

const WALLET = wrap(
  `<rect x="40" y="110" width="120" height="80" rx="6" fill="#6B3F1E"/>
   <line x1="40" y1="170" x2="160" y2="170" stroke="#3F2410" stroke-width="2"/>
   <text x="138" y="184" text-anchor="end" font-family="Inter, sans-serif" font-size="9" font-weight="800" fill="#3F2410">spykar</text>`,
  "#6B3F1E"
);

// ---------- Catalog --------------------------------------------------------

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "p001",
    handle: "hugo-straight-distressed",
    name: "Hugo Straight Distressed Jeans",
    category: "Jeans",
    price: 3499,
    image: "/products/1.png",
    silhouette: JEANS("#3F6FAF"),
    tagline: "Made to chill, built to last",
  },
  {
    id: "p002",
    handle: "onyx-straight-jet-black",
    name: "Onyx Straight Jet Black",
    category: "Jeans",
    price: 2499,
    image: "/products/3.png",
    silhouette: JEANS("#1A1A1A"),
  },
  {
    id: "p003",
    handle: "vader-slim-mid-blue",
    name: "Vader Slim Mid-Blue",
    category: "Jeans",
    price: 2799,
    image: "/products/4.png",
    silhouette: JEANS("#3E70B0"),
    tagline: "Rhapsodic Route",
  },
  {
    id: "p004",
    handle: "skinny-indigo-rinse",
    name: "Skinny Indigo Rinse",
    category: "Jeans",
    price: 2699,
    image: "/products/5.png",
    silhouette: JEANS("#1B2845"),
  },
  {
    id: "p005",
    handle: "rover-loose-mid-blue",
    name: "Rover Loose Mid-Blue",
    category: "Jeans",
    price: 3299,
    image: "/products/6.png",
    silhouette: JEANS("#4A78B5"),
    tagline: "Heritage & Horizons",
  },
  {
    id: "p006",
    handle: "skinny-light-wash",
    name: "Skinny Light Wash",
    category: "Jeans",
    price: 2599,
    image: "/products/7.png",
    silhouette: JEANS("#9CC1E8"),
  },
  {
    id: "p007",
    handle: "vintage-wash-distressed",
    name: "Vintage Wash Distressed",
    category: "Jeans",
    price: 3799,
    image: "/products/8.png",
    silhouette: JEANS("#456384"),
    tagline: "Young & Restless",
  },
  {
    id: "p008",
    handle: "faded-slim-black",
    name: "Faded Slim Black",
    category: "Jeans",
    price: 2599,
    image: "/products/9.png",
    silhouette: JEANS("#2A2A2A"),
  },
  {
    id: "p009",
    handle: "reversible-leather-belt",
    name: "Reversible Leather Belt",
    category: "Accessories",
    price: 1299,
    image: "/products/Belt.png",
    silhouette: BELT,
  },
  {
    id: "p010",
    handle: "signature-red-cap",
    name: "Signature Red Cap",
    category: "Accessories",
    price: 799,
    image: "/products/cap.png",
    silhouette: CAP,
  },
  {
    id: "p011",
    handle: "spykar-hanger",
    name: "Premium Branded Hanger",
    category: "Packaging",
    price: 199,
    image: "/products/Hanger.png",
    silhouette: HANGER,
  },
  {
    id: "p012",
    handle: "kraft-carry-bag",
    name: "Kraft Carry Bag",
    category: "Packaging",
    price: 99,
    image: "/products/Shopping%20bag.png",
    silhouette: BAG,
  },
  {
    id: "p013",
    handle: "hudson-bifold-wallet",
    name: "Hudson Bifold Wallet",
    category: "Accessories",
    price: 1699,
    image: "/products/Wallet.png",
    silhouette: WALLET,
  },
];

export const PREMIUM_PRICE_THRESHOLD = 2500;

export function isPremium(p: Pick<MockProduct, "price">) {
  return p.price >= PREMIUM_PRICE_THRESHOLD;
}
