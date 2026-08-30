---
name: Azouz Coffee
description: Packaging-led Shopify theme for a Jordan roastery — B2B enquiry plus a small D2C shop.
colors:
  warm-white: "#F6F3ED"
  silver: "#B7B7B3"
  onyx: "#171717"
  coffee-brown: "#4A3126"
  sage: "#687B5D"
  burnt-orange: "#C65B32"
  sage-deep: "#5A6A50"
  orange-deep: "#B3522D"
  muted-grey: "#656563"
  warm-white-alt: "#ECE9E4"
  sage-tint: "#D4D6CA"
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
    backgroundColor: "{colors.sage-deep}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 2rem"
  button-primary-hover:
    backgroundColor: "#4d5a44"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.onyx}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 2rem"
  label-block:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.sm}"
    padding: "2rem"
---

# Design System: Azouz Coffee

## 1. Overview

**Creative North Star: "The packaging is the design system."**

The printed bag label is lifted into the UI: a solid colour rectangle, a tight uppercase title, a hairline rule, a two-column spec grid, and a roast-level dot meter. Everything around it is restraint: Warm White ground, generous section padding, one typeface, one green.

The system is Swiss-minimal, not rustic. Confidence comes from the bags themselves, from stainless steel, and from Sage used as a voice rather than a wash. The alt band and the sage tint exist to rest the eye between label blocks.

This system rejects burlap, wood, steam illustration, bean scatter, brown gradient heroes, stock latte-art, a second display typeface, and Dawn-default Shopify chrome.

**Key Characteristics:**
- Single family (Baloo Bhaijaan 2) with weight contrast only
- 4px radius; silver hairline at 40% between quiet things, ink rules under headings and between index cells
- One green band per page
- Logical CSS properties; no physical left/right
- Product photography sits untreated on Warm White

## 2. Colors

The palette is the Azouz colour board — stainless steel, coffee and nature —
plus three derived shades so sage, orange and silver stay legal as text.

### Primary
- **Sage Green** (`#687B5D`): the brand green. Fills, label blocks, large display type. White on it is 4.6:1 — legal for body text, which the old primary never was, but only by 0.09, so surfaces that actually carry 17px copy still take the deep shade.
- **Sage Deep** (`#5A6A50`): green *as text* — links, green type on the page, the focus ring — and the button fill. Sage is 4.1:1 on Warm White and fails as text; and while Sage would pass behind a button label at 4.6:1, an 18px SemiBold label is not "large text" by WCAG, so buttons take the 5.8:1 shade rather than a 0.09 margin.

### Neutral
- **Warm White** (`#F6F3ED`): page ground.
- **Warm White Alt** (`#ECE9E4`): alternating section bands. Derived; a 1.09 step off the ground, the same weight the old cream band had.
- **Onyx Black** (`#171717`): body and headings (16.2:1).
- **Muted Grey** (`#656563`): eyebrows and secondary text (5.3:1). Silver darkened until it is legal.
- **Silver** (`#B7B7B3`): hairlines, rules and light label fills only. 1.8:1 as text.

### Warm and highlight
- **Coffee Brown** (`#4A3126`): the warm tone. Legal in both directions — 10.8:1 as text, 11.9:1 behind white — so it works as copy, as a label fill, or as a dark band.
- **Burnt Orange** (`#C65B32`): highlight. Large type, rules, small non-text marks.
- **Orange Deep** (`#B3522D`): the orange that carries words. Any orange behind or as body text is this one.
- **Sage Tint** (`#D4D6CA`): chips and tinted bands. Onyx on it only — muted grey does not clear AA there.

### Named Rules
**The One Green Voice Rule.** Sage is the only core brand colour. One deliberate green band per page — painted in Sage Deep, because the band carries body copy. Silver, brown and orange support it and never overshadow it.

**The Silver Is Not Text Rule.** Silver on Warm White is 1.8:1. If it carries words, it is a defect. It is the industrial accent — hairlines, rules, and pale label fills that take Onyx ink.

**The Orange Is A Highlight Rule.** Burnt Orange fails in both inks — 3.8:1 as text, 4.3:1 behind white. Nothing that must be read sits on it or is set in it. Use Orange Deep the moment words are involved.

**The Green Reversal.** In the old palette green was too light to sit behind text and fine as text. This one is the reverse. Buttons may use `--color-accent`; links may not.

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

Flat by default. Depth is tonal (Warm White / Alt band / Sage Tint) and the label-block's solid fill. Cards may use a single quiet shadow; they do not combine a 1px border with a wide drop shadow.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgb(48 48 48 / 4%), 0 8px 24px rgb(48 48 48 / 6%)`): product tiles only, if used. Never on buttons.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. No glass, no 32px radii, no ghost-card (border + wide shadow).

## 5. Components

### Buttons
- **Shape:** 4px radius, min block-size 48px, 18px SemiBold
- **Primary:** Sage Deep fill, white label. Hover darkens only.
- **Secondary:** transparent, Onyx border. Hover inverts to Onyx fill.

### Cards / Containers
- **Corner Style:** 4px
- **Background:** Warm White or the label-block fill
- **Shadow Strategy:** optional quiet card shadow; never both border and wide shadow
- **Internal Padding:** `--space-lg` (2rem) inside a label-block

### Inputs / Fields
- **Style:** hairline stroke, Warm White fill, 4px radius
- **Focus:** 2px Sage Deep outline, 3px offset
- **Error / Disabled:** sold-out controls are disabled, not restyled as error theatre

### Navigation
- Text links in the header, Onyx on Warm White. Active state is weight, not a new colour. Mobile is a `<details>` disclosure, not a scripted drawer. Cart is a link to `/cart` that upgrades to a drawer when JS runs.

### Label block (signature)
The bag label. Fill from `custom.label_color` via `--label-bg`. Title ≥24px so white type on orange / brown / silver / sage stays large-text legal. Spec grid is two columns. Roast meter is five dots.

## 6. Layout grammar

The pages are laid out on three moves, shared by the homepage, the collection,
the search results and the collections list.

### The ultra measure
`--content-ultra` (1800px) is the editorial width. A four-up row at that measure
is four real columns; at the 1280px `--content-max` it is four squeezed ones.
Prose keeps its own limit — 68ch on `p`, `--content-narrow` on an intro — so the
wider container never widens a line of copy.

### The section head
An oversized uppercase `h2` (`--text-3xl`, or `--text-display` when it opens a
whole block), its "see the rest" link parked at the inline end, and a rule
across the full measure underneath. `.section-head` + `.anchor-arrow` +
`.section-head__rule`. A section that renders its own head must not also
re-declare `display` or `gap` on it, or the shared grammar is undone.

### The rule-divided index
`.list-lines` lays cells out four, three or two to a row and divides them with
1px strokes rather than with gaps — a printed index, not a tray of cards. The
dividers run continuously across the row, so these grids declare no column gap;
cells are held apart by their own inline padding.

### Named Rules

**The Ink Rule Rule.** Silver is still never text, and still the hairline
between quiet things. But a stroke closing a 56px heading has to carry that
heading's weight, so the section-head rule, the list dividers and the marquee
band are drawn in ink: `--rule-ink`, with `--rule-ink-soft` for the finer
divisions inside a card. This does not soften the Silver Is Not Text rule — it
is the opposite direction, a stronger stroke, and neither token ever colours a
word.

**The Scrim Is Fixed Rule.** Copy sits over a photograph in the hero and in the
feature band. The scrim is a fixed gradient or wash of Onyx, never a tint keyed
to the artwork, so the contrast the headline gets does not depend on which image
a merchant uploads.

**One Band, One Colour.** A template carries one green band. The feature band
falls back to Coffee Brown rather than green when it has no photograph, so a
page that ends on the green CTA band does not paint two.

## 7. Do's and Don'ts

### Do:
- **Do** put the silver-bag photograph on Warm White with no overlay, crop gimmick, or coloured panel substitute.
- **Do** use `--color-accent-deep` for any green that carries or is body-size text. `--color-accent` is for bands, fills and large display type.
- **Do** keep one H1, one green band, and logical CSS properties on every template.
- **Do** let forms post natively so the page works with scripting off.

### Don't:
- **Don't** use rustic coffee tropes: burlap, wood grain, rising-steam illustration, scattered bean icons, brown gradient heroes, stock latte-art photography.
- **Don't** introduce a second typeface or script "handcrafted since" lettering.
- **Don't** use Silver for text, or Burnt Orange behind it.
- **Don't** ship SaaS landing grammar: hero-metric rows, floating icon+heading+text card grids, numbered 01/02/03 eyebrows on every section. A rule-divided index is not that card grid — it has no card, no shadow and no border box, only the strokes between entries.
- **Don't** bury Sage under a silver-and-brown wash, or let the highlight orange become a fourth surface colour.
- **Don't** use Dawn-default Shopify chrome or generic OS 2.0 starter aesthetics.
- **Don't** hide `.reveal` content before `reveal-on-scroll` is defined.
