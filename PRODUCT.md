# Product

## Register

brand

## Users

Two audiences share one storefront.

**B2B buyers** (primary conversion): café, hotel, restaurant, retailer, distributor, and startup-brand operators in Jordan and the region. They arrive to evaluate a roastery partner, not to browse a catalogue. Context is work: comparing private-label capability, wholesale reliability, and whether the brand looks serious enough to put on their own shelf. The job is to request a sample or a quote.

**D2C customers** (secondary): people buying Azouz retail bags. They arrive from the header Shop link or the Our Brands CTA. The job is to pick a blend, choose weight and grind, and check out.

## Product Purpose

Azouz Coffee is a hybrid Shopify theme: B2B lead-generation pages (Home, Private Label, Wholesale, Our Brands, enquiry forms) plus a small D2C shop (collection, product, cart). Success on the marketing surface is a completed enquiry. Success on the shop surface is a completed add-to-cart that survives with JavaScript off. The theme must look like the printed bags, not like a generic coffee template, the moment it is uploaded.

## Brand Personality

Swiss-minimal, packaging-led, restrained.

Voice is direct and commercial: what Azouz roasts, for whom, and what to do next. No rustic warmth, no craft-theatre. Confidence comes from the label block, the silver-bag photography, the stainless-steel neutrals, and the sage green used sparingly.

Emotional goals: competence for a B2B buyer; quiet premium for a retail customer.

## Anti-references

- Rustic coffee tropes: burlap, wood grain, rising-steam illustration, scattered bean icons, brown gradient heroes, stock latte-art photography
- Script "handcrafted since" typefaces and a second display face next to Baloo
- SaaS landing grammar: hero-metric rows, identical icon+heading+text card grids, numbered 01/02/03 eyebrows on every section
- Cream-and-sage "warm café" palettes that bury the sage green under a wash
- Dawn-default Shopify chrome and generic OS 2.0 starter aesthetics

## Design Principles

1. **The packaging is the design system.** The bag label (solid colour panel, tight uppercase title, hairline, spec grid, roast dots) is the signature component. Product cards, range cards, and service cards derive from it.
2. **Show the bag, don't decorate around it.** Product photography is silver foil on near-white. It sits on the light-grey ground with no treatment. Empty colour panels where a bag should be are a bug.
3. **One green voice, and a quiet one.** Sage is the only core brand colour; silver, coffee brown and burnt orange support it. It appears as a pale tint — one band per page plus the announcement bar — never as a dark fill and never as text. Anything that acts is graphite.
4. **English now, Arabic later.** Logical CSS properties and externalised strings. No physical `left`/`right`. Adding `locales/ar.json` must not require a CSS rewrite.
5. **Works with scripting off.** Forms post natively. Menus are `<details>`. Reveal motion never hides content until the custom element is defined.

## Accessibility & Inclusion

WCAG 2.1 AA is the floor, enforced in `tests/contrast.test.js`.

- Body text ≥4.5:1 (Onyx on the grey ground is 16.7:1; muted grey is 5.5:1)
- Silver is never text (1.8:1); Burnt Orange is never a surface for it (4.3:1 behind white)
- Sage is never body-size *text* (4.1:1); buttons and green copy use `--color-accent-deep`
- Visible `:focus-visible` ring; skip link; one `h1` per page
- `prefers-reduced-motion: reduce` disables reveal and smooth scroll
- Touch targets ≥44px; RTL-ready logical properties
