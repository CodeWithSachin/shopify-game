# Product Assets

Drop the 13 product photos in this folder using the exact filenames below. The catalog in `lib/mock-products.ts` references these paths. If a file is missing, the falling-product component falls back to an inline-SVG silhouette automatically, so the game keeps working — but real photos look much better.

## Files in use

The catalog in `lib/mock-products.ts` is wired to the filenames the user actually saved:

| Filename             | Catalog id | What it is                                  |
| -------------------- | ---------- | ------------------------------------------- |
| `1.png`              | p001       | Mid-blue distressed straight jeans          |
| `3.png`              | p002       | Black straight jeans                        |
| `4.png`              | p003       | Clean mid-blue slim jeans                   |
| `5.png`              | p004       | Dark indigo straight jeans                  |
| `6.png`              | p005       | Mid-blue baggy jeans (SPYKAR tag visible)   |
| `7.png`              | p006       | Light wash slim jeans                       |
| `8.png`              | p007       | Vintage / dirty wash distressed jeans       |
| `9.png`              | p008       | Faded grey-black slim jeans                 |
| `Belt.png`           | p009       | Black leather belt with Spykar buckle       |
| `cap.png`            | p010       | Red Spykar baseball cap                     |
| `Hanger.png`         | p011       | Black branded hanger                        |
| `Shopping bag.png`   | p012       | Kraft carry bag with red logo (URL-encoded as `Shopping%20bag.png`) |
| `Wallet.png`         | p013       | Brown leather bifold wallet                 |

## Store backdrop (separate file)

The Spykar store front photo is saved as `public/store-bg.png` (one level up, in `public/` — not in `public/products/`). It renders behind the falling products at 20% opacity in `components/game/GameCanvas.tsx`.

## Notes

- `.jpg` is preferred (smaller files) but `.png` and `.webp` work too — if you change the extension, also update the `image:` field in `lib/mock-products.ts`.
- The images you shared were on solid black backgrounds. That works perfectly: the falling-product component renders each photo inside a black rounded card with a red ring, so the source background blends seamlessly.
- Don't worry about exact dimensions. The card renders the image at 92×120 with `object-contain`, so any reasonable aspect ratio works.
- After dropping files in, hard-refresh the dev server (`Cmd+Shift+R`) so Next.js picks them up.
