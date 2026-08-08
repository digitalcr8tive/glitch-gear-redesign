---
name: Glitch Gear Storefront
description: A cinematic game-loadout storefront for licensed apparel and collectibles.
colors:
  power-lime: "oklch(82% 0.22 126)"
  power-lime-bright: "oklch(90% 0.25 126)"
  power-lime-deep: "oklch(58% 0.17 126)"
  void-black: "oklch(7% 0.012 135)"
  void-soft: "oklch(10% 0.014 135)"
  loadout-charcoal: "oklch(14% 0.014 135)"
  armor-silver: "oklch(94% 0.008 120)"
  signal-gray: "oklch(74% 0.018 120)"
  alert-red: "oklch(66% 0.2 28)"
typography:
  display:
    fontFamily: "Barlow Condensed, Impact, sans-serif"
    fontSize: "clamp(3rem, 7vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.01em"
  body:
    fontFamily: "Chakra Petch, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Chakra Petch, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  control: "2px"
  surface: "0px"
  status: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "30px"
  xl: "clamp(36px, 5vw, 74px)"
components:
  button-primary:
    backgroundColor: "{colors.power-lime}"
    textColor: "{colors.void-black}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
  button-secondary:
    backgroundColor: "{colors.void-black}"
    textColor: "{colors.armor-silver}"
    rounded: "{rounded.control}"
    padding: "11px 20px"
  product-card:
    backgroundColor: "{colors.loadout-charcoal}"
    textColor: "{colors.armor-silver}"
    rounded: "{rounded.surface}"
    padding: "12px"
---

# Design System: Glitch Gear Storefront

## 1. Overview

**Creative North Star: "The Player Loadout"**

The supplied redesign image is the controlling visual reference. The storefront behaves like a premium game inventory screen made physical: near-black technical surfaces, acid-lime interaction signals, metallic display lettering, charcoal product bays, subtle HUD markings, and franchise imagery treated as world-building.

The system is dense but disciplined. Products, prices, sizes, navigation, and cart feedback stay immediately legible while the atmosphere feels immersive and battle-worn. Motion is responsive and tactical, with short state changes and controlled reveals rather than flashing or prolonged choreography.

**Key Characteristics:**

- Near-black layered surfaces with restrained acid-lime signals
- Industrial condensed display type with readable technical body text
- Square and lightly clipped geometry instead of soft lifestyle-fashion shapes
- Official product photography and collection art as the main visual material
- One continuous visual identity across desktop and mobile

## 2. Colors

The palette is restrained. Void Black and Loadout Charcoal carry almost every surface while Power Lime is reserved for navigation, status, and primary shopping actions. Armor Silver provides high-priority text, and Signal Gray remains readable for metadata.

### Primary

- **Power Lime:** Primary actions, active controls, progress signals, and short display emphasis.
- **Power Lime Bright:** Hover and focus reinforcement.
- **Power Lime Deep:** Borders and lower-priority interface signals.

### Neutral

- **Void Black:** Page background and dominant atmospheric field.
- **Void Soft:** Header, drawers, and secondary dark fields.
- **Loadout Charcoal:** Product bays, inputs, and raised surfaces.
- **Armor Silver:** Headlines, iconography, and high-priority text.
- **Signal Gray:** Supporting copy and subdued metadata.

### Tertiary

- **Alert Red:** Sold-out and destructive states only.

**The Signal Rule.** Power Lime communicates interaction or status. It is never sprayed across large surfaces as decoration.

## 3. Typography

**Display Font:** Barlow Condensed (with Impact fallback)

**Body Font:** Chakra Petch (with system sans-serif fallback)

**Character:** Headlines resemble a steel equipment label or game-case title. Body copy stays calm, compact, and easy to scan while shopping.

### Hierarchy

- **Display** (900, fluid to 6rem, 0.78 to 0.95 line-height): Hero statements and large page titles.
- **Headline** (800, 1.65rem to 2.45rem, 0.95 line-height): Sections and collection names.
- **Title** (500 to 700, 0.78rem to 1.7rem): Products, cart items, and support blocks.
- **Body** (400, 1rem, 1.55 to 1.8 line-height): Descriptions and policy content, capped at 72ch.
- **Label** (700, 0.68rem to 0.72rem, 0.08em to 0.1em tracking): Short navigation, filter, and status labels.

**The Case-Title Rule.** Display lettering is reserved for world names and decisive campaign statements. Product descriptions never imitate game-box typography.

## 4. Elevation

The system is flat by default and creates depth through tonal layering, image contrast, crisp borders, and restrained glows. Product bays feel recessed. Lift appears only through a three-pixel hover translation, while drawers and dialogs use a dark backdrop rather than a wide soft shadow.

**The Equipment-Bay Rule.** Products are mounted inside the interface. Soft floating cards and ambient lifestyle shadows are prohibited.

## 5. Components

### Buttons

- **Shape:** Square with lightly clipped corners (2px plus a 5px clip on primary controls).
- **Primary:** Power Lime field, Void Black label, compact uppercase action text.
- **Hover / Focus:** Brighter lime, two-pixel lift, and a three-pixel visible focus outline.
- **Secondary:** Transparent dark field with Armor Silver border and copy.

### Cards / Containers

- **Corner Style:** Square (0px).
- **Background:** Loadout Charcoal over Void Black.
- **Shadow Strategy:** None at rest.
- **Border:** One-pixel muted lime-neutral line, brightening on interaction.
- **Internal Padding:** Compact 12px to 18px rhythm.

### Inputs / Fields

- **Style:** Dark charcoal fill, crisp one-pixel neutral stroke, square geometry.
- **Focus:** Power Lime stroke plus the global focus outline.
- **Error / Disabled:** Alert Red or reduced opacity with text status, never color alone.

### Navigation

Desktop navigation uses compact uppercase labels and a short lime underline. Mobile navigation becomes a full-width command list beneath the sticky header with the same squared geometry.

### Product Bay

Product imagery uses contained scaling over a radial charcoal stage. Availability occupies the upper left, saved state occupies the upper right, and price plus the next action stay anchored beneath the image.

## 6. Do's and Don'ts

### Do:

- **Do** reproduce the supplied image's near-black, charcoal, silver, and acid-lime hierarchy.
- **Do** use current Glitch Gear product photography and franchise imagery as the main visual material.
- **Do** preserve obvious product, sizing, cart, search, and checkout affordances.
- **Do** make mobile layouts feel like the same loadout system rather than a simplified generic shop.
- **Do** support keyboard navigation, visible focus, reduced motion, and WCAG 2.2 AA contrast.

### Don't:

- **Don't** use generic Shopify templates, bright lifestyle-fashion minimalism, soft SaaS styling, or cartoonish gamer motifs.
- **Don't** invent products, prices, sizing claims, policies, testimonials, or licensing relationships.
- **Don't** use glassmorphism, large rounded cards, gradient text, wide soft shadows, or repeated decorative badges.
- **Don't** let HUD ornament compete with product names, prices, sizes, or shopping actions.
- **Don't** imply that live payment processing is connected until the Shopify integration is configured.
