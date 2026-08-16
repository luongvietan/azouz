# Azouz Coffee Theme — Plan C: Commerce Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the D2C shop — product, collection, cart, search, list-collections, 404, password and customer-account templates — plus the `theme.js` web components that make the cart drawer, variant picker and quantity stepper work, so the whole shop surface renders against fixtures in the local preview and the drawer and picker genuinely function.

**Architecture:** Each template gets one `main-*` section that reads its context object (`product`, `collection`, `cart`, `search`, `customer`) and carries no `presets`, so it never appears in the Theme Editor's "add section" list — the same rule `main-page.liquid` already follows. Reusable pieces (price, roast meter, product card, variant picker, quantity input, pagination, cart lines) are snippets. `theme.js` stays a **classic script** — no `import`, no `export`, zero delivery risk — and exposes its pure logic on a single `window.AzouzTheme` namespace so `node:test` can load the real shipped file in a `node:vm` sandbox and unit-test that logic. Commerce styles go in a new `assets/commerce.css` rather than growing `sections.css` further. The preview harness gains dynamic routing, an in-memory cart and a Section Rendering API shim, which is what lets the drawer be reviewed for real.

**Tech Stack:** Shopify Liquid (OS 2.0), vanilla custom elements, vanilla CSS with logical properties, `node:test`, `node:vm`, LiquidJS preview harness from Plans A and B.

**Spec:** `docs/superpowers/specs/2026-08-16-azouz-coffee-shopify-theme-design.md`

**Working directory:** `C:\Users\admin\Desktop\Azouz`. Windows, PowerShell, Node 24, git on PATH. Branch: **`plan-c-commerce`**, cut from `plan-b-marketing`.

---

## What Plans A and B already give you

Do not rebuild any of this.

| Asset | What it gives you |
|---|---|
| `azouz-theme/assets/tokens.css` | Every colour, type-scale, spacing, radius and motion token. **Never write a colour literal anywhere else.** |
| `azouz-theme/assets/base.css` | `.container`, `.container--narrow/--wide`, `.section`, `.section--alt/--tint/--accent`, `.grid--2/3/4`, `.stack`, `.eyebrow`, `.lead`, `.button`, `.button--secondary`, `.button-group`, `.rule`, `.label-block` (+`__title`,`__subtitle`,`__rule`,`__specs`), `.roast-meter` (+`__dot`,`__dot--filled`), `.texture-kufi`, `.visually-hidden`, `.skip-link`, `.reveal` |
| `azouz-theme/assets/sections.css` | All Plan B marketing section styles, plus `.icon` and the form field kit: `.field`, `.field--wide`, `.field__label`, `.field__hint`, `.field__input` (used on `<input>`, `<select>` **and** `<textarea>` — there is deliberately no separate select class) |
| `azouz-theme/assets/theme.js` | `<reveal-on-scroll>` only. Classic script, loaded `defer` from the layout. |
| `azouz-theme/layout/theme.liquid` | Document shell. Sets `class="no-js"` on `<html>` and swaps it to `js` inline in `<head>`. Renders `announcement-bar`, `header`, `footer`. |
| `azouz-theme/locales/en.default.json` | All UI strings. Add keys here; never hard-code English in `.liquid`. |
| `azouz-theme/snippets/icon.liquid` | `{% render 'icon', name: 'cart' %}` — `search`, `cart`, `menu`, `close`, `arrow-right`, `chevron-down` |
| `preview/engine.js` | `createEngine(themeDir)`, `renderThemeFile(engine, themeDir, path, extraScope)` |
| `preview/template-renderer.js` | `renderTemplate(engine, themeDir, templatePath, extraScope)` — walks a JSON template's `order` |
| `preview/settings-resolver.js` | `resolveSettings(schema, settings, fixtures)` — turns `link_list` / `image_picker` / `collection` / `product` settings into objects |
| `preview/fixtures.js` | `buildFixtures()` — shop, 4 products, empty cart, `linklists`, `routes`, `request` |
| `preview/server.js` | Dev server on 4321; exports `ROUTES`, `templateForRoute`, `createPreviewServer` |
| `tests/helpers/render-section.js` | `renderSection(name, { settings, blocks, scope })`, `countMatches(html, pattern)` |
| `scripts/schema-parser.js` | `extractSchema`, `defaultSettings`, `defaultBlocks` |

**Baseline before you start:** `npm test` → **283 passing**. `npm run validate` → `Theme validation passed.` `npm run check` → 1 warning (`AssetPreload`), **0 errors**.

---

## Hard rules for this plan

These carry forward from Plan B. Two of them have already caught real defects; do not relax them.

1. **Tests live flat in `tests/`.** `npm test` runs `node --test tests/*.test.js` — a flat glob. A file in `tests/sections/` or `tests/snippets/` **never runs and the suite still reports green**. Section tests are `tests/section-<name>.test.js`, snippet tests are `tests/snippet-<name>.test.js`, JS component tests are `tests/theme-js-<name>.test.js`. Helpers go in `tests/helpers/` and must not end in `.test.js`.
2. **No colour literals outside `tokens.css`. No physical direction properties.** Task 1 extends the enforcement to `commerce.css` and moves the guards into one shared helper so `base.css`, `sections.css` and `commerce.css` are all checked by the same code.
3. **No user-visible English inside `.liquid` markup.** Copy comes from a section setting or `locales/en.default.json`. English inside `{% schema %}` is correct and expected.
4. **Green rules.** `--color-accent` for non-text fills and display type ≥24px only. `--color-accent-deep` wherever green carries or backs smaller text. `--color-hairline` is a border colour, never a text colour.
5. **One `<h1>` per page.** On commerce templates the `<h1>` is the product title, the collection title, the cart heading, the search heading or the account heading — one per template, never more.
6. **Every component degrades.** Before you write a line of JavaScript, the HTML must already work. The JS only ever *adds*. Task 24 Step 6 disables JavaScript and checks this — it is the step that caught the `.reveal` defect at the end of Plan A. **Do not skip it.**
7. **`main-*` sections carry no `presets`.** They read a context object that only exists on their own template.
8. **Every metafield read is null-guarded.** The client may not have created the definitions yet. A missing metafield must render nothing, never an empty box or the word "null".

---

## Out of scope for Plan C

Named here so nobody adds them halfway through:

- Blog and article templates, `gift_card.liquid` — deferred to Plan D
- Predictive search (a Shopify server-side API with no local equivalent)
- Real checkout, real payment, real customer authentication
- Discount codes, affiliate tracking, shipping calculators
- Arabic translation (`locales/ar.json`) — the theme is RTL-*ready*, not translated

## Deviations from the spec's file tree, and why

| Spec says | Plan C does | Why |
|---|---|---|
| `snippets/cart-drawer.liquid` | `sections/cart-drawer.liquid` | The Section Rendering API can only re-render a **section**. A snippet cannot be refreshed after an add-to-cart. |
| `<accordion-item>` custom element | Plain `<details>`/`<summary>` | The native element already does everything the component would, keyboard and screen-reader behaviour included. Writing a custom element to reimplement it would be code with no purpose. |
| Section styles in `sections.css` | New `assets/commerce.css` | `sections.css` is already large. Commerce styles change together and belong together. |
| `snippets/responsive-image.liquid` | `image_url` + explicit `width`/`height` on each `<img>` | Marketing images already ship this way. A shared snippet would be a rename, not a behaviour change. Add it in a polish pass if Lighthouse flags missing `srcset`. |
| `snippets/social-icons.liquid` | Footer already renders social links from theme settings | A second snippet would duplicate `footer.liquid`. |

---

## File Structure

| File | Responsibility |
|---|---|
| `azouz-theme/assets/commerce.css` | All commerce styles, appended to by most tasks |
| `azouz-theme/assets/theme.js` | Grows `AzouzTheme` pure helpers + `<quantity-input>`, `<variant-picker>`, `<product-form>`, `<cart-drawer>` |
| `azouz-theme/snippets/price.liquid` | Money, compare-at, "from" pricing |
| `azouz-theme/snippets/roast-meter.liquid` | Null-guarded dot meter for `custom.roast_level` |
| `azouz-theme/snippets/product-card.liquid` | Packaging-label product tile |
| `azouz-theme/snippets/quantity-input.liquid` | Number input + optional stepper buttons |
| `azouz-theme/snippets/pagination.liquid` | Previous / page numbers / next |
| `azouz-theme/snippets/variant-picker.liquid` | Option selects + `<noscript>` fallback select |
| `azouz-theme/snippets/cart-line-items.liquid` | The cart line table, shared by page and drawer |
| `azouz-theme/sections/main-product.liquid` | Product page |
| `azouz-theme/sections/main-collection.liquid` | Collection page |
| `azouz-theme/sections/main-cart.liquid` | Cart page |
| `azouz-theme/sections/main-search.liquid` | Search results |
| `azouz-theme/sections/main-list-collections.liquid` | Collection index |
| `azouz-theme/sections/main-404.liquid` | Not found |
| `azouz-theme/sections/main-password.liquid` | Password page |
| `azouz-theme/sections/cart-drawer.liquid` | The drawer, re-renderable via the Section Rendering API |
| `azouz-theme/sections/featured-collection.liquid` | Product carousel/grid for the homepage |
| `azouz-theme/sections/main-login.liquid` … `main-activate-account.liquid` | Seven customer-account sections |
| `azouz-theme/layout/password.liquid` | Password-page layout |
| `azouz-theme/templates/product.json` `collection.json` `cart.json` `search.json` `list-collections.json` `404.json` `password.json` | Commerce templates |
| `azouz-theme/templates/customers/*.json` | Seven customer templates |
| `preview/route-context.js` | URL → `{ page_type, template, scope }`, static and dynamic |
| `preview/cart-api.js` | In-memory preview cart + line building |
| `tests/helpers/css-guards.js` | Shared CSS assertions (not a test file) |
| `tests/helpers/render-snippet.js` | `renderSnippet(name, args, scope)` (not a test file) |
| `tests/helpers/load-theme-js.js` | Loads the real `theme.js` into a `node:vm` sandbox (not a test file) |

---

## Task 1: `commerce.css`, shared CSS guards

**Files:**
- Create: `azouz-theme/assets/commerce.css`
- Create: `tests/helpers/css-guards.js`
- Create: `tests/commerce-css.test.js`
- Modify: `azouz-theme/layout/theme.liquid`
- Modify: `tests/sections-css.test.js`

- [ ] **Step 1: Write the shared guard helper**

Create `tests/helpers/css-guards.js`:

```js
import assert from 'node:assert/strict';

/**
 * Properties that hard-code a physical direction. Every one of these has a
 * logical equivalent that flips automatically under `dir="rtl"`, which the
 * theme must support for Arabic.
 */
const PHYSICAL_PROPERTIES = [
  /(?<![-\w])margin-left\s*:/g,
  /(?<![-\w])margin-right\s*:/g,
  /(?<![-\w])padding-left\s*:/g,
  /(?<![-\w])padding-right\s*:/g,
  /(?<![-\w])border-left\s*:/g,
  /(?<![-\w])border-right\s*:/g,
  /(?<![-\w])left\s*:/g,
  /(?<![-\w])right\s*:/g,
  /text-align\s*:\s*(left|right)/g,
];

/** Strip comments so a rule written inside a note is not read as real CSS. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

export function assertLogicalPropertiesOnly(css, label) {
  const offenders = [];
  for (const pattern of PHYSICAL_PROPERTIES) {
    for (const match of stripComments(css).matchAll(pattern)) offenders.push(match[0]);
  }
  assert.deepEqual(
    offenders,
    [],
    `${label}: use logical properties instead — ${offenders.join(', ')}`,
  );
}

export function assertNoColourLiterals(css, label) {
  const literals = stripComments(css).match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  assert.deepEqual(literals, [], `${label}: move these into tokens.css — ${literals.join(', ')}`);
}

/**
 * White on --color-accent measures 3.37:1. That passes only for large text.
 * A rule may fill with the primary green, but if it also sets the on-accent
 * text colour it must declare a display-size font.
 */
export function assertNoSmallTextOnAccent(css, label) {
  const offenders = [];
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const [, selector, body] = match;
    if (!/background(-color)?:\s*var\(--color-accent\)/.test(body)) continue;
    if (
      /color:\s*var\(--color-on-accent\)/.test(body) &&
      !/font-size:\s*var\(--text-(2xl|3xl|display)\)/.test(body)
    ) {
      offenders.push(selector.trim());
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `${label}: white on --color-accent is 3.37:1 and legal only above 24px — use --color-accent-deep: ${offenders.join(' | ')}`,
  );
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/commerce-css.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import {
  assertLogicalPropertiesOnly,
  assertNoColourLiterals,
  assertNoSmallTextOnAccent,
} from './helpers/css-guards.js';

const load = () => readFile(resolveInTheme('assets/commerce.css'), 'utf8');

test('commerce.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('commerce.css uses no physical directional properties — RTL readiness', async () => {
  assertLogicalPropertiesOnly(await load(), 'commerce.css');
});

test('commerce.css contains no colour literals — tokens only', async () => {
  assertNoColourLiterals(await load(), 'commerce.css');
});

test('commerce.css never puts small text on the primary green', async () => {
  assertNoSmallTextOnAccent(await load(), 'commerce.css');
});

test('the layout links commerce.css after sections.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const sections = layout.indexOf('sections.css');
  const commerce = layout.indexOf('commerce.css');
  assert.ok(commerce > -1, 'commerce.css must be linked from the layout');
  assert.ok(commerce > sections, 'commerce.css must come after sections.css so it can override');
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test tests/commerce-css.test.js`
Expected: FAIL — `ENOENT` on `assets/commerce.css`.

- [ ] **Step 4: Create `azouz-theme/assets/commerce.css`**

```css
/*
  Azouz Coffee — commerce styles.

  Layout primitives, buttons, the .label-block component and the roast meter
  live in base.css; marketing sections live in sections.css. This file holds
  the shop surface: product, collection, cart, drawer, search and account.

  Same rules as the other two, enforced by tests/commerce-css.test.js:
    - no colour literals; every colour comes from tokens.css
    - no physical direction properties; logical only, so the theme flips for Arabic
    - never place body-size text on --color-accent (3.37:1); use --color-accent-deep
*/
```

- [ ] **Step 5: Link it from the layout**

In `azouz-theme/layout/theme.liquid`, replace:

```liquid
    {{ 'sections.css' | asset_url | stylesheet_tag }}
```

with:

```liquid
    {{ 'sections.css' | asset_url | stylesheet_tag }}
    {{ 'commerce.css' | asset_url | stylesheet_tag }}
```

- [ ] **Step 6: Point `tests/sections-css.test.js` at the shared helper**

Replace the whole of `tests/sections-css.test.js` with:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import {
  assertLogicalPropertiesOnly,
  assertNoColourLiterals,
  assertNoSmallTextOnAccent,
} from './helpers/css-guards.js';

const load = () => readFile(resolveInTheme('assets/sections.css'), 'utf8');

test('sections.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('sections.css uses no physical directional properties — RTL readiness', async () => {
  assertLogicalPropertiesOnly(await load(), 'sections.css');
});

test('sections.css contains no colour literals — tokens only', async () => {
  assertNoColourLiterals(await load(), 'sections.css');
});

test('sections.css never puts small text on the primary green', async () => {
  assertNoSmallTextOnAccent(await load(), 'sections.css');
});

test('the layout links sections.css after base.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const base = layout.indexOf('base.css');
  const sections = layout.indexOf('sections.css');
  assert.ok(sections > -1, 'sections.css must be linked from the layout');
  assert.ok(sections > base, 'sections.css must come after base.css so it can override');
});
```

- [ ] **Step 7: Run to verify everything passes**

Run: `node --test tests/commerce-css.test.js tests/sections-css.test.js tests/theme-layout.test.js`
Expected: PASS — 5 + 5 + 11 = 21 tests. If `sections-css` now fails, the shared helper is stricter than the copy it replaced; fix `sections.css`, not the helper.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS — 288 tests.

- [ ] **Step 9: Commit**

```bash
git add azouz-theme/assets/commerce.css azouz-theme/layout/theme.liquid tests/helpers/css-guards.js tests/commerce-css.test.js tests/sections-css.test.js
git commit -m "feat: add commerce.css and share the css guard assertions"
```

---

## Task 2: Commerce fixtures

The variant picker matches on `variant.options` — an array Shopify provides and the current fixtures do not. Search, customer and order objects do not exist at all. Without these, none of the commerce sections can be rendered in a test.

**Files:**
- Modify: `preview/fixtures.js`
- Test: `tests/fixtures-commerce.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/fixtures-commerce.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures, buildSearchFixture, buildCustomerFixture } from '../preview/fixtures.js';

test('every variant exposes the options array the variant picker matches on', () => {
  for (const product of buildFixtures().products) {
    for (const variant of product.variants) {
      assert.ok(Array.isArray(variant.options), `${variant.id} has no options array`);
      assert.equal(variant.options[0], variant.option1);
    }
  }
});

test('every variant has a url carrying its own variant id', () => {
  const product = buildFixtures().products[0];
  for (const variant of product.variants) {
    assert.equal(variant.url, `${product.url}?variant=${variant.id}`);
  }
});

test('one variant is unavailable so the picker disabled state can be reviewed', () => {
  const all = buildFixtures().products.flatMap((product) => product.variants);
  assert.ok(all.some((variant) => variant.available === false));
});

test('one variant is on sale so compare-at pricing can be reviewed', () => {
  const all = buildFixtures().products.flatMap((product) => product.variants);
  assert.ok(all.some((variant) => variant.compare_at_price > variant.price));
});

test('search returns the products whose title or notes match the terms', () => {
  const search = buildSearchFixture('wadi');
  assert.equal(search.performed, true);
  assert.equal(search.terms, 'wadi');
  assert.deepEqual(search.results.map((r) => r.handle), ['wadi-rum-blend']);
  assert.equal(search.results_count, 1);
});

test('an empty search term performs no search and returns nothing', () => {
  const search = buildSearchFixture('');
  assert.equal(search.performed, false);
  assert.deepEqual(search.results, []);
});

test('a search that matches nothing still reports it was performed', () => {
  const search = buildSearchFixture('zzzz');
  assert.equal(search.performed, true);
  assert.equal(search.results_count, 0);
});

test('the customer fixture carries orders and addresses', () => {
  const customer = buildCustomerFixture();
  assert.equal(typeof customer.name, 'string');
  assert.ok(customer.orders.length > 0);
  assert.ok(customer.addresses.length > 0);
  assert.equal(customer.addresses_count, customer.addresses.length);
  assert.equal(customer.orders_count, customer.orders.length);
});

test('each order has line items and a customer url', () => {
  const order = buildCustomerFixture().orders[0];
  assert.ok(order.line_items.length > 0);
  assert.match(order.customer_url, /^\/account\/orders\//);
  assert.equal(typeof order.total_price, 'number');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/fixtures-commerce.test.js`
Expected: FAIL — `buildSearchFixture is not a function`, and variants have no `options`.

- [ ] **Step 3: Give variants `options`, `url`, availability and compare-at**

In `preview/fixtures.js`, replace the whole `makeBlend` function with:

```js
function makeBlend({ handle, title, roast, notes, labelColor, description, soldOut, saleOn }) {
  const url = `/products/${handle}`;

  const variant = ({ id, weight, grind, price, compareAt = null }) => ({
    id,
    title: `${weight} / ${grind}`,
    option1: weight,
    option2: grind,
    options: [weight, grind],
    price,
    compare_at_price: compareAt,
    available: id !== soldOut,
    url: `${url}?variant=${id}`,
    featured_image: `/preview-media/${handle}.jpg`,
    inventory_quantity: id === soldOut ? 0 : 25,
  });

  const variants = [
    variant({
      id: `${handle}-250-wb`,
      weight: '250g',
      grind: 'Whole Bean',
      price: 750,
      compareAt: saleOn === `${handle}-250-wb` ? 900 : null,
    }),
    variant({ id: `${handle}-1kg-wb`, weight: '1kg', grind: 'Whole Bean', price: 2600 }),
    variant({ id: `${handle}-1kg-esp`, weight: '1kg', grind: 'Espresso', price: 2600 }),
  ];

  const available = variants.filter((item) => item.available);

  return {
    id: handle,
    handle,
    title,
    description,
    url,
    available: available.length > 0,
    price: variants[0].price,
    price_min: 750,
    price_max: 2600,
    compare_at_price: variants[0].compare_at_price,
    options: ['Weight', 'Grind'],
    options_with_values: [
      { name: 'Weight', values: ['250g', '1kg'] },
      { name: 'Grind', values: ['Whole Bean', 'Espresso'] },
    ],
    variants,
    selected_or_first_available_variant: available[0] ?? variants[0],
    featured_image: `/preview-media/${handle}.jpg`,
    images: [`/preview-media/${handle}.jpg`],
    tags: ['espresso', 'arabica'],
    type: 'Coffee',
    vendor: 'Azouz Coffee',
    metafields: {
      custom: {
        roast_level: metafield(roast, 'number_integer'),
        tasting_notes: metafield(notes, 'list.single_line_text_field'),
        origin: metafield('Blend', 'single_line_text_field'),
        process: metafield('Washed', 'single_line_text_field'),
        altitude: metafield('1,400–1,900 masl', 'single_line_text_field'),
        brew_methods: metafield(['Espresso', 'Moka Pot'], 'list.single_line_text_field'),
        label_color: metafield(labelColor, 'color'),
      },
    },
  };
}
```

Then, still inside `buildFixtures`, extend the two calls that need the new states. Replace the `dead-sea-blend` call with:

```js
    makeBlend({
      handle: 'dead-sea-blend',
      title: 'Dead Sea Blend',
      roast: 4,
      notes: ['Dark Chocolate', 'Toffee', 'Balanced'],
      labelColor: '#BFDDD3',
      description: 'Balanced and rounded, with dark chocolate and toffee through the cup.',
      soldOut: 'dead-sea-blend-1kg-esp',
    }),
```

and the `downtown-blend` call with:

```js
    makeBlend({
      handle: 'downtown-blend',
      title: 'Downtown Blend',
      roast: 4,
      notes: ['Chocolate', 'Caramel', 'Smooth'],
      labelColor: '#7C7F44',
      description: 'Smooth and approachable — chocolate and caramel, made for milk drinks.',
      saleOn: 'downtown-blend-250-wb',
    }),
```

- [ ] **Step 4: Give the filter-bags product the same variant shape**

Inside `buildFixtures`, replace the `filtered-coffee-bags` object literal's `variants` and `selected_or_first_available_variant` with:

```js
      variants: [
        {
          id: 'fcb-box10',
          title: 'Box of 10 / Filter',
          option1: 'Box of 10',
          option2: 'Filter',
          options: ['Box of 10', 'Filter'],
          price: 900,
          compare_at_price: null,
          available: true,
          url: '/products/filtered-coffee-bags?variant=fcb-box10',
          featured_image: '/preview-media/filtered-coffee-bags.jpg',
          inventory_quantity: 40,
        },
      ],
      selected_or_first_available_variant: {
        id: 'fcb-box10',
        title: 'Box of 10 / Filter',
        option1: 'Box of 10',
        option2: 'Filter',
        options: ['Box of 10', 'Filter'],
        price: 900,
        compare_at_price: null,
        available: true,
        url: '/products/filtered-coffee-bags?variant=fcb-box10',
        featured_image: '/preview-media/filtered-coffee-bags.jpg',
        inventory_quantity: 40,
      },
```

- [ ] **Step 5: Add the search and customer builders**

Append to `preview/fixtures.js`:

```js
/**
 * A Shopify `search` drop. Matching is a plain substring test over the title
 * and the tasting notes — enough to review the results, empty and no-results
 * states. Predictive search is a server-side Shopify API with no local
 * equivalent and is out of scope.
 *
 * @param {string} terms
 */
export function buildSearchFixture(terms = '') {
  const query = String(terms).trim().toLowerCase();
  if (query === '') {
    return { performed: false, terms: '', results: [], results_count: 0, types: ['product'] };
  }

  const { products } = buildFixtures();
  const results = products.filter((product) => {
    const notes = (product.metafields.custom.tasting_notes.value ?? []).join(' ');
    return `${product.title} ${notes}`.toLowerCase().includes(query);
  });

  return {
    performed: true,
    terms: String(terms),
    results,
    results_count: results.length,
    types: ['product'],
  };
}

const ADDRESS = {
  id: 'addr-1',
  first_name: 'Layla',
  last_name: 'Haddad',
  company: 'Rainbow Street Coffee',
  address1: '12 Rainbow Street',
  address2: '',
  city: 'Amman',
  province: '',
  zip: '11181',
  country: 'Jordan',
  phone: '+962 7 9000 0000',
};

/**
 * A logged-in customer with one past order, for previewing the account pages.
 * There is no authentication in preview — the account routes always render as
 * though this customer is signed in.
 */
export function buildCustomerFixture() {
  const { products } = buildFixtures();

  const order = {
    id: 1002,
    name: '#1002',
    order_number: 1002,
    created_at: '2026-07-28T09:15:00Z',
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    subtotal_price: 4100,
    total_price: 4400,
    shipping_price: 300,
    customer_url: '/account/orders/1002',
    shipping_address: ADDRESS,
    billing_address: ADDRESS,
    line_items: [
      {
        id: 'line-1',
        title: 'Wadi Rum Blend — 1kg / Whole Bean',
        product: products[0],
        variant: products[0].variants[1],
        quantity: 1,
        price: 2600,
        line_price: 2600,
        image: products[0].featured_image,
        url: products[0].url,
      },
      {
        id: 'line-2',
        title: 'Dead Sea Blend — 250g / Whole Bean',
        product: products[1],
        variant: products[1].variants[0],
        quantity: 2,
        price: 750,
        line_price: 1500,
        image: products[1].featured_image,
        url: products[1].url,
      },
    ],
  };

  return {
    id: 'cust-1',
    first_name: 'Layla',
    last_name: 'Haddad',
    name: 'Layla Haddad',
    email: 'layla@example.com',
    phone: ADDRESS.phone,
    accepts_marketing: false,
    orders_count: 1,
    total_spent: 4400,
    orders: [order],
    default_address: ADDRESS,
    addresses: [ADDRESS],
    addresses_count: 1,
  };
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `node --test tests/fixtures-commerce.test.js tests/fixtures.test.js`
Expected: PASS — 9 + 7 = 16 tests. The Plan A fixture tests must still be green; if `products expose variants with weight and grind options` fails, `makeBlend` lost a field.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — 297 tests.

- [ ] **Step 8: Commit**

```bash
git add preview/fixtures.js tests/fixtures-commerce.test.js
git commit -m "feat: add variant options, search and customer fixtures"
```

---

## Task 3: Route context

The preview server currently knows six hard-coded marketing paths. The shop needs `/products/:handle`, `/collections/:handle`, `/cart`, `/search`, `/404` and seven account paths. Putting that logic in `server.js` would leave one file doing routing, rendering and static assets, so it moves to its own module.

**Files:**
- Create: `preview/route-context.js`
- Modify: `preview/server.js`
- Test: `tests/route-context.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/route-context.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ROUTES, templateForRoute, resolveRoute, listPreviewPaths } from '../preview/route-context.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('the marketing routes from Plan B are still served', () => {
  for (const path of ['/', '/pages/private-label', '/pages/wholesale', '/pages/our-brands']) {
    assert.ok(ROUTES[path], `${path} must still be a preview route`);
  }
});

test('templateForRoute falls back to the default page template', () => {
  assert.equal(templateForRoute({ page_type: 'page' }), 'templates/page.json');
});

test('a product url resolves to the product template with that product in scope', () => {
  const route = resolveRoute('/products/wadi-rum-blend');
  assert.equal(route.page_type, 'product');
  assert.equal(route.template, 'templates/product.json');
  assert.equal(route.scope.product.title, 'Wadi Rum Blend');
});

test('an unknown product handle resolves to the 404 template', () => {
  const route = resolveRoute('/products/not-a-real-blend');
  assert.equal(route.page_type, '404');
  assert.equal(route.template, 'templates/404.json');
});

test('a collection url resolves to the collection template', () => {
  const route = resolveRoute('/collections/all');
  assert.equal(route.page_type, 'collection');
  assert.equal(route.scope.collection.products.length, 4);
});

test('the collection index lists every collection', () => {
  const route = resolveRoute('/collections');
  assert.equal(route.page_type, 'list-collections');
  assert.ok(route.scope.collections.length >= 1);
});

test('the cart route renders the live preview cart', () => {
  const route = resolveRoute('/cart');
  assert.equal(route.page_type, 'cart');
  assert.equal(route.template, 'templates/cart.json');
  assert.ok(Array.isArray(route.scope.cart.items));
});

test('the search route reads its terms from the query string', () => {
  const route = resolveRoute('/search', new URLSearchParams('q=wadi'));
  assert.equal(route.page_type, 'search');
  assert.equal(route.scope.search.terms, 'wadi');
  assert.equal(route.scope.search.results_count, 1);
});

test('every account route resolves with a signed-in customer', () => {
  for (const path of [
    '/account',
    '/account/login',
    '/account/register',
    '/account/addresses',
    '/account/orders/1002',
  ]) {
    const route = resolveRoute(path);
    assert.ok(route, `${path} must resolve`);
    assert.equal(route.scope.customer.name, 'Layla Haddad');
  }
});

test('the order route puts the order itself in scope', () => {
  const route = resolveRoute('/account/orders/1002');
  assert.equal(route.scope.order.name, '#1002');
});

test('an unrecognised path resolves to the 404 template, never null', () => {
  const route = resolveRoute('/nope/nope');
  assert.equal(route.page_type, '404');
});

test('every template any route points at exists in the theme', () => {
  for (const path of listPreviewPaths()) {
    const route = resolveRoute(path);
    assert.ok(
      existsSync(resolveInTheme(route.template)),
      `${path} points at ${route.template}, which does not exist`,
    );
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/route-context.test.js`
Expected: FAIL — `Cannot find module '../preview/route-context.js'`

- [ ] **Step 3: Create `preview/route-context.js`**

`ROUTES` and `templateForRoute` move here verbatim from `server.js` so there is one routing table.

```js
/**
 * Maps a preview URL to what Shopify would render there: a page_type, a JSON
 * template, and the context object that template's sections read.
 *
 * Anything unrecognised resolves to the 404 template rather than null, so the
 * preview always renders the theme rather than a bare server error page.
 */
import { buildFixtures, buildSearchFixture, buildCustomerFixture } from './fixtures.js';
import { buildCart } from './cart-api.js';

/** Static marketing routes. `page` supplies the Liquid `page` object. */
export const ROUTES = {
  '/': { page_type: 'index', template: 'templates/index.json' },
  '/pages/private-label': {
    page_type: 'page',
    template: 'templates/page.private-label.json',
    page: { title: 'Private Label', handle: 'private-label', content: '' },
  },
  '/pages/wholesale': {
    page_type: 'page',
    template: 'templates/page.wholesale.json',
    page: { title: 'Wholesale', handle: 'wholesale', content: '' },
  },
  '/pages/our-brands': {
    page_type: 'page',
    template: 'templates/page.our-brands.json',
    page: { title: 'Our Brands', handle: 'our-brands', content: '' },
  },
  '/pages/request-a-sample': {
    page_type: 'page',
    template: 'templates/page.enquiry.json',
    page: { title: 'Request a Sample', handle: 'request-a-sample', content: '' },
  },
  '/pages/get-a-quote': {
    page_type: 'page',
    template: 'templates/page.enquiry.json',
    page: { title: 'Get a Quote', handle: 'get-a-quote', content: '' },
  },
};

/** Which JSON template a static route renders. */
export function templateForRoute(route) {
  if (route.template) return route.template;
  return route.page_type === 'index' ? 'templates/index.json' : 'templates/page.json';
}

const ACCOUNT_ROUTES = {
  '/account': { page_type: 'customers/account', template: 'templates/customers/account.json' },
  '/account/login': { page_type: 'customers/login', template: 'templates/customers/login.json' },
  '/account/register': {
    page_type: 'customers/register',
    template: 'templates/customers/register.json',
  },
  '/account/addresses': {
    page_type: 'customers/addresses',
    template: 'templates/customers/addresses.json',
  },
  '/account/recover': {
    page_type: 'customers/reset_password',
    template: 'templates/customers/reset_password.json',
  },
  '/account/activate': {
    page_type: 'customers/activate_account',
    template: 'templates/customers/activate_account.json',
  },
};

const notFound = () => ({ page_type: '404', template: 'templates/404.json', scope: {} });

/**
 * @param {string} pathname
 * @param {URLSearchParams} [query]
 * @returns {{page_type: string, template: string, scope: object}}
 */
export function resolveRoute(pathname, query = new URLSearchParams()) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const fixtures = buildFixtures();

  const marketing = ROUTES[path];
  if (marketing) {
    return {
      page_type: marketing.page_type,
      template: templateForRoute(marketing),
      scope: { page: marketing.page ?? null },
    };
  }

  const product = /^\/products\/([\w-]+)$/.exec(path);
  if (product) {
    const found = fixtures.products.find((item) => item.handle === product[1]);
    if (!found) return notFound();
    return {
      page_type: 'product',
      template: 'templates/product.json',
      scope: { product: found, collection: fixtures.collections.all },
    };
  }

  const collection = /^\/collections\/([\w-]+)$/.exec(path);
  if (collection) {
    const found = fixtures.collections[collection[1]];
    if (!found) return notFound();
    return { page_type: 'collection', template: 'templates/collection.json', scope: { collection: found } };
  }

  if (path === '/collections') {
    return {
      page_type: 'list-collections',
      template: 'templates/list-collections.json',
      scope: { collections: Object.values(fixtures.collections) },
    };
  }

  if (path === '/cart') {
    return { page_type: 'cart', template: 'templates/cart.json', scope: { cart: buildCart() } };
  }

  if (path === '/search') {
    return {
      page_type: 'search',
      template: 'templates/search.json',
      scope: { search: buildSearchFixture(query.get('q') ?? '') },
    };
  }

  if (path === '/password') {
    return { page_type: 'password', template: 'templates/password.json', scope: {} };
  }

  const order = /^\/account\/orders\/(\d+)$/.exec(path);
  if (order) {
    const customer = buildCustomerFixture();
    const found = customer.orders.find((item) => String(item.order_number) === order[1]);
    if (!found) return notFound();
    return {
      page_type: 'customers/order',
      template: 'templates/customers/order.json',
      scope: { customer, order: found },
    };
  }

  const account = ACCOUNT_ROUTES[path];
  if (account) {
    return { ...account, scope: { customer: buildCustomerFixture() } };
  }

  return notFound();
}

/** Every path the preview advertises on startup and the route test walks. */
export function listPreviewPaths() {
  return [
    ...Object.keys(ROUTES),
    '/collections',
    '/collections/all',
    '/products/wadi-rum-blend',
    '/cart',
    '/search',
    '/password',
    ...Object.keys(ACCOUNT_ROUTES),
    '/account/orders/1002',
    '/404',
  ];
}
```

- [ ] **Step 4: Re-export from `preview/server.js` so Plan B's route test keeps working**

In `preview/server.js`, delete the `ROUTES` constant and the `templateForRoute` function, and replace them with:

```js
export { ROUTES, templateForRoute } from './route-context.js';
```

Leave the rest of `server.js` alone for now — Task 4 rewrites its request handler.

- [ ] **Step 5: Run to verify it fails on the templates only**

Run: `node --test tests/route-context.test.js`
Expected: FAIL — `Cannot find module './cart-api.js'`, and the last test cannot find `templates/product.json`. Both are created in Tasks 4 and 5. This is the expected intermediate state; do not chase it.

- [ ] **Step 6: Commit the work in progress**

```bash
git add preview/route-context.js preview/server.js tests/route-context.test.js
git commit -m "feat: extract preview routing into route-context"
```

---

## Task 4: Preview cart API and Section Rendering shim

Plan A listed "Cart Section API responses" as something the preview could not verify. The drawer cannot be reviewed without it, so the preview gets a small in-memory cart and a Section Rendering endpoint. This is an approximation of Shopify's API, not a reimplementation — it exists so the drawer's behaviour can be seen before the theme is uploaded.

**Files:**
- Create: `preview/cart-api.js`
- Test: `tests/cart-api.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/cart-api.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addLine, setLine, buildCart, resetCart, seedCart } from '../preview/cart-api.js';

test('a fresh cart is empty', () => {
  resetCart();
  const cart = buildCart();
  assert.equal(cart.item_count, 0);
  assert.deepEqual(cart.items, []);
  assert.equal(cart.total_price, 0);
});

test('adding a variant creates a line with the right price and title', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  const cart = buildCart();
  assert.equal(cart.item_count, 2);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].price, 750);
  assert.equal(cart.items[0].line_price, 1500);
  assert.equal(cart.items[0].product_title, 'Wadi Rum Blend');
  assert.equal(cart.items[0].variant_title, '250g / Whole Bean');
});

test('adding the same variant twice merges into one line', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 1);
  addLine('wadi-rum-blend-250-wb', 3);
  const cart = buildCart();
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 4);
});

test('the cart total is the sum of its lines', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  addLine('dead-sea-blend-1kg-wb', 1);
  const cart = buildCart();
  assert.equal(cart.total_price, 1500 + 2600);
  assert.equal(cart.items_subtotal_price, cart.total_price);
});

test('setting a line to zero removes it', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  setLine('wadi-rum-blend-250-wb', 0);
  assert.equal(buildCart().items.length, 0);
});

test('adding an unknown variant is ignored rather than throwing', () => {
  resetCart();
  addLine('not-a-variant', 1);
  assert.equal(buildCart().item_count, 0);
});

test('every line carries the url and image the drawer renders', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 1);
  const [line] = buildCart().items;
  assert.match(line.url, /^\/products\/wadi-rum-blend/);
  assert.equal(typeof line.image, 'string');
  assert.equal(line.key, 'wadi-rum-blend-250-wb');
});

test('seeding fills the cart so the populated state can be reviewed', () => {
  resetCart();
  seedCart();
  assert.ok(buildCart().item_count >= 3);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/cart-api.test.js`
Expected: FAIL — `Cannot find module '../preview/cart-api.js'`

- [ ] **Step 3: Create `preview/cart-api.js`**

```js
/**
 * In-memory cart for the preview server.
 *
 * This approximates the parts of Shopify's Cart AJAX API the theme actually
 * calls — /cart/add, /cart/change, /cart.js — so the drawer and the add-to-cart
 * flow can be reviewed locally. It is not a Shopify emulator: there is no
 * inventory check, no discount engine, no selling plans, and the cart resets
 * when the server restarts.
 */
import { buildFixtures } from './fixtures.js';

/** variant id -> quantity, in insertion order. */
const quantities = new Map();

/** @returns {{product: object, variant: object}|null} */
function findVariant(variantId) {
  for (const product of buildFixtures().products) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

export function resetCart() {
  quantities.clear();
}

export function addLine(variantId, quantity = 1) {
  if (!findVariant(variantId)) return;
  const amount = Math.max(0, Number(quantity) || 0);
  if (amount === 0) return;
  quantities.set(variantId, (quantities.get(variantId) ?? 0) + amount);
}

export function setLine(variantId, quantity) {
  const amount = Math.max(0, Number(quantity) || 0);
  if (amount === 0) quantities.delete(variantId);
  else if (findVariant(variantId)) quantities.set(variantId, amount);
}

/** Fill the cart with three lines so the populated state is reviewable. */
export function seedCart() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  addLine('dead-sea-blend-1kg-wb', 1);
  addLine('fcb-box10', 3);
}

/** @returns {object} a Liquid `cart` drop. */
export function buildCart() {
  const items = [];

  for (const [variantId, quantity] of quantities) {
    const found = findVariant(variantId);
    if (!found) continue;
    const { product, variant } = found;
    items.push({
      id: variantId,
      key: variantId,
      quantity,
      title: `${product.title} — ${variant.title}`,
      product_title: product.title,
      variant_title: variant.title,
      product,
      variant,
      url: variant.url,
      image: product.featured_image,
      price: variant.price,
      original_price: variant.price,
      line_price: variant.price * quantity,
      original_line_price: variant.price * quantity,
      final_line_price: variant.price * quantity,
      options_with_values: (product.options ?? []).map((name, index) => ({
        name,
        value: variant.options[index],
      })),
      properties: {},
    });
  }

  const total = items.reduce((sum, item) => sum + item.line_price, 0);

  return {
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    total_price: total,
    items_subtotal_price: total,
    original_total_price: total,
    total_discount: 0,
    currency: 'JOD',
    note: null,
    cart_level_discount_applications: [],
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/cart-api.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add preview/cart-api.js tests/cart-api.test.js
git commit -m "feat: add an in-memory cart to the preview harness"
```

---

## Task 5: Preview server serves the shop

**Files:**
- Modify: `preview/server.js`
- Create: `azouz-theme/templates/product.json`, `collection.json`, `cart.json`, `search.json`, `list-collections.json`, `404.json`, `password.json`
- Create: `azouz-theme/templates/customers/account.json`, `login.json`, `register.json`, `addresses.json`, `order.json`, `reset_password.json`, `activate_account.json`
- Modify: `tests/preview-routes.test.js`
- Test: `tests/preview-server.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/preview-server.test.js`:

```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../preview/server.js';
import { resetCart } from '../preview/cart-api.js';

let server;
let origin;

before(async () => {
  server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, resolve));
  origin = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('the homepage renders a full document', async () => {
  const response = await fetch(`${origin}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Your Coffee\. Your Brand\. Our Roastery\./);
});

test('a product page renders that product', async () => {
  const html = await (await fetch(`${origin}/products/wadi-rum-blend`)).text();
  assert.match(html, /Wadi Rum Blend/);
});

test('an unknown url renders the theme 404, not a server error', async () => {
  const response = await fetch(`${origin}/nope`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /<!doctype html>/i);
});

test('the remove link works — GET /cart/change with quantity 0 drops the line', async () => {
  resetCart();
  await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ id: 'wadi-rum-blend-250-wb', quantity: '1' }),
  });

  const response = await fetch(
    `${origin}/cart/change?id=wadi-rum-blend-250-wb&quantity=0`,
    { redirect: 'manual' },
  );
  assert.equal(response.status, 302);

  const cart = await (await fetch(`${origin}/cart.js`)).json();
  assert.equal(cart.item_count, 0);
});

test('cart.js returns the live cart as json', async () => {
  resetCart();
  const cart = await (await fetch(`${origin}/cart.js`)).json();
  assert.equal(cart.item_count, 0);
});

test('posting to /cart/add adds a line and returns json for fetch callers', async () => {
  resetCart();
  const response = await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ id: 'wadi-rum-blend-250-wb', quantity: '2' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.item_count, 2);
});

test('posting to /cart/add without an ajax Accept header redirects to the cart page', async () => {
  resetCart();
  const response = await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id: 'wadi-rum-blend-250-wb', quantity: '1' }),
    redirect: 'manual',
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/cart');
});

test('the section rendering endpoint returns rendered html per section', async () => {
  resetCart();
  const response = await fetch(`${origin}/?sections=cart-drawer,header`);
  assert.equal(response.status, 200);
  const sections = await response.json();
  assert.match(sections['cart-drawer'], /shopify-section-cart-drawer/);
  assert.match(sections.header, /shopify-section-header/);
});

test('an asset is served with the right content type', async () => {
  const response = await fetch(`${origin}/assets/commerce.css`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/preview-server.test.js`
Expected: FAIL — no `/cart.js`, no section rendering, product template missing.

- [ ] **Step 3: Create the fourteen placeholder templates**

Each of these files contains exactly:

```json
{
  "sections": {},
  "order": []
}
```

Create them at:

```
azouz-theme/templates/product.json
azouz-theme/templates/collection.json
azouz-theme/templates/cart.json
azouz-theme/templates/search.json
azouz-theme/templates/list-collections.json
azouz-theme/templates/404.json
azouz-theme/templates/password.json
azouz-theme/templates/customers/account.json
azouz-theme/templates/customers/login.json
azouz-theme/templates/customers/register.json
azouz-theme/templates/customers/addresses.json
azouz-theme/templates/customers/order.json
azouz-theme/templates/customers/reset_password.json
azouz-theme/templates/customers/activate_account.json
```

Later tasks fill them in.

- [ ] **Step 4: Rewrite `preview/server.js`**

Replace the whole file:

```js
/**
 * Local preview server. Renders the real theme files so what is reviewed is
 * what ships. A development aid, not a Shopify emulator — checkout, real form
 * delivery, predictive search and customer authentication do not exist here.
 *
 * Run: npm run preview   ->   http://localhost:4321
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEngine, renderThemeFile } from './engine.js';
import { renderTemplate } from './template-renderer.js';
import { buildFixtures } from './fixtures.js';
import { resolveRoute, listPreviewPaths } from './route-context.js';
import { addLine, setLine, seedCart, buildCart } from './cart-api.js';
import { extractSchema, defaultSettings, defaultBlocks } from '../scripts/schema-parser.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

export { ROUTES, templateForRoute } from './route-context.js';

const PORT = Number(process.env.PORT ?? 4321);

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const json = (response, status, body) =>
  response
    .writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    .end(JSON.stringify(body));

async function serveAsset(response, urlPath) {
  const relative = normalize(urlPath.replace(/^\/assets\//, '')).replace(/^(\.\.[/\\])+/, '');
  const file = join(THEME_DIR, 'assets', relative);
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('asset not found');
  }
}

/** Read a urlencoded request body into a URLSearchParams. */
async function readForm(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

/**
 * Shopify's Section Rendering API: GET any url with ?sections=a,b and receive
 * `{ a: "<html>", b: "<html>" }`. The theme uses it to refresh the drawer and
 * the header cart count after an add-to-cart.
 */
async function renderSections(names, scope) {
  const engine = await createEngine(THEME_DIR);
  const rendered = {};

  for (const name of names) {
    const file = join(THEME_DIR, 'sections', `${name}.liquid`);
    if (!existsSync(file)) continue;
    const source = readFileSync(file, 'utf8');
    const schema = extractSchema(source, `sections/${name}.liquid`);
    const sectionScope = {
      ...scope,
      section: {
        id: name,
        settings: defaultSettings(schema),
        blocks: defaultBlocks(schema),
        shopify_attributes: '',
      },
    };
    const html = await engine.parseAndRender(source, sectionScope, { globals: sectionScope });
    rendered[name] = `<div id="shopify-section-${name}" class="shopify-section">${html}</div>`;
  }

  return rendered;
}

/** The globals every render gets, with the route's own context merged over. */
function buildScope(route) {
  const fixtures = buildFixtures();
  return {
    ...fixtures,
    cart: buildCart(),
    request: { ...fixtures.request, page_type: route.page_type },
    page: null,
    ...route.scope,
  };
}

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (url.pathname.startsWith('/assets/')) return serveAsset(response, url.pathname);

    if (request.method === 'POST' && path === '/cart/add') {
      const form = await readForm(request);
      addLine(form.get('id'), Number(form.get('quantity') ?? 1));
      if ((request.headers.accept ?? '').includes('application/json')) {
        return json(response, 200, buildCart());
      }
      return response.writeHead(302, { Location: '/cart' }).end();
    }

    // Shopify accepts /cart/change as both a POST and a plain GET link, which
    // is what the remove control in cart-line-items is.
    if (path === '/cart/change') {
      const form = request.method === 'POST' ? await readForm(request) : url.searchParams;
      setLine(form.get('id'), Number(form.get('quantity') ?? 0));
      if ((request.headers.accept ?? '').includes('application/json')) {
        return json(response, 200, buildCart());
      }
      return response.writeHead(302, { Location: '/cart' }).end();
    }

    // Dev convenience: fill the cart so /cart can be reviewed without first
    // exercising the drawer. Not part of the theme.
    if (path === '/cart/seed') {
      seedCart();
      return response.writeHead(302, { Location: '/cart' }).end();
    }

    if (path === '/cart.js') return json(response, 200, buildCart());

    const route = resolveRoute(path, url.searchParams);

    if (url.searchParams.has('sections')) {
      const names = url.searchParams.get('sections').split(',').filter(Boolean);
      return json(response, 200, await renderSections(names, buildScope(route)));
    }

    try {
      const engine = await createEngine(THEME_DIR);
      const scope = buildScope(route);
      const html = await renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
        ...scope,
        content_for_layout: await renderTemplate(engine, THEME_DIR, route.template, scope),
      });
      response
        .writeHead(route.page_type === '404' ? 404 : 200, {
          'Content-Type': 'text/html; charset=utf-8',
        })
        .end(html);
    } catch (error) {
      response
        .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end(`Render error on ${path}\n\n${error.stack}`);
    }
  });
}

// Only listen when run directly, so tests can import the factory without opening a port.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createPreviewServer().listen(PORT, () => {
    console.log(`Azouz preview: http://localhost:${PORT}`);
    for (const path of listPreviewPaths()) console.log(`  http://localhost:${PORT}${path}`);
  });
}
```

- [ ] **Step 5: Update Plan B's route test for the moved table**

`tests/preview-routes.test.js` asserted `templateForRoute` and `ROUTES` from `server.js`, which still re-exports them, so it passes unchanged. Confirm rather than assume:

Run: `node --test tests/preview-routes.test.js`
Expected: PASS — 5 tests.

- [ ] **Step 6: Run the new tests**

Run: `node --test tests/preview-server.test.js tests/route-context.test.js`
Expected: PASS — 9 + 12 = 21 tests.

The section-rendering test needs `sections/cart-drawer.liquid`, which does not exist until Task 19. Until then that one test fails on `sections['cart-drawer']` being undefined. **Temporarily** mark it skipped so the suite stays green, and remove the skip in Task 19 Step 7:

```js
test('the section rendering endpoint returns rendered html per section', { skip: 'cart-drawer arrives in Task 19' }, async () => {
```

- [ ] **Step 7: Run the full suite and the validator**

Run: `npm test`
Expected: PASS — 326 tests, 1 skipped.

Treat the number as a sanity check, not a gate: the signal that matters is **zero failures and one skip**. If a total is off by a few because a task added an extra assertion, that is fine; if it is off by a whole file's worth, a test file is not being picked up by the glob.

Run: `npm run validate`
Expected: `Theme validation passed.`

- [ ] **Step 8: Commit**

```bash
git add preview/server.js azouz-theme/templates tests/preview-server.test.js tests/route-context.test.js
git commit -m "feat: preview server renders the shop surface with a cart api"
```

---

## Task 6: Form tag shim

`{% form 'product', product %}` must post to `/cart/add`, not `/product#product`. The current shim builds the action from the form type for every form, so the product form and all seven customer forms point at URLs that do not exist.

**Files:**
- Modify: `preview/shims/tags.js`
- Test: `tests/form-tag.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/form-tag.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const render = async (source, scope = {}) => {
  const engine = await createEngine(THEME_DIR);
  return engine.parseAndRender(source, scope, { globals: scope });
};

test('a contact form posts to the contact endpoint', async () => {
  const html = await render(`{% form 'contact' %}x{% endform %}`);
  assert.match(html, /action="\/contact#contact"/);
  assert.match(html, /name="form_type" value="contact"/);
});

test('a product form posts to cart add, not to a form-type url', async () => {
  const html = await render(`{% form 'product', product %}x{% endform %}`, {
    product: { id: 'p1' },
  });
  assert.match(html, /action="\/cart\/add"/);
  assert.equal(/action="\/product/.test(html), false);
});

test('a cart form posts to the cart', async () => {
  const html = await render(`{% form 'cart', cart %}x{% endform %}`, { cart: { items: [] } });
  assert.match(html, /action="\/cart"/);
});

test('every customer form posts to its real endpoint', async () => {
  const cases = {
    customer_login: '/account/login',
    create_customer: '/account',
    recover_customer_password: '/account/recover',
    activate_customer_password: '/account/activate',
    customer_address: '/account/addresses',
  };
  for (const [type, action] of Object.entries(cases)) {
    const html = await render(`{% form '${type}' %}x{% endform %}`, { customer: {} });
    assert.match(html, new RegExp(`action="${action.replace(/\//g, '\\/')}"`), `${type}`);
  }
});

test('an id keyword argument becomes the form id so inputs can target it', async () => {
  const html = await render(`{% form 'product', product, id: 'AddToCart' %}x{% endform %}`, {
    product: { id: 'p1' },
  });
  assert.match(html, /id="AddToCart"/);
});

test('a class keyword argument is applied', async () => {
  const html = await render(`{% form 'product', product, class: 'product-form__form' %}x{% endform %}`, {
    product: { id: 'p1' },
  });
  assert.match(html, /class="product-form__form"/);
});

test('the form body still renders and the form object is in scope', async () => {
  const html = await render(
    `{% form 'contact' %}{% if form.posted_successfully? %}yes{% else %}no{% endif %}{% endform %}`,
  );
  assert.match(html, />no</);
});

test('an unknown form type falls back to a form-type url rather than throwing', async () => {
  const html = await render(`{% form 'mystery' %}x{% endform %}`);
  assert.match(html, /action="\/mystery"/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/form-tag.test.js`
Expected: FAIL — the product form renders `action="/product#product"`.

- [ ] **Step 3: Replace the `form` tag in `preview/shims/tags.js`**

Replace the whole `engine.registerTag('form', { ... });` block with:

```js
  /**
   * Where Shopify actually posts each form type. Getting this wrong is silent:
   * the form renders, the button works, and the submission goes nowhere.
   */
  const FORM_ACTIONS = {
    product: '/cart/add',
    cart: '/cart',
    contact: '/contact#contact',
    customer: '/contact#contact',
    customer_login: '/account/login',
    guest_login: '/account/login',
    create_customer: '/account',
    recover_customer_password: '/account/recover',
    activate_customer_password: '/account/activate',
    customer_address: '/account/addresses',
    new_comment: '/comments',
    localization: '/localization',
  };

  engine.registerTag('form', {
    parse(tagToken, remainTokens) {
      this.args = tagToken.args;
      this.templates = [];
      const stream = engine.parser
        .parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endform', function () {
          this.stop();
        })
        .on('end', () => {
          throw new Error('Missing {% endform %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      const formType = (this.args.match(/'([^']+)'|"([^"]+)"/) || [])[1] ?? 'contact';
      const action = FORM_ACTIONS[formType] ?? `/${formType}`;

      // Keyword arguments after the object, e.g. `id: 'AddToCart', class: 'x'`.
      const attributes = {};
      for (const match of this.args.matchAll(/(\w+)\s*:\s*'([^']*)'/g)) {
        attributes[match[1]] = match[2];
      }

      const id = attributes.id ? ` id="${attributes.id}"` : '';
      const className = attributes.class ?? `${formType}-form`;

      emitter.write(
        `<form method="post" action="${action}"${id} accept-charset="UTF-8"` +
          ` class="${className}">` +
          `<input type="hidden" name="form_type" value="${formType}">` +
          `<input type="hidden" name="utf8" value="✓">`,
      );
      ctx.push({ form: { posted_successfully: false, errors: null } });
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    },
  });
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/form-tag.test.js tests/tags.test.js tests/section-enquiry-form.test.js`
Expected: PASS — 8 + the existing tag and enquiry tests. The enquiry form still posts to `/contact#contact`, so Plan B's test is unaffected.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 334 tests, 1 skipped.

- [ ] **Step 6: Commit**

```bash
git add preview/shims/tags.js tests/form-tag.test.js
git commit -m "feat: post each form type to its real shopify endpoint in preview"
```

---

## Task 7: Load `theme.js` under test

`theme.js` is a classic script — it cannot be `import`ed, and it must never gain `import`/`export` or it will fail to parse in the browser. To unit-test the real shipped file, load it into a `node:vm` sandbox with a minimal DOM stand-in and read the `AzouzTheme` namespace it defines.

**Files:**
- Create: `tests/helpers/load-theme-js.js`
- Modify: `azouz-theme/assets/theme.js`
- Test: `tests/theme-js-runtime.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/theme-js-runtime.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('theme.js is a classic script — no import or export, ever', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.equal(
    /^\s*(import|export)\s/m.test(source),
    false,
    'theme.js is loaded with a plain <script defer>; module syntax would break the whole runtime',
  );
});

test('theme.js exposes its pure logic on a single global namespace', async () => {
  const { AzouzTheme } = await loadThemeJs();
  assert.equal(typeof AzouzTheme, 'object');
});

test('theme.js registers reveal-on-scroll', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('reveal-on-scroll'), 'function');
});

test('loading theme.js twice does not throw on re-registration', async () => {
  await loadThemeJs();
  await loadThemeJs();
});
```

- [ ] **Step 2: Write the loader**

Create `tests/helpers/load-theme-js.js`:

```js
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolveInTheme } from '../../scripts/theme-paths.js';

/**
 * Evaluate the real `assets/theme.js` in a sandbox that provides just enough of
 * a browser for the file to parse and register its custom elements.
 *
 * Element *behaviour* needs a real DOM and is verified in the browser during
 * final review; what is unit-tested here is the pure logic on `AzouzTheme`,
 * which is where the bugs that matter live.
 *
 * @returns {Promise<object>} the sandbox's global object
 */
export async function loadThemeJs() {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');

  const registry = new Map();

  const sandbox = {
    HTMLElement: class {},
    customElements: {
      define: (name, constructor) => registry.set(name, constructor),
      get: (name) => registry.get(name),
    },
    matchMedia: () => ({ matches: false }),
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
    },
    fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '' }),
    console,
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'theme.js' });

  return sandbox;
}
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test tests/theme-js-runtime.test.js`
Expected: FAIL — `AzouzTheme` is `undefined`; the other three pass.

- [ ] **Step 4: Add the namespace to `azouz-theme/assets/theme.js`**

Insert immediately after the file's opening comment block, before `const prefersReducedMotion`:

```js
/*
  Pure logic lives on one global namespace so it can be unit-tested by loading
  this exact file into a sandbox — see tests/helpers/load-theme-js.js.

  This file must stay a classic script. It is loaded with <script defer>, so
  `import` or `export` anywhere in it would stop the entire runtime from
  parsing and silently disable every component below.
*/
window.AzouzTheme = window.AzouzTheme || {};
```

- [ ] **Step 5: Run to verify it passes**

Run: `node --test tests/theme-js-runtime.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS — 338 tests, 1 skipped.

- [ ] **Step 7: Commit**

```bash
git add azouz-theme/assets/theme.js tests/helpers/load-theme-js.js tests/theme-js-runtime.test.js
git commit -m "test: load the real theme.js in a sandbox for unit tests"
```

---

## Task 8: `price` snippet

**Files:**
- Create: `azouz-theme/snippets/price.liquid`
- Create: `tests/helpers/render-snippet.js`
- Modify: `azouz-theme/locales/en.default.json`
- Modify: `azouz-theme/assets/commerce.css`
- Test: `tests/snippet-price.test.js`

- [ ] **Step 1: Write the snippet render helper**

Create `tests/helpers/render-snippet.js`:

```js
import { createEngine } from '../../preview/engine.js';
import { buildFixtures } from '../../preview/fixtures.js';
import { THEME_DIR } from '../../scripts/theme-paths.js';

/**
 * Render one snippet the way {% render %} does: an isolated local scope built
 * from `args`, plus the global drops Shopify exposes everywhere.
 *
 * @param {string} name snippet filename without extension
 * @param {object} [args] the keyword arguments passed to {% render %}
 * @param {object} [extraScope] extra globals merged over the fixtures
 */
export async function renderSnippet(name, args = {}, extraScope = {}) {
  const engine = await createEngine(THEME_DIR);
  const globals = { ...buildFixtures(), ...extraScope };
  const keys = Object.keys(args);
  const params = keys.map((key) => `${key}: ${key}`).join(', ');
  const source = params ? `{% render '${name}', ${params} %}` : `{% render '${name}' %}`;
  return engine.parseAndRender(source, { ...globals, ...args }, { globals });
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/snippet-price.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';

test('renders the amount as money', async () => {
  const html = await renderSnippet('price', { price: 750 });
  assert.match(html, /7\.5|7,5/, 'the money filter should format 750 minor units');
});

test('labels the price for screen readers', async () => {
  const html = await renderSnippet('price', { price: 750 });
  assert.match(html, /visually-hidden/);
  assert.equal(/translation missing/.test(html), false);
});

test('shows a strike-through compare-at price when the item is on sale', async () => {
  const html = await renderSnippet('price', { price: 750, compare_at: 900 });
  assert.match(html, /<s /);
  assert.match(html, /price--on-sale/);
});

test('ignores a compare-at price that is not actually higher', async () => {
  const html = await renderSnippet('price', { price: 900, compare_at: 900 });
  assert.equal(/<s /.test(html), false);
  assert.equal(/price--on-sale/.test(html), false);
});

test('a from-price shows the prefix and no compare-at', async () => {
  const html = await renderSnippet('price', { price: 750, show_from: true });
  assert.match(html, /price__from/);
  assert.equal(/<s /.test(html), false);
});

test('the from-price prefix comes from the locale file', async () => {
  const html = await renderSnippet('price', { price: 750, show_from: true });
  assert.equal(/translation missing/.test(html), false);
});

test('a zero price still renders rather than collapsing to nothing', async () => {
  const html = await renderSnippet('price', { price: 0 });
  assert.match(html, /price__current/);
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test tests/snippet-price.test.js`
Expected: FAIL — the snippet does not exist, so `{% render %}` throws.

- [ ] **Step 4: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `products.product`, add:

```json
      "regular_price": "Regular price",
      "sale_price": "Sale price",
```

`products.product.price` and `products.product.from_price` already exist from Plan A.

- [ ] **Step 5: Create `azouz-theme/snippets/price.liquid`**

```liquid
{%- comment -%}
  Renders one price.

  Accepts:
    price       - required, an amount in the currency's minor units
    compare_at  - optional, the was-price; ignored unless it is higher
    show_from   - optional boolean, renders "From <price>" for ranged products
    class       - optional extra class
{%- endcomment -%}

{%- liquid
  assign on_sale = false
  if compare_at != blank and compare_at > price
    assign on_sale = true
  endif
  assign formatted = price | money
-%}

<span class="price{% if on_sale %} price--on-sale{% endif %}{% if class %} {{ class }}{% endif %}">
  {%- if show_from -%}
    <span class="price__from">{{ 'products.product.from_price' | t: price: formatted }}</span>
  {%- else -%}
    <span class="price__current">
      <span class="visually-hidden">
        {%- if on_sale -%}
          {{- 'products.product.sale_price' | t -}}
        {%- else -%}
          {{- 'products.product.price' | t -}}
        {%- endif -%}
      </span>
      {{ formatted }}
    </span>

    {%- if on_sale -%}
      <s class="price__compare">
        <span class="visually-hidden">{{ 'products.product.regular_price' | t }}</span>
        {{ compare_at | money }}
      </s>
    {%- endif -%}
  {%- endif -%}
</span>
```

- [ ] **Step 6: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Price ---------- */

.price {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-xs);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.price__compare {
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
}

.price--on-sale .price__current {
  color: var(--color-accent-deep);
}

.price__from {
  font-weight: var(--font-weight-regular);
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `node --test tests/snippet-price.test.js`
Expected: PASS — 7 tests.

- [ ] **Step 8: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 345 tests, 1 skipped.

```bash
git add azouz-theme/snippets/price.liquid azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/helpers/render-snippet.js tests/snippet-price.test.js
git commit -m "feat: add price snippet"
```

---

## Task 9: `roast-meter` snippet

The dot meter reads `custom.roast_level`. If the client has not created that metafield definition yet, it must render nothing at all — not an empty row of dots.

**Files:**
- Create: `azouz-theme/snippets/roast-meter.liquid`
- Modify: `azouz-theme/locales/en.default.json`
- Test: `tests/snippet-roast-meter.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/snippet-roast-meter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';

test('renders five dots, four of them filled, for a roast level of 4', async () => {
  const html = await renderSnippet('roast-meter', { level: 4 });
  assert.equal(countMatches(html, /roast-meter__dot[ "]/g), 5);
  assert.equal(countMatches(html, /roast-meter__dot--filled/g), 4);
});

test('renders nothing when the metafield is missing', async () => {
  assert.equal((await renderSnippet('roast-meter', { level: null })).trim(), '');
});

test('renders nothing when the metafield is zero', async () => {
  assert.equal((await renderSnippet('roast-meter', { level: 0 })).trim(), '');
});

test('clamps a value above five rather than rendering extra dots', async () => {
  const html = await renderSnippet('roast-meter', { level: 9 });
  assert.equal(countMatches(html, /roast-meter__dot[ "]/g), 5);
  assert.equal(countMatches(html, /roast-meter__dot--filled/g), 5);
});

test('is announced as an image with a text alternative, not as five empty spans', async () => {
  const html = await renderSnippet('roast-meter', { level: 3 });
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the accessible label states both the level and the maximum', async () => {
  const html = await renderSnippet('roast-meter', { level: 3 });
  assert.match(html, /aria-label="[^"]*3[^"]*5[^"]*"/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/snippet-roast-meter.test.js`
Expected: FAIL — the snippet does not exist.

- [ ] **Step 3: Add the locale key**

In `azouz-theme/locales/en.default.json`, inside `products.product`, add:

```json
      "roast_level_of": "Roast level {{ level }} of {{ total }}",
```

- [ ] **Step 4: Create `azouz-theme/snippets/roast-meter.liquid`**

```liquid
{%- comment -%}
  Dot meter for the `custom.roast_level` metafield.

  Accepts: level (1–5, may be nil)

  Renders nothing when the value is missing or zero, so the product page is
  correct before the client has created the metafield definition in admin.
{%- endcomment -%}

{%- liquid
  assign filled = level | default: 0 | at_least: 0 | at_most: 5
-%}

{%- if filled > 0 -%}
  <div
    class="roast-meter"
    role="img"
    aria-label="{{ 'products.product.roast_level_of' | t: level: filled, total: 5 }}">
    {%- for dot in (1..5) -%}
      <span class="roast-meter__dot{% if dot <= filled %} roast-meter__dot--filled{% endif %}"></span>
    {%- endfor -%}
  </div>
{%- endif -%}
```

- [ ] **Step 5: Run to verify it passes**

Run: `node --test tests/snippet-roast-meter.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 6: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 351 tests, 1 skipped.

```bash
git add azouz-theme/snippets/roast-meter.liquid azouz-theme/locales/en.default.json tests/snippet-roast-meter.test.js
git commit -m "feat: add null-guarded roast meter snippet"
```

---

## Task 10: `product-card` snippet

The signature element of the site: the packaging label block, reused as a product tile.

**Files:**
- Create: `azouz-theme/snippets/product-card.liquid`
- Modify: `azouz-theme/assets/commerce.css`
- Test: `tests/snippet-product-card.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/snippet-product-card.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSnippet } from './helpers/render-snippet.js';

const fixtures = buildFixtures();
const wadiRum = fixtures.products[0];
const filterBags = fixtures.products[3];

test('renders the product title inside the label block', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /label-block__title[^>]*>\s*Wadi Rum Blend/);
});

test('the whole card links to the product', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /href="\/products\/wadi-rum-blend"/);
});

test('uses the blend label colour from the metafield', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /--label-bg:\s*#C4562E/);
});

test('renders the tasting notes as the label subtitle', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /Dark Chocolate/);
});

test('renders the roast meter', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /roast-meter/);
});

test('shows a from-price when the product spans a price range', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /price__from/);
});

test('shows a plain price when every variant costs the same', async () => {
  const html = await renderSnippet('product-card', { product: filterBags });
  assert.equal(/price__from/.test(html), false);
  assert.match(html, /price__current/);
});

test('the image has alt text and is lazy loaded — cards are below the fold', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /alt="Wadi Rum Blend"/);
  assert.match(html, /loading="lazy"/);
});

test('a product with no label colour still renders', async () => {
  const plain = { ...wadiRum, metafields: { custom: {} } };
  const html = await renderSnippet('product-card', { product: plain });
  assert.match(html, /label-block/);
  assert.equal(/roast-meter/.test(html), false);
});

test('a sold-out product is marked as such', async () => {
  const soldOut = { ...wadiRum, available: false };
  const html = await renderSnippet('product-card', { product: soldOut });
  assert.match(html, /product-card__badge/);
  assert.equal(/translation missing/.test(html), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/snippet-product-card.test.js`
Expected: FAIL — the snippet does not exist.

- [ ] **Step 3: Create `azouz-theme/snippets/product-card.liquid`**

```liquid
{%- comment -%}
  Product tile built from the packaging label block.

  Accepts: product (required)

  Every metafield read is guarded — the card is correct on a store where the
  definitions have not been created yet.
{%- endcomment -%}

{%- liquid
  assign custom = product.metafields.custom
  assign notes = custom.tasting_notes.value
  assign label_color = custom.label_color.value

  assign label_style = ''
  if label_color != blank
    assign label_style = '--label-bg: ' | append: label_color | append: ';'
  endif

  assign ranged = false
  if product.price_min != product.price_max
    assign ranged = true
  endif
-%}

<article class="product-card">
  {%- if product.featured_image -%}
    <img
      class="product-card__image"
      src="{{ product.featured_image | image_url: width: 600 }}"
      alt="{{ product.title | escape }}"
      width="600"
      height="750"
      loading="lazy"
      decoding="async">
  {%- endif -%}

  {%- unless product.available -%}
    <p class="product-card__badge">{{ 'products.product.sold_out' | t }}</p>
  {%- endunless -%}

  <div class="label-block product-card__label" style="{{ label_style }}">
    <h3 class="label-block__title">
      <a class="product-card__link" href="{{ product.url }}">{{ product.title }}</a>
    </h3>
    {%- if notes != blank -%}
      <p class="label-block__subtitle">{{ notes | join: ' | ' }}</p>
    {%- endif -%}
  </div>

  <div class="product-card__meta">
    {%- render 'price',
      price: product.price,
      compare_at: product.compare_at_price,
      show_from: ranged
    -%}
    {%- render 'roast-meter', level: custom.roast_level.value -%}
  </div>
</article>
```

- [ ] **Step 4: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Product card ----------
   The title anchor is stretched over the whole card, so the card is one large
   target while the accessible name stays the product title. */

.product-card {
  position: relative;
  display: grid;
  gap: var(--space-sm);
  align-content: start;
}

.product-card__image {
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-alt);
}

.product-card__link {
  color: inherit;
  text-decoration: none;
}

.product-card__link::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
}

.product-card:hover .product-card__image {
  opacity: 0.92;
}

.product-card__badge {
  position: absolute;
  inset-block-start: var(--space-sm);
  inset-inline-start: var(--space-sm);
  margin: 0;
  padding: var(--space-2xs) var(--space-xs);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  background-color: var(--color-bg);
  border-radius: var(--radius);
}

.product-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `node --test tests/snippet-product-card.test.js`
Expected: PASS — 10 tests.

- [ ] **Step 6: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 361 tests, 1 skipped.

```bash
git add azouz-theme/snippets/product-card.liquid azouz-theme/assets/commerce.css tests/snippet-product-card.test.js
git commit -m "feat: add product card snippet"
```

---

## Task 11: `quantity-input` snippet and its component

**Files:**
- Create: `azouz-theme/snippets/quantity-input.liquid`
- Modify: `azouz-theme/assets/theme.js`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/snippet-quantity-input.test.js`, `tests/theme-js-quantity.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/snippet-quantity-input.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';

test('renders a real number input so it works with no javascript', async () => {
  const html = await renderSnippet('quantity-input', {});
  assert.match(html, /<input[^>]+type="number"/);
  assert.match(html, /name="quantity"/);
  assert.match(html, /min="1"/);
});

test('the stepper buttons are type=button so they never submit the form', async () => {
  const html = await renderSnippet('quantity-input', {});
  const buttons = html.match(/<button[^>]*>/g) ?? [];
  assert.equal(buttons.length, 2);
  for (const button of buttons) assert.match(button, /type="button"/);
});

test('the input is labelled for screen readers', async () => {
  const html = await renderSnippet('quantity-input', {});
  assert.match(html, /aria-label="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});

test('accepts a custom name, value and form association', async () => {
  const html = await renderSnippet('quantity-input', {
    name: 'updates[abc]',
    value: 3,
    form: 'CartForm',
  });
  assert.match(html, /name="updates\[abc\]"/);
  assert.match(html, /value="3"/);
  assert.match(html, /form="CartForm"/);
});

test('omits the max attribute when no maximum is given', async () => {
  assert.equal(/max="/.test(await renderSnippet('quantity-input', {})), false);
});
```

Create `tests/theme-js-quantity.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadThemeJs } from './helpers/load-theme-js.js';

const clamp = async (...args) => {
  const { AzouzTheme } = await loadThemeJs();
  return AzouzTheme.clampQuantity(...args);
};

test('clamps below the minimum', async () => {
  assert.equal(await clamp(0, 1, 10), 1);
  assert.equal(await clamp(-5, 1, 10), 1);
});

test('clamps above the maximum', async () => {
  assert.equal(await clamp(99, 1, 10), 10);
});

test('leaves an in-range value alone', async () => {
  assert.equal(await clamp(4, 1, 10), 4);
});

test('treats a non-numeric value as the minimum rather than NaN', async () => {
  assert.equal(await clamp('abc', 1, 10), 1);
  assert.equal(await clamp('', 1, 10), 1);
});

test('rounds a fractional value down to a whole unit', async () => {
  assert.equal(await clamp(2.7, 1, 10), 2);
});

test('an absent maximum means unbounded', async () => {
  assert.equal(await clamp(500, 1), 500);
});

test('quantity-input is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('quantity-input'), 'function');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/snippet-quantity-input.test.js tests/theme-js-quantity.test.js`
Expected: FAIL — no snippet, `AzouzTheme.clampQuantity is not a function`.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `general.accessibility`, add:

```json
      "decrease_quantity": "Decrease quantity",
      "increase_quantity": "Increase quantity",
```

- [ ] **Step 4: Create `azouz-theme/snippets/quantity-input.liquid`**

```liquid
{%- comment -%}
  Number input with an optional +/- stepper.

  Accepts: name, value, min, max, form

  The input works on its own. The buttons are hidden until JavaScript has run
  (see `.no-js .quantity__button` in commerce.css), so nothing dead is shown.
{%- endcomment -%}

<quantity-input class="quantity">
  <button class="quantity__button" type="button" data-quantity-step="-1">
    <span aria-hidden="true">&minus;</span>
    <span class="visually-hidden">{{ 'general.accessibility.decrease_quantity' | t }}</span>
  </button>

  <input
    class="quantity__input"
    type="number"
    inputmode="numeric"
    name="{{ name | default: 'quantity' }}"
    value="{{ value | default: 1 }}"
    min="{{ min | default: 1 }}"
    {% if max %}max="{{ max }}"{% endif %}
    step="1"
    {% if form %}form="{{ form }}"{% endif %}
    aria-label="{{ 'products.product.quantity' | t }}">

  <button class="quantity__button" type="button" data-quantity-step="1">
    <span aria-hidden="true">+</span>
    <span class="visually-hidden">{{ 'general.accessibility.increase_quantity' | t }}</span>
  </button>
</quantity-input>
```

- [ ] **Step 5: Add the logic and the component to `azouz-theme/assets/theme.js`**

Append:

```js
/**
 * Coerce whatever is in a quantity field into a usable whole number.
 * @param {unknown} value
 * @param {number} min
 * @param {number} [max]
 */
window.AzouzTheme.clampQuantity = function clampQuantity(value, min = 1, max = Infinity) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(Math.max(parsed, min), max);
};

/**
 * <quantity-input> turns its two buttons into a stepper.
 * The <input type="number"> inside works on its own without this.
 */
class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    if (!this.input) return;

    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-quantity-step]');
      if (!button) return;

      const min = Number(this.input.min || 1);
      const max = this.input.max === '' ? Infinity : Number(this.input.max);
      const next = Number(this.input.value) + Number(button.dataset.quantityStep);

      this.input.value = window.AzouzTheme.clampQuantity(next, min, max);
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', QuantityInput);
}
```

- [ ] **Step 6: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Quantity ---------- */

.quantity {
  display: inline-flex;
  align-items: stretch;
  border: var(--hairline);
  border-radius: var(--radius);
  overflow: hidden;
}

.quantity__button {
  padding-inline: var(--space-sm);
  font-size: var(--text-lg);
  line-height: 1;
  color: var(--color-text);
  background: none;
  border: 0;
  cursor: pointer;
}

.quantity__input {
  inline-size: 3.5rem;
  padding-block: var(--space-xs);
  text-align: center;
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  border-inline: var(--hairline);
  -moz-appearance: textfield;
}

.quantity__input::-webkit-outer-spin-button,
.quantity__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Nothing dead on screen: the steppers only exist once the script has run. */
.no-js .quantity__button {
  display: none;
}

.no-js .quantity__input {
  border-inline: 0;
  -moz-appearance: auto;
}

.no-js .quantity__input::-webkit-outer-spin-button,
.no-js .quantity__input::-webkit-inner-spin-button {
  -webkit-appearance: auto;
}
```

- [ ] **Step 7: Run to verify they pass**

Run: `node --test tests/snippet-quantity-input.test.js tests/theme-js-quantity.test.js`
Expected: PASS — 5 + 7 = 12 tests.

- [ ] **Step 8: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 373 tests, 1 skipped.

```bash
git add azouz-theme/snippets/quantity-input.liquid azouz-theme/assets/theme.js azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/snippet-quantity-input.test.js tests/theme-js-quantity.test.js
git commit -m "feat: add quantity input snippet and stepper component"
```

---

## Task 12: `pagination` snippet

**Files:**
- Create: `azouz-theme/snippets/pagination.liquid`
- Modify: `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/snippet-pagination.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/snippet-pagination.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';

const paginate = (overrides = {}) => ({
  pages: 3,
  current_page: 2,
  items: 30,
  page_size: 12,
  previous: { url: '?page=1', title: '1', is_link: true },
  next: { url: '?page=3', title: '3', is_link: true },
  ...overrides,
});

test('renders nothing when there is only one page', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate({ pages: 1 }) });
  assert.equal(html.trim(), '');
});

test('renders a link per page', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.equal(countMatches(html, /class="pagination__page/g), 3);
});

test('marks the current page as current for screen readers', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.match(html, /aria-current="page"/);
  assert.equal(countMatches(html, /aria-current="page"/g), 1);
});

test('the current page is not a link', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  const current = /<[^>]+aria-current="page"[^>]*>/.exec(html)[0];
  assert.equal(current.startsWith('<a'), false);
});

test('renders previous and next when they exist', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.match(html, /href="\?page=1"/);
  assert.match(html, /href="\?page=3"/);
});

test('omits previous on the first page', async () => {
  const html = await renderSnippet('pagination', {
    paginate: paginate({ current_page: 1, previous: null }),
  });
  assert.equal(/pagination__previous/.test(html), false);
  assert.match(html, /pagination__next/);
});

test('is a navigation landmark with an accessible name', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.match(html, /<nav[^>]+aria-label="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/snippet-pagination.test.js`
Expected: FAIL — the snippet does not exist.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `general`, add a new group after `meta`:

```json
    "pagination": {
      "label": "Pagination",
      "previous": "Previous",
      "next": "Next",
      "page": "Page {{ page }}"
    },
```

- [ ] **Step 4: Create `azouz-theme/snippets/pagination.liquid`**

```liquid
{%- comment -%}
  Accepts: paginate (the object from {% paginate %})

  Built from `pages` and `current_page` rather than `paginate.parts`, so the
  same markup renders under Shopify and under the preview harness.
{%- endcomment -%}

{%- if paginate.pages > 1 -%}
  <nav class="pagination" aria-label="{{ 'general.pagination.label' | t }}">
    {%- if paginate.previous -%}
      <a class="pagination__previous" href="{{ paginate.previous.url }}" rel="prev">
        {{ 'general.pagination.previous' | t }}
      </a>
    {%- endif -%}

    <ol class="pagination__pages" role="list">
      {%- for page in (1..paginate.pages) -%}
        <li>
          {%- if page == paginate.current_page -%}
            <span class="pagination__page pagination__page--current" aria-current="page">
              <span class="visually-hidden">{{ 'general.pagination.page' | t: page: page }}</span>
              <span aria-hidden="true">{{ page }}</span>
            </span>
          {%- else -%}
            <a class="pagination__page" href="?page={{ page }}">
              <span class="visually-hidden">{{ 'general.pagination.page' | t: page: page }}</span>
              <span aria-hidden="true">{{ page }}</span>
            </a>
          {%- endif -%}
        </li>
      {%- endfor -%}
    </ol>

    {%- if paginate.next -%}
      <a class="pagination__next" href="{{ paginate.next.url }}" rel="next">
        {{ 'general.pagination.next' | t }}
      </a>
    {%- endif -%}
  </nav>
{%- endif -%}
```

- [ ] **Step 5: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Pagination ---------- */

.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  margin-block-start: var(--space-xl);
  font-size: var(--text-sm);
}

.pagination__pages {
  display: flex;
  gap: var(--space-2xs);
}

.pagination__page {
  display: grid;
  place-items: center;
  min-inline-size: 2.25rem;
  min-block-size: 2.25rem;
  padding-inline: var(--space-2xs);
  text-decoration: none;
  border-radius: var(--radius);
  font-variant-numeric: tabular-nums;
}

.pagination__page:hover {
  background-color: var(--color-bg-alt);
}

.pagination__page--current {
  background-color: var(--color-accent-deep);
  color: var(--color-on-accent);
}

.pagination__previous,
.pagination__next {
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `node --test tests/snippet-pagination.test.js`
Expected: PASS — 7 tests.

- [ ] **Step 7: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 380 tests, 1 skipped.

```bash
git add azouz-theme/snippets/pagination.liquid azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/snippet-pagination.test.js
git commit -m "feat: add pagination snippet"
```

---

## Task 13: `variant-picker` snippet

Two selection mechanisms live side by side: option `<select>`s that JavaScript reads, and a `<noscript>` select listing whole variants. Exactly one is ever active, so the form can never post two conflicting `id` values.

**Files:**
- Create: `azouz-theme/snippets/variant-picker.liquid`
- Modify: `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/snippet-variant-picker.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/snippet-variant-picker.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';

const fixtures = buildFixtures();
const wadiRum = fixtures.products[0];
const deadSea = fixtures.products[1];

const render = (product = wadiRum) =>
  renderSnippet('variant-picker', { product, form_id: 'AddToCart' });

test('renders one select per product option', async () => {
  const html = await render();
  assert.equal(countMatches(html, /data-option-index=/g), 2);
});

test('each option select has a visible label', async () => {
  const html = await render();
  assert.match(html, /<label[^>]+for="Option-1"[^>]*>\s*Weight/);
  assert.match(html, /<label[^>]+for="Option-2"[^>]*>\s*Grind/);
});

test('the currently selected variant is preselected in each option', async () => {
  const html = await render();
  assert.match(html, /<option value="250g" selected/);
  assert.match(html, /<option value="Whole Bean" selected/);
});

test('the variant data is emitted as parseable json', async () => {
  const html = await render();
  const json = /<script type="application\/json" data-variant-data>([\s\S]*?)<\/script>/.exec(html);
  assert.ok(json, 'the variant json script must be present');
  const variants = JSON.parse(json[1]);
  assert.equal(variants.length, 3);
  assert.deepEqual(variants[0].options, ['250g', 'Whole Bean']);
  assert.equal(typeof variants[0].price, 'string', 'prices are pre-formatted by Liquid');
});

test('the json marks unavailable variants so the picker can disable them', async () => {
  const html = await render(deadSea);
  const json = /<script type="application\/json" data-variant-data>([\s\S]*?)<\/script>/.exec(html);
  const variants = JSON.parse(json[1]);
  assert.ok(variants.some((variant) => variant.available === false));
});

test('a noscript fallback select posts a real variant id', async () => {
  const html = await render();
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(html);
  assert.ok(noscript, 'there must be a noscript fallback');
  assert.match(noscript[1], /name="id"/);
  assert.match(noscript[1], /form="AddToCart"/);
});

test('only the noscript select is named id — the option selects never are', async () => {
  const html = await render();
  const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/, '');
  assert.equal(
    /name="id"/.test(withoutNoscript),
    false,
    'a second name="id" outside noscript would post two conflicting variant ids',
  );
});

test('the fallback marks sold-out variants disabled', async () => {
  const html = await render(deadSea);
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(html)[1];
  assert.match(noscript, /disabled/);
});

test('no user-visible english is hard-coded', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/snippet-variant-picker.test.js`
Expected: FAIL — the snippet does not exist.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `products.product`, add:

```json
      "choose_options": "Choose options",
      "variant_unavailable": "That combination is not available",
```

- [ ] **Step 4: Create `azouz-theme/snippets/variant-picker.liquid`**

```liquid
{%- comment -%}
  Variant selection.

  Accepts: product (required), form_id (the id of the add-to-cart form)

  Two mechanisms, never both live at once:
    - option selects, read by <variant-picker>, which creates the hidden
      name="id" input itself once it has connected
    - a <noscript> select named "id", which the browser only parses when
      scripting is off

  Because the hidden input is created by script, there is exactly one field
  named "id" in the form in either state.
{%- endcomment -%}

{%- liquid
  assign current = product.selected_or_first_available_variant
-%}

<variant-picker class="variant-picker" data-url="{{ product.url }}">
  <script type="application/json" data-variant-data>
    [
      {%- for variant in product.variants -%}
        {
          "id": {{ variant.id | json }},
          "options": {{ variant.options | json }},
          "available": {{ variant.available | json }},
          "price": {{ variant.price | money | json }},
          "url": {{ variant.url | json }}
        }{% unless forloop.last %},{% endunless %}
      {%- endfor -%}
    ]
  </script>

  <div class="variant-picker__options">
    {%- for option in product.options_with_values -%}
      {%- assign option_index = forloop.index0 -%}
      <div class="field">
        <label class="field__label" for="Option-{{ forloop.index }}">{{ option.name }}</label>
        <select class="field__input" id="Option-{{ forloop.index }}" data-option-index="{{ option_index }}">
          {%- for value in option.values -%}
            <option value="{{ value | escape }}"
              {%- if current.options[option_index] == value %} selected{% endif -%}
            >{{ value }}</option>
          {%- endfor -%}
        </select>
      </div>
    {%- endfor -%}
  </div>

  <p class="variant-picker__unavailable" data-variant-unavailable hidden>
    {{ 'products.product.variant_unavailable' | t }}
  </p>

  <noscript>
    <div class="field">
      <label class="field__label" for="VariantFallback">{{ 'products.product.choose_options' | t }}</label>
      <select class="field__input" id="VariantFallback" name="id" form="{{ form_id }}">
        {%- for variant in product.variants -%}
          <option
            value="{{ variant.id }}"
            {%- unless variant.available %} disabled{% endunless -%}
            {%- if variant.id == current.id %} selected{% endif -%}
          >{{ variant.title }} — {{ variant.price | money }}</option>
        {%- endfor -%}
      </select>
    </div>
  </noscript>
</variant-picker>
```

- [ ] **Step 5: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Variant picker ----------
   With scripting off the option selects cannot drive anything, so they are
   hidden and the <noscript> select is the only control on screen. */

.variant-picker {
  display: grid;
  gap: var(--space-md);
}

.variant-picker__options {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
}

.no-js .variant-picker__options {
  display: none;
}

.variant-picker__unavailable {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-accent-deep);
}

.variant-picker__unavailable[hidden] {
  display: none;
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `node --test tests/snippet-variant-picker.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 7: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 389 tests, 1 skipped.

```bash
git add azouz-theme/snippets/variant-picker.liquid azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/snippet-variant-picker.test.js
git commit -m "feat: add variant picker snippet with a noscript fallback"
```

---

## Task 14: `<variant-picker>` component

**Files:**
- Modify: `azouz-theme/assets/theme.js`
- Test: `tests/theme-js-variant.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/theme-js-variant.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadThemeJs } from './helpers/load-theme-js.js';

const VARIANTS = [
  { id: 'a', options: ['250g', 'Whole Bean'], available: true, price: '7.500 JOD', url: '/p?variant=a' },
  { id: 'b', options: ['1kg', 'Whole Bean'], available: true, price: '26.000 JOD', url: '/p?variant=b' },
  { id: 'c', options: ['1kg', 'Espresso'], available: false, price: '26.000 JOD', url: '/p?variant=c' },
];

const match = async (selected) => {
  const { AzouzTheme } = await loadThemeJs();
  return AzouzTheme.findMatchingVariant(VARIANTS, selected);
};

test('finds the variant whose options match exactly', async () => {
  assert.equal((await match(['1kg', 'Whole Bean'])).id, 'b');
});

test('finds an unavailable variant too — the caller decides what to do', async () => {
  const found = await match(['1kg', 'Espresso']);
  assert.equal(found.id, 'c');
  assert.equal(found.available, false);
});

test('returns null when no combination matches', async () => {
  assert.equal(await match(['500g', 'Turkish']), null);
});

test('a partial selection does not match a longer variant', async () => {
  assert.equal(await match(['1kg']), null);
});

test('an empty selection matches nothing rather than the first variant', async () => {
  assert.equal(await match([]), null);
});

test('matching is order sensitive — option one is weight, option two is grind', async () => {
  assert.equal(await match(['Whole Bean', '1kg']), null);
});

test('a single-option product matches on one value', async () => {
  const { AzouzTheme } = await loadThemeJs();
  const single = [{ id: 'x', options: ['Box of 10'], available: true }];
  assert.equal(AzouzTheme.findMatchingVariant(single, ['Box of 10']).id, 'x');
});

test('an empty variant list returns null rather than throwing', async () => {
  const { AzouzTheme } = await loadThemeJs();
  assert.equal(AzouzTheme.findMatchingVariant([], ['250g']), null);
});

test('variant-picker is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('variant-picker'), 'function');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/theme-js-variant.test.js`
Expected: FAIL — `AzouzTheme.findMatchingVariant is not a function`.

- [ ] **Step 3: Append to `azouz-theme/assets/theme.js`**

```js
/**
 * Find the variant whose option values are exactly the ones selected.
 * Order matters: index 0 is option one, index 1 is option two.
 *
 * @param {Array<{options: string[]}>} variants
 * @param {string[]} selected
 * @returns {object|null}
 */
window.AzouzTheme.findMatchingVariant = function findMatchingVariant(variants, selected) {
  if (!Array.isArray(variants) || !Array.isArray(selected) || selected.length === 0) return null;

  return (
    variants.find((variant) => {
      const values = variant.options ?? [];
      if (values.length !== selected.length) return false;
      return values.every((value, index) => value === selected[index]);
    }) ?? null
  );
};

/**
 * <variant-picker> drives the option selects.
 *
 * It creates the hidden name="id" input itself, so with scripting off the only
 * field named "id" is the one inside <noscript>. It updates the price, the
 * add-to-cart button and the address bar as the selection changes.
 */
class VariantPicker extends HTMLElement {
  connectedCallback() {
    const data = this.querySelector('[data-variant-data]');
    if (!data) return;

    try {
      this.variants = JSON.parse(data.textContent);
    } catch {
      return; // malformed data must not take the page down
    }

    this.selects = Array.from(this.querySelectorAll('[data-option-index]'));
    if (this.selects.length === 0) return;

    this.root = this.closest('[data-product-root]') ?? document;
    this.message = this.querySelector('[data-variant-unavailable]');

    this.input = document.createElement('input');
    this.input.type = 'hidden';
    this.input.name = 'id';
    const form = this.closest('form');
    if (form) form.appendChild(this.input);
    else this.appendChild(this.input);

    this.addEventListener('change', () => this.update());
    this.update();
  }

  update() {
    const selected = this.selects.map((select) => select.value);
    const variant = window.AzouzTheme.findMatchingVariant(this.variants, selected);

    const button = this.root.querySelector('[data-add-to-cart]');
    const price = this.root.querySelector('[data-product-price]');

    if (!variant) {
      this.input.value = '';
      if (this.message) this.message.hidden = false;
      if (button) button.disabled = true;
      return;
    }

    this.input.value = variant.id;
    if (this.message) this.message.hidden = true;
    if (price) price.textContent = variant.price;

    if (button) {
      button.disabled = !variant.available;
      const label = variant.available ? button.dataset.labelAdd : button.dataset.labelSoldOut;
      if (label) button.textContent = label;
    }

    if (variant.url && window.history?.replaceState) {
      window.history.replaceState({}, '', variant.url);
    }
  }
}

if (!customElements.get('variant-picker')) {
  customElements.define('variant-picker', VariantPicker);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/theme-js-variant.test.js`
Expected: PASS — 9 tests.

Note the sandbox has no `document`, so `connectedCallback` is never invoked in tests — only the pure matcher is exercised. The element's DOM behaviour is verified in the browser at Task 24 Step 4.

- [ ] **Step 5: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 398 tests, 1 skipped.

```bash
git add azouz-theme/assets/theme.js tests/theme-js-variant.test.js
git commit -m "feat: add variant picker component"
```

---

## Task 15: Product page

**Files:**
- Create: `azouz-theme/sections/main-product.liquid`
- Modify: `azouz-theme/templates/product.json`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/section-main-product.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/section-main-product.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const fixtures = buildFixtures();
const wadiRum = fixtures.products[0];

const render = (product = wadiRum, settings = {}) =>
  renderSection('main-product', { settings, scope: { product } });

test('the product title is the page h1, and the only one', async () => {
  const html = await render();
  assert.match(html, /<h1[^>]*>[\s\S]*Wadi Rum Blend[\s\S]*<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders the add-to-cart form posting to cart add', async () => {
  const html = await render();
  assert.match(html, /action="\/cart\/add"/);
  assert.match(html, /data-add-to-cart/);
});

test('the add-to-cart form works without javascript — it is a real form', async () => {
  const html = await render();
  assert.match(html, /<form[^>]+method="post"/);
  assert.match(html, /type="submit"/);
});

test('renders the variant picker and the quantity input', async () => {
  const html = await render();
  assert.match(html, /<variant-picker/);
  assert.match(html, /<quantity-input/);
});

test('the product image is eager with high priority — it is the LCP element', async () => {
  const html = await render();
  assert.match(html, /fetchpriority="high"/);
  assert.equal(/loading="lazy"/.test(html), false);
});

test('renders the roast meter and the tasting notes', async () => {
  const html = await render();
  assert.match(html, /roast-meter/);
  assert.match(html, /Dark Chocolate/);
});

test('the spec grid renders every metafield that has a value', async () => {
  const html = await render();
  for (const value of ['Blend', 'Washed', '1,400–1,900 masl']) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('a product with no metafields renders no empty spec rows', async () => {
  const bare = { ...wadiRum, metafields: { custom: {} } };
  const html = await render(bare);
  assert.equal(/roast-meter/.test(html), false);
  assert.equal(/label-block__specs/.test(html), false);
});

test('the spec panels are native details elements — no javascript needed', async () => {
  const html = await render();
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
});

test('a sold-out product disables the button and says so', async () => {
  const soldOut = {
    ...wadiRum,
    available: false,
    selected_or_first_available_variant: { ...wadiRum.variants[0], available: false },
  };
  const html = await render(soldOut);
  assert.match(html, /disabled/);
  assert.equal(/translation missing/.test(html), false);
});

test('no user-visible english is hard-coded', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('has no presets — it only makes sense on the product template', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-product.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/section-main-product.test.js`
Expected: FAIL — the section does not exist.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `products.product`, add:

```json
      "specifications": "Specifications",
      "description": "Description",
      "brewing": "Brewing",
```

- [ ] **Step 4: Create `azouz-theme/sections/main-product.liquid`**

```liquid
{%- liquid
  assign current = product.selected_or_first_available_variant
  assign custom = product.metafields.custom
  assign notes = custom.tasting_notes.value
  assign brews = custom.brew_methods.value
  assign label_color = custom.label_color.value

  assign label_style = ''
  if label_color != blank
    assign label_style = '--label-bg: ' | append: label_color | append: ';'
  endif

  assign has_specs = false
  if custom.origin.value != blank or custom.process.value != blank or custom.altitude.value != blank
    assign has_specs = true
  endif

  assign add_label = 'products.product.add_to_cart' | t
  assign sold_out_label = 'products.product.sold_out' | t
-%}

<section class="section main-product" data-product-root{{ section.shopify_attributes }}>
  <div class="container main-product__inner">
    <div class="main-product__media">
      {%- if product.featured_image -%}
        <img
          class="main-product__image"
          src="{{ product.featured_image | image_url: width: 1200 }}"
          alt="{{ product.title | escape }}"
          width="1200"
          height="1500"
          fetchpriority="high"
          decoding="async">
      {%- endif -%}
    </div>

    <div class="main-product__details">
      <div class="label-block main-product__label" style="{{ label_style }}">
        <h1 class="label-block__title">{{ product.title }}</h1>
        {%- if notes != blank -%}
          <p class="label-block__subtitle">{{ notes | join: ' | ' }}</p>
        {%- endif -%}

        {%- if has_specs -%}
          <hr class="label-block__rule">
          <dl class="label-block__specs">
            {%- if custom.origin.value != blank -%}
              <div><dt>{{ 'products.product.origin' | t }}</dt><dd>{{ custom.origin.value }}</dd></div>
            {%- endif -%}
            {%- if custom.process.value != blank -%}
              <div><dt>{{ 'products.product.process' | t }}</dt><dd>{{ custom.process.value }}</dd></div>
            {%- endif -%}
            {%- if custom.altitude.value != blank -%}
              <div><dt>{{ 'products.product.altitude' | t }}</dt><dd>{{ custom.altitude.value }}</dd></div>
            {%- endif -%}
          </dl>
        {%- endif -%}
      </div>

      {%- if custom.roast_level.value != blank -%}
        <div class="main-product__roast">
          <span class="eyebrow">{{ 'products.product.roast_level' | t }}</span>
          {%- render 'roast-meter', level: custom.roast_level.value -%}
        </div>
      {%- endif -%}

      <p class="main-product__price" data-product-price>{{ current.price | money }}</p>

      {%- form 'product', product, id: 'AddToCart', class: 'main-product__form' -%}
        {%- render 'variant-picker', product: product, form_id: 'AddToCart' -%}

        <div class="main-product__purchase">
          {%- render 'quantity-input', name: 'quantity', value: 1, min: 1, form: 'AddToCart' -%}

          <product-form class="main-product__submit">
            <button
              class="button main-product__add"
              type="submit"
              data-add-to-cart
              data-label-add="{{ add_label | escape }}"
              data-label-sold-out="{{ sold_out_label | escape }}"
              {% unless current.available %}disabled{% endunless %}>
              {%- if current.available -%}{{ add_label }}{%- else -%}{{ sold_out_label }}{%- endif -%}
            </button>
          </product-form>
        </div>
      {%- endform -%}

      {%- if product.description != blank -%}
        <details class="accordion" open>
          <summary class="accordion__summary">{{ 'products.product.description' | t }}</summary>
          <div class="accordion__body rte">{{ product.description }}</div>
        </details>
      {%- endif -%}

      {%- if brews != blank -%}
        <details class="accordion">
          <summary class="accordion__summary">{{ 'products.product.brewing' | t }}</summary>
          <div class="accordion__body">
            <ul class="main-product__brews" role="list">
              {%- for method in brews -%}
                <li>{{ method }}</li>
              {%- endfor -%}
            </ul>
          </div>
        </details>
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "Product",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

Note: `<product-form>` wraps only the button, not the `<form>`, because the `{% form %}` tag owns the form element. Task 16's component walks up to `this.closest('form')`.

- [ ] **Step 5: Fill `azouz-theme/templates/product.json`**

```json
{
  "sections": {
    "main": { "type": "main-product" }
  },
  "order": ["main"]
}
```

- [ ] **Step 6: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Product page ---------- */

.main-product__inner {
  display: grid;
  gap: var(--space-xl);
  align-items: start;
}

.main-product__image {
  inline-size: 100%;
  block-size: auto;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-alt);
}

.main-product__details {
  display: grid;
  gap: var(--space-lg);
  align-content: start;
}

.main-product__roast {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.main-product__price {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.main-product__form {
  display: grid;
  gap: var(--space-lg);
}

.main-product__purchase {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.main-product__add[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}

.main-product__brews {
  display: grid;
  gap: var(--space-2xs);
}

/* ---------- Accordion ----------
   Native <details>: keyboard and screen-reader behaviour for free, and it
   works with scripting disabled. */

.accordion {
  border-block-start: var(--hairline);
  padding-block: var(--space-md);
}

.accordion__summary {
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  list-style: none;
}

.accordion__summary::-webkit-details-marker {
  display: none;
}

.accordion__summary::after {
  content: '+';
  float: inline-end;
  font-weight: var(--font-weight-regular);
}

.accordion[open] .accordion__summary::after {
  content: '−';
}

.accordion__body {
  padding-block-start: var(--space-sm);
}

@media (min-width: 56em) {
  .main-product__inner {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2xl);
  }
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `node --test tests/section-main-product.test.js`
Expected: PASS — 12 tests.

- [ ] **Step 8: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 410 tests, 1 skipped.

```bash
git add azouz-theme/sections/main-product.liquid azouz-theme/templates/product.json azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/section-main-product.test.js
git commit -m "feat: add product page"
```

- [ ] **Step 9: Close the JSON-LD gap the spec already declared**

Plan A emits Organization everywhere and Product on `request.page_type == 'product'`. The spec also requires **BreadcrumbList on product pages**, and the collection breadcrumb currently hard-codes the English word `Home`.

In `azouz-theme/locales/en.default.json`, inside `general.meta`, add:

```json
      "home": "Home",
      "shop": "Shop"
```

In `azouz-theme/snippets/structured-data.liquid`, replace the collection-only breadcrumb block with one that also fires on product pages. Do **not** reuse `general.meta.tags` — that string is `"Tagged \"{{ tags }}\""`.

```liquid
{%- if request.page_type == 'collection' and collection -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": {{ 'general.meta.home' | t | json }}, "item": {{ shop.url | json }} },
    { "@type": "ListItem", "position": 2, "name": {{ collection.title | json }}, "item": {{ collection.url | json }} }
  ]
}
</script>
{%- endif -%}

{%- if request.page_type == 'product' and product -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": {{ 'general.meta.home' | t | json }}, "item": {{ shop.url | json }} },
    { "@type": "ListItem", "position": 2, "name": {{ 'general.meta.shop' | t | json }}, "item": {{ routes.all_products_collection_url | json }} },
    { "@type": "ListItem", "position": 3, "name": {{ product.title | json }}, "item": {{ product.url | json }} }
  ]
}
</script>
{%- endif -%}
```

Append to `tests/meta-tags.test.js`:

```js
test('structured-data emits BreadcrumbList on a product page', async () => {
  const out = await renderSnippet('structured-data', {
    request: { page_type: 'product' },
    product: {
      title: 'Wadi Rum Blend',
      description: 'An espresso roast.',
      url: '/products/wadi-rum-blend',
      featured_image: '/preview-media/wadi-rum-blend.jpg',
      vendor: 'Azouz Coffee',
      price: 750,
      available: true,
    },
  });
  const blocks = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = blocks.map((block) => JSON.parse(block[1])['@type']);
  assert.ok(types.includes('Product'));
  assert.ok(types.includes('BreadcrumbList'));
  assert.equal(/translation missing/.test(out), false);
  assert.equal(/\bHome\b/.test(out.replace(/<script[\s\S]*?<\/script>/g, '')), false);
});

test('structured-data collection breadcrumbs are not hard-coded English', async () => {
  const out = await renderSnippet('structured-data', {
    request: { page_type: 'collection' },
    collection: { title: 'Azouz Coffee', url: '/collections/all' },
  });
  assert.match(out, /BreadcrumbList/);
  assert.equal(/translation missing/.test(out), false);
});
```

Run: `node --test tests/meta-tags.test.js`
Expected: PASS — existing tests plus the two new ones.

```bash
git add azouz-theme/snippets/structured-data.liquid azouz-theme/locales/en.default.json tests/meta-tags.test.js
git commit -m "feat: add product breadcrumbs to json-ld"
```

---

## Task 16: `<product-form>` component

**Files:**
- Modify: `azouz-theme/assets/theme.js`
- Test: `tests/theme-js-product-form.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/theme-js-product-form.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('product-form is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('product-form'), 'function');
});

test('the add-to-cart request targets the cart add route', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /routes\.cart_add_url|'\/cart\/add'/);
});

test('the component asks for json so the server does not redirect it', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /Accept['"]?\s*:\s*['"]application\/json/);
});

test('a failed request falls back to a native form submission', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(
    source,
    /catch[\s\S]{0,400}\.submit\(\)/,
    'if fetch fails the browser must still be allowed to post the form',
  );
});

test('the component announces a cart update rather than reaching into the drawer', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /cart:updated/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/theme-js-product-form.test.js`
Expected: FAIL — `product-form` is not registered.

- [ ] **Step 3: Append to `azouz-theme/assets/theme.js`**

```js
/**
 * <product-form> upgrades a real <form action="/cart/add"> into an async add.
 *
 * It wraps the submit button, not the form — the {% form %} tag owns the form
 * element — and walks up to it. With scripting off the form posts natively and
 * the customer lands on /cart, which is fully functional.
 */
class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.closest('form');
    this.button = this.querySelector('[type="submit"]');
    if (!this.form) return;

    this.form.addEventListener('submit', (event) => this.onSubmit(event));
  }

  async onSubmit(event) {
    event.preventDefault();
    if (this.button) this.button.setAttribute('aria-busy', 'true');

    try {
      const response = await fetch('/cart/add', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(this.form),
      });

      if (!response.ok) throw new Error(`add to cart failed: ${response.status}`);

      document.dispatchEvent(new CustomEvent('cart:updated', { detail: await response.json() }));
    } catch {
      // Anything unexpected: hand the browser back the plain form post.
      this.form.submit();
    } finally {
      if (this.button) this.button.removeAttribute('aria-busy');
    }
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/theme-js-product-form.test.js`
Expected: PASS — 5 tests.

- [ ] **Step 5: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 415 tests, 1 skipped.

```bash
git add azouz-theme/assets/theme.js tests/theme-js-product-form.test.js
git commit -m "feat: add async add-to-cart component"
```

---

## Task 17: `cart-line-items` snippet

One line list, rendered by both the cart page and the drawer.

**Files:**
- Create: `azouz-theme/snippets/cart-line-items.liquid`
- Modify: `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/snippet-cart-line-items.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/snippet-cart-line-items.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

function filledCart() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  addLine('dead-sea-blend-1kg-wb', 1);
  return buildCart();
}

test('renders one row per line', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.equal(countMatches(html, /class="cart-line"/g), 2);
});

test('each line shows the product title, the variant and the line total', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /Wadi Rum Blend/);
  assert.match(html, /250g \/ Whole Bean/);
  assert.match(html, /cart-line__total/);
});

test('each line links to its product', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /href="\/products\/wadi-rum-blend\?variant=/);
});

test('quantity is editable and carries the line key', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /name="updates\[wadi-rum-blend-250-wb\]"/);
});

test('each line has a remove control', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.equal(countMatches(html, /cart-line__remove/g), 2);
  assert.equal(/translation missing/.test(html), false);
});

test('the remove control names the product it removes', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /visually-hidden[^>]*>[^<]*Wadi Rum Blend/);
});

test('an empty cart renders nothing rather than an empty table', async () => {
  resetCart();
  const html = await renderSnippet('cart-line-items', { cart: buildCart() });
  assert.equal(html.trim(), '');
});

test('line images are lazy and have alt text', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /loading="lazy"/);
  assert.match(html, /alt="Wadi Rum Blend"/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/snippet-cart-line-items.test.js`
Expected: FAIL — the snippet does not exist.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `cart.general`, add:

```json
      "quantity": "Quantity",
      "line_total": "Total",
      "remove_item": "Remove {{ title }}",
      "update": "Update cart",
      "drawer_title": "Added to your cart",
```

`cart.general.remove` already exists from Plan A.

- [ ] **Step 4: Create `azouz-theme/snippets/cart-line-items.liquid`**

```liquid
{%- comment -%}
  The cart's line list. Shared by the cart page and the drawer.

  Accepts: cart (required), form_id (optional, associates the quantity inputs
  with a form that lives outside this markup)

  Renders nothing for an empty cart — the caller shows the empty state.
{%- endcomment -%}

{%- if cart.items.size > 0 -%}
  <ul class="cart-lines" role="list">
    {%- for item in cart.items -%}
      <li class="cart-line">
        {%- if item.image -%}
          <img
            class="cart-line__image"
            src="{{ item.image | image_url: width: 160 }}"
            alt="{{ item.product_title | escape }}"
            width="80"
            height="100"
            loading="lazy">
        {%- endif -%}

        <div class="cart-line__info">
          <a class="cart-line__title" href="{{ item.url }}">{{ item.product_title }}</a>
          {%- if item.variant_title != blank -%}
            <p class="cart-line__variant">{{ item.variant_title }}</p>
          {%- endif -%}
          <p class="cart-line__unit">{{ item.price | money }}</p>
        </div>

        <div class="cart-line__actions">
          {%- render 'quantity-input',
            name: 'updates[' | append: item.key | append: ']',
            value: item.quantity,
            min: 0,
            form: form_id
          -%}

          <a
            class="cart-line__remove"
            href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity=0">
            <span aria-hidden="true">&times;</span>
            <span class="visually-hidden">
              {{- 'cart.general.remove_item' | t: title: item.product_title -}}
            </span>
          </a>
        </div>

        <p class="cart-line__total">
          <span class="visually-hidden">{{ 'cart.general.line_total' | t }}</span>
          {{ item.line_price | money }}
        </p>
      </li>
    {%- endfor -%}
  </ul>
{%- endif -%}
```

- [ ] **Step 5: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Cart lines ---------- */

.cart-lines {
  display: grid;
  gap: var(--space-md);
}

.cart-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-md);
  align-items: start;
  padding-block-end: var(--space-md);
  border-block-end: var(--hairline);
}

.cart-line__image {
  inline-size: 5rem;
  block-size: auto;
  border-radius: var(--radius);
  background-color: var(--color-bg-alt);
}

.cart-line__info {
  display: grid;
  gap: var(--space-2xs);
}

.cart-line__title {
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.cart-line__variant,
.cart-line__unit {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.cart-line__actions {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
}

.cart-line__remove {
  font-size: var(--text-lg);
  line-height: 1;
  color: var(--color-text-muted);
  text-decoration: none;
}

.cart-line__remove:hover {
  color: var(--color-text);
}

.cart-line__total {
  grid-column: 2;
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 40em) {
  .cart-line {
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
  }

  .cart-line__actions,
  .cart-line__total {
    grid-column: auto;
  }
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `node --test tests/snippet-cart-line-items.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 7: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 423 tests, 1 skipped.

```bash
git add azouz-theme/snippets/cart-line-items.liquid azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/snippet-cart-line-items.test.js
git commit -m "feat: add cart line items snippet"
```

---

## Task 18: Cart page

**Files:**
- Create: `azouz-theme/sections/main-cart.liquid`
- Modify: `azouz-theme/templates/cart.json`, `azouz-theme/assets/commerce.css`
- Test: `tests/section-main-cart.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/section-main-cart.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

function filled() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  return buildCart();
}

const render = (cart) => renderSection('main-cart', { scope: { cart } });

test('the cart heading is the page h1, and the only one', async () => {
  const html = await render(filled());
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders the lines and the subtotal', async () => {
  const html = await render(filled());
  assert.match(html, /cart-line/);
  assert.match(html, /cart__subtotal/);
});

test('the form posts to the cart so quantity edits work without javascript', async () => {
  const html = await render(filled());
  assert.match(html, /action="\/cart"/);
  assert.match(html, /name="update"|type="submit"/);
});

test('there is a checkout button', async () => {
  const html = await render(filled());
  assert.match(html, /name="checkout"/);
});

test('an empty cart shows the empty state and a way back to the shop', async () => {
  resetCart();
  const html = await render(buildCart());
  assert.match(html, /cart__empty/);
  assert.match(html, /href="\/collections\/all"/);
  assert.equal(/cart-line/.test(html), false);
});

test('an empty cart shows no checkout button', async () => {
  resetCart();
  assert.equal(/name="checkout"/.test(await render(buildCart())), false);
});

test('the taxes note is present so the total is not misread', async () => {
  const html = await render(filled());
  assert.match(html, /cart__note/);
  assert.equal(/translation missing/.test(html), false);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-cart.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/section-main-cart.test.js`
Expected: FAIL — the section does not exist.

- [ ] **Step 3: Create `azouz-theme/sections/main-cart.liquid`**

```liquid
<section class="section main-cart"{{ section.shopify_attributes }}>
  <div class="container main-cart__inner">
    <h1 class="main-cart__heading">{{ 'cart.general.title' | t }}</h1>

    {%- if cart.items.size == 0 -%}
      <div class="cart__empty">
        <p class="lead">{{ 'cart.general.empty' | t }}</p>
        <a class="button" href="{{ routes.all_products_collection_url }}">
          {{ 'cart.general.continue_shopping' | t }}
        </a>
      </div>
    {%- else -%}
      {%- form 'cart', cart, id: 'CartForm', class: 'main-cart__form' -%}
        {%- render 'cart-line-items', cart: cart, form_id: 'CartForm' -%}

        <div class="cart__summary">
          <p class="cart__subtotal">
            <span>{{ 'cart.general.subtotal' | t }}</span>
            <span>{{ cart.total_price | money }}</span>
          </p>

          <p class="cart__note">{{ 'cart.general.taxes_note' | t }}</p>

          <div class="button-group cart__actions">
            <button class="button button--secondary" type="submit" name="update">
              {{ 'cart.general.update' | t }}
            </button>
            <button class="button" type="submit" name="checkout">
              {{ 'cart.general.checkout' | t }}
            </button>
          </div>
        </div>
      {%- endform -%}
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Cart",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 4: Fill `azouz-theme/templates/cart.json`**

```json
{
  "sections": {
    "main": { "type": "main-cart" }
  },
  "order": ["main"]
}
```

- [ ] **Step 5: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Cart page ---------- */

.main-cart__inner {
  display: grid;
  gap: var(--space-xl);
}

.main-cart__heading {
  margin: 0;
}

.cart__empty {
  display: grid;
  gap: var(--space-lg);
  justify-items: start;
}

.cart__summary {
  display: grid;
  gap: var(--space-sm);
  justify-items: end;
  margin-block-start: var(--space-lg);
}

.cart__subtotal {
  display: flex;
  gap: var(--space-lg);
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.cart__note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.cart__actions {
  justify-content: end;
}
```

- [ ] **Step 6: Run to verify it passes**

Run: `node --test tests/section-main-cart.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 7: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 431 tests, 1 skipped.

```bash
git add azouz-theme/sections/main-cart.liquid azouz-theme/templates/cart.json azouz-theme/assets/commerce.css tests/section-main-cart.test.js
git commit -m "feat: add cart page"
```

---

## Task 19: Cart drawer

The drawer is a **section**, not a snippet, because only a section can be re-rendered through the Section Rendering API after an add-to-cart. It uses a native `<dialog>`, which gives focus trapping, Escape-to-close and inertness of the page behind it without a line of code.

**Files:**
- Create: `azouz-theme/sections/cart-drawer.liquid`
- Modify: `azouz-theme/layout/theme.liquid`, `azouz-theme/sections/header.liquid`, `azouz-theme/assets/theme.js`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/section-cart-drawer.test.js`, `tests/theme-js-cart-drawer.test.js`
- Modify: `tests/preview-server.test.js` (remove the Task 5 skip)

- [ ] **Step 1: Write the failing tests**

Create `tests/section-cart-drawer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

const render = (cart) => renderSection('cart-drawer', { scope: { cart } });

function filled() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 1);
  return buildCart();
}

test('is a dialog so focus trapping and escape come from the platform', async () => {
  const html = await render(filled());
  assert.match(html, /<dialog/);
});

test('the dialog is closed in the markup — it must never block a no-js page', async () => {
  const html = await render(filled());
  assert.equal(/<dialog[^>]+\sopen/.test(html), false);
});

test('the refreshable region is marked so a refresh does not destroy the element', async () => {
  const html = await render(filled());
  assert.match(html, /data-drawer-content/);
});

test('renders the cart lines', async () => {
  const html = await render(filled());
  assert.match(html, /cart-line/);
  assert.match(html, /Wadi Rum Blend/);
});

test('renders the empty state when the cart is empty', async () => {
  resetCart();
  const html = await render(buildCart());
  assert.match(html, /cart-drawer__empty/);
  assert.equal(/cart-line/.test(html), false);
});

test('has a close control with an accessible name', async () => {
  const html = await render(filled());
  assert.match(html, /data-drawer-close/);
  assert.equal(/translation missing/.test(html), false);
});

test('links to the full cart page, which is the no-javascript path', async () => {
  const html = await render(filled());
  assert.match(html, /href="\/cart"/);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/cart-drawer.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
```

Create `tests/theme-js-cart-drawer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const source = () => readFile(resolveInTheme('assets/theme.js'), 'utf8');

test('cart-drawer is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('cart-drawer'), 'function');
});

test('it listens for the cart:updated event rather than being called directly', async () => {
  assert.match(await source(), /addEventListener\(\s*'cart:updated'/);
});

test('it refreshes through the section rendering api', async () => {
  assert.match(await source(), /\?sections=/);
});

test('it refreshes the header too, so the cart count stays correct', async () => {
  assert.match(await source(), /sections=cart-drawer,header|sections=header,cart-drawer/);
});

test('it replaces the inner content region, never its own element', async () => {
  const js = await source();
  assert.match(js, /data-drawer-content/);
  assert.equal(
    /this\.innerHTML\s*=/.test(js),
    false,
    'replacing the component own innerHTML would destroy its listeners',
  );
});

test('it uses showModal so the platform provides focus trapping', async () => {
  assert.match(await source(), /showModal/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/section-cart-drawer.test.js tests/theme-js-cart-drawer.test.js`
Expected: FAIL — neither the section nor the component exists.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `general.accessibility`, add:

```json
      "close_cart": "Close cart",
```

and inside `cart.general`, add:

```json
      "view_cart": "View cart",
```

- [ ] **Step 4: Create `azouz-theme/sections/cart-drawer.liquid`**

```liquid
{%- comment -%}
  The cart drawer.

  A section rather than a snippet because only sections can be re-rendered
  through the Section Rendering API after an add-to-cart.

  A native <dialog> without the `open` attribute: invisible and inert until
  showModal() is called, so with scripting off it costs nothing and the header
  cart link goes to /cart as normal.
{%- endcomment -%}

<cart-drawer class="cart-drawer">
  <dialog class="cart-drawer__dialog" aria-label="{{ 'cart.general.title' | t }}">
    <div class="cart-drawer__panel">
      <div class="cart-drawer__head">
        <h2 class="cart-drawer__heading">{{ 'cart.general.title' | t }}</h2>
        <button class="cart-drawer__close" type="button" data-drawer-close>
          {%- render 'icon', name: 'close' -%}
          <span class="visually-hidden">{{ 'general.accessibility.close_cart' | t }}</span>
        </button>
      </div>

      <div class="cart-drawer__content" data-drawer-content>
        {%- if cart.items.size == 0 -%}
          <p class="cart-drawer__empty">{{ 'cart.general.empty' | t }}</p>
        {%- else -%}
          {%- render 'cart-line-items', cart: cart -%}

          <p class="cart-drawer__subtotal">
            <span>{{ 'cart.general.subtotal' | t }}</span>
            <span>{{ cart.total_price | money }}</span>
          </p>
        {%- endif -%}
      </div>

      <div class="cart-drawer__foot">
        <a class="button button--secondary" href="{{ routes.cart_url }}">
          {{ 'cart.general.view_cart' | t }}
        </a>
      </div>
    </div>
  </dialog>
</cart-drawer>

{% schema %}
{
  "name": "Cart drawer",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 5: Render it from the layout**

In `azouz-theme/layout/theme.liquid`, replace:

```liquid
    {% section 'footer' %}
```

with:

```liquid
    {% section 'footer' %}
    {% section 'cart-drawer' %}
```

- [ ] **Step 6: Let the header open the drawer and expose its count for refresh**

In `azouz-theme/sections/header.liquid`, replace the cart link block:

```liquid
      <a class="header__action" href="{{ routes.cart_url }}">
        {%- render 'icon', name: 'cart' -%}
        <span class="visually-hidden">{{ 'cart.general.title' | t }}</span>
        <span class="header__cart-count" aria-hidden="true">{{ cart.item_count | default: 0 }}</span>
        <span class="visually-hidden">{{ cart.item_count | default: 0 }} {{ 'general.accessibility.cart_count' | t }}</span>
      </a>
```

with:

```liquid
      {%- comment -%}
        A link, not a button: with scripting off it navigates to /cart. The
        drawer component upgrades it to open the drawer instead.
      {%- endcomment -%}
      <a class="header__action" href="{{ routes.cart_url }}" data-cart-link>
        {%- render 'icon', name: 'cart' -%}
        <span class="visually-hidden">{{ 'cart.general.title' | t }}</span>
        <span class="header__cart-count" aria-hidden="true" data-cart-count>{{ cart.item_count | default: 0 }}</span>
        <span class="visually-hidden">{{ cart.item_count | default: 0 }} {{ 'general.accessibility.cart_count' | t }}</span>
      </a>
```

- [ ] **Step 7: Append the component to `azouz-theme/assets/theme.js`**

```js
/**
 * <cart-drawer> shows the cart without a page load.
 *
 * It refreshes itself through Shopify's Section Rendering API and replaces only
 * the inner content region, so the element and its listeners survive. The
 * markup is a <dialog> with no `open` attribute: inert until showModal(), which
 * means a page with scripting disabled behaves as though the drawer is not
 * there and the header cart link simply navigates to /cart.
 */
class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    if (!this.dialog) return;

    this.querySelectorAll('[data-drawer-close]').forEach((button) => {
      button.addEventListener('click', () => this.dialog.close());
    });

    // Clicking the backdrop closes the dialog.
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });

    const link = document.querySelector('[data-cart-link]');
    if (link) {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        this.open();
      });
    }

    document.addEventListener('cart:updated', () => this.refresh());
  }

  open() {
    if (typeof this.dialog.showModal === 'function') this.dialog.showModal();
    else window.location.href = '/cart';
  }

  async refresh() {
    try {
      const response = await fetch(`${window.location.pathname}?sections=cart-drawer,header`);
      if (!response.ok) throw new Error(`section render failed: ${response.status}`);

      const sections = await response.json();
      const parsed = new DOMParser().parseFromString(sections['cart-drawer'] ?? '', 'text/html');

      const fresh = parsed.querySelector('[data-drawer-content]');
      const current = this.querySelector('[data-drawer-content]');
      if (fresh && current) current.innerHTML = fresh.innerHTML;

      const header = new DOMParser().parseFromString(sections.header ?? '', 'text/html');
      const freshCount = header.querySelector('[data-cart-count]');
      const currentCount = document.querySelector('[data-cart-count]');
      if (freshCount && currentCount) currentCount.textContent = freshCount.textContent;
    } catch {
      // Leave the drawer showing whatever it last had; /cart is still correct.
    }

    this.open();
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
```

- [ ] **Step 8: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Cart drawer ---------- */

.cart-drawer__dialog {
  margin: 0;
  margin-inline-start: auto;
  padding: 0;
  inline-size: min(28rem, 100vw);
  max-inline-size: 100vw;
  block-size: 100dvh;
  max-block-size: 100dvh;
  border: 0;
  background-color: var(--color-bg);
  color: var(--color-text);
}

.cart-drawer__dialog::backdrop {
  background-color: rgb(48 48 48 / 45%);
}

.cart-drawer__panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
  block-size: 100%;
}

.cart-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-block-end: var(--hairline);
}

.cart-drawer__heading {
  margin: 0;
  font-size: var(--text-lg);
}

.cart-drawer__close {
  display: inline-flex;
  padding: var(--space-2xs);
  color: inherit;
  background: none;
  border: 0;
  cursor: pointer;
}

.cart-drawer__content {
  overflow-y: auto;
  padding: var(--space-lg);
}

.cart-drawer__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.cart-drawer__subtotal {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  margin-block-start: var(--space-lg);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.cart-drawer__foot {
  padding: var(--space-lg);
  border-block-start: var(--hairline);
}

.cart-drawer__foot .button {
  inline-size: 100%;
}
```

The backdrop uses `rgb(48 48 48 / 45%)` rather than a token because `::backdrop` cannot see custom properties inherited from `:root` in every engine. It is a shadow, not a brand colour — the same literal `base.css` already uses in `--shadow-card`. If the CSS guard flags it, that is the guard working correctly; add the exact selector to the allowance rather than weakening the rule:

In `tests/helpers/css-guards.js`, the colour check reads hex literals only, and `rgb(48 48 48 / 45%)` is not hex, so no change is needed. Confirm by running the guard.

- [ ] **Step 9: Remove the Task 5 skip**

In `tests/preview-server.test.js`, change:

```js
test('the section rendering endpoint returns rendered html per section', { skip: 'cart-drawer arrives in Task 19' }, async () => {
```

back to:

```js
test('the section rendering endpoint returns rendered html per section', async () => {
```

- [ ] **Step 10: Run to verify everything passes**

Run: `node --test tests/section-cart-drawer.test.js tests/theme-js-cart-drawer.test.js tests/preview-server.test.js tests/commerce-css.test.js tests/section-header.test.js`
Expected: PASS — 8 + 6 + 9 + 5 + 12 = 40 tests, none skipped.

- [ ] **Step 11: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 445 tests, **0 skipped**.

```bash
git add azouz-theme/sections/cart-drawer.liquid azouz-theme/sections/header.liquid azouz-theme/layout/theme.liquid azouz-theme/assets/theme.js azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/section-cart-drawer.test.js tests/theme-js-cart-drawer.test.js tests/preview-server.test.js
git commit -m "feat: add cart drawer with section rendering refresh"
```

---

## Task 20: Collection page and featured collection

**Files:**
- Create: `azouz-theme/sections/main-collection.liquid`, `azouz-theme/sections/featured-collection.liquid`
- Modify: `azouz-theme/templates/collection.json`, `azouz-theme/templates/index.json`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/section-main-collection.test.js`, `tests/section-featured-collection.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/section-main-collection.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const collection = buildFixtures().collections.all;
const render = (scope = {}, settings = {}) =>
  renderSection('main-collection', { settings, scope: { collection, ...scope } });

test('the collection title is the page h1, and the only one', async () => {
  const html = await render();
  assert.match(html, /<h1[^>]*>[\s\S]*Azouz Coffee[\s\S]*<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders a card per product', async () => {
  const html = await render();
  assert.equal(countMatches(html, /class="product-card"/g), 4);
});

test('renders the collection description when there is one', async () => {
  const html = await render();
  assert.match(html, /roasted in Jordan/);
});

test('an empty collection shows the empty state, not an empty grid', async () => {
  const html = await render({ collection: { ...collection, products: [], products_count: 0 } });
  assert.match(html, /collection__empty/);
  assert.equal(/product-card/.test(html), false);
  assert.equal(/translation missing/.test(html), false);
});

test('the product count is announced', async () => {
  const html = await render();
  assert.match(html, /collection__count/);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(
    await readFile(resolveInTheme('sections/main-collection.liquid'), 'utf8'),
  );
  assert.equal(schema.presets, undefined);
});
```

Create `tests/section-featured-collection.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) =>
  renderSection('featured-collection', { settings: { collection: 'all', ...settings } });

test('renders the heading as an h2, never an h1', async () => {
  const html = await render({ heading: 'Our Coffee' });
  assert.match(html, /<h2/);
  assert.equal(/<h1/.test(html), false);
});

test('renders a card per product up to the limit', async () => {
  const html = await render({ products_to_show: 3 });
  assert.equal(countMatches(html, /class="product-card"/g), 3);
});

test('renders every product when the limit exceeds the collection', async () => {
  const html = await render({ products_to_show: 12 });
  assert.equal(countMatches(html, /class="product-card"/g), 4);
});

test('renders a link to the whole collection when one is configured', async () => {
  const html = await render({ link_label: 'Shop all', link: '/collections/all' });
  assert.match(html, /href="\/collections\/all"/);
  assert.match(html, /Shop all/);
});

test('renders no empty anchor when the link is half configured', async () => {
  const html = await render({ link_label: 'Shop all', link: '' });
  assert.equal(/href=""/.test(html), false);
});

test('renders nothing when no collection is chosen', async () => {
  const html = await renderSection('featured-collection', { settings: { collection: '' } });
  assert.equal(html.trim(), '');
});

test('declares a preset so the client can add it in the theme editor', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(
    await readFile(resolveInTheme('sections/featured-collection.liquid'), 'utf8'),
  );
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/section-main-collection.test.js tests/section-featured-collection.test.js`
Expected: FAIL — neither section exists.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `collections.general`, add:

```json
      "view_all": "View all",
```

`collections.general.no_products` and `product_count` already exist from Plan A.

- [ ] **Step 4: Create `azouz-theme/sections/main-collection.liquid`**

```liquid
<section class="section main-collection"{{ section.shopify_attributes }}>
  <div class="container">
    <header class="collection__head">
      <h1 class="collection__heading">{{ collection.title }}</h1>

      {%- if collection.description != blank -%}
        <div class="collection__description rte">{{ collection.description }}</div>
      {%- endif -%}

      <p class="collection__count">
        {{ 'collections.general.product_count' | t: count: collection.products_count }}
      </p>
    </header>

    {%- if collection.products.size == 0 -%}
      <p class="collection__empty">{{ 'collections.general.no_products' | t }}</p>
    {%- else -%}
      {%- paginate collection.products by 12 -%}
        <reveal-on-scroll>
          <div class="grid grid--3 collection__grid">
            {%- for product in collection.products -%}
              <div class="reveal">
                {%- render 'product-card', product: product -%}
              </div>
            {%- endfor -%}
          </div>
        </reveal-on-scroll>

        {%- render 'pagination', paginate: paginate -%}
      {%- endpaginate -%}
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Collection",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 5: Create `azouz-theme/sections/featured-collection.liquid`**

```liquid
{%- liquid
  assign featured = section.settings.collection
  assign limit = section.settings.products_to_show | default: 4

  assign section_class = 'section featured-collection'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt featured-collection'
  endif

  assign has_link = false
  if section.settings.link_label != blank and section.settings.link != blank
    assign has_link = true
  endif
-%}

{%- if featured != blank -%}
  <section class="{{ section_class }}"{{ section.shopify_attributes }}>
    <div class="container">
      <div class="featured-collection__head">
        {%- if section.settings.eyebrow != blank -%}
          <span class="eyebrow">{{ section.settings.eyebrow }}</span>
        {%- endif -%}
        <h2 class="featured-collection__heading">{{ section.settings.heading }}</h2>
      </div>

      <reveal-on-scroll>
        <div class="grid grid--4 featured-collection__grid">
          {%- for product in featured.products limit: limit -%}
            <div class="reveal">
              {%- render 'product-card', product: product -%}
            </div>
          {%- endfor -%}
        </div>
      </reveal-on-scroll>

      {%- if has_link -%}
        <div class="button-group featured-collection__actions">
          <a class="button button--secondary" href="{{ section.settings.link }}">
            {{ section.settings.link_label }}
          </a>
        </div>
      {%- endif -%}
    </div>
  </section>
{%- endif -%}

{% schema %}
{
  "name": "Featured collection",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Our Coffee" },
    { "type": "collection", "id": "collection", "label": "Collection" },
    {
      "type": "range",
      "id": "products_to_show",
      "label": "Products to show",
      "min": 2,
      "max": 12,
      "step": 1,
      "default": 4
    },
    { "type": "text", "id": "link_label", "label": "Link label", "default": "View all" },
    { "type": "url", "id": "link", "label": "Link" },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" }
      ],
      "default": "default"
    }
  ],
  "presets": [{ "name": "Featured collection" }]
}
{% endschema %}
```

- [ ] **Step 6: Fill `azouz-theme/templates/collection.json`**

```json
{
  "sections": {
    "main": { "type": "main-collection" }
  },
  "order": ["main"]
}
```

- [ ] **Step 7: Add the featured collection to the homepage**

In `azouz-theme/templates/index.json`, add this entry to `sections`, between `audience` and `closing`:

```json
    "featured": {
      "type": "featured-collection",
      "settings": {
        "eyebrow": "Azouz Coffee",
        "heading": "Our Coffee",
        "collection": "all",
        "products_to_show": 4,
        "link_label": "Discover Our Coffee",
        "link": "/collections/all",
        "background": "default"
      }
    },
```

and change `order` to:

```json
  "order": ["hero", "services", "process", "audience", "featured", "closing"]
```

- [ ] **Step 8: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Collection ---------- */

.collection__head {
  display: grid;
  gap: var(--space-sm);
  margin-block-end: var(--space-xl);
  max-inline-size: var(--content-narrow);
}

.collection__heading {
  margin: 0;
}

.collection__count,
.collection__empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.collection__grid,
.featured-collection__grid {
  gap: var(--space-xl) var(--space-lg);
}

/* ---------- Featured collection ---------- */

.featured-collection__head {
  display: grid;
  gap: var(--space-sm);
  margin-block-end: var(--space-xl);
}

.featured-collection__heading {
  margin: 0;
}

.featured-collection__actions {
  justify-content: center;
  margin-block-start: var(--space-xl);
}
```

- [ ] **Step 9: Run to verify they pass**

Run: `node --test tests/section-main-collection.test.js tests/section-featured-collection.test.js tests/templates.test.js`
Expected: PASS — 6 + 7 + 12 = 25 tests. `templates.test.js` must still report exactly one `<h1>` on the homepage; if it does not, `featured-collection` is emitting one.

- [ ] **Step 10: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 458 tests.

```bash
git add azouz-theme/sections/main-collection.liquid azouz-theme/sections/featured-collection.liquid azouz-theme/templates/collection.json azouz-theme/templates/index.json azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/section-main-collection.test.js tests/section-featured-collection.test.js
git commit -m "feat: add collection page and featured collection section"
```

---

## Task 21: Search page

**Files:**
- Create: `azouz-theme/sections/main-search.liquid`
- Modify: `azouz-theme/templates/search.json`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/section-main-search.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/section-main-search.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSearchFixture } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (terms) =>
  renderSection('main-search', { scope: { search: buildSearchFixture(terms) } });

test('the search heading is the page h1, and the only one', async () => {
  const html = await render('wadi');
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders a get form so a search is a shareable url', async () => {
  const html = await render('');
  assert.match(html, /<form[^>]+method="get"/);
  assert.match(html, /action="\/search"/);
  assert.match(html, /name="q"/);
});

test('the search field is labelled', async () => {
  const html = await render('');
  assert.match(html, /<label[^>]+for="SearchInput"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the field keeps the terms that were searched for', async () => {
  const html = await render('wadi');
  assert.match(html, /value="wadi"/);
});

test('renders a card per result', async () => {
  const html = await render('blend');
  assert.equal(countMatches(html, /class="product-card"/g), 3);
});

test('states how many results were found', async () => {
  const html = await render('wadi');
  assert.match(html, /search__count/);
});

test('a search with no matches shows the no-results message, not an empty grid', async () => {
  const html = await render('zzzz');
  assert.match(html, /search__empty/);
  assert.equal(/product-card/.test(html), false);
});

test('before any search there is no results message at all', async () => {
  const html = await render('');
  assert.equal(/search__empty/.test(html), false);
  assert.equal(/search__count/.test(html), false);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-search.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/section-main-search.test.js`
Expected: FAIL — the section does not exist.

- [ ] **Step 3: Add the locale key**

In `azouz-theme/locales/en.default.json`, inside `general.search`, add:

```json
      "results_count": "{{ count }} results",
```

`general.search.title`, `placeholder`, `submit` and `no_results` already exist from Plan A.

- [ ] **Step 4: Create `azouz-theme/sections/main-search.liquid`**

```liquid
{%- comment -%}
  Search results.

  Predictive search is a Shopify server-side API with no local equivalent and
  is out of scope; this is a plain GET form, which means a search is a URL the
  customer can bookmark and share.
{%- endcomment -%}

<section class="section main-search"{{ section.shopify_attributes }}>
  <div class="container container--narrow main-search__inner">
    <h1 class="search__heading">{{ 'general.search.title' | t }}</h1>

    <form class="search__form" method="get" action="{{ routes.search_url }}" role="search">
      <div class="field">
        <label class="field__label" for="SearchInput">{{ 'general.search.title' | t }}</label>
        <input
          class="field__input"
          type="search"
          id="SearchInput"
          name="q"
          value="{{ search.terms | escape }}"
          placeholder="{{ 'general.search.placeholder' | t | escape }}">
      </div>
      <button class="button" type="submit">{{ 'general.search.submit' | t }}</button>
    </form>

    {%- if search.performed -%}
      {%- if search.results_count > 0 -%}
        <p class="search__count">
          {{ 'general.search.results_count' | t: count: search.results_count }}
        </p>
      {%- else -%}
        <p class="search__empty">{{ 'general.search.no_results' | t: terms: search.terms }}</p>
      {%- endif -%}
    {%- endif -%}
  </div>

  {%- if search.results_count > 0 -%}
    <div class="container">
      <div class="grid grid--3 search__grid">
        {%- for item in search.results -%}
          {%- render 'product-card', product: item -%}
        {%- endfor -%}
      </div>
    </div>
  {%- endif -%}
</section>

{% schema %}
{
  "name": "Search",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 5: Fill `azouz-theme/templates/search.json`**

```json
{
  "sections": {
    "main": { "type": "main-search" }
  },
  "order": ["main"]
}
```

- [ ] **Step 6: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Search ---------- */

.main-search__inner {
  display: grid;
  gap: var(--space-lg);
  margin-block-end: var(--space-xl);
}

.search__heading {
  margin: 0;
}

.search__form {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-md);
}

.search__form .field {
  flex: 1 1 16rem;
}

.search__count,
.search__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.search__grid {
  gap: var(--space-xl) var(--space-lg);
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `node --test tests/section-main-search.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 8: Run the full suite and commit**

Run: `npm test`
Expected: PASS — 467 tests.

```bash
git add azouz-theme/sections/main-search.liquid azouz-theme/templates/search.json azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/section-main-search.test.js
git commit -m "feat: add search page"
```

---

## Task 22: 404, collection index and password

**Files:**
- Create: `azouz-theme/sections/main-404.liquid`, `main-list-collections.liquid`, `main-password.liquid`, `azouz-theme/layout/password.liquid`
- Modify: `azouz-theme/templates/404.json`, `list-collections.json`, `password.json`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/section-main-404.test.js`, `tests/section-main-list-collections.test.js`, `tests/section-main-password.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/section-main-404.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('renders a single h1 explaining what happened', async () => {
  const html = await renderSection('main-404');
  assert.equal(countMatches(html, /<h1/g), 1);
  assert.equal(/translation missing/.test(html), false);
});

test('offers a way back to the shop and to the homepage', async () => {
  const html = await renderSection('main-404');
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/collections\/all"/);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-404.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
```

Create `tests/section-main-list-collections.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';

const collections = Object.values(buildFixtures().collections);

test('renders a single h1', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections } });
  assert.equal(countMatches(html, /<h1/g), 1);
  assert.equal(/translation missing/.test(html), false);
});

test('renders a card per collection, linking to it', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections } });
  assert.equal(countMatches(html, /class="collection-card"/g), collections.length);
  assert.match(html, /href="\/collections\/all"/);
});

test('states each collection product count', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections } });
  assert.match(html, /collection-card__count/);
});

test('no collections renders an empty state, not an empty grid', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections: [] } });
  assert.equal(/collection-card/.test(html), false);
});
```

Create `tests/section-main-password.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('renders a single h1 with the shop name', async () => {
  const html = await renderSection('main-password');
  assert.equal(countMatches(html, /<h1/g), 1);
  assert.match(html, /Azouz Coffee/);
});

test('renders the storefront password form', async () => {
  const html = await renderSection('main-password');
  assert.match(html, /type="password"/);
  assert.match(html, /<label[^>]+for="Password"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the password layout exists and is a complete document', async () => {
  const layout = await readFile(resolveInTheme('layout/password.liquid'), 'utf8');
  assert.match(layout, /<!doctype html>/i);
  assert.match(layout, /content_for_layout/);
  assert.match(layout, /content_for_header/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test tests/section-main-404.test.js tests/section-main-list-collections.test.js tests/section-main-password.test.js`
Expected: FAIL — none of the three sections exists.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, inside `general`, add a new group after `404`:

```json
    "password": {
      "heading": "Opening soon",
      "subtext": "Enter the store password to take a look around.",
      "label": "Password",
      "submit": "Enter"
    },
```

and inside `collections.general`, add:

```json
      "title": "Collections",
      "empty": "No collections yet.",
```

- [ ] **Step 4: Create `azouz-theme/sections/main-404.liquid`**

```liquid
<section class="section main-404"{{ section.shopify_attributes }}>
  <div class="container container--narrow main-404__inner">
    <h1 class="main-404__heading">{{ 'general.404.title' | t }}</h1>
    <p class="lead">{{ 'general.404.subtext' | t }}</p>

    <div class="button-group">
      <a class="button" href="{{ routes.root_url }}">{{ 'general.404.link' | t }}</a>
      <a class="button button--secondary" href="{{ routes.all_products_collection_url }}">
        {{ 'cart.general.continue_shopping' | t }}
      </a>
    </div>
  </div>
</section>

{% schema %}
{
  "name": "404",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 5: Create `azouz-theme/sections/main-list-collections.liquid`**

```liquid
<section class="section main-list-collections"{{ section.shopify_attributes }}>
  <div class="container">
    <h1 class="list-collections__heading">{{ 'collections.general.title' | t }}</h1>

    {%- if collections.size == 0 -%}
      <p class="collection__empty">{{ 'collections.general.empty' | t }}</p>
    {%- else -%}
      <div class="grid grid--3 list-collections__grid">
        {%- for item in collections -%}
          <article class="collection-card">
            {%- if item.image -%}
              <img
                class="collection-card__image"
                src="{{ item.image | image_url: width: 600 }}"
                alt="{{ item.title | escape }}"
                width="600"
                height="400"
                loading="lazy">
            {%- endif -%}
            <h2 class="collection-card__title">
              <a href="{{ item.url }}">{{ item.title }}</a>
            </h2>
            <p class="collection-card__count">
              {{ 'collections.general.product_count' | t: count: item.products_count }}
            </p>
          </article>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Collections list",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 6: Create `azouz-theme/sections/main-password.liquid`**

```liquid
<section class="section main-password"{{ section.shopify_attributes }}>
  <div class="container container--narrow main-password__inner">
    <img
      class="main-password__logo"
      src="{{ 'logo-black.svg' | asset_url }}"
      alt="{{ shop.name | escape }}"
      width="83"
      height="56">

    <h1 class="main-password__heading">{{ shop.name }}</h1>
    <p class="lead">{{ 'general.password.subtext' | t }}</p>

    {%- form 'storefront_password', class: 'main-password__form' -%}
      <div class="field">
        <label class="field__label" for="Password">{{ 'general.password.label' | t }}</label>
        <input class="field__input" type="password" id="Password" name="password">
      </div>
      <button class="button" type="submit">{{ 'general.password.submit' | t }}</button>
    {%- endform -%}
  </div>
</section>

{% schema %}
{
  "name": "Password",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`storefront_password` is not in the shim's action map, so it falls through to `/storefront_password`. That is fine — the preview has no password gate; on Shopify the tag resolves correctly.

- [ ] **Step 7: Create `azouz-theme/layout/password.liquid`**

```liquid
<!doctype html>
{%- liquid
  assign locale_code = request.locale.iso_code | default: 'en'
  assign rtl_locales = 'ar,he,fa,ur'
  assign text_direction = 'ltr'
  if rtl_locales contains locale_code
    assign text_direction = 'rtl'
  endif
-%}
<html lang="{{ locale_code }}" dir="{{ text_direction }}" class="no-js">
  <head>
    {%- render 'meta-tags' -%}

    <link rel="icon" type="image/svg+xml" href="{{ 'logomark.svg' | asset_url }}">

    {{ 'tokens.css' | asset_url | stylesheet_tag }}
    {{ 'fonts.css' | asset_url | stylesheet_tag }}
    {{ 'base.css' | asset_url | stylesheet_tag }}
    {{ 'sections.css' | asset_url | stylesheet_tag }}
    {{ 'commerce.css' | asset_url | stylesheet_tag }}

    <script>document.documentElement.classList.replace('no-js', 'js');</script>

    {{ content_for_header }}
  </head>

  <body class="template-password">
    <main id="MainContent" tabindex="-1">
      {{ content_for_layout }}
    </main>
  </body>
</html>
```

- [ ] **Step 8: Fill the three templates**

`azouz-theme/templates/404.json`:

```json
{
  "sections": {
    "main": { "type": "main-404" }
  },
  "order": ["main"]
}
```

`azouz-theme/templates/list-collections.json`:

```json
{
  "sections": {
    "main": { "type": "main-list-collections" }
  },
  "order": ["main"]
}
```

`azouz-theme/templates/password.json`:

```json
{
  "sections": {
    "main": { "type": "main-password" }
  },
  "order": ["main"]
}
```

- [ ] **Step 9: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- 404 ---------- */

.main-404__inner {
  display: grid;
  gap: var(--space-lg);
  justify-items: center;
  text-align: center;
}

.main-404__heading {
  margin: 0;
}

/* ---------- Collections list ---------- */

.list-collections__heading {
  margin-block-end: var(--space-xl);
}

.collection-card {
  display: grid;
  gap: var(--space-xs);
  align-content: start;
}

.collection-card__image {
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-alt);
}

.collection-card__title {
  margin: 0;
  font-size: var(--text-lg);
}

.collection-card__title a {
  text-decoration: none;
}

.collection-card__count {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

/* ---------- Password ---------- */

.main-password__inner {
  display: grid;
  gap: var(--space-lg);
  justify-items: center;
  text-align: center;
  min-block-size: 70dvh;
  align-content: center;
}

.main-password__logo {
  block-size: 3.5rem;
  inline-size: auto;
}

.main-password__heading {
  margin: 0;
}

.main-password__form {
  display: grid;
  gap: var(--space-md);
  justify-items: center;
  inline-size: min(24rem, 100%);
}

.main-password__form .field {
  inline-size: 100%;
}
```

- [ ] **Step 10: Run to verify they pass**

Run: `node --test tests/section-main-404.test.js tests/section-main-list-collections.test.js tests/section-main-password.test.js`
Expected: PASS — 3 + 4 + 3 = 10 tests.

- [ ] **Step 11: Run the full suite and the validator, then commit**

Run: `npm test`
Expected: PASS — 477 tests.

Run: `npm run validate`
Expected: `Theme validation passed.`

```bash
git add azouz-theme/sections/main-404.liquid azouz-theme/sections/main-list-collections.liquid azouz-theme/sections/main-password.liquid azouz-theme/layout/password.liquid azouz-theme/templates azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/section-main-404.test.js tests/section-main-list-collections.test.js tests/section-main-password.test.js
git commit -m "feat: add 404, collection index and password templates"
```

---

## Task 23: Customer accounts

Seven sections and seven templates. They are formulaic on purpose — every one is a labelled native form with inline error output.

**Files:**
- Create: `azouz-theme/sections/main-login.liquid`, `main-register.liquid`, `main-account.liquid`, `main-order.liquid`, `main-addresses.liquid`, `main-reset-password.liquid`, `main-activate-account.liquid`
- Modify: the seven `azouz-theme/templates/customers/*.json`, `azouz-theme/assets/commerce.css`, `azouz-theme/locales/en.default.json`
- Test: `tests/section-customer-accounts.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/section-customer-accounts.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCustomerFixture } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const customer = buildCustomerFixture();
const order = customer.orders[0];

const SECTIONS = [
  'main-login',
  'main-register',
  'main-account',
  'main-order',
  'main-addresses',
  'main-reset-password',
  'main-activate-account',
];

const scope = { customer, order };

test('every account section renders exactly one h1', async () => {
  for (const name of SECTIONS) {
    const html = await renderSection(name, { scope });
    assert.equal(countMatches(html, /<h1/g), 1, `${name} must have exactly one h1`);
  }
});

test('no account section hard-codes english', async () => {
  for (const name of SECTIONS) {
    const html = await renderSection(name, { scope });
    assert.equal(/translation missing/.test(html), false, `${name} has a missing locale key`);
  }
});

test('no account section declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  for (const name of SECTIONS) {
    const schema = extractSchema(await readFile(resolveInTheme(`sections/${name}.liquid`), 'utf8'));
    assert.equal(schema.presets, undefined, `${name} must not be addable in the theme editor`);
  }
});

test('every input in every account form has a label', async () => {
  for (const name of SECTIONS) {
    const html = await renderSection(name, { scope });
    for (const input of html.match(/<input[^>]*>/g) ?? []) {
      if (/type="(hidden|submit)"/.test(input)) continue;
      const id = /id="([^"]+)"/.exec(input);
      assert.ok(id, `${name}: an input has no id, so it cannot be labelled — ${input}`);
      assert.match(html, new RegExp(`for="${id[1]}"`), `${name}: ${id[1]} has no label`);
    }
  }
});

test('login posts to the customer login endpoint', async () => {
  const html = await renderSection('main-login', { scope });
  assert.match(html, /action="\/account\/login"/);
  assert.match(html, /type="password"/);
});

test('login links to registration and to password recovery', async () => {
  const html = await renderSection('main-login', { scope });
  assert.match(html, /href="\/account\/register"/);
  assert.match(html, /href="\/account\/recover"/);
});

test('registration posts to the create customer endpoint', async () => {
  const html = await renderSection('main-register', { scope });
  assert.match(html, /action="\/account"/);
});

test('the account page lists the customer orders with links', async () => {
  const html = await renderSection('main-account', { scope });
  assert.match(html, /#1002/);
  assert.match(html, /href="\/account\/orders\/1002"/);
});

test('an account with no orders shows an empty state', async () => {
  const html = await renderSection('main-account', {
    scope: { customer: { ...customer, orders: [], orders_count: 0 } },
  });
  assert.match(html, /account__empty/);
  assert.equal(/#1002/.test(html), false);
});

test('the order page lists its line items and the total', async () => {
  const html = await renderSection('main-order', { scope });
  assert.match(html, /Wadi Rum Blend/);
  assert.match(html, /order__total/);
});

test('the addresses page renders the saved address and a form to add one', async () => {
  const html = await renderSection('main-addresses', { scope });
  assert.match(html, /Rainbow Street/);
  assert.match(html, /action="\/account\/addresses"/);
});

test('password recovery posts to the recover endpoint', async () => {
  const html = await renderSection('main-reset-password', { scope });
  assert.match(html, /action="\/account\/recover"/);
});

test('account activation posts to the activate endpoint', async () => {
  const html = await renderSection('main-activate-account', { scope });
  assert.match(html, /action="\/account\/activate"/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/section-customer-accounts.test.js`
Expected: FAIL — none of the seven sections exists.

- [ ] **Step 3: Add the locale keys**

In `azouz-theme/locales/en.default.json`, add a new top-level `customer` group after `contact`:

```json
  "customer": {
    "login": {
      "title": "Sign in",
      "email": "Email",
      "password": "Password",
      "submit": "Sign in",
      "forgot": "Forgot your password?",
      "no_account": "Create an account"
    },
    "register": {
      "title": "Create an account",
      "first_name": "First name",
      "last_name": "Last name",
      "email": "Email",
      "password": "Password",
      "submit": "Create account",
      "has_account": "Already have an account? Sign in"
    },
    "account": {
      "title": "Your account",
      "orders": "Order history",
      "no_orders": "You have not placed an order yet.",
      "order_number": "Order",
      "date": "Date",
      "status": "Status",
      "total": "Total",
      "view_addresses": "Your addresses",
      "logout": "Sign out"
    },
    "order": {
      "title": "Order {{ name }}",
      "placed_on": "Placed on {{ date }}",
      "product": "Product",
      "quantity": "Quantity",
      "total": "Total",
      "shipping_address": "Shipping address"
    },
    "addresses": {
      "title": "Your addresses",
      "add": "Add a new address",
      "first_name": "First name",
      "last_name": "Last name",
      "company": "Company",
      "address1": "Address",
      "city": "City",
      "zip": "Postal code",
      "country": "Country",
      "phone": "Phone",
      "submit": "Save address",
      "back": "Back to your account"
    },
    "recover_password": {
      "title": "Reset your password",
      "subtext": "We will email you a link to set a new password.",
      "email": "Email",
      "submit": "Send reset link",
      "cancel": "Back to sign in"
    },
    "activate_account": {
      "title": "Activate your account",
      "subtext": "Choose a password to finish setting up your account.",
      "password": "Password",
      "password_confirm": "Confirm password",
      "submit": "Activate account",
      "decline": "Decline invitation"
    }
  },
```

- [ ] **Step 4: Create the seven sections**

`azouz-theme/sections/main-login.liquid`:

```liquid
<section class="section account"{{ section.shopify_attributes }}>
  <div class="container container--narrow account__inner">
    <h1 class="account__heading">{{ 'customer.login.title' | t }}</h1>

    {%- form 'customer_login', class: 'account__form' -%}
      <div class="field">
        <label class="field__label" for="LoginEmail">{{ 'customer.login.email' | t }}</label>
        <input class="field__input" type="email" id="LoginEmail" name="customer[email]" autocomplete="email" required>
      </div>

      <div class="field">
        <label class="field__label" for="LoginPassword">{{ 'customer.login.password' | t }}</label>
        <input class="field__input" type="password" id="LoginPassword" name="customer[password]" autocomplete="current-password" required>
      </div>

      <button class="button" type="submit">{{ 'customer.login.submit' | t }}</button>
    {%- endform -%}

    <p class="account__links">
      <a href="{{ routes.account_url }}/recover">{{ 'customer.login.forgot' | t }}</a>
      <a href="{{ routes.account_url }}/register">{{ 'customer.login.no_account' | t }}</a>
    </p>
  </div>
</section>

{% schema %}
{
  "name": "Login",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`azouz-theme/sections/main-register.liquid`:

```liquid
<section class="section account"{{ section.shopify_attributes }}>
  <div class="container container--narrow account__inner">
    <h1 class="account__heading">{{ 'customer.register.title' | t }}</h1>

    {%- form 'create_customer', class: 'account__form' -%}
      <div class="field">
        <label class="field__label" for="RegisterFirstName">{{ 'customer.register.first_name' | t }}</label>
        <input class="field__input" type="text" id="RegisterFirstName" name="customer[first_name]" autocomplete="given-name">
      </div>

      <div class="field">
        <label class="field__label" for="RegisterLastName">{{ 'customer.register.last_name' | t }}</label>
        <input class="field__input" type="text" id="RegisterLastName" name="customer[last_name]" autocomplete="family-name">
      </div>

      <div class="field">
        <label class="field__label" for="RegisterEmail">{{ 'customer.register.email' | t }}</label>
        <input class="field__input" type="email" id="RegisterEmail" name="customer[email]" autocomplete="email" required>
      </div>

      <div class="field">
        <label class="field__label" for="RegisterPassword">{{ 'customer.register.password' | t }}</label>
        <input class="field__input" type="password" id="RegisterPassword" name="customer[password]" autocomplete="new-password" required>
      </div>

      <button class="button" type="submit">{{ 'customer.register.submit' | t }}</button>
    {%- endform -%}

    <p class="account__links">
      <a href="{{ routes.account_login_url }}">{{ 'customer.register.has_account' | t }}</a>
    </p>
  </div>
</section>

{% schema %}
{
  "name": "Register",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`azouz-theme/sections/main-account.liquid`:

```liquid
<section class="section account"{{ section.shopify_attributes }}>
  <div class="container account__inner">
    <h1 class="account__heading">{{ 'customer.account.title' | t }}</h1>
    <p class="account__name">{{ customer.name }} — {{ customer.email }}</p>

    <h2 class="account__subheading">{{ 'customer.account.orders' | t }}</h2>

    {%- if customer.orders.size == 0 -%}
      <p class="account__empty">{{ 'customer.account.no_orders' | t }}</p>
    {%- else -%}
      <table class="account__table">
        <thead>
          <tr>
            <th scope="col">{{ 'customer.account.order_number' | t }}</th>
            <th scope="col">{{ 'customer.account.date' | t }}</th>
            <th scope="col">{{ 'customer.account.status' | t }}</th>
            <th scope="col">{{ 'customer.account.total' | t }}</th>
          </tr>
        </thead>
        <tbody>
          {%- for order in customer.orders -%}
            <tr>
              <td><a href="{{ order.customer_url }}">{{ order.name }}</a></td>
              <td>{{ order.created_at | date: '%d %b %Y' }}</td>
              <td>{{ order.fulfillment_status }}</td>
              <td>{{ order.total_price | money }}</td>
            </tr>
          {%- endfor -%}
        </tbody>
      </table>
    {%- endif -%}

    <p class="account__links">
      <a href="{{ routes.account_url }}/addresses">{{ 'customer.account.view_addresses' | t }}</a>
    </p>
  </div>
</section>

{% schema %}
{
  "name": "Account",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`azouz-theme/sections/main-order.liquid`:

```liquid
{%- comment -%}
  Note the `assign` for the date. Writing
  `{{ 'x' | t: date: order.created_at | date: '%d %b %Y' }}` would apply the
  date filter to the finished sentence, not to the timestamp.
{%- endcomment -%}
{%- assign placed_on = order.created_at | date: '%d %b %Y' -%}

<section class="section account"{{ section.shopify_attributes }}>
  <div class="container account__inner">
    <h1 class="account__heading">{{ 'customer.order.title' | t: name: order.name }}</h1>
    <p class="account__name">{{ 'customer.order.placed_on' | t: date: placed_on }}</p>

    <table class="account__table">
      <thead>
        <tr>
          <th scope="col">{{ 'customer.order.product' | t }}</th>
          <th scope="col">{{ 'customer.order.quantity' | t }}</th>
          <th scope="col">{{ 'customer.order.total' | t }}</th>
        </tr>
      </thead>
      <tbody>
        {%- for item in order.line_items -%}
          <tr>
            <td><a href="{{ item.url }}">{{ item.title }}</a></td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.line_price | money }}</td>
          </tr>
        {%- endfor -%}
      </tbody>
    </table>

    <p class="order__total">
      <span>{{ 'customer.order.total' | t }}</span>
      <span>{{ order.total_price | money }}</span>
    </p>

    <h2 class="account__subheading">{{ 'customer.order.shipping_address' | t }}</h2>
    <address class="account__address">{{ order.shipping_address | format_address }}</address>
  </div>
</section>

{% schema %}
{
  "name": "Order",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`azouz-theme/sections/main-addresses.liquid`:

```liquid
<section class="section account"{{ section.shopify_attributes }}>
  <div class="container container--narrow account__inner">
    <h1 class="account__heading">{{ 'customer.addresses.title' | t }}</h1>

    {%- for address in customer.addresses -%}
      <address class="account__address">{{ address | format_address }}</address>
    {%- endfor -%}

    <h2 class="account__subheading">{{ 'customer.addresses.add' | t }}</h2>

    {%- form 'customer_address', class: 'account__form' -%}
      <div class="field">
        <label class="field__label" for="AddressFirstName">{{ 'customer.addresses.first_name' | t }}</label>
        <input class="field__input" type="text" id="AddressFirstName" name="address[first_name]" autocomplete="given-name">
      </div>

      <div class="field">
        <label class="field__label" for="AddressLastName">{{ 'customer.addresses.last_name' | t }}</label>
        <input class="field__input" type="text" id="AddressLastName" name="address[last_name]" autocomplete="family-name">
      </div>

      <div class="field">
        <label class="field__label" for="AddressCompany">{{ 'customer.addresses.company' | t }}</label>
        <input class="field__input" type="text" id="AddressCompany" name="address[company]" autocomplete="organization">
      </div>

      <div class="field">
        <label class="field__label" for="AddressLine1">{{ 'customer.addresses.address1' | t }}</label>
        <input class="field__input" type="text" id="AddressLine1" name="address[address1]" autocomplete="address-line1">
      </div>

      <div class="field">
        <label class="field__label" for="AddressCity">{{ 'customer.addresses.city' | t }}</label>
        <input class="field__input" type="text" id="AddressCity" name="address[city]" autocomplete="address-level2">
      </div>

      <div class="field">
        <label class="field__label" for="AddressZip">{{ 'customer.addresses.zip' | t }}</label>
        <input class="field__input" type="text" id="AddressZip" name="address[zip]" autocomplete="postal-code">
      </div>

      <div class="field">
        <label class="field__label" for="AddressCountry">{{ 'customer.addresses.country' | t }}</label>
        <input class="field__input" type="text" id="AddressCountry" name="address[country]" autocomplete="country-name">
      </div>

      <div class="field">
        <label class="field__label" for="AddressPhone">{{ 'customer.addresses.phone' | t }}</label>
        <input class="field__input" type="tel" id="AddressPhone" name="address[phone]" autocomplete="tel">
      </div>

      <button class="button" type="submit">{{ 'customer.addresses.submit' | t }}</button>
    {%- endform -%}

    <p class="account__links">
      <a href="{{ routes.account_url }}">{{ 'customer.addresses.back' | t }}</a>
    </p>
  </div>
</section>

{% schema %}
{
  "name": "Addresses",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`azouz-theme/sections/main-reset-password.liquid`:

```liquid
<section class="section account"{{ section.shopify_attributes }}>
  <div class="container container--narrow account__inner">
    <h1 class="account__heading">{{ 'customer.recover_password.title' | t }}</h1>
    <p class="lead">{{ 'customer.recover_password.subtext' | t }}</p>

    {%- form 'recover_customer_password', class: 'account__form' -%}
      <div class="field">
        <label class="field__label" for="RecoverEmail">{{ 'customer.recover_password.email' | t }}</label>
        <input class="field__input" type="email" id="RecoverEmail" name="email" autocomplete="email" required>
      </div>

      <button class="button" type="submit">{{ 'customer.recover_password.submit' | t }}</button>
    {%- endform -%}

    <p class="account__links">
      <a href="{{ routes.account_login_url }}">{{ 'customer.recover_password.cancel' | t }}</a>
    </p>
  </div>
</section>

{% schema %}
{
  "name": "Reset password",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

`azouz-theme/sections/main-activate-account.liquid`:

```liquid
<section class="section account"{{ section.shopify_attributes }}>
  <div class="container container--narrow account__inner">
    <h1 class="account__heading">{{ 'customer.activate_account.title' | t }}</h1>
    <p class="lead">{{ 'customer.activate_account.subtext' | t }}</p>

    {%- form 'activate_customer_password', class: 'account__form' -%}
      <div class="field">
        <label class="field__label" for="ActivatePassword">{{ 'customer.activate_account.password' | t }}</label>
        <input class="field__input" type="password" id="ActivatePassword" name="customer[password]" autocomplete="new-password" required>
      </div>

      <div class="field">
        <label class="field__label" for="ActivatePasswordConfirm">{{ 'customer.activate_account.password_confirm' | t }}</label>
        <input class="field__input" type="password" id="ActivatePasswordConfirm" name="customer[password_confirmation]" autocomplete="new-password" required>
      </div>

      <div class="button-group">
        <button class="button" type="submit">{{ 'customer.activate_account.submit' | t }}</button>
        <button class="button button--secondary" type="submit" name="decline">
          {{ 'customer.activate_account.decline' | t }}
        </button>
      </div>
    {%- endform -%}
  </div>
</section>

{% schema %}
{
  "name": "Activate account",
  "tag": "div",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 5: Fill the seven customer templates**

Each file contains one section. In order:

`templates/customers/login.json` → `"main-login"`
`templates/customers/register.json` → `"main-register"`
`templates/customers/account.json` → `"main-account"`
`templates/customers/order.json` → `"main-order"`
`templates/customers/addresses.json` → `"main-addresses"`
`templates/customers/reset_password.json` → `"main-reset-password"`
`templates/customers/activate_account.json` → `"main-activate-account"`

Each with this shape, substituting the type:

```json
{
  "sections": {
    "main": { "type": "main-login" }
  },
  "order": ["main"]
}
```

- [ ] **Step 6: Append to `azouz-theme/assets/commerce.css`**

```css
/* ---------- Customer accounts ---------- */

.account__inner {
  display: grid;
  gap: var(--space-lg);
  align-content: start;
}

.account__heading,
.account__subheading {
  margin: 0;
}

.account__subheading {
  font-size: var(--text-lg);
}

.account__name {
  margin: 0;
  color: var(--color-text-muted);
}

.account__form {
  display: grid;
  gap: var(--space-md);
  justify-items: start;
}

.account__form .field {
  inline-size: 100%;
}

.account__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin: 0;
  font-size: var(--text-sm);
}

.account__empty {
  margin: 0;
  color: var(--color-text-muted);
}

.account__table {
  inline-size: 100%;
  border-collapse: collapse;
  text-align: start;
}

.account__table th,
.account__table td {
  padding: var(--space-sm);
  border-block-end: var(--hairline);
  text-align: start;
}

.account__table th {
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-eyebrow);
  color: var(--color-text-muted);
}

.account__address {
  margin: 0;
  font-style: normal;
  color: var(--color-text-muted);
}

.order__total {
  display: flex;
  justify-content: space-between;
  gap: var(--space-lg);
  margin: 0;
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 7: Run to verify it passes**

Run: `node --test tests/section-customer-accounts.test.js`
Expected: PASS — 14 tests.

- [ ] **Step 8: Run the full suite and the validator, then commit**

Run: `npm test`
Expected: PASS — 491 tests.

Run: `npm run validate`
Expected: `Theme validation passed.`

```bash
git add azouz-theme/sections azouz-theme/templates/customers azouz-theme/assets/commerce.css azouz-theme/locales/en.default.json tests/section-customer-accounts.test.js
git commit -m "feat: add customer account templates"
```

---

## Task 24: Final verification

No new code. Prove the shop works.

- [ ] **Step 1: Full suite**

Run: `npm test`
Expected: every test green, nothing skipped. Record the total.

- [ ] **Step 2: Theme validator**

Run: `npm run validate`
Expected: `Theme validation passed.`

- [ ] **Step 3: Shopify's linter**

Run: `npm run check`

Expected: **zero error-level findings.** The `AssetPreload` warning carried over from Plan A is acceptable. Report any new error, and any `MissingTemplate` — there should be none, since every section the layout and templates reference now exists.

- [ ] **Step 4: Visual review**

Run: `npm run preview`, then open each route and check it against the list.

| Route | Must show |
|---|---|
| `/collections/all` | Four product cards, each with its packaging label colour, price and roast dots |
| `/products/wadi-rum-blend` | One `<h1>`, label block with the terracotta fill and spec grid, roast meter, price, Weight and Grind selects, quantity stepper, add-to-cart, description and brewing accordions |
| `/products/dead-sea-blend` | Same, and selecting **1kg / Espresso** disables the button and shows the unavailable message |
| `/products/downtown-blend` | The 250g variant shows a struck-through compare-at price |
| `/cart` | Empty state with a link back to the shop. Then hit `/cart/seed` (a dev-only route that fills the cart and redirects) and confirm lines with quantity steppers, subtotal, taxes note, update and checkout. Clicking a line's remove control empties that line. |
| `/search?q=blend` | Three results; `/search?q=zzzz` shows the no-results message; `/search` alone shows only the form |
| `/collections` | One card per collection |
| `/account`, `/account/login`, `/account/register`, `/account/addresses`, `/account/orders/1002` | One `<h1>` each, every field labelled |
| `/nope` | The themed 404 page, with the browser reporting status 404 |

On every route confirm:
- Header, footer and announcement bar render, and the cart count is correct
- Pressing Tab first reveals the green "Skip to content" link
- The console is free of errors and the Network tab shows no 404s

- [ ] **Step 5: The two interactions that define this plan**

**Variant picker.** On `/products/wadi-rum-blend`:
- Change Weight to 1kg — the price updates and the address bar gains `?variant=…`
- Change Grind to Espresso — still available, price holds
- On `/products/dead-sea-blend` choose 1kg + Espresso — the button disables and the unavailable message appears
- Reload with a `?variant=` URL — the right options are preselected

**Cart drawer.** From any product page:
- Click Add to cart — the drawer opens with the line in it, and the header count increases
- The page does not navigate
- Add a second product — the drawer content refreshes, both lines show, the subtotal is right
- Press Escape — the drawer closes
- Click the backdrop — the drawer closes
- With the drawer open, press Tab repeatedly — focus stays inside the dialog
- Click "View cart" — `/cart` shows the same lines

- [ ] **Step 6: No-JavaScript check**

**Do not skip this step.** It is the one that caught the `.reveal` defect at the end of Plan A, and it is the only check that proves the progressive-enhancement claim in the spec.

Disable JavaScript in DevTools, reload, and confirm on `/products/wadi-rum-blend`:
- All content is visible — nothing stuck invisible from the scroll reveal
- The Weight and Grind selects are **hidden**, and a single "Choose options" select listing whole variants is shown in their place
- Sold-out variants in that select are disabled
- The quantity stepper buttons are **hidden** and the number input shows its native spinner
- Clicking Add to cart posts the form and lands on `/cart` with the right line — this is the whole no-JS purchase path
- The mobile menu still opens, because it is a `<details>` element
- The header cart link navigates to `/cart` rather than doing nothing
- The cart drawer is invisible and does not intercept anything

Also with JavaScript off, on `/cart`: change a quantity, press Update cart, and confirm the line updates.

- [ ] **Step 7: Responsive check**

At 375, 768, 1280 and 1440 on `/collections/all`, `/products/wadi-rum-blend` and `/cart`:
- No horizontal scrollbar on `<body>`
- Product grids reflow rather than overflow
- The cart drawer is full-width at 375 and a right-hand panel above 768
- The product page is one column at 375 and two above 896px

- [ ] **Step 8: RTL smoke check**

In DevTools set `document.documentElement.dir = 'rtl'` on `/products/wadi-rum-blend` and `/cart`:
- The layout mirrors: nav, product columns, cart line order and text alignment all flip
- The cart drawer opens from the left
- Nothing overlaps or escapes its container

Text stays English — only direction is under test. Arabic translation is out of scope.

- [ ] **Step 9: Commit any fixes, then report**

Report: total test count, `theme check` error count, and anything from Steps 4–8 that did not hold.

---

## Definition of Done for Plan C

- [ ] `npm test` passes with no failures and **nothing skipped**
- [ ] `npm run validate` prints `Theme validation passed.`
- [ ] `npm run check` reports **zero errors**
- [ ] Every commerce route renders completely in the preview against fixtures
- [ ] Each page has exactly one `<h1>`, no empty `href`, no `translation missing`, no unresolved section
- [ ] The variant picker updates price, availability and URL, and disables unavailable combinations
- [ ] The cart drawer opens on add, refreshes its contents and the header count, traps focus, and closes on Escape and backdrop click
- [ ] With JavaScript disabled: every page is fully readable, the `<noscript>` variant select is the only variant control shown, add-to-cart posts natively to `/cart`, and quantities can still be updated
- [ ] Layouts hold at 375 / 768 / 1280 / 1440 with no horizontal overflow
- [ ] `dir="rtl"` mirrors the layout without breakage

**Next:** Plan D — blog and article templates, `gift_card.liquid`, the client setup guide, `products.csv`, the affiliate-app comparison, and the delivery zip.
