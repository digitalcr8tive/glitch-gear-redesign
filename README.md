# Glitch Gear reference-matched storefront

A complete, responsive storefront for [Glitch Gaming Apparel](https://www.glitchgear.com/), rebuilt as a crisp HTML/CSS implementation of the supplied 1456×1090 “WEAR THE GAME.” reference composition.

The site is intentionally static so it can run on GitHub Pages. Product names, descriptions, prices, variants, availability, collection artwork, product imagery, the sizing chart, About copy, contact information, and privacy content are sourced from Glitch Gear's public Shopify storefront. A generated catalog snapshot supports local development, while the deployed site can fall back to the public live catalog.

## Included

- Reference-matched desktop composition: 20px announcement bar, 61px header, 302px hero, 158px collections, 212px Featured Drops, 98px banner, and 184px footer. The four-item benefits strip beneath the banner is intentionally removed.
- Crisp code-built layout at every viewport; the supplied screenshot is not stretched or used as a webpage surface
- One black, charcoal, silver, and acid-lime technical theme across every route, drawer, dialog, filter, form, and empty state
- Full searchable product catalog with availability, types, collections, and sorting
- Collection and product detail routes
- Official product imagery and sizing chart, with source-color-preserving transparent product cutouts on consistent charcoal presentation bays
- Exact supplied Portal, Fallout, BioShock, Half-Life, Gears of War, and Left 4 Dead collection artwork on the homepage rail
- Persistent local cart and wishlist
- Variant and sold-out handling
- Responsive navigation and mobile storefront layouts
- Customer support, contact, About, and privacy pages
- Clearly deferred Shopify checkout handoff
- WCAG-oriented keyboard, focus, contrast, reduced-motion, and semantic markup
- A complete Shopify Online Store 2.0 theme under `shopify-theme/`, including native product, collection, cart, search, page, blog, gift card, and customer-account routes
- Repo-local Impeccable project helper under `.agents/skills/impeccable/`
- Original cinematic banner artwork with opaque helmet visors and no recognizable third-party characters

## Run locally

Serve the folder through any static server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`.

## Impeccable project helper

The full Impeccable frontend helper is installed locally at `.agents/skills/impeccable/`. Compatible coding agents discover it from that directory and use the Glitch Gear product and design context in `PRODUCT.md` and `DESIGN.md` for future interface creation and editing.

Verify the project context at any time with:

```bash
node .agents/skills/impeccable/scripts/context.mjs
```

Run its interface anti-pattern audit with:

```bash
node .agents/skills/impeccable/scripts/detect.mjs index.html styles.css app.js
```

## Refresh the catalog

The local catalog snapshot can be generated from Glitch Gear's public Shopify JSON endpoints:

```bash
node scripts/sync-catalog.mjs
```

After a catalog refresh, regenerate the preserved product cutouts and Shopify image mapping with the repo script from a Python environment containing Pillow and rembg:

```bash
U2NET_HOME=/path/to/rembg-models python scripts/build-product-cutouts.py
```

## GitHub Pages demo and Shopify checkout

The GitHub Pages presentation uses a local demonstration cart and intentionally does not process payment. The theme in `shopify-theme/` uses native Shopify product forms, AJAX cart addition, the Shopify cart route, and the store's checkout button. No Admin API credential is stored in the theme or browser.

## Shopify theme package

The ready-to-upload archive is `glitch-gear-shopify-theme.zip`, built from the complete `shopify-theme/` directory. Its product-image map is keyed to the current Glitch Gear Shopify media IDs and falls back safely to native Shopify product images for future catalog additions. Always duplicate the published theme, upload this one separately, validate apps and analytics in preview, then publish through Shopify Admin.

## Content note

This is a presentation concept, not the currently operated Glitch Gear storefront. It does not invent shipping, returns, testimonials, or licensing claims that are not published by the source site.
