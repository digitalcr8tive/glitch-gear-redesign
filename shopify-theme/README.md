# Glitch Gear Loadout Shopify theme

This is a complete Shopify Online Store 2.0 theme, not a homepage-only section pack. It includes native product, collection, collection-list, cart, search, page, and 404 templates. Product forms and cart/checkout actions use Shopify's native routes and current product variants.

## Install safely

1. In Shopify Admin, open **Online Store → Themes**.
2. Back up the published theme by duplicating it.
3. Upload `glitch-gear-shopify-theme.zip` as a new, unpublished theme.
4. Preview and configure the theme before publishing.
5. In the header settings, assign:
   - **Shop category menu**: T-shirts, Hoodies, Hats, Backpacks, Accessories, Gift Cards, and any other active product categories.
   - **Current collections menu**: the collections currently offered by the store.
6. Assign the official horizontal logo, homepage collection blocks, Featured Drops collection, footer menus, and sizing chart page.
7. Leave the countdown field blank unless a real drop has a verified end time.

## Product image treatment

`scripts/build-product-cutouts.py` creates transparent WebP versions of the current catalog photography. The semantic mask supplies alpha only; visible colors come from the original product pixels. This avoids white halos without recoloring white shirts, white bags, skin, logos, or other light product details.

The generated `snippets/glitch-product-image.liquid` maps this store's Shopify image IDs to those preserved assets. Newly added images fall back to Shopify's native image URL until the cutout build is run again.

## Checkout behavior

The product and cart templates use Shopify product forms, `/cart/add.js`, the native cart route, and the native checkout button. Payment methods, taxes, shipping rates, inventory, customer accounts, and installed apps remain controlled by the Shopify store.

## Homepage direction

The supplied Glitch redesign is the visual reference. The four-item benefits strip beneath the campaign banner remains removed, as requested.
