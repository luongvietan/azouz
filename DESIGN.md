---
name: Azouz Coffee
description: Packaging-led Shopify theme for a Jordan roastery — B2B enquiry plus a small D2C shop.
colors:
  asparagus: "#67985E"
  asparagus-deep: "#4F7748"
  warm-cream: "#F6F1E8"
  taupe: "#C5B7A4"
  sage: "#DEE6D5"
  off-white: "#FFFBF8"
  jet: "#303030"
  muted-grey: "#6B6B6B"
  on-accent: "#FFFFFF"
typography:
  display:
    fontFamily: "Baloo Bhaijaan 2, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Baloo Bhaijaan 2, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.12
  title:
    fontFamily: "Baloo Bhaijaan 2, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.2vw, 1.875rem)"
    fontWeight: 700
    lineHeight: 1.12
  body:
    fontFamily: "Baloo Bhaijaan 2, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Baloo Bhaijaan 2, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "2rem"
  xl: "3rem"
  section: "clamp(4rem, 9vw, 8rem)"
components:
  button-primary:
    backgroundColor: "{colors.asparagus-deep}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 2rem"
  button-primary-hover:
    backgroundColor: "#3d5c38"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.jet}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 2rem"
  label-block:
    backgroundColor: "{colors.asparagus}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "2rem"
---

# Design System: Azouz Coffee

## 1. Overview

**Creative North Star: "The packaging is the design system."**

The printed bag label is lifted into the UI: a solid colour rectangle, a tight uppercase title, a hairline rule, a two-column spec grid, and a roast-level dot meter. Everything around it is restraint: Off White ground, generous section padding, one typeface, one green.

The system is Swiss-minimal, not rustic. Confidence comes from the bags themselves and from Asparagus used as a voice, not a wash. Secondary cream and sage exist to rest the eye between label blocks.

This system rejects burlap, wood, steam illustration, bean scatter, brown gradient heroes, stock latte-art, a second display typeface, and Dawn-default Shopify chrome.

**Key Characteristics:**
- Single family (Baloo Bhaijaan 2) with weight contrast only
- 4px radius; hairline taupe at 40% opacity
- One green band per page
- Logical CSS properties; no physical left/right
- Product photography sits untreated on Off White

## 2. Colors

The palette is the 17-page brand guidelines, plus two derived tokens so green and taupe stay legal.

### Primary
- **Asparagus** (`#67985E`, PANTONE 7731 C): fills, large display type, the default label-block, one full-bleed band per page. Not body-size text.
- **Asparagus Deep** (`#4F7748`): buttons, body-size text on green, focus ring. Use this whenever green must carry 17px copy.

### Neutral
- **Off White** (`#FFFBF8`): page ground.
- **Warm Cream** (`#F6F1E8`): alternating section bands.
- **Soft Sage** (`#DEE6D5`): rare tint; never a large wash that competes with Asparagus.
- **Jet** (`#303030`): body and headings.
- **Muted Grey** (`#6B6B6B`): eyebrows and secondary text (5.2:1 on Off White).
- **Taupe Beige** (`#C5B7A4`): hairlines and rules only.

### Named Rules
**The One Green Voice Rule.** Asparagus is the only core brand colour. One deliberate green band per page. Secondary tones never overshadow it.

**The Taupe Is Not Text Rule.** Taupe on Off White is 1.9:1. If it carries words, it is a defect.

## 3. Typography

**Display Font:** Baloo Bhaijaan 2 (system-ui fallback)
**Body Font:** Baloo Bhaijaan 2
**Label/Mono Font:** none. Eyebrows are Baloo SemiBold, 0.75rem, 0.18em tracking, uppercase.

**Character:** One rounded humanist family that already carries Latin and Arabic. Hierarchy is weight and size, never a second face.

### Hierarchy
- **Display** (700, `clamp(2.75rem, 6vw, 5rem)`, 1.02 / −0.02em): page H1 only.
- **Headline** (700, `clamp(2.25rem, 4.4vw, 3.5rem)`): section H2.
- **Title** (700, `clamp(1.5rem, 2.2vw, 1.875rem)`): H3 and label-block titles.
- **Body** (400, 17px / 1.65, max 68ch): all prose.
- **Label** (600, 12px, 0.18em, uppercase): the packaging eyebrow. Short labels only.

### Named Rules
**The One Face Rule.** No second typeface. The packaging eyebrow is Baloo, not a gothic or a serif.

**The Short Caps Rule.** Uppercase is for labels of a few words. Sentences in caps are forbidden.

## 4. Elevation

Flat by default. Depth is tonal (Off White / Warm Cream / Sage) and the label-block's solid fill. Cards may use a single quiet shadow; they do not combine a 1px border with a wide drop shadow.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgb(48 48 48 / 4%), 0 8px 24px rgb(48 48 48 / 6%)`): product tiles only, if used. Never on buttons.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. No glass, no 32px radii, no ghost-card (border + wide shadow).

## 5. Components

### Buttons
- **Shape:** 4px radius, min block-size 48px, 18px SemiBold
- **Primary:** Asparagus Deep fill, white label. Hover darkens only.
- **Secondary:** transparent, Jet border. Hover inverts to Jet fill.

### Cards / Containers
- **Corner Style:** 4px
- **Background:** Off White or the label-block fill
- **Shadow Strategy:** optional quiet card shadow; never both border and wide shadow
- **Internal Padding:** `--space-lg` (2rem) inside a label-block

### Inputs / Fields
- **Style:** hairline stroke, Off White fill, 4px radius
- **Focus:** 2px Asparagus Deep outline, 3px offset
- **Error / Disabled:** sold-out controls are disabled, not restyled as error theatre

### Navigation
- Text links in the header, Jet on Off White. Active state is weight, not a new colour. Mobile is a `<details>` disclosure, not a scripted drawer. Cart is a link to `/cart` that upgrades to a drawer when JS runs.

### Label block (signature)
The bag label. Fill from `custom.label_color` via `--label-bg`. Title ≥24px so white type on terracotta / olive / mint / Asparagus stays large-text legal. Spec grid is two columns. Roast meter is five dots.

## 6. Do's and Don'ts

### Do:
- **Do** put the silver-bag photograph on Off White with no overlay, crop gimmick, or coloured panel substitute.
- **Do** use `--color-accent-deep` for any green that carries 17px text or a button label.
- **Do** keep one H1, one green band, and logical CSS properties on every template.
- **Do** let forms post natively so the page works with scripting off.

### Don't:
- **Don't** use rustic coffee tropes: burlap, wood grain, rising-steam illustration, scattered bean icons, brown gradient heroes, stock latte-art photography.
- **Don't** introduce a second typeface or script "handcrafted since" lettering.
- **Don't** use Taupe Beige for text.
- **Don't** ship SaaS landing grammar: hero-metric rows, identical icon+heading+text card grids, numbered 01/02/03 eyebrows on every section.
- **Don't** bury Asparagus under a cream-and-sage "warm café" wash.
- **Don't** use Dawn-default Shopify chrome or generic OS 2.0 starter aesthetics.
- **Don't** hide `.reveal` content before `reveal-on-scroll` is defined.
