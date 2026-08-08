# Glitch Gear storefront concept

A complete, responsive storefront concept for [Glitch Gaming Apparel](https://www.glitchgear.com/), built from the supplied dark game-loadout UI reference.

The site is intentionally static so it can run on GitHub Pages. Product names, descriptions, prices, variants, availability, collection artwork, product imagery, the sizing chart, About copy, contact information, and privacy content are sourced from Glitch Gear's public Shopify storefront. A generated catalog snapshot supports local development, while the deployed site can fall back to the public live catalog.

## Included

- Full searchable product catalog with availability, types, collections, and sorting
- Collection and product detail routes
- Official product imagery and sizing chart
- Persistent local cart and wishlist
- Variant and sold-out handling
- Responsive navigation and mobile storefront layouts
- Customer support, contact, About, and privacy pages
- Clearly deferred Shopify checkout handoff
- WCAG-oriented keyboard, focus, contrast, reduced-motion, and semantic markup

## Run locally

Serve the folder through any static server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`.

## Refresh the catalog

The local catalog snapshot can be generated from Glitch Gear's public Shopify JSON endpoints:

```bash
node scripts/sync-catalog.mjs
```

## Connect Shopify checkout later

The current cart is local and does not process payment. To activate live checkout, replace the checkout notice in `app.js` with Shopify Storefront API cart creation using the business's storefront domain and public Storefront API access token. Keep all privileged Admin API credentials out of the browser and repository.

## Content note

This is a presentation concept, not the currently operated Glitch Gear storefront. It does not invent shipping, returns, testimonials, or licensing claims that are not published by the source site.
