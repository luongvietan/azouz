# Azouz Coffee — Custom Shopify Theme

**Date:** 2026-08-16
**Client:** Anwar Al Daoud — Azouz Coffee, Jordan (azouzcoffee.com)
**Contract:** $450 — store design on existing Shopify, ≤20 products, Jordan card payments + COD, shipping setup, affiliate program. Delivery 1–2 weeks.
**Deliverable of this spec:** a hand-built Shopify Online Store 2.0 theme, packaged as a `.zip` importable via Shopify admin → Online Store → Themes → Upload zip file.

---

## 1. Context & scope

### 1.1 What the client asked for vs. what the content implies

The signed contract describes a transactional store (products, checkout, COD, affiliate). The four pages of copy supplied by the client are **B2B lead-generation** pages (private label, wholesale, request a sample, get a quote). These are not in conflict — the site is a **hybrid**:

- **B2B surface** — Home, Private Label, Wholesale, Our Brands. Goal: capture enquiries from cafés, hotels, distributors. Conversion action is a form submission, not a checkout.
- **D2C surface** — the Azouz Coffee retail shop (collection, product, cart, checkout). Reached from the `[VIEW AZOUZ COFFEE]` CTA on the Our Brands page and from the header nav.

Both surfaces share one theme, one header, one footer, one design system.

### 1.2 In scope

Everything that can live inside a theme `.zip`: layout, all templates, all sections with editor schemas, styling, client-side JS, SEO metadata, structured data, responsive behaviour, RTL-ready CSS architecture, English locale file.

### 1.3 Explicitly out of scope for the theme zip

These are Shopify **admin** configurations and cannot ship inside a theme file. They are covered by the separate handover guides (§9), not by the theme:

- Payment gateway (Jordan card processing) and Cash on Delivery
- Shipping zones, rates, courier, COD fee
- Taxes, store policies, checkout branding
- Product metafield **definitions** (the theme reads metafields; the definitions must be created in admin)
- Affiliate app install and commission configuration
- AI marketing app installs
- Domain connection, email sender authentication

### 1.4 Decisions taken

| Decision | Choice | Rationale |
|---|---|---|
| Theme base | Custom OS 2.0 from scratch | Product count is small and content is highly specific; a hand-built theme delivers the brand exactly without fighting Dawn's opinionated markup |
| Language | English only, RTL-ready architecture | Supplied copy is English. Logical CSS properties + externalised strings mean adding Arabic later needs only `locales/ar.json`, no CSS rework |
| Products | Seeded from packaging mockups + `products.csv` | Theme must demo correctly on import; client edits prices/copy in the CSV or admin |
| Preview | LiquidJS dev harness rendering the real `.liquid` files | Faithful review before packaging; dev-only, excluded from the delivered zip |

---

## 2. Brand system (source: Azouz Brand Guidelines, 17pp)

### 2.1 Colour

| Role | Name | Hex | Usage rule from guidelines |
|---|---|---|---|
| Primary | Asparagus (PANTONE 7731 C) | `#67985E` | The single core brand colour. Applied consistently across website, packaging, social. Takes precedence over secondary tones in core brand expressions. |
| Secondary | Warm Cream | `#F6F1E8` | Background |
| Accent | Taupe Beige | `#C5B7A4` | Hairlines, muted UI |
| Supporting accent | Soft Sage | `#DEE6D5` | Tints, subtle fills |
| Base | Off White | `#FFFBF8` | Default page background |
| Text | Jet | `#303030` | Body and headings |

Secondary palette is for text, accents and neutrals — **used sparingly**, never overshadowing primary.

Two derived tokens are added for accessibility, both staying within the brand hue (see §8):

| Token | Hex | Purpose |
|---|---|---|
| `--color-accent-deep` | `#4F7748` | Darkened primary. Used only where green must carry or sit behind body-size text. |
| `--color-text-muted` | `#6B6B6B` | Eyebrow labels and secondary text. Taupe Beige cannot be used for text. |

**Note on the vector source:** the green inside `azouz-logo.ai` is `#67995F`, one step off the `#67985E` specified in the guidelines PDF. The guidelines are treated as authoritative — the extracted SVGs are normalised to `#67985E` so the site, packaging and logo agree.

### 2.2 Typography

Single typeface: **Baloo Bhaijaan** (Google Fonts; the current maintained release is *Baloo Bhaijaan 2*, which carries both Latin and Arabic). Hierarchy is expressed through weight only:

- Bold → headings
- SemiBold → sub-headings
- Regular → body

Digital minimum sizes from the guidelines: 18pt titles, 16pt subtitles, 14pt body. Translated to web, the body base is `17px` with a minimum rendered size of `14px` for fine print — no UI text below that.

**No second typeface is introduced.** The uppercase tracked "eyebrow" style seen on packaging is achieved with Baloo SemiBold at small size with wide letter-spacing, not a different font.

Fonts are **self-hosted** as `woff2` in `assets/` rather than loaded from Google's CDN — removes a third-party request, improves LCP, and avoids sending visitor IPs to a third party. Baloo Bhaijaan 2 is OFL-licensed, so self-hosting is permitted; the OFL notice ships in the repo.

### 2.3 Logo

Two elements — the Arabic wordmark عزوز and the "Azouz Coffee" lockup — usable together or separately.

- Full lockup minimum: 57px digital
- Wordmark alone minimum: 23px digital
- Logomark for favicon / avatar: 23px minimum
- Permitted colourways: primary green, black, or white — chosen for contrast against the background
- Never tilted, never below minimum size, never coloured over imagery, never on busy or low-contrast surfaces

Theme enforcement: header logo height is a theme setting with a **minimum of 57px** and the setting's help text states the constraint. Favicon uses the logomark asset.

Available files: `logo1/azouz-logo-1.png` (white on green), `-2` (white on white), `-3` (green on white), `-4` (green on black), `logo_black.png` (black, low-res), plus `azouz-logo.ai` and `AzouzLogoBlack.ai` vector sources.

---

## 3. Visual direction

**Governing idea: the packaging is the design system.**

The label block on the silver bags — a solid colour rectangle containing a tight uppercase title, a hairline rule, a two-column spec grid, and a roast-level dot meter — is already a complete UI component. It is lifted directly and reused as the signature element of the site: product cards, coffee-range cards, and service cards all derive from it.

Everything surrounding it is restraint: cream ground, generous whitespace, editorial typography. The brand reads Swiss-minimal, not rustic.

### 3.1 Rules

| Aspect | Rule |
|---|---|
| Page ground | `#FFFBF8`; alternating full-bleed bands in `#F6F1E8`. Green is never a large background wash except one deliberate band per page. |
| Green usage | Primary CTA fill, active/focus states, the label block on B2B cards, one full-bleed band per page. |
| Grid | 12 columns, 1280px content max, 1440px for full-bleed bands, 20px gutters mobile / 32px desktop. |
| Vertical rhythm | Section padding 128px desktop / 96px tablet / 64px mobile. |
| Type scale | `clamp()` driven. H1 `clamp(2.75rem, 6vw, 5rem)`, leading 1.02, tracking −0.02em. Body 17px/1.65. |
| Eyebrow | 0.75rem, uppercase, tracking 0.18em, SemiBold, muted grey `#6B6B6B` (5.2:1). Sits above every section heading — mirrors `SPECIALTY COFFEE ROASTERS` on the bags. **Not** Taupe Beige: that is 1.9:1 on the page ground and fails as text. |
| Hairline | 1px Taupe Beige at 40% opacity, used as separator exactly as on the label. Taupe Beige is a **non-text colour only** — borders, rules, dividers. |
| Radius | 4px. The Kufi logo and Baloo are both rounded; sharp corners fight them, pills are too soft. |
| Texture | Kufi geometric pattern derived from the cup design, 4% opacity, as section dividers only. |
| Imagery | Product shots are silver bags on near-white — they sit natively on Off White with no treatment needed. |

### 3.2 Motion

Minimal and purposeful:

- Fade-up on scroll for section content, via `IntersectionObserver`
- Roast-level dots fill in sequence when a card enters the viewport
- Nav underline slide on hover

All motion is wrapped in `@media (prefers-reduced-motion: no-preference)`. With reduced motion requested, content is immediately visible in its final state.

### 3.3 Deliberately excluded

Burlap or wood textures, rising-steam SVGs, script "handcrafted since" typefaces, scattered coffee-bean icons, brown gradient heroes, stock latte-art photography. None are consistent with this brand's identity.

---

## 4. Theme architecture

Online Store 2.0. JSON templates, sections everywhere, every section carrying a complete `{% schema %}` so the client can edit all copy, images, and section-level colour in the Theme Editor without touching code. This is a hard requirement: the client is a coffee roaster, not a developer.

```
azouz-theme/
├── assets/
│   ├── base.css                  design tokens, reset, typography, layout primitives
│   ├── theme.js                  web components: cart drawer, variant picker, quantity, accordion, reveal
│   ├── baloobhaijaan2-{400,600,700}.woff2
│   ├── logo-primary.svg  logo-black.svg  logo-white.svg  logomark.svg
│   └── pattern-kufi.svg
├── config/
│   ├── settings_schema.json      theme settings: colours, logo, typography scale, social, enquiry email
│   └── settings_data.json        preset values pre-filled with the Azouz brand
├── layout/
│   ├── theme.liquid
│   └── password.liquid
├── locales/
│   ├── en.default.json           all storefront strings
│   └── en.default.schema.json    all Theme Editor labels
├── sections/
│   ├── header.liquid  footer.liquid  announcement-bar.liquid
│   ├── hero-split.liquid          headline + dual CTA + image
│   ├── service-cards.liquid       "What We Do" — label-block cards
│   ├── process-steps.liquid       Source → Blend → Roast → Grind → Pack
│   ├── audience-strip.liquid      "Cafés · Hotels · Restaurants · Retailers …"
│   ├── feature-grid.liquid        the 8 private-label coffee types
│   ├── coffee-range.liquid        4 range cards in packaging-label style
│   ├── blend-builder.liquid       Body · Sweetness · Acidity · Roast · Arabica/Robusta · Flavour
│   ├── packaging-sizes.liquid     heading + format chips — used for "250g · 500g · 1kg · Bulk"
│   │                              and for "Consistent Coffee" (Whole Bean · Ground · Retail · Wholesale)
│   ├── two-column-choice.liquid   "Your Blend or Ours"
│   ├── brand-feature.liquid       Our Brands → Azouz Coffee → shop
│   ├── cta-band.liquid            heading + dual CTA, optional green band
│   ├── enquiry-form.liquid        Request a Sample / Get a Quote
│   ├── featured-collection.liquid
│   ├── main-product.liquid  main-collection.liquid  main-cart.liquid
│   ├── main-search.liquid  main-page.liquid  main-list-collections.liquid
│   ├── main-blog.liquid  main-article.liquid  main-404.liquid  main-password.liquid
│   └── main-{login,register,account,order,addresses,reset-password,activate-account}.liquid
├── snippets/
│   ├── product-card.liquid  roast-meter.liquid  variant-picker.liquid
│   ├── cart-drawer.liquid  cart-line-items.liquid  price.liquid
│   ├── quantity-input.liquid  pagination.liquid  icon.liquid
│   ├── meta-tags.liquid  structured-data.liquid  social-icons.liquid
│   └── responsive-image.liquid
└── templates/
    ├── index.json
    ├── page.private-label.json  page.wholesale.json  page.our-brands.json
    ├── page.enquiry.json  page.json
    ├── product.json  collection.json  list-collections.json
    ├── cart.json  search.json  404.json  password.json
    ├── blog.json  article.json
    ├── gift_card.liquid
    └── customers/{login,register,account,order,addresses,reset_password,activate_account}.json
```

### 4.1 JavaScript

Vanilla custom elements only — no framework, no external library. Each is self-contained and degrades gracefully:

| Element | Responsibility | Without JS |
|---|---|---|
| `<cart-drawer>` | Opens drawer, renders Cart Section API responses | Links to `/cart` page, which is fully functional |
| `<product-form>` | Async add-to-cart, opens drawer | Native form POST to `/cart/add` |
| `<variant-picker>` | Variant selection, price/availability/URL update | Native `<select>` form submission |
| `<quantity-input>` | +/− stepper | Native `<input type=number>` |
| `<accordion-item>` | Collapsible spec panels | `<details>`/`<summary>` fallback |
| `<reveal-on-scroll>` | Fade-up | Content visible by default; JS only adds the animation |

### 4.2 RTL readiness

- All directional CSS uses logical properties: `margin-inline`, `padding-inline`, `inset-inline`, `border-inline`, `text-align: start/end`
- No `left`/`right` physical properties in layout code
- `<html dir>` is derived from the active locale in `theme.liquid`
- Every user-visible string lives in `locales/en.default.json` — no hard-coded English in `.liquid`
- Adding Arabic later requires only `locales/ar.json` plus enabling the language in admin

---

## 5. Content mapping

| Supplied page | Template | Section stack |
|---|---|---|
| "Your Coffee. Your Brand. Our Roastery." | `index.json` | hero-split · service-cards ×3 · process-steps · audience-strip · cta-band |
| "Build Your Own Coffee Brand." | `page.private-label.json` | hero-split · process-steps ×5 · feature-grid ×8 · two-column-choice · blend-builder · packaging-sizes · audience-strip · cta-band |
| "Wholesale Coffee for Your Business." | `page.wholesale.json` | hero-split · coffee-range ×4 · blend-builder · audience-strip · packaging-sizes (preset: "Consistent Coffee, Batch After Batch" — Whole Bean · Ground · Retail Bags · Wholesale Bags) · cta-band |
| "Our Brands." | `page.our-brands.json` | hero-split · brand-feature · feature-grid (retail formats) · distributor cta-band · private-label cross-sell |
| — | `page.enquiry.json` | enquiry-form |

All copy is transcribed verbatim from the client's supplied text into the section defaults in `settings_data.json` / the JSON templates, so the store shows the correct content the moment the theme is applied.

`blend-builder` appears on both Private Label and Wholesale with different presets — one section definition, two configurations.

### 5.1 CTA routing

| Button label | Destination |
|---|---|
| REQUEST A SAMPLE | `/pages/request-a-sample` |
| GET A QUOTE / GET A PRIVATE LABEL QUOTE / GET WHOLESALE PRICING / REQUEST WHOLESALE PRICING | `/pages/get-a-quote` |
| START YOUR PRIVATE LABEL / START YOUR PROJECT / LEARN MORE / EXPLORE PRIVATE LABEL | `/pages/private-label` |
| VIEW WHOLESALE | `/pages/wholesale` |
| DISCOVER OUR COFFEE / VIEW AZOUZ COFFEE | `/collections/all` |
| BECOME A DISTRIBUTOR / WHOLESALE ENQUIRY | `/pages/get-a-quote` (pre-selected business type) |

All destinations are section settings, not hard-coded — the client can re-point any button from the Theme Editor.

---

## 6. Product data model

### 6.1 Options

- **Weight** — 250g / 500g / 1kg (per the packaging-options page)
- **Grind** — Whole Bean / Espresso / Filter / Turkish

Not every product carries both; the variant picker renders whatever options exist.

### 6.2 Metafields

Namespace `custom`. The theme reads these; the definitions are created in admin per the setup guide. Every metafield render is null-guarded so the theme is correct when a definition is missing or empty.

| Key | Type | Renders as |
|---|---|---|
| `roast_level` | `number_integer` (1–5) | dot meter `●●●●○` |
| `tasting_notes` | `list.single_line_text_field` | `DARK CHOCOLATE \| CARAMEL \| SPICE` |
| `origin` | `single_line_text_field` | spec grid row |
| `process` | `single_line_text_field` | spec grid row |
| `altitude` | `single_line_text_field` | spec grid row |
| `brew_methods` | `list.single_line_text_field` | brewing guidance |
| `label_color` | `color` | the label block's fill for that blend |

`label_color` reproduces the per-blend colour coding visible on the packaging: Wadi Rum Blend terracotta, Dead Sea Blend mint, Downtown Blend olive.

### 6.3 Seed products

Derived from the packaging mockups supplied by the client:

| Product | Type | Notes |
|---|---|---|
| Wadi Rum Blend | Espresso roast, 100% Arabica | dark chocolate, caramel, spice — roast 4/5 |
| Dead Sea Blend | Espresso roast, 100% Arabica | dark chocolate, toffee, balanced — roast 4/5 |
| Downtown Blend | Espresso roast, 100% Arabica | chocolate, caramel, smooth — roast 4/5 |
| Filtered Coffee Bags | 12g single-serve, box | specialty, dark roast |

Prices are placeholders and are marked `[NEEDS PRICE]` in `products.csv` so nothing incorrect goes live by accident.

---

## 7. B2B enquiry forms

Built on Shopify's native `{% form 'contact' %}`. This costs nothing, requires no app, and delivers submissions to the store's customer-service email — consistent with what the developer told the client about not adding monthly costs.

Fields: Name · Company · Email · Phone · Business type (select) · Coffee type of interest (select) · Expected monthly volume · Message.

One `enquiry-form` section with two presets:

- **Request a Sample** — heading and copy oriented to sampling; volume field optional
- **Get a Quote** — heading oriented to pricing; volume field required

Business type options match the audience list in the copy: Coffee Shop · Restaurant · Hotel · Office · Retailer · Distributor · Startup · Supermarket · Other.

Success and error states are rendered inline from `form.posted_successfully?` and `form.errors`, with focus moved to the message for screen-reader users.

---

## 8. Accessibility & SEO

- Semantic landmarks: `header`/`nav`/`main`/`footer`, one `<h1>` per page
- Visible focus rings on all interactive elements, never `outline: none` without a replacement
- Skip-to-content link
- Colour contrast. Measured against WCAG 2.1:

  | Pair | Ratio | Verdict |
  |---|---|---|
  | Jet `#303030` on Off White | 12.8:1 | AAA |
  | Muted `#6B6B6B` on Off White | 5.2:1 | AA |
  | White on Asparagus `#67985E` | 3.4:1 | **large text only** — WCAG large scale is ≥24px, or ≥18.66px at weight 700. Semibold at 18px does **not** qualify. |
  | Jet on Asparagus | 3.9:1 | **large text only** |
  | Taupe Beige on Off White | 1.9:1 | **fails — non-text use only** |
  | White on Deep Green `#4F7748` | 5.2:1 | AA |
  | Deep Green on Off White | 5.0:1 | AA |
  | Deep Green on Warm Cream | 4.6:1 | AA |

  Neither white nor Jet reaches 4.5:1 on the primary green, so **green is never a background for small text**. Two derived tokens resolve this without leaving the brand hue: `--color-accent` (`#67985E`, the guideline primary) for non-text fills and display type at 24px and above; `--color-accent-deep` (`#4F7748`, a darkened primary) wherever green must carry or sit behind anything smaller. **Buttons use the deep green** — their labels are 18px semibold, which is not large-scale text and so needs the full 4.5:1.

Two automated tests (§10) enforce this: one reads the token file and fails if any documented pairing regresses; the other parses the `.button` rule, derives its actual pixel size and weight, and asserts the correct threshold for that size. The first implementation of the button got this wrong — white on primary green at 18px semibold — and the test is what caught it.
- Every image gets meaningful `alt`, sourced from a section setting
- `<meta>` title/description, Open Graph, Twitter card via `meta-tags.liquid`
- JSON-LD: `Organization` on all pages, `Product` with offers on product pages, `BreadcrumbList` on collection/product
- Responsive images via `image_url` with `srcset` and explicit `width`/`height` to prevent layout shift
- Native lazy loading below the fold; hero image eager with `fetchpriority="high"`

---

## 9. Deliverables

| # | Artefact | Path |
|---|---|---|
| 1 | Theme zip, importable directly | `dist/azouz-coffee-theme.zip` |
| 2 | Product import file | `dist/products.csv` |
| 3 | Shopify admin setup guide | `docs/handover/01-shopify-setup.md` |
| 4 | Affiliate + AI apps guide | `docs/handover/02-affiliate-and-ai-apps.md` |
| 5 | Post-upload test checklist | `docs/handover/03-post-upload-checklist.md` |
| 6 | Preview harness (dev only, not shipped) | `preview/` |

### 9.1 Setup guide contents (§3 above is the reason this exists)

Import theme · create the 4 pages and assign templates · navigation menus · product metafield definitions · import products.csv · payment gateway for Jordan cards · Cash on Delivery · shipping zone and rates for Jordan · COD fee · taxes · store policies · contact email for enquiry forms · favicon · domain.

### 9.2 Affiliate guide contents

Comparison of affiliate apps with a genuine free tier (UpPromote, Refersion, Goaffpro) against this store's needs, install steps, commission rule configuration, referral link generation, affiliate dashboard, payout process. Plus AI marketing apps for product descriptions, email, SEO, and chat — with each app's actual pricing stated plainly so the client knows what is free and what is not.

---

## 10. Verification

| Step | Method | What it proves |
|---|---|---|
| Liquid lint | `npx shopify theme check` | No Liquid syntax errors, no undefined objects, no deprecated filters, schema validity |
| JSON validity | Node script parsing every `.json` in `config/`, `locales/`, `templates/` | Shopify will not reject the upload on malformed JSON |
| Required files | Node script asserting `layout/theme.liquid`, `config/settings_schema.json`, `locales/*.default.json` exist | Upload will not be rejected as an invalid theme |
| Zip structure | Node script listing zip entries | Theme directories are at the **zip root**, not nested inside a parent folder — Shopify rejects wrapped zips |
| Visual review | LiquidJS preview harness rendering the real `.liquid` sources | The design matches the brand guidelines, on real markup rather than a hand-written mock |
| Responsive | Preview harness at 375 / 768 / 1280 / 1440 | No horizontal overflow, layouts hold |

### 10.1 Preview harness design

`preview/` is a small Node dev server, excluded from the delivered zip. It uses LiquidJS with shims for the Shopify-specific tags and filters the theme actually uses — `asset_url`, `image_url`, `money`, `t`, `render`, `section`, `form`, `paginate`, `link_to`, `escape`, `handle` — plus fixture objects for `shop`, `product`, `collection`, `cart`, `page`, `linklists`, `settings`, and `request`.

It renders the **actual section and snippet files**, so the CSS and markup under review are the ones that ship. It is a development aid, not a Shopify emulator.

### 10.2 Stated limitations

The following cannot be verified locally and are listed in the post-upload checklist for testing on the live store:

- Checkout, payment authorisation, COD flow
- Real contact-form email delivery
- Predictive search (a Shopify server-side API)
- Cart Section API responses
- Shipping rate calculation
- Customer accounts, discount codes, affiliate tracking

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Shopify rejects the zip on upload | Structural validation before packaging; if it still fails, the same folder can be pushed with `shopify theme push` |
| Client's real prices/copy differ from the seeds | Placeholders explicitly marked `[NEEDS PRICE]`; every string is editable in the Theme Editor |
| Metafield definitions not created → blank spec panels | All metafield reads null-guarded; the setup guide covers definitions before product import |
| White-on-green contrast fails AA at body size | Constraint encoded in the CSS tokens and documented; small text on green uses Jet |
| Client's existing theme is live and edits get lost | Guide instructs uploading as an unpublished theme, previewing, then publishing |
| Preview harness drifts from real Shopify rendering | Harness renders the real `.liquid` files; `theme check` catches Liquid-level problems the harness cannot |
