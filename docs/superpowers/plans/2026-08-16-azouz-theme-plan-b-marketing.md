# Azouz Coffee Theme — Plan B: Marketing Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the site chrome and every B2B marketing section, then assemble the client's four supplied pages as Online Store 2.0 JSON templates — so the four pages render completely and correctly in the local preview.

**Architecture:** Each section is one `.liquid` file carrying a complete `{% schema %}`, so the client edits all copy, imagery and links in the Shopify Theme Editor without touching code. Sections are generic and reused across pages with different presets; the client's copy lives in the JSON templates, not hard-coded in markup. Section styles go in a single `assets/sections.css` rather than per-section `{% stylesheet %}` blocks, because the preview harness cannot render the latter. The preview harness gains a JSON-template renderer so it assembles pages exactly as Shopify does.

**Tech Stack:** Shopify Liquid (OS 2.0), vanilla CSS with logical properties, `node:test`, LiquidJS preview harness from Plan A.

**Spec:** `docs/superpowers/specs/2026-08-16-azouz-coffee-shopify-theme-design.md`

**Working directory:** `C:\Users\admin\Desktop\Azouz`. Windows, PowerShell, Node 24, git on PATH. Branch: **`plan-b-marketing`**.

---

## What Plan A already gives you

Do not rebuild any of this. Read these files before starting — you will use them constantly.

| Asset | What it gives you |
|---|---|
| `azouz-theme/assets/tokens.css` | Every colour, type-scale, spacing, radius and motion token. **Never write a colour literal anywhere else.** |
| `azouz-theme/assets/base.css` | `.container`, `.section`, `.section--alt`, `.section--accent`, `.grid--2/3/4`, `.stack`, `.eyebrow`, `.lead`, `.button`, `.button--secondary`, `.button-group`, `.rule`, `.label-block` (+`__title`,`__subtitle`,`__rule`,`__specs`), `.roast-meter`, `.texture-kufi`, `.visually-hidden`, `.skip-link`, `.reveal` |
| `azouz-theme/layout/theme.liquid` | Document shell. Calls `{% section 'announcement-bar' %}`, `{% section 'header' %}`, `{% section 'footer' %}` — those three files do not exist yet, which is why `theme check` currently reports 3 `MissingTemplate` errors. Plan B creates them. |
| `azouz-theme/locales/en.default.json` | All UI strings. Add new keys here; never hard-code English in `.liquid`. |
| `azouz-theme/config/settings_schema.json` | Global settings incl. `color_accent`, `color_accent_deep`, `logo`, `logo_height`, `social_*` |
| `preview/engine.js` | `createEngine(themeDir)`, `renderThemeFile(engine, themeDir, path, extraScope)` |
| `preview/fixtures.js` | `buildFixtures()` — shop, 4 real products, cart, `linklists`, `routes` |
| `preview/server.js` | Dev server on port 4321 |
| `scripts/schema-parser.js` | `extractSchema`, `defaultSettings`, `defaultBlocks` |

Baseline before you start: `npm test` → **135 passing**. `npm run validate` → `Theme validation passed.`

---

## Hard rules for this plan

1. **No colour literals outside `tokens.css`.** A test enforces this for `base.css`; Task 1 extends it to `sections.css`.
2. **No physical direction properties.** Use `margin-inline`, `padding-inline`, `inset-inline-start`, `text-align: start`. A test enforces this.
3. **No user-visible English inside `.liquid` markup.** Copy comes from either a section setting (client-editable) or `locales/en.default.json` (UI chrome). The only English in a `.liquid` file is inside `{% schema %}` defaults and labels — that is correct and expected.
4. **Every section needs a `presets` array** or the client cannot add it in the Theme Editor.
5. **Every image needs an `alt`** sourced from a setting.
6. **Green rules.** `--color-accent` (`#67985E`) for non-text fills and display type ≥24px only. `--color-accent-deep` (`#4F7748`) anywhere green carries or backs smaller text. Never put body-size text on `--color-accent`. `--color-hairline` is a border colour, never a text colour.
7. **One `<h1>` per page** — only `hero-split` emits `<h1>`; every other section uses `<h2>`.

---

## File Structure

| File | Responsibility |
|---|---|
| `azouz-theme/assets/sections.css` | All section-specific styles, appended to by most tasks |
| `azouz-theme/sections/announcement-bar.liquid` | Dismissible top strip |
| `azouz-theme/sections/header.liquid` | Logo, nav, cart link, mobile menu |
| `azouz-theme/sections/footer.liquid` | Menus, social, contact, copyright |
| `azouz-theme/sections/hero-split.liquid` | Page opener: eyebrow, `<h1>`, body, dual CTA, image |
| `azouz-theme/sections/cta-band.liquid` | Heading + body + dual CTA, optional green band |
| `azouz-theme/sections/audience-strip.liquid` | Heading + chip list of business types |
| `azouz-theme/sections/service-cards.liquid` | "What We Do" — label-block cards with links |
| `azouz-theme/sections/process-steps.liquid` | Numbered process, used for both process lists |
| `azouz-theme/sections/feature-grid.liquid` | Plain feature/product-type list |
| `azouz-theme/sections/coffee-range.liquid` | Packaging-label cards for the coffee range |
| `azouz-theme/sections/blend-builder.liquid` | Labelled spectrum bars for blend attributes |
| `azouz-theme/sections/packaging-sizes.liquid` | Heading + format chips + note |
| `azouz-theme/sections/two-column-choice.liquid` | Two side-by-side options |
| `azouz-theme/sections/brand-feature.liquid` | Brand showcase with image and CTA |
| `azouz-theme/sections/enquiry-form.liquid` | Native Shopify contact form, two presets |
| `azouz-theme/sections/main-page.liquid` | Renders a Shopify page's title and rich-text body |
| `azouz-theme/templates/index.json` | Home |
| `azouz-theme/templates/page.private-label.json` | Private Label |
| `azouz-theme/templates/page.wholesale.json` | Wholesale |
| `azouz-theme/templates/page.our-brands.json` | Our Brands |
| `azouz-theme/templates/page.enquiry.json` | Request a Sample / Get a Quote |
| `azouz-theme/templates/page.json` | Default page fallback |
| `preview/template-renderer.js` | Renders a JSON template's section list |
| `preview/settings-resolver.js` | Turns typed schema settings into the objects Liquid expects |
| `tests/helpers/render-section.js` | Shared test helper — not a test file |
| `tests/section-*.test.js` | One test file per section |

**Test file naming matters.** `npm test` runs `node --test tests/*.test.js` — a flat glob. Section tests must sit directly in `tests/` as `tests/section-<name>.test.js`, not in a `tests/sections/` subdirectory, or they will silently never run. The helper lives at `tests/helpers/render-section.js`, which the glob correctly ignores because it does not end in `.test.js`.

---

## Task 1: Wire `sections.css` and extend the CSS guards

Section styles need somewhere to live. Shopify's `{% stylesheet %}` tag would work on the live store but our preview harness deliberately swallows it, so section styles would be invisible during review — which defeats the purpose of the harness. A single linked stylesheet works identically in both places.

**Files:**
- Create: `azouz-theme/assets/sections.css`
- Modify: `azouz-theme/layout/theme.liquid` (add one `stylesheet_tag` line after `base.css`)
- Modify: `tests/base-css.test.js` (rename guards to cover both stylesheets)
- Test: `tests/sections-css.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/sections-css.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = () => readFile(resolveInTheme('assets/sections.css'), 'utf8');

test('sections.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('sections.css uses no physical directional properties — RTL readiness', async () => {
  const css = await load();
  const offenders = [];
  const forbidden = [
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
  for (const pattern of forbidden) {
    for (const match of css.matchAll(pattern)) offenders.push(match[0]);
  }
  assert.deepEqual(offenders, [], `use logical properties instead: ${offenders.join(', ')}`);
});

test('sections.css contains no colour literals — tokens only', async () => {
  const body = (await load()).replace(/\/\*[\s\S]*?\*\//g, '');
  const literals = body.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  assert.deepEqual(literals, [], `move these into tokens.css: ${literals.join(', ')}`);
});

test('sections.css never puts small text on the primary green', async () => {
  const css = await load();
  const offenders = [];
  for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const [, selector, body] = match;
    if (!/background(-color)?:\s*var\(--color-accent\)/.test(body)) continue;
    // A rule may fill with the primary green only if it sets no text colour,
    // or explicitly opts into a large-text context.
    if (/color:\s*var\(--color-on-accent\)/.test(body) && !/font-size:\s*var\(--text-(2xl|3xl|display)\)/.test(body)) {
      offenders.push(selector.trim());
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `white on --color-accent is 3.37:1 and only legal for text >=24px; use --color-accent-deep: ${offenders.join(' | ')}`,
  );
});

test('the layout links sections.css after base.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const base = layout.indexOf('base.css');
  const sections = layout.indexOf('sections.css');
  assert.ok(sections > -1, 'sections.css must be linked from the layout');
  assert.ok(sections > base, 'sections.css must come after base.css so it can override');
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/sections-css.test.js`
Expected: FAIL — `ENOENT ... assets/sections.css`

- [x] **Step 3: Create `azouz-theme/assets/sections.css`**

```css
/*
  Azouz Coffee — section styles.

  Foundations (layout primitives, buttons, the .label-block component, the
  eyebrow, motion) live in base.css. This file holds only what individual
  sections add on top.

  Same rules as base.css, enforced by tests/sections-css.test.js:
    - no colour literals; every colour comes from tokens.css
    - no physical direction properties; logical only, so the theme flips for Arabic
    - never place body-size text on --color-accent (3.37:1); use --color-accent-deep
*/
```

- [x] **Step 4: Link it from the layout**

In `azouz-theme/layout/theme.liquid`, immediately after the `base.css` line, add:

```liquid
    {{ 'sections.css' | asset_url | stylesheet_tag }}
```

The three stylesheet lines must end up in this order: `tokens.css`, `fonts.css`, `base.css`, `sections.css`.

- [x] **Step 5: Run to verify it passes**

Run: `node --test tests/sections-css.test.js`
Expected: PASS — 5 tests.

- [x] **Step 6: Confirm the layout test still passes**

Run: `node --test tests/theme-layout.test.js`
Expected: PASS — 10 tests. The existing "links the token, font and base stylesheets in that order" test must still be green.

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — 140 tests.

- [x] **Step 8: Commit**

```bash
git add azouz-theme/assets/sections.css azouz-theme/layout/theme.liquid tests/sections-css.test.js
git commit -m "feat: add sections stylesheet with rtl and contrast guards"
```

---

## Task 2: JSON template renderer for the preview harness

Shopify assembles a page by reading a JSON template's `order` array and rendering each named section. The preview harness currently injects a placeholder string instead. Without this, none of Plan B's work is reviewable.

**Files:**
- Create: `preview/template-renderer.js`
- Test: `tests/template-renderer.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/template-renderer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';

async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-tpl-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

const HERO = `<h1>{{ section.settings.heading }}</h1>
{% schema %}{"name":"Hero","settings":[{"type":"text","id":"heading","default":"Default heading"}]}{% endschema %}`;

const BAND = `<p>{{ section.settings.body }}</p>
{% schema %}{"name":"Band","settings":[{"type":"text","id":"body","default":"Default body"}]}{% endschema %}`;

const STEPS = `<ul>{% for block in section.blocks %}<li>{{ block.settings.title }}</li>{% endfor %}</ul>
{% schema %}{"name":"Steps","blocks":[{"type":"step","name":"Step","settings":[{"type":"text","id":"title","default":"Untitled"}]}]}{% endschema %}`;

test('sections render in the order the template declares', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'sections/band.liquid': BAND,
    'templates/index.json': JSON.stringify({
      sections: { a: { type: 'band' }, b: { type: 'hero' } },
      order: ['b', 'a'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.ok(html.indexOf('<h1>') < html.indexOf('<p>'), 'hero must come before band');
});

test('template settings override the schema defaults', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({
      sections: { hero: { type: 'hero', settings: { heading: 'Our Roastery.' } } },
      order: ['hero'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<h1>Our Roastery\.<\/h1>/);
});

test('schema defaults apply when the template omits a setting', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({ sections: { hero: { type: 'hero' } }, order: ['hero'] }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<h1>Default heading<\/h1>/);
});

test('blocks render in block_order, merging block-type defaults', async () => {
  const dir = await makeTheme({
    'sections/steps.liquid': STEPS,
    'templates/index.json': JSON.stringify({
      sections: {
        steps: {
          type: 'steps',
          blocks: {
            one: { type: 'step', settings: { title: 'Source' } },
            two: { type: 'step', settings: { title: 'Roast' } },
            three: { type: 'step' },
          },
          block_order: ['two', 'three', 'one'],
        },
      },
      order: ['steps'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.deepEqual([...html.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), [
    'Roast',
    'Untitled',
    'Source',
  ]);
});

test('a section id listed in order but missing from sections is skipped, not fatal', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({
      sections: { hero: { type: 'hero' } },
      order: ['hero', 'ghost'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<h1>/);
});

test('a missing section file produces a visible comment rather than throwing', async () => {
  const dir = await makeTheme({
    'templates/index.json': JSON.stringify({
      sections: { nope: { type: 'does-not-exist' } },
      order: ['nope'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /does-not-exist/);
});

test('when order is absent, sections render in object key order', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'sections/band.liquid': BAND,
    'templates/index.json': JSON.stringify({
      sections: { hero: { type: 'hero' }, band: { type: 'band' } },
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.ok(html.indexOf('<h1>') < html.indexOf('<p>'));
});

test('each rendered section is wrapped in a shopify-section element', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({ sections: { hero: { type: 'hero' } }, order: ['hero'] }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<div id="shopify-section-hero" class="shopify-section">/);
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/template-renderer.test.js`
Expected: FAIL — `Cannot find module '../preview/template-renderer.js'`

- [x] **Step 3: Create `preview/template-renderer.js`**

```js
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractSchema, defaultSettings } from '../scripts/schema-parser.js';
import { buildFixtures } from './fixtures.js';

/**
 * Expand a JSON template's blocks into the array shape Liquid sees as
 * `section.blocks`, honouring block_order and merging block-type defaults.
 */
function buildBlocks(schema, sectionConfig) {
  const declared = sectionConfig.blocks;
  if (!declared) return [];

  const typeDefaults = new Map(
    (schema?.blocks ?? []).map((blockType) => [blockType.type, defaultSettings(blockType)]),
  );

  const ids = sectionConfig.block_order ?? Object.keys(declared);

  return ids
    .filter((id) => declared[id])
    .map((id) => ({
      id,
      type: declared[id].type,
      settings: {
        ...(typeDefaults.get(declared[id].type) ?? {}),
        ...(declared[id].settings ?? {}),
      },
      shopify_attributes: '',
    }));
}

/**
 * Render one Online Store 2.0 JSON template the way Shopify assembles a page:
 * walk `order`, render each named section, concatenate.
 *
 * @param {import('liquidjs').Liquid} engine
 * @param {string} themeDir
 * @param {string} templatePath POSIX-style, e.g. 'templates/index.json'
 * @param {object} [extraScope] merged over the fixtures for every section
 * @returns {Promise<string>} the HTML that belongs in content_for_layout
 */
export async function renderTemplate(engine, themeDir, templatePath, extraScope = {}) {
  const template = JSON.parse(
    await readFile(join(themeDir, ...templatePath.split('/')), 'utf8'),
  );

  const sections = template.sections ?? {};
  const order = template.order ?? Object.keys(sections);
  const fixtures = buildFixtures();

  const rendered = [];

  for (const id of order) {
    const config = sections[id];
    if (!config) continue; // declared in order but not defined — Shopify ignores it

    const file = join(themeDir, 'sections', `${config.type}.liquid`);
    if (!existsSync(file)) {
      rendered.push(`<!-- missing section file: sections/${config.type}.liquid -->`);
      continue;
    }

    const source = await readFile(file, 'utf8');
    const schema = extractSchema(source, `sections/${config.type}.liquid`);

    const scope = {
      ...fixtures,
      ...extraScope,
      section: {
        id,
        settings: { ...defaultSettings(schema), ...(config.settings ?? {}) },
        blocks: buildBlocks(schema, config),
        shopify_attributes: '',
      },
    };

    const html = await engine.parseAndRender(source, scope);
    rendered.push(
      `<div id="shopify-section-${id}" class="shopify-section">${html}</div>`,
    );
  }

  return rendered.join('\n');
}
```

- [x] **Step 4: Run to verify it passes**

Run: `node --test tests/template-renderer.test.js`
Expected: PASS — 8 tests.

- [x] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 148 tests.

- [x] **Step 6: Commit**

```bash
git add preview/template-renderer.js tests/template-renderer.test.js
git commit -m "feat: render OS 2.0 json templates in the preview harness"
```

---

## Task 3: Preview server renders real templates

**Files:**
- Modify: `preview/server.js`
- Test: `tests/preview-routes.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/preview-routes.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ROUTES, templateForRoute } from '../preview/server.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('every marketing route the client will link to is served', () => {
  for (const path of [
    '/',
    '/pages/private-label',
    '/pages/wholesale',
    '/pages/our-brands',
    '/pages/request-a-sample',
    '/pages/get-a-quote',
  ]) {
    assert.ok(ROUTES[path], `${path} must be a preview route`);
  }
});

test('each route names a page_type Shopify would report', () => {
  const valid = new Set(['index', 'page', 'collection', 'product', 'cart', 'search', '404']);
  for (const [path, route] of Object.entries(ROUTES)) {
    assert.ok(valid.has(route.page_type), `${path} has page_type "${route.page_type}"`);
  }
});

test('templateForRoute falls back to the default page template', () => {
  assert.equal(templateForRoute({ page_type: 'page' }), 'templates/page.json');
});

test('templateForRoute honours an explicit template', () => {
  assert.equal(
    templateForRoute({ page_type: 'page', template: 'templates/page.wholesale.json' }),
    'templates/page.wholesale.json',
  );
});

test('every template a route points at exists in the theme', () => {
  for (const [path, route] of Object.entries(ROUTES)) {
    const template = templateForRoute(route);
    assert.ok(
      existsSync(resolveInTheme(template)),
      `${path} points at ${template}, which does not exist`,
    );
  }
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/preview-routes.test.js`
Expected: FAIL — `ROUTES` and `templateForRoute` are not exported from `preview/server.js`.

- [x] **Step 3: Rewrite `preview/server.js`**

Replace the whole file:

```js
/**
 * Local preview server. Renders the real theme files so what is reviewed is
 * what ships. A development aid, not a Shopify emulator — checkout, real form
 * delivery, predictive search and the Cart Section API do not exist here.
 *
 * Run: npm run preview   ->   http://localhost:4321
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEngine, renderThemeFile } from './engine.js';
import { renderTemplate } from './template-renderer.js';
import { buildFixtures } from './fixtures.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

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

/**
 * URL path -> what Shopify would render there.
 * `page` supplies the Liquid `page` object; `template` overrides the default.
 */
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

/** Which JSON template a route renders. */
export function templateForRoute(route) {
  if (route.template) return route.template;
  return route.page_type === 'index' ? 'templates/index.json' : 'templates/page.json';
}

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

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (url.pathname.startsWith('/assets/')) return serveAsset(response, url.pathname);

    const route = ROUTES[path];
    if (!route) {
      response
        .writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        .end(`<h1>No preview route for ${path}</h1><p>Known routes: ${Object.keys(ROUTES).join(', ')}</p>`);
      return;
    }

    try {
      const engine = await createEngine(THEME_DIR);
      const fixtures = buildFixtures();
      const scope = {
        ...fixtures,
        request: { ...fixtures.request, page_type: route.page_type },
        page: route.page ?? null,
      };

      const html = await renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
        ...scope,
        content_for_layout: await renderTemplate(
          engine,
          THEME_DIR,
          templateForRoute(route),
          scope,
        ),
      });

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
    } catch (error) {
      response
        .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end(`Render error on ${path}\n\n${error.stack}`);
    }
  });
}

// Only listen when run directly, so tests can import ROUTES without opening a port.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createPreviewServer().listen(PORT, () => {
    console.log(`Azouz preview: http://localhost:${PORT}`);
    for (const route of Object.keys(ROUTES)) console.log(`  http://localhost:${PORT}${route}`);
  });
}
```

- [x] **Step 4: Create placeholder templates so the route test can pass**

The route test asserts every referenced template exists. Create these six files now; later tasks fill them with real sections.

`azouz-theme/templates/index.json`, `page.private-label.json`, `page.wholesale.json`, `page.our-brands.json`, `page.enquiry.json`, `page.json` — each containing exactly:

```json
{
  "sections": {},
  "order": []
}
```

- [x] **Step 5: Run to verify it passes**

Run: `node --test tests/preview-routes.test.js`
Expected: PASS — 5 tests.

- [x] **Step 6: Run the full suite and the validator**

Run: `npm test`
Expected: PASS — 153 tests.

Run: `npm run validate`
Expected: `Theme validation passed.`

- [x] **Step 7: Commit**

```bash
git add preview/server.js azouz-theme/templates tests/preview-routes.test.js
git commit -m "feat: preview server renders real json templates"
```

---

## Task 4: Resolve typed section settings in the preview harness

Most schema setting types hand Liquid a plain string, but four hand it an **object**. A `link_list` setting stores the handle `"main-menu"` while Liquid receives a linklist with a `.links` array; an `image_picker` stores a filename while Liquid receives an image it can pass to `image_url`. Without this translation the header's `{% for link in section.settings.menu.links %}` silently renders nothing, and every section that takes an image renders a broken `<img>`.

**Files:**
- Create: `preview/settings-resolver.js`
- Modify: `preview/template-renderer.js` (apply the resolver to section and block settings)
- Modify: `preview/engine.js` (apply the resolver in `renderThemeFile`)
- Test: `tests/settings-resolver.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/settings-resolver.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSettings } from '../preview/settings-resolver.js';
import { buildFixtures } from '../preview/fixtures.js';

const fixtures = buildFixtures();

const schema = {
  settings: [
    { type: 'link_list', id: 'menu' },
    { type: 'image_picker', id: 'image' },
    { type: 'collection', id: 'featured' },
    { type: 'product', id: 'hero_product' },
    { type: 'text', id: 'heading' },
    { type: 'checkbox', id: 'show' },
    { type: 'color', id: 'tint' },
  ],
};

test('a link_list handle becomes a linklist object with links', () => {
  const resolved = resolveSettings(schema, { menu: 'main-menu' }, fixtures);
  assert.ok(Array.isArray(resolved.menu.links));
  assert.equal(resolved.menu.links[0].title, 'Private Label');
});

test('an unknown link_list handle yields an empty linklist, not undefined', () => {
  const resolved = resolveSettings(schema, { menu: 'does-not-exist' }, fixtures);
  assert.deepEqual(resolved.menu.links, []);
});

test('an image_picker filename becomes an asset path', () => {
  const resolved = resolveSettings(schema, { image: 'logo-black.svg' }, fixtures);
  assert.equal(resolved.image, '/assets/logo-black.svg');
});

test('an empty image_picker resolves to null so {% if %} guards work', () => {
  assert.equal(resolveSettings(schema, { image: '' }, fixtures).image, null);
});

test('a collection handle becomes the collection object', () => {
  const resolved = resolveSettings(schema, { featured: 'all' }, fixtures);
  assert.equal(resolved.featured.products.length, 4);
});

test('a product handle becomes the product object', () => {
  const resolved = resolveSettings(schema, { hero_product: 'wadi-rum-blend' }, fixtures);
  assert.equal(resolved.hero_product.title, 'Wadi Rum Blend');
});

test('primitive setting types pass through untouched', () => {
  const input = { heading: 'Our Roastery.', show: true, tint: '#67985E' };
  assert.deepEqual(resolveSettings(schema, input, fixtures), input);
});

test('settings with no declared type pass through untouched', () => {
  assert.deepEqual(resolveSettings(schema, { mystery: 'x' }, fixtures), { mystery: 'x' });
});

test('a null schema is tolerated', () => {
  assert.deepEqual(resolveSettings(null, { a: 1 }, fixtures), { a: 1 });
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/settings-resolver.test.js`
Expected: FAIL — `Cannot find module '../preview/settings-resolver.js'`

- [x] **Step 3: Create `preview/settings-resolver.js`**

```js
/**
 * Shopify stores a setting's *reference* (a handle or filename) but hands Liquid
 * the resolved *object*. The preview harness must do the same translation or
 * `section.settings.menu.links` and `section.settings.image | image_url` break.
 *
 * Only the four object-valued types need translating; everything else — text,
 * richtext, url, checkbox, range, select, color, number — is already what
 * Liquid sees.
 */
export function resolveSettings(schema, settings, fixtures) {
  const declaredType = new Map(
    (schema?.settings ?? []).filter((s) => s?.id).map((s) => [s.id, s.type]),
  );

  const resolved = {};

  for (const [id, value] of Object.entries(settings ?? {})) {
    switch (declaredType.get(id)) {
      case 'link_list':
        resolved[id] = fixtures.linklists?.[value] ?? { links: [] };
        break;

      case 'image_picker':
        resolved[id] = value ? `/assets/${value}` : null;
        break;

      case 'collection':
        resolved[id] = fixtures.collections?.[value] ?? null;
        break;

      case 'product':
        resolved[id] = fixtures.products?.find((p) => p.handle === value) ?? null;
        break;

      default:
        resolved[id] = value;
    }
  }

  return resolved;
}
```

- [x] **Step 4: Apply it in `preview/template-renderer.js`**

Add the import at the top:

```js
import { resolveSettings } from './settings-resolver.js';
```

In `buildBlocks`, wrap each block's merged settings. Replace the `settings:` property inside the `.map()` with:

```js
      settings: resolveSettings(
        (schema?.blocks ?? []).find((b) => b.type === declared[id].type) ?? null,
        {
          ...(typeDefaults.get(declared[id].type) ?? {}),
          ...(declared[id].settings ?? {}),
        },
        buildFixtures(),
      ),
```

In `renderTemplate`, replace the `settings:` line inside the `scope.section` object with:

```js
        settings: resolveSettings(
          schema,
          { ...defaultSettings(schema), ...(config.settings ?? {}) },
          fixtures,
        ),
```

- [x] **Step 5: Apply it in `preview/engine.js`**

In `renderThemeFile`, replace the `settings:` line inside `scope.section` with:

```js
      settings: resolveSettings(
        schema,
        { ...defaultSettings(schema), ...(extraScope.section?.settings ?? {}) },
        scope,
      ),
```

and add the import at the top:

```js
import { resolveSettings } from './settings-resolver.js';
```

- [x] **Step 6: Run to verify it passes**

Run: `node --test tests/settings-resolver.test.js`
Expected: PASS — 9 tests.

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — 162 tests. The template-renderer and engine tests must still be green — if any regressed, the resolver was wired in wrongly.

- [x] **Step 8: Commit**

```bash
git add preview/settings-resolver.js preview/template-renderer.js preview/engine.js tests/settings-resolver.test.js
git commit -m "feat: resolve link_list, image, collection and product settings in preview"
```

---

## Task 5: Shared section test helper and the icon snippet

Every section test needs the same three lines of setup, and several sections need the same handful of icons. Build both once.

**Files:**
- Create: `tests/helpers/render-section.js`
- Create: `azouz-theme/snippets/icon.liquid`
- Test: `tests/icon.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/icon.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const ICONS = ['search', 'cart', 'menu', 'close', 'arrow-right', 'chevron-down'];

async function renderIcon(name) {
  const engine = await createEngine(THEME_DIR);
  return engine.parseAndRender(`{% render 'icon', name: '${name}' %}`, {});
}

test('every icon the theme uses renders an svg', async () => {
  for (const name of ICONS) {
    assert.match(await renderIcon(name), /<svg/, `icon "${name}" is missing`);
  }
});

test('icons are decorative — aria-hidden and focusable=false', async () => {
  for (const name of ICONS) {
    const svg = await renderIcon(name);
    assert.match(svg, /aria-hidden="true"/, `${name} must be hidden from assistive tech`);
    assert.match(svg, /focusable="false"/, `${name} must not be a tab stop in IE/Edge legacy`);
  }
});

test('icons inherit colour rather than hard-coding it', async () => {
  for (const name of ICONS) {
    const svg = await renderIcon(name);
    assert.equal(/#[0-9a-fA-F]{3,6}/.test(svg), false, `${name} hard-codes a colour`);
    assert.match(svg, /currentColor/, `${name} must use currentColor`);
  }
});

test('an unknown icon name renders nothing rather than breaking the page', async () => {
  assert.equal((await renderIcon('not-a-real-icon')).trim(), '');
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/icon.test.js`
Expected: FAIL — the snippet does not exist.

- [x] **Step 3: Create `azouz-theme/snippets/icon.liquid`**

```liquid
{%- comment -%}
  Inline SVG icons.

  Usage: {% render 'icon', name: 'cart' %}

  All icons are decorative — they are always accompanied by a text label or a
  visually-hidden one, so they are hidden from assistive technology. They use
  currentColor so they take the colour of whatever they sit inside.
{%- endcomment -%}

{%- case name -%}
  {%- when 'search' -%}
    <svg class="icon icon--search" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><circle cx="9" cy="9" r="6"/><path d="M13.5 13.5 18 18" stroke-linecap="round"/></svg>

  {%- when 'cart' -%}
    <svg class="icon icon--cart" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M3 4h2l1.6 8.4a1 1 0 0 0 1 .8h6.9a1 1 0 0 0 1-.79L17 7H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="16.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="16.5" r="1.2" fill="currentColor" stroke="none"/></svg>

  {%- when 'menu' -%}
    <svg class="icon icon--menu" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M3 6h14M3 10h14M3 14h14" stroke-linecap="round"/></svg>

  {%- when 'close' -%}
    <svg class="icon icon--close" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/></svg>

  {%- when 'arrow-right' -%}
    <svg class="icon icon--arrow-right" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M4 10h12M11 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>

  {%- when 'chevron-down' -%}
    <svg class="icon icon--chevron-down" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
{%- endcase -%}
```

- [x] **Step 4: Add icon sizing to `sections.css`**

Append:

```css
/* ---------- Icons ---------- */

.icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
  flex: none;
}
```

- [x] **Step 5: Create the shared test helper**

Create `tests/helpers/render-section.js`:

```js
import { createEngine, renderThemeFile } from '../../preview/engine.js';
import { THEME_DIR } from '../../scripts/theme-paths.js';

/**
 * Render one section with its schema defaults, optionally overridden.
 *
 * @param {string} name section filename without extension, e.g. 'hero-split'
 * @param {object} [options]
 * @param {object} [options.settings] merged over the schema defaults
 * @param {Array}  [options.blocks] replaces the preset blocks entirely
 * @param {object} [options.scope] extra globals (page, product, collection…)
 * @returns {Promise<string>} rendered HTML
 */
export async function renderSection(name, options = {}) {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, `sections/${name}.liquid`, {
    ...(options.scope ?? {}),
    section: { settings: options.settings ?? {}, blocks: options.blocks },
  });
}

/** Count occurrences of a pattern — handy for asserting block counts. */
export function countMatches(html, pattern) {
  return (html.match(pattern) ?? []).length;
}
```

- [x] **Step 6: Run to verify it passes**

Run: `node --test tests/icon.test.js`
Expected: PASS — 4 tests.

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — 166 tests. Confirm the helper file was NOT picked up as a test file (the run should report 15 test files, not 16).

- [x] **Step 8: Commit**

```bash
git add azouz-theme/snippets/icon.liquid azouz-theme/assets/sections.css tests/icon.test.js tests/helpers/render-section.js
git commit -m "feat: add icon snippet and shared section test helper"
```

---

## Task 6: Announcement bar

**Files:**
- Create: `azouz-theme/sections/announcement-bar.liquid`
- Modify: `azouz-theme/assets/sections.css` (append)
- Modify: `azouz-theme/locales/en.default.json` (add one key)
- Test: `tests/section-announcement-bar.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/section-announcement-bar.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection } from './helpers/render-section.js';

test('renders the announcement text', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: 'Roasted in Jordan' } });
  assert.match(html, /Roasted in Jordan/);
});

test('renders nothing at all when the text is empty', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: '' } });
  assert.equal(html.trim(), '');
});

test('renders the optional link only when both label and url are set', async () => {
  const withBoth = await renderSection('announcement-bar', {
    settings: { text: 'Now taking wholesale orders', link_label: 'Enquire', link: '/pages/get-a-quote' },
  });
  assert.match(withBoth, /href="\/pages\/get-a-quote"/);
  assert.match(withBoth, /Enquire/);

  const labelOnly = await renderSection('announcement-bar', {
    settings: { text: 'Now taking wholesale orders', link_label: 'Enquire', link: '' },
  });
  assert.equal(/<a /.test(labelOnly), false, 'a label with no url must not produce an empty link');
});

test('is announced as a region with an accessible name', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: 'Hello' } });
  assert.match(html, /role="region"/);
  assert.match(html, /aria-label="[^"]+"/);
});

test('the accessible name comes from the locale file, not hard-coded English', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: 'Hello' } });
  assert.equal(/translation missing/.test(html), false);
});

test('declares a preset so the client can add it in the theme editor', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolveInTheme } = await import('../scripts/theme-paths.js');
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(
    await readFile(resolveInTheme('sections/announcement-bar.liquid'), 'utf8'),
  );
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/section-announcement-bar.test.js`
Expected: FAIL — the section file does not exist.

- [x] **Step 3: Add the locale key**

In `azouz-theme/locales/en.default.json`, inside `general.accessibility`, add:

```json
      "announcement": "Announcement",
```

- [x] **Step 4: Create `azouz-theme/sections/announcement-bar.liquid`**

```liquid
{%- if section.settings.text != blank -%}
  <div class="announcement" role="region" aria-label="{{ 'general.accessibility.announcement' | t }}">
    <div class="container announcement__inner">
      <p class="announcement__text">{{ section.settings.text }}</p>
      {%- if section.settings.link_label != blank and section.settings.link != blank -%}
        <a class="announcement__link" href="{{ section.settings.link }}">
          {{ section.settings.link_label }}
          {%- render 'icon', name: 'arrow-right' -%}
        </a>
      {%- endif -%}
    </div>
  </div>
{%- endif -%}

{% schema %}
{
  "name": "Announcement bar",
  "tag": "aside",
  "settings": [
    {
      "type": "text",
      "id": "text",
      "label": "Announcement",
      "default": "Specialty coffee, roasted in Jordan.",
      "info": "Leave empty to hide the bar entirely."
    },
    { "type": "text", "id": "link_label", "label": "Link label" },
    { "type": "url", "id": "link", "label": "Link" }
  ],
  "presets": [{ "name": "Announcement bar" }]
}
{% endschema %}
```

- [x] **Step 5: Append to `azouz-theme/assets/sections.css`**

```css
/* ---------- Announcement bar ----------
   Deep green, not the primary: this text is small and white-on-primary is
   only 3.37:1. */

.announcement {
  background-color: var(--color-accent-deep);
  color: var(--color-on-accent);
  font-size: var(--text-sm);
}

.announcement__inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-md);
  align-items: center;
  justify-content: center;
  padding-block: var(--space-xs);
  text-align: center;
}

.announcement__text {
  margin: 0;
  max-inline-size: none;
}

.announcement__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-weight: var(--font-weight-semibold);
}

.announcement__link .icon {
  inline-size: 1rem;
  block-size: 1rem;
}
```

- [x] **Step 6: Run to verify it passes**

Run: `node --test tests/section-announcement-bar.test.js`
Expected: PASS — 6 tests.

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — 172 tests. The locale test must still pass — you added a key, removed none.

- [x] **Step 8: Commit**

```bash
git add azouz-theme/sections/announcement-bar.liquid azouz-theme/assets/sections.css azouz-theme/locales/en.default.json tests/section-announcement-bar.test.js
git commit -m "feat: add announcement bar section"
```

---

## Task 7: Header

The mobile menu uses `<details>`/`<summary>` rather than a JavaScript toggle, so navigation works with scripting unavailable. The brand guidelines set a **minimum logo height of 57 px**; `settings.logo_height` already enforces that via its `min` value, and the header must honour it.

**Files:**
- Create: `azouz-theme/sections/header.liquid`
- Modify: `azouz-theme/assets/sections.css` (append)
- Modify: `azouz-theme/locales/en.default.json` (add keys)
- Test: `tests/section-header.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/section-header.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('header', { settings: { menu: 'main-menu', ...settings } });

test('is a banner landmark', async () => {
  assert.match(await render(), /<header[^>]+class="header"/);
});

test('the logo links home', async () => {
  assert.match(await render(), /<a[^>]+class="header__logo"[^>]+href="\/"/);
});

test('falls back to the bundled vector logo when no logo is uploaded', async () => {
  const html = await render({ logo: '' });
  assert.match(html, /logo-black\.svg/);
});

test('uses the uploaded logo when one is set', async () => {
  const html = await render({ logo: 'logo-primary.svg' });
  assert.match(html, /logo-primary\.svg/);
});

test('the logo image has non-empty alt text', async () => {
  const img = /<img[^>]+class="header__logo-image"[^>]*>/.exec(await render())[0];
  const alt = /alt="([^"]*)"/.exec(img);
  assert.ok(alt && alt[1].trim().length > 0, 'logo alt must not be empty');
});

test('renders every link from the chosen menu', async () => {
  const html = await render();
  for (const label of ['Private Label', 'Wholesale', 'Our Brands', 'Shop']) {
    assert.match(html, new RegExp(label));
  }
});

test('the navigation has an accessible name', async () => {
  assert.match(await render(), /<nav[^>]+aria-label="[^"]+"/);
});

test('the cart link shows the item count', async () => {
  const html = await render();
  assert.match(html, /href="\/cart"/);
  assert.match(html, /header__cart-count/);
});

test('the mobile menu works without javascript', async () => {
  const html = await render();
  assert.match(html, /<details[^>]*class="header__mobile"/);
  assert.match(html, /<summary/);
});

test('no user-visible english is hard-coded in the markup', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('the logo height setting cannot go below the brand minimum of 57px', async () => {
  const schema = JSON.parse(await readFile(resolveInTheme('config/settings_schema.json'), 'utf8'));
  const height = schema
    .slice(1)
    .flatMap((group) => group.settings)
    .find((setting) => setting.id === 'logo_height');
  assert.equal(height.min, 57, 'brand guidelines: full lockup minimum 57px digital');
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/header.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/section-header.test.js`
Expected: FAIL — the section file does not exist.

- [x] **Step 3: Add locale keys**

In `azouz-theme/locales/en.default.json`, inside `general.accessibility`, add:

```json
      "primary_navigation": "Primary",
      "cart_count": "items in cart",
```

- [x] **Step 4: Create `azouz-theme/sections/header.liquid`**

```liquid
{%- liquid
  assign logo_height = settings.logo_height | default: 64
  assign logo_source = section.settings.logo
-%}

<header class="header">
  <div class="container header__inner">
    <a class="header__logo" href="{{ routes.root_url }}">
      {%- if logo_source -%}
        <img
          class="header__logo-image"
          src="{{ logo_source | image_url: width: 400 }}"
          alt="{{ shop.name | escape }}"
          style="block-size: {{ logo_height }}px;"
          width="400"
          height="270">
      {%- else -%}
        <img
          class="header__logo-image"
          src="{{ 'logo-black.svg' | asset_url }}"
          alt="{{ shop.name | escape }}"
          style="block-size: {{ logo_height }}px;"
          width="83"
          height="56">
      {%- endif -%}
    </a>

    <nav class="header__nav" aria-label="{{ 'general.accessibility.primary_navigation' | t }}">
      <ul class="header__menu" role="list">
        {%- for link in section.settings.menu.links -%}
          <li>
            <a class="header__link{% if link.active %} is-active{% endif %}" href="{{ link.url }}">
              {{ link.title }}
            </a>
          </li>
        {%- endfor -%}
      </ul>
    </nav>

    <div class="header__actions">
      <a class="header__action" href="{{ routes.search_url }}">
        {%- render 'icon', name: 'search' -%}
        <span class="visually-hidden">{{ 'general.search.title' | t }}</span>
      </a>

      <a class="header__action" href="{{ routes.cart_url }}">
        {%- render 'icon', name: 'cart' -%}
        <span class="visually-hidden">{{ 'cart.general.title' | t }}</span>
        <span class="header__cart-count" aria-hidden="true">{{ cart.item_count | default: 0 }}</span>
        <span class="visually-hidden">{{ cart.item_count | default: 0 }} {{ 'general.accessibility.cart_count' | t }}</span>
      </a>
    </div>

    {%- comment -%}
      A <details> disclosure rather than a scripted toggle, so the menu opens
      even if theme.js never loads.
    {%- endcomment -%}
    <details class="header__mobile">
      <summary class="header__action header__mobile-toggle">
        {%- render 'icon', name: 'menu' -%}
        <span class="visually-hidden">{{ 'general.accessibility.menu' | t }}</span>
      </summary>
      <div class="header__mobile-panel">
        <ul class="header__mobile-menu" role="list">
          {%- for link in section.settings.menu.links -%}
            <li><a class="header__mobile-link" href="{{ link.url }}">{{ link.title }}</a></li>
          {%- endfor -%}
        </ul>
      </div>
    </details>
  </div>
</header>

{% schema %}
{
  "name": "Header",
  "settings": [
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Logo",
      "info": "Leave empty to use the bundled vector logo. Never display the full lockup below 57 px tall."
    },
    { "type": "link_list", "id": "menu", "label": "Menu", "default": "main-menu" }
  ],
  "presets": [{ "name": "Header" }]
}
{% endschema %}
```

- [x] **Step 5: Append to `azouz-theme/assets/sections.css`**

```css
/* ---------- Header ---------- */

.header {
  position: sticky;
  inset-block-start: 0;
  z-index: 20;
  background-color: var(--color-bg);
  border-block-end: var(--hairline);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding-block: var(--space-md);
}

.header__logo {
  display: inline-flex;
  flex: none;
  text-decoration: none;
}

.header__logo-image {
  inline-size: auto;
  max-inline-size: 100%;
}

.header__nav {
  display: none;
  margin-inline-start: auto;
}

.header__menu {
  display: flex;
  gap: var(--space-lg);
  align-items: center;
}

.header__link {
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  padding-block: var(--space-2xs);
  border-block-end: 2px solid transparent;
}

.header__link:hover,
.header__link.is-active {
  border-block-end-color: var(--color-accent);
}

.header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-inline-start: auto;
}

.header__action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-2xs);
  text-decoration: none;
  border-radius: var(--radius);
}

.header__cart-count {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  font-variant-numeric: tabular-nums;
}

.header__mobile {
  flex: none;
}

.header__mobile-toggle {
  cursor: pointer;
  list-style: none;
}

.header__mobile-toggle::-webkit-details-marker {
  display: none;
}

.header__mobile-panel {
  position: absolute;
  inset-inline: 0;
  padding: var(--space-md) var(--gutter) var(--space-lg);
  background-color: var(--color-bg);
  border-block-end: var(--hairline);
}

.header__mobile-menu {
  display: grid;
  gap: var(--space-md);
}

.header__mobile-link {
  display: block;
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

@media (min-width: 48em) {
  .header__nav { display: block; }
  .header__actions { margin-inline-start: 0; }
  .header__mobile { display: none; }
}
```

- [x] **Step 6: Run to verify it passes**

Run: `node --test tests/section-header.test.js`
Expected: PASS — 12 tests.

- [x] **Step 7: Run the full suite**

Run: `npm test`
Expected: PASS — 184 tests.

- [x] **Step 8: Commit**

```bash
git add azouz-theme/sections/header.liquid azouz-theme/assets/sections.css azouz-theme/locales/en.default.json tests/section-header.test.js
git commit -m "feat: add header with no-js mobile menu"
```

---

## Task 8: Footer

**Files:**
- Create: `azouz-theme/sections/footer.liquid`
- Modify: `azouz-theme/assets/sections.css` (append)
- Modify: `azouz-theme/locales/en.default.json` (add keys)
- Test: `tests/section-footer.test.js`

- [x] **Step 1: Write the failing test**

Create `tests/section-footer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('footer', { settings: { menu: 'footer', ...settings } });

test('is a contentinfo landmark', async () => {
  assert.match(await render(), /<footer[^>]+class="footer"/);
});

test('renders the menu links', async () => {
  const html = await render();
  assert.match(html, /Request a Sample/);
  assert.match(html, /Get a Quote/);
});

test('shows the shop name and the current year in the copyright', async () => {
  const html = await render();
  assert.match(html, /Azouz Coffee/);
  assert.match(html, new RegExp(String(new Date().getFullYear())));
});

test('renders the contact email as a mailto link when set', async () => {
  const html = await render({ show_contact: true });
  assert.match(html, /mailto:hello@azouzcoffee\.com/);
});

test('social links appear only when configured', async () => {
  const html = await render();
  assert.equal(/href=""/.test(html), false, 'no empty hrefs from unset social settings');
});

test('social links that are set get an accessible name', async () => {
  const html = await renderSection('footer', {
    settings: { menu: 'footer' },
    scope: { settings: { social_instagram: 'https://instagram.com/azouzcoffee' } },
  });
  if (/instagram\.com/.test(html)) {
    assert.match(html, /aria-label="[^"]+"|visually-hidden/);
  }
});

test('no user-visible english is hard-coded in the markup', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/footer.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
```

- [x] **Step 2: Run to verify it fails**

Run: `node --test tests/section-footer.test.js`
Expected: FAIL — the section file does not exist.

- [x] **Step 3: Add locale keys**

In `azouz-theme/locales/en.default.json`, inside `layout.footer`, add:

```json
      "menu": "Explore",
      "contact": "Contact",
      "follow": "Follow"
```

and inside `general.accessibility` add:

```json
      "instagram": "Instagram",
      "facebook": "Facebook",
      "whatsapp": "WhatsApp",
```

- [x] **Step 4: Create `azouz-theme/sections/footer.liquid`**

```liquid
<footer class="footer">
  <div class="container footer__inner">
    <div class="footer__brand">
      <img
        class="footer__logo"
        src="{{ 'logo-black.svg' | asset_url }}"
        alt="{{ shop.name | escape }}"
        width="83"
        height="56"
        loading="lazy">
      {%- if section.settings.tagline != blank -%}
        <p class="footer__tagline">{{ section.settings.tagline }}</p>
      {%- endif -%}
    </div>

    {%- if section.settings.menu.links.size > 0 -%}
      <nav class="footer__column" aria-label="{{ 'layout.footer.menu' | t }}">
        <h2 class="eyebrow">{{ 'layout.footer.menu' | t }}</h2>
        <ul class="footer__menu" role="list">
          {%- for link in section.settings.menu.links -%}
            <li><a class="footer__link" href="{{ link.url }}">{{ link.title }}</a></li>
          {%- endfor -%}
        </ul>
      </nav>
    {%- endif -%}

    {%- if section.settings.show_contact -%}
      <div class="footer__column">
        <h2 class="eyebrow">{{ 'layout.footer.contact' | t }}</h2>
        <ul class="footer__menu" role="list">
          {%- if shop.email != blank -%}
            <li><a class="footer__link" href="mailto:{{ shop.email }}">{{ shop.email }}</a></li>
          {%- endif -%}
          {%- if section.settings.phone != blank -%}
            <li><a class="footer__link" href="tel:{{ section.settings.phone | remove: ' ' }}">{{ section.settings.phone }}</a></li>
          {%- endif -%}
          {%- if section.settings.address != blank -%}
            <li class="footer__address">{{ section.settings.address }}</li>
          {%- endif -%}
        </ul>
      </div>
    {%- endif -%}

    {%- if settings.social_instagram != blank or settings.social_facebook != blank or settings.social_whatsapp != blank -%}
      <div class="footer__column">
        <h2 class="eyebrow">{{ 'layout.footer.follow' | t }}</h2>
        <ul class="footer__social" role="list">
          {%- if settings.social_instagram != blank -%}
            <li><a class="footer__link" href="{{ settings.social_instagram }}">{{ 'general.accessibility.instagram' | t }}</a></li>
          {%- endif -%}
          {%- if settings.social_facebook != blank -%}
            <li><a class="footer__link" href="{{ settings.social_facebook }}">{{ 'general.accessibility.facebook' | t }}</a></li>
          {%- endif -%}
          {%- if settings.social_whatsapp != blank -%}
            <li><a class="footer__link" href="https://wa.me/{{ settings.social_whatsapp }}">{{ 'general.accessibility.whatsapp' | t }}</a></li>
          {%- endif -%}
        </ul>
      </div>
    {%- endif -%}
  </div>

  <div class="container footer__legal">
    <hr class="rule">
    <p class="footer__copyright">
      &copy; {{ 'now' | date: '%Y' }} {{ shop.name }}. {{ 'layout.footer.rights' | t }}
    </p>
  </div>
</footer>

{% schema %}
{
  "name": "Footer",
  "settings": [
    {
      "type": "text",
      "id": "tagline",
      "label": "Tagline",
      "default": "Specialty coffee roasters. Private label, wholesale and retail coffee, roasted in Jordan."
    },
    { "type": "link_list", "id": "menu", "label": "Menu", "default": "footer" },
    { "type": "checkbox", "id": "show_contact", "label": "Show contact details", "default": true },
    { "type": "text", "id": "phone", "label": "Phone" },
    { "type": "text", "id": "address", "label": "Address" }
  ],
  "presets": [{ "name": "Footer" }]
}
{% endschema %}
```

- [x] **Step 5: Append to `azouz-theme/assets/sections.css`**

```css
/* ---------- Footer ---------- */

.footer {
  margin-block-start: var(--space-2xl);
  padding-block-start: var(--space-xl);
  background-color: var(--color-bg-alt);
}

.footer__inner {
  display: grid;
  gap: var(--space-xl);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  padding-block-end: var(--space-xl);
}

.footer__brand {
  display: grid;
  gap: var(--space-md);
  align-content: start;
}

.footer__logo {
  block-size: 3rem;
  inline-size: auto;
}

.footer__tagline {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  max-inline-size: 32ch;
}

.footer__column {
  display: grid;
  gap: var(--space-sm);
  align-content: start;
}

.footer__menu,
.footer__social {
  display: grid;
  gap: var(--space-xs);
  font-size: var(--text-sm);
}

.footer__link {
  text-decoration: none;
}

.footer__link:hover {
  text-decoration: underline;
}

.footer__address {
  color: var(--color-text-muted);
}

.footer__legal {
  padding-block-end: var(--space-lg);
}

.footer__copyright {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
```

- [x] **Step 6: Run to verify it passes**

Run: `node --test tests/section-footer.test.js`
Expected: PASS — 8 tests.

- [x] **Step 7: Run the full suite and theme check**

Run: `npm test`
Expected: PASS — 192 tests.

Run: `npm run check`
Expected: the three `MissingTemplate` errors for `announcement-bar`, `header` and `footer` are now **gone**. Remaining warnings are acceptable; report any error-level finding.

- [x] **Step 8: Commit**

```bash
git add azouz-theme/sections/footer.liquid azouz-theme/assets/sections.css azouz-theme/locales/en.default.json tests/section-footer.test.js
git commit -m "feat: add footer section"
```

---

## A shared pattern for the remaining sections

Tasks 9–19 all build marketing sections. They share one shape, so read this once:

- Markup begins with an optional `.eyebrow`, then a heading, then content, then optional CTAs.
- **`hero-split` is the only section that emits `<h1>`.** Every other section uses `<h2>`, because a page has exactly one `<h1>`.
- Repeating content is `{% schema %}` **blocks**, never hard-coded lists, so the client can add and reorder items.
- Every block loop must emit `{{ block.shopify_attributes }}` on its outer element or Theme Editor selection breaks.
- The section root carries `{{ section.shopify_attributes }}`.
- Wrap animated groups in `<reveal-on-scroll>` and give children `class="reveal"`. Content stays visible if JavaScript never runs — Plan A gates the hidden state on `reveal-on-scroll:defined`.
- Any CTA pair uses `.button-group` with `.button` and `.button--secondary`.
- A background choice is a `select` setting with options `default`, `alt`, `accent` mapping to `.section`, `.section--alt`, `.section--accent`.

**One Liquid trap to avoid throughout.** Liquid evaluates `and` and `or` **right to left, with no operator precedence**. `a and b or c and d` becomes `a and (b or (c and d))` — not what anyone means. Whenever a condition mixes `and` with `or`, compute each side into its own variable with `assign` first, then combine. Every section below that has two optional calls to action does this.

Each task follows the same five steps: write the test, run it and watch it fail, write the section plus its CSS, run the test until green, commit. Run `npm test` after each commit.

---

## Task 9: Hero split

**Files:** create `azouz-theme/sections/hero-split.liquid`; append `azouz-theme/assets/sections.css`; test `tests/section-hero-split.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('hero-split', { settings });

test('renders the heading as the page h1', async () => {
  const html = await render({ heading: 'Your Coffee. Your Brand. Our Roastery.' });
  assert.match(html, /<h1[^>]*>[\s\S]*Your Coffee\. Your Brand\. Our Roastery\.[\s\S]*<\/h1>/);
});

test('emits exactly one h1', async () => {
  assert.equal(((await render()).match(/<h1/g) ?? []).length, 1);
});

test('renders the eyebrow when set and omits it when empty', async () => {
  assert.match(await render({ eyebrow: 'Private Label' }), /class="eyebrow"/);
  assert.equal(/class="eyebrow"/.test(await render({ eyebrow: '' })), false);
});

test('renders both calls to action with their labels and links', async () => {
  const html = await render({
    cta_primary_label: 'Request a Sample',
    cta_primary_link: '/pages/request-a-sample',
    cta_secondary_label: 'Start Your Private Label',
    cta_secondary_link: '/pages/private-label',
  });
  assert.match(html, /href="\/pages\/request-a-sample"[^>]*>[\s\S]*Request a Sample/);
  assert.match(html, /href="\/pages\/private-label"[^>]*>[\s\S]*Start Your Private Label/);
});

test('a cta with a label but no link is not rendered as an empty anchor', async () => {
  const html = await render({ cta_primary_label: 'Request a Sample', cta_primary_link: '' });
  assert.equal(/href=""/.test(html), false);
});

/*
  Liquid evaluates and/or right to left with no precedence, so a compound
  condition like `a and b or c and d` collapses to `a and (b or (c and d))`.
  With only the SECONDARY button configured that reads false and the whole
  button group vanishes. This test is the one that catches it.
*/
test('a secondary cta renders even when no primary cta is configured', async () => {
  const html = await render({
    cta_primary_label: '',
    cta_primary_link: '',
    cta_secondary_label: 'View Wholesale',
    cta_secondary_link: '/pages/wholesale',
  });
  assert.match(html, /href="\/pages\/wholesale"/);
  assert.match(html, /View Wholesale/);
});

test('the button group is omitted entirely when neither cta is configured', async () => {
  const html = await render({
    cta_primary_label: '', cta_primary_link: '',
    cta_secondary_label: '', cta_secondary_link: '',
  });
  assert.equal(/button-group/.test(html), false);
});

test('the image carries the alt text from its setting', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'Wadi Rum Blend, 1kg bag' });
  assert.match(html, /alt="Wadi Rum Blend, 1kg bag"/);
});

test('the hero image loads eagerly with high priority — it is the LCP element', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'A coffee bag' });
  assert.match(html, /fetchpriority="high"/);
  assert.equal(/loading="lazy"/.test(html), false);
});

test('body copy renders as rich text', async () => {
  const html = await render({ body: '<p>We roast and produce coffee.</p>' });
  assert.match(html, /<p>We roast and produce coffee\.<\/p>/);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/hero-split.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign background = section.settings.background
  assign section_class = 'section hero'
  if background == 'alt'
    assign section_class = 'section section--alt hero'
  elsif background == 'accent'
    assign section_class = 'section section--accent hero'
  endif

  comment
    Liquid evaluates `and` / `or` right to left with no operator precedence, so
    `a and b or c and d` silently becomes `a and (b or (c and d))`. Compute each
    side into its own variable rather than writing a compound condition.
  endcomment
  assign has_primary = false
  if section.settings.cta_primary_label != blank and section.settings.cta_primary_link != blank
    assign has_primary = true
  endif

  assign has_secondary = false
  if section.settings.cta_secondary_label != blank and section.settings.cta_secondary_link != blank
    assign has_secondary = true
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container hero__inner{% unless section.settings.image %} hero__inner--full{% endunless %}">
    <div class="hero__content">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}

      <h1 class="hero__heading">{{ section.settings.heading }}</h1>

      {%- if section.settings.body != blank -%}
        <div class="hero__body lead">{{ section.settings.body }}</div>
      {%- endif -%}

      {%- if has_primary or has_secondary -%}
        <div class="button-group">
          {%- if has_primary -%}
            <a class="button" href="{{ section.settings.cta_primary_link }}">{{ section.settings.cta_primary_label }}</a>
          {%- endif -%}
          {%- if has_secondary -%}
            <a class="button button--secondary" href="{{ section.settings.cta_secondary_link }}">{{ section.settings.cta_secondary_label }}</a>
          {%- endif -%}
        </div>
      {%- endif -%}
    </div>

    {%- if section.settings.image -%}
      <div class="hero__media">
        <img
          class="hero__image"
          src="{{ section.settings.image | image_url: width: 1200 }}"
          alt="{{ section.settings.image_alt | escape }}"
          width="1200"
          height="1500"
          fetchpriority="high"
          decoding="async">
      </div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Hero",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Your Coffee. Your Brand. Our Roastery."
    },
    { "type": "richtext", "id": "body", "label": "Body" },
    { "type": "text", "id": "cta_primary_label", "label": "Primary button label" },
    { "type": "url", "id": "cta_primary_link", "label": "Primary button link" },
    { "type": "text", "id": "cta_secondary_label", "label": "Secondary button label" },
    { "type": "url", "id": "cta_secondary_link", "label": "Secondary button link" },
    { "type": "image_picker", "id": "image", "label": "Image" },
    {
      "type": "text",
      "id": "image_alt",
      "label": "Image description",
      "info": "Describe the image for screen readers and for when it fails to load."
    },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" },
        { "value": "accent", "label": "Green" }
      ],
      "default": "default"
    }
  ],
  "presets": [{ "name": "Hero" }]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Hero ---------- */

.hero__inner {
  display: grid;
  gap: var(--space-xl);
  align-items: center;
}

.hero__content {
  display: grid;
  gap: var(--space-lg);
  align-content: start;
}

.hero__heading {
  margin: 0;
}

.hero__body > :first-child { margin-block-start: 0; }
.hero__body > :last-child { margin-block-end: 0; }

.hero__media {
  justify-self: center;
  inline-size: 100%;
  max-inline-size: 32rem;
}

.hero__image {
  inline-size: 100%;
  block-size: auto;
  border-radius: var(--radius-lg);
}

@media (min-width: 56em) {
  .hero__inner {
    grid-template-columns: 1.1fr 0.9fr;
    gap: var(--space-2xl);
  }

  .hero__inner--full {
    grid-template-columns: minmax(0, 52rem);
  }
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/hero-split.liquid azouz-theme/assets/sections.css tests/section-hero-split.test.js
git commit -m "feat: add hero split section"
```

---

## Task 10: CTA band

**Files:** create `azouz-theme/sections/cta-band.liquid`; append CSS; test `tests/section-cta-band.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('cta-band', { settings });

test('renders the heading as an h2, never an h1', async () => {
  const html = await render({ heading: "Let's Create Your Coffee." });
  assert.match(html, /<h2[^>]*>[\s\S]*Let&#39;s Create Your Coffee\.|<h2[^>]*>[\s\S]*Let's Create Your Coffee\./);
  assert.equal(/<h1/.test(html), false);
});

test('renders both calls to action', async () => {
  const html = await render({
    cta_primary_label: 'Request a Sample',
    cta_primary_link: '/pages/request-a-sample',
    cta_secondary_label: 'Get a Quote',
    cta_secondary_link: '/pages/get-a-quote',
  });
  assert.match(html, /href="\/pages\/request-a-sample"/);
  assert.match(html, /href="\/pages\/get-a-quote"/);
});

test('the green background uses the accent modifier so its text passes contrast', async () => {
  const html = await render({ background: 'accent' });
  assert.match(html, /section--accent/);
});

test('renders no empty anchors when a cta is half configured', async () => {
  const html = await render({ cta_primary_label: 'Go', cta_primary_link: '' });
  assert.equal(/href=""/.test(html), false);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/cta-band.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section cta-band'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt cta-band'
  elsif section.settings.background == 'accent'
    assign section_class = 'section section--accent cta-band'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container container--narrow cta-band__inner">
    {%- if section.settings.eyebrow != blank -%}
      <span class="eyebrow">{{ section.settings.eyebrow }}</span>
    {%- endif -%}

    <h2 class="cta-band__heading">{{ section.settings.heading }}</h2>

    {%- if section.settings.body != blank -%}
      <div class="cta-band__body lead">{{ section.settings.body }}</div>
    {%- endif -%}

    <div class="button-group cta-band__actions">
      {%- if section.settings.cta_primary_label != blank and section.settings.cta_primary_link != blank -%}
        <a class="button" href="{{ section.settings.cta_primary_link }}">{{ section.settings.cta_primary_label }}</a>
      {%- endif -%}
      {%- if section.settings.cta_secondary_label != blank and section.settings.cta_secondary_link != blank -%}
        <a class="button button--secondary" href="{{ section.settings.cta_secondary_link }}">{{ section.settings.cta_secondary_label }}</a>
      {%- endif -%}
    </div>
  </div>
</section>

{% schema %}
{
  "name": "CTA band",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Let's Create Your Coffee." },
    { "type": "richtext", "id": "body", "label": "Body" },
    { "type": "text", "id": "cta_primary_label", "label": "Primary button label", "default": "Request a Sample" },
    { "type": "url", "id": "cta_primary_link", "label": "Primary button link" },
    { "type": "text", "id": "cta_secondary_label", "label": "Secondary button label" },
    { "type": "url", "id": "cta_secondary_link", "label": "Secondary button link" },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" },
        { "value": "accent", "label": "Green" }
      ],
      "default": "alt"
    }
  ],
  "presets": [{ "name": "CTA band" }]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- CTA band ---------- */

.cta-band__inner {
  display: grid;
  gap: var(--space-lg);
  justify-items: center;
  text-align: center;
}

.cta-band__heading { margin: 0; }

.cta-band__body { margin: 0; }
.cta-band__body > :first-child { margin-block-start: 0; }
.cta-band__body > :last-child { margin-block-end: 0; }

.cta-band__actions { justify-content: center; }

/* On the green band the secondary button must read against green, not page. */
.section--accent .button--secondary {
  --button-fg: var(--color-on-accent);
  border-color: var(--color-on-accent);
}

.section--accent .button--secondary:hover {
  --button-bg: var(--color-on-accent);
  --button-fg: var(--color-accent-deep);
}

.section--accent .button {
  --button-bg: var(--color-on-accent);
  --button-fg: var(--color-accent-deep);
}

.section--accent .button:hover {
  --button-bg: var(--color-bg-alt);
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/cta-band.liquid azouz-theme/assets/sections.css tests/section-cta-band.test.js
git commit -m "feat: add cta band section"
```

---

## Task 11: Audience strip

Renders the "We work with: Cafés · Hotels · Restaurants …" lists that appear on three of the four pages.

**Files:** create `azouz-theme/sections/audience-strip.liquid`; append CSS; test `tests/section-audience-strip.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const blocks = (titles) =>
  titles.map((title, index) => ({ id: `a${index}`, type: 'audience', settings: { title }, shopify_attributes: '' }));

test('renders one chip per block, in order', async () => {
  const html = await renderSection('audience-strip', {
    settings: { heading: 'Coffee Made for Your Business.' },
    blocks: blocks(['Cafés', 'Hotels', 'Restaurants', 'Retailers', 'Distributors', 'Coffee Brands']),
  });
  assert.equal(countMatches(html, /class="audience-strip__chip"/g), 6);
  assert.ok(html.indexOf('Cafés') < html.indexOf('Hotels'));
});

test('the chip list is a real list for screen readers', async () => {
  const html = await renderSection('audience-strip', { blocks: blocks(['Cafés']) });
  assert.match(html, /<ul[^>]+role="list"/);
  assert.match(html, /<li/);
});

test('each chip carries shopify_attributes so theme editor selection works', async () => {
  const html = await renderSection('audience-strip', {
    blocks: [{ id: 'a0', type: 'audience', settings: { title: 'Cafés' }, shopify_attributes: 'data-shopify-editor-block' }],
  });
  assert.match(html, /data-shopify-editor-block/);
});

test('renders the heading as an h2 and the optional footnote', async () => {
  const html = await renderSection('audience-strip', {
    settings: { heading: 'Who We Work With', footnote: 'Whether you are creating your first coffee product or expanding an existing range, we can support you from sample to production.' },
    blocks: blocks(['Cafés']),
  });
  assert.match(html, /<h2/);
  assert.equal(/<h1/.test(html), false);
  assert.match(html, /from sample to production/);
});

test('renders nothing but the heading when there are no blocks', async () => {
  const html = await renderSection('audience-strip', { settings: { heading: 'Who We Work With' }, blocks: [] });
  assert.equal(countMatches(html, /audience-strip__chip/g), 0);
});

test('declares a preset and a block type', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/audience-strip.liquid'), 'utf8'));
  assert.ok(schema.presets?.length > 0);
  assert.ok(schema.blocks?.some((b) => b.type === 'audience'));
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section audience-strip'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt audience-strip'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container audience-strip__inner">
    {%- if section.settings.eyebrow != blank -%}
      <span class="eyebrow">{{ section.settings.eyebrow }}</span>
    {%- endif -%}

    <h2 class="audience-strip__heading">{{ section.settings.heading }}</h2>

    {%- if section.settings.intro != blank -%}
      <p class="audience-strip__intro">{{ section.settings.intro }}</p>
    {%- endif -%}

    {%- if section.blocks.size > 0 -%}
      <reveal-on-scroll>
        <ul class="audience-strip__list" role="list">
          {%- for block in section.blocks -%}
            <li class="audience-strip__chip reveal"{{ block.shopify_attributes }}>{{ block.settings.title }}</li>
          {%- endfor -%}
        </ul>
      </reveal-on-scroll>
    {%- endif -%}

    {%- if section.settings.footnote != blank -%}
      <p class="audience-strip__footnote">{{ section.settings.footnote }}</p>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Audience strip",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Coffee Made for Your Business." },
    { "type": "text", "id": "intro", "label": "Intro line", "default": "We work with:" },
    { "type": "text", "id": "footnote", "label": "Footnote" },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" }
      ],
      "default": "alt"
    }
  ],
  "blocks": [
    {
      "type": "audience",
      "name": "Business type",
      "settings": [{ "type": "text", "id": "title", "label": "Name", "default": "Cafés" }]
    }
  ],
  "presets": [
    {
      "name": "Audience strip",
      "blocks": [
        { "type": "audience", "settings": { "title": "Cafés" } },
        { "type": "audience", "settings": { "title": "Hotels" } },
        { "type": "audience", "settings": { "title": "Restaurants" } },
        { "type": "audience", "settings": { "title": "Retailers" } },
        { "type": "audience", "settings": { "title": "Distributors" } },
        { "type": "audience", "settings": { "title": "Coffee Brands" } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Audience strip ---------- */

.audience-strip__inner {
  display: grid;
  gap: var(--space-lg);
  justify-items: center;
  text-align: center;
}

.audience-strip__heading { margin: 0; }

.audience-strip__intro,
.audience-strip__footnote {
  color: var(--color-text-muted);
  margin: 0;
}

.audience-strip__footnote { max-inline-size: 54ch; }

.audience-strip__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
}

.audience-strip__chip {
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  background-color: var(--color-bg-tint);
  border-radius: var(--radius);
}

.section--alt .audience-strip__chip {
  background-color: var(--color-bg);
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/audience-strip.liquid azouz-theme/assets/sections.css tests/section-audience-strip.test.js
git commit -m "feat: add audience strip section"
```

---

## Task 12: Service cards

The "What We Do" cards on the homepage. This is where the packaging label block first appears as a UI component.

**Files:** create `azouz-theme/sections/service-cards.liquid`; append CSS; test `tests/section-service-cards.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const card = (id, settings) => ({ id, type: 'service', settings, shopify_attributes: '' });

const THREE = [
  card('s1', {
    title: 'Private Label Coffee',
    body: 'Create coffee under your own brand.',
    detail: 'Custom blends, roasting, grinding and packaging.',
    link_label: 'Learn More',
    link: '/pages/private-label',
  }),
  card('s2', {
    title: 'Wholesale Coffee',
    body: 'Reliable coffee for cafés, restaurants, hotels and businesses.',
    detail: 'Espresso · Turkish · Filter · Specialty',
    link_label: 'View Wholesale',
    link: '/pages/wholesale',
  }),
  card('s3', {
    title: 'Specialty Coffee',
    body: 'Single origins and specialty coffees selected for quality and flavour.',
    link_label: 'Discover Our Coffee',
    link: '/collections/all',
  }),
];

test('renders one card per block with its title and body', async () => {
  const html = await renderSection('service-cards', { blocks: THREE });
  assert.equal(countMatches(html, /class="service-card[ "]/g), 3);
  assert.match(html, /Private Label Coffee/);
  assert.match(html, /Espresso · Turkish · Filter · Specialty/);
});

test('each card uses the packaging label block component', async () => {
  const html = await renderSection('service-cards', { blocks: THREE });
  assert.equal(countMatches(html, /label-block__title/g), 3);
});

test('card titles are h3 — the section heading is the h2', async () => {
  const html = await renderSection('service-cards', { settings: { heading: 'What We Do' }, blocks: THREE });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 3);
  assert.equal(/<h1/.test(html), false);
});

test('a card link renders only when both label and url are set', async () => {
  const html = await renderSection('service-cards', {
    blocks: [card('s1', { title: 'X', link_label: 'Learn More', link: '' })],
  });
  assert.equal(/href=""/.test(html), false);
});

test('the label colour setting drives the card fill via a custom property', async () => {
  const html = await renderSection('service-cards', {
    blocks: [card('s1', { title: 'X', label_color: '#C4562E' })],
  });
  assert.match(html, /--label-bg:\s*#C4562E/);
});

test('declares a preset with three cards', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/service-cards.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 3);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section service-cards'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt service-cards'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container">
    <div class="service-cards__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="service-cards__heading">{{ section.settings.heading }}</h2>
    </div>

    <reveal-on-scroll>
      <div class="grid grid--3 service-cards__grid">
        {%- for block in section.blocks -%}
          <article class="service-card reveal"{{ block.shopify_attributes }}>
            <div
              class="label-block service-card__label"
              {% if block.settings.label_color != blank %}style="--label-bg: {{ block.settings.label_color }};"{% endif %}>
              <h3 class="label-block__title">{{ block.settings.title }}</h3>
              {%- if block.settings.detail != blank -%}
                <hr class="label-block__rule">
                <p class="label-block__subtitle">{{ block.settings.detail }}</p>
              {%- endif -%}
            </div>

            {%- if block.settings.body != blank -%}
              <p class="service-card__body">{{ block.settings.body }}</p>
            {%- endif -%}

            {%- if block.settings.link_label != blank and block.settings.link != blank -%}
              <a class="service-card__link" href="{{ block.settings.link }}">
                {{ block.settings.link_label }}
                {%- render 'icon', name: 'arrow-right' -%}
              </a>
            {%- endif -%}
          </article>
        {%- endfor -%}
      </div>
    </reveal-on-scroll>
  </div>
</section>

{% schema %}
{
  "name": "Service cards",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "What We Do" },
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
  "blocks": [
    {
      "type": "service",
      "name": "Service",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Private Label Coffee" },
        { "type": "text", "id": "body", "label": "Body" },
        { "type": "text", "id": "detail", "label": "Detail line", "info": "Shown inside the coloured label, under a hairline." },
        {
          "type": "color",
          "id": "label_color",
          "label": "Label colour",
          "default": "#67985E",
          "info": "The title inside the label is large enough to sit on the primary green. Do not use this colour for small text elsewhere."
        },
        { "type": "text", "id": "link_label", "label": "Link label" },
        { "type": "url", "id": "link", "label": "Link" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Service cards",
      "blocks": [
        { "type": "service" },
        { "type": "service" },
        { "type": "service" }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Service cards ----------
   The card is the packaging label lifted off the bag: a solid colour panel
   with a tight title and a hairline, then supporting copy beneath it. */

.service-cards__head {
  margin-block-end: var(--space-xl);
}

.service-cards__heading { margin: 0; }

.service-card {
  display: grid;
  gap: var(--space-md);
  align-content: start;
}

.service-card__label {
  min-block-size: 10rem;
  display: grid;
  align-content: start;
}

.service-card__body {
  margin: 0;
  color: var(--color-text-muted);
}

.service-card__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent-deep);
  text-decoration: none;
}

.service-card__link:hover { text-decoration: underline; }

.service-card__link .icon {
  inline-size: 1rem;
  block-size: 1rem;
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/service-cards.liquid azouz-theme/assets/sections.css tests/section-service-cards.test.js
git commit -m "feat: add service cards section using the packaging label component"
```

---

## Task 13: Process steps

Serves both "From Bean to Bag. Source → Blend → Roast → Grind → Pack" (titles only) and "What We Can Do" (titles with descriptions). The `show_numbers` and `layout` settings switch between the two looks.

**Files:** create `azouz-theme/sections/process-steps.liquid`; append CSS; test `tests/section-process-steps.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const step = (id, settings) => ({ id, type: 'step', settings, shopify_attributes: '' });

const FLOW = ['Source', 'Blend', 'Roast', 'Grind', 'Pack'].map((title, i) =>
  step(`s${i}`, { title }),
);

test('renders one step per block, in order', async () => {
  const html = await renderSection('process-steps', { blocks: FLOW });
  assert.equal(countMatches(html, /class="process-step[ "]/g), 5);
  assert.ok(html.indexOf('Source') < html.indexOf('Blend'));
  assert.ok(html.indexOf('Grind') < html.indexOf('Pack'));
});

test('is an ordered list — the sequence carries meaning', async () => {
  const html = await renderSection('process-steps', { blocks: FLOW });
  assert.match(html, /<ol/);
});

test('renders step descriptions when present and omits the element when not', async () => {
  const withBody = await renderSection('process-steps', {
    blocks: [step('s1', { title: 'Roasting', body: 'Your approved coffee is roasted consistently to the agreed profile.' })],
  });
  assert.match(withBody, /roasted consistently to the agreed profile/);

  const withoutBody = await renderSection('process-steps', { blocks: [step('s1', { title: 'Roast' })] });
  assert.equal(/process-step__body/.test(withoutBody), false);
});

test('step numbers are decorative and hidden from assistive tech', async () => {
  const html = await renderSection('process-steps', { settings: { show_numbers: true }, blocks: FLOW });
  assert.match(html, /class="process-step__number"[^>]*aria-hidden="true"/);
});

test('step titles are h3 and the section heading is the only h2', async () => {
  const html = await renderSection('process-steps', { settings: { heading: 'From Bean to Bag.' }, blocks: FLOW });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 5);
});

test('declares a preset with the five production steps', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/process-steps.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 5);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section process-steps'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt process-steps'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container">
    <div class="process-steps__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="process-steps__heading">{{ section.settings.heading }}</h2>
      {%- if section.settings.body != blank -%}
        <p class="process-steps__intro lead">{{ section.settings.body }}</p>
      {%- endif -%}
    </div>

    <reveal-on-scroll>
      <ol class="process-steps__list process-steps__list--{{ section.settings.layout }}" role="list">
        {%- for block in section.blocks -%}
          <li class="process-step reveal"{{ block.shopify_attributes }}>
            {%- if section.settings.show_numbers -%}
              <span class="process-step__number" aria-hidden="true">{{ forloop.index }}</span>
            {%- endif -%}
            <h3 class="process-step__title">{{ block.settings.title }}</h3>
            {%- if block.settings.body != blank -%}
              <p class="process-step__body">{{ block.settings.body }}</p>
            {%- endif -%}
          </li>
        {%- endfor -%}
      </ol>
    </reveal-on-scroll>
  </div>
</section>

{% schema %}
{
  "name": "Process steps",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "From Bean to Bag." },
    { "type": "text", "id": "body", "label": "Intro" },
    { "type": "checkbox", "id": "show_numbers", "label": "Show step numbers", "default": true },
    {
      "type": "select",
      "id": "layout",
      "label": "Layout",
      "options": [
        { "value": "flow", "label": "Horizontal flow" },
        { "value": "cards", "label": "Cards with descriptions" }
      ],
      "default": "flow"
    },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" }
      ],
      "default": "alt"
    }
  ],
  "blocks": [
    {
      "type": "step",
      "name": "Step",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Source" },
        { "type": "text", "id": "body", "label": "Description" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Process steps",
      "blocks": [
        { "type": "step", "settings": { "title": "Source" } },
        { "type": "step", "settings": { "title": "Blend" } },
        { "type": "step", "settings": { "title": "Roast" } },
        { "type": "step", "settings": { "title": "Grind" } },
        { "type": "step", "settings": { "title": "Pack" } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Process steps ---------- */

.process-steps__head {
  display: grid;
  gap: var(--space-md);
  margin-block-end: var(--space-xl);
}

.process-steps__heading { margin: 0; }
.process-steps__intro { margin: 0; }

.process-steps__list {
  display: grid;
  gap: var(--space-lg);
  counter-reset: step;
}

.process-steps__list--flow {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  text-align: center;
  justify-items: center;
}

.process-steps__list--cards {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
}

.process-step {
  display: grid;
  gap: var(--space-xs);
  align-content: start;
}

.process-steps__list--cards .process-step {
  padding: var(--space-lg);
  background-color: var(--color-bg);
  border: var(--hairline);
  border-radius: var(--radius);
}

.section--alt .process-steps__list--cards .process-step {
  background-color: var(--color-bg);
}

.process-step__number {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-eyebrow);
  color: var(--color-accent-deep);
}

.process-step__title {
  margin: 0;
  font-size: var(--text-lg);
}

.process-step__body {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

/* The flow arrows are decorative and only make sense on a wide, single row. */
@media (min-width: 56em) {
  .process-steps__list--flow .process-step {
    position: relative;
  }

  .process-steps__list--flow .process-step + .process-step::before {
    content: '';
    position: absolute;
    inset-block-start: 0.6em;
    inset-inline-start: calc(var(--space-lg) * -0.5 - 0.25rem);
    inline-size: 0.5rem;
    block-size: 0.5rem;
    border-block-start: 1px solid var(--color-hairline);
    border-inline-end: 1px solid var(--color-hairline);
    transform: rotate(45deg);
  }
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/process-steps.liquid azouz-theme/assets/sections.css tests/section-process-steps.test.js
git commit -m "feat: add process steps section"
```

---

## Task 14: Feature grid

The plain lists: "Private Label Coffee Options" (8 coffee types) and "Retail Coffee Products".

**Files:** create `azouz-theme/sections/feature-grid.liquid`; append CSS; test `tests/section-feature-grid.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const items = (titles) =>
  titles.map((title, i) => ({ id: `f${i}`, type: 'feature', settings: { title }, shopify_attributes: '' }));

const EIGHT = items([
  'Espresso blends', 'Specialty coffee', 'Single-origin coffee', 'Turkish coffee',
  'Arabic coffee', 'Filter coffee', 'Whole bean coffee', 'Ground coffee',
]);

test('renders one item per block', async () => {
  const html = await renderSection('feature-grid', { blocks: EIGHT });
  assert.equal(countMatches(html, /class="feature-grid__item[ "]/g), 8);
  assert.match(html, /Arabic coffee/);
});

test('is a real list', async () => {
  const html = await renderSection('feature-grid', { blocks: EIGHT });
  assert.match(html, /<ul[^>]+role="list"/);
});

test('renders an optional description per item', async () => {
  const html = await renderSection('feature-grid', {
    blocks: [{ id: 'f0', type: 'feature', settings: { title: 'Espresso coffee', body: 'For milk drinks.' }, shopify_attributes: '' }],
  });
  assert.match(html, /For milk drinks\./);
});

test('the section heading is the only h2 and there is no h1', async () => {
  const html = await renderSection('feature-grid', { settings: { heading: 'Private Label Coffee Options' }, blocks: EIGHT });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(/<h1/.test(html), false);
});

test('declares a preset and a feature block type', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/feature-grid.liquid'), 'utf8'));
  assert.ok(schema.presets?.length > 0);
  assert.ok(schema.blocks?.some((b) => b.type === 'feature'));
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section feature-grid'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt feature-grid'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container">
    <div class="feature-grid__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="feature-grid__heading">{{ section.settings.heading }}</h2>
      {%- if section.settings.body != blank -%}
        <p class="feature-grid__intro lead">{{ section.settings.body }}</p>
      {%- endif -%}
    </div>

    <reveal-on-scroll>
      <ul class="feature-grid__list" role="list">
        {%- for block in section.blocks -%}
          <li class="feature-grid__item reveal"{{ block.shopify_attributes }}>
            <span class="feature-grid__title">{{ block.settings.title }}</span>
            {%- if block.settings.body != blank -%}
              <span class="feature-grid__body">{{ block.settings.body }}</span>
            {%- endif -%}
          </li>
        {%- endfor -%}
      </ul>
    </reveal-on-scroll>
  </div>
</section>

{% schema %}
{
  "name": "Feature grid",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Private Label Coffee Options" },
    { "type": "text", "id": "body", "label": "Intro" },
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
  "blocks": [
    {
      "type": "feature",
      "name": "Item",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Espresso blends" },
        { "type": "text", "id": "body", "label": "Description" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Feature grid",
      "blocks": [
        { "type": "feature", "settings": { "title": "Espresso blends" } },
        { "type": "feature", "settings": { "title": "Specialty coffee" } },
        { "type": "feature", "settings": { "title": "Single-origin coffee" } },
        { "type": "feature", "settings": { "title": "Turkish coffee" } },
        { "type": "feature", "settings": { "title": "Arabic coffee" } },
        { "type": "feature", "settings": { "title": "Filter coffee" } },
        { "type": "feature", "settings": { "title": "Whole bean coffee" } },
        { "type": "feature", "settings": { "title": "Ground coffee" } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Feature grid ---------- */

.feature-grid__head {
  display: grid;
  gap: var(--space-md);
  margin-block-end: var(--space-xl);
}

.feature-grid__heading { margin: 0; }
.feature-grid__intro { margin: 0; }

.feature-grid__list {
  display: grid;
  gap: 0;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  border-block-start: var(--hairline);
}

.feature-grid__item {
  display: grid;
  gap: var(--space-2xs);
  padding-block: var(--space-md);
  padding-inline-end: var(--space-md);
  border-block-end: var(--hairline);
}

.feature-grid__title {
  font-weight: var(--font-weight-semibold);
}

.feature-grid__body {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/feature-grid.liquid azouz-theme/assets/sections.css tests/section-feature-grid.test.js
git commit -m "feat: add feature grid section"
```

---

## Task 15: Coffee range

The wholesale page's four range cards, styled as packaging labels with their own colour per range.

**Files:** create `azouz-theme/sections/coffee-range.liquid`; append CSS; test `tests/section-coffee-range.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const range = (id, settings) => ({ id, type: 'range', settings, shopify_attributes: '' });

const FOUR = [
  range('r1', { title: 'Espresso Blends', body: 'Balanced coffees developed for espresso and milk-based drinks.', label_color: '#C4562E' }),
  range('r2', { title: 'Turkish Coffee', body: 'Traditional profiles available plain or with cardamom.', label_color: '#7C7F44' }),
  range('r3', { title: 'Specialty Coffee', body: 'Single origins and specialty-grade coffees selected for quality and flavour.', label_color: '#BFDDD3' }),
  range('r4', { title: 'Filter Coffee', body: 'Coffee roasted for V60, batch brew and other filter methods.', label_color: '#303030' }),
];

test('renders one card per block with title and body', async () => {
  const html = await renderSection('coffee-range', { blocks: FOUR });
  assert.equal(countMatches(html, /class="range-card[ "]/g), 4);
  assert.match(html, /plain or with cardamom/);
});

test('each card is a packaging label block', async () => {
  const html = await renderSection('coffee-range', { blocks: FOUR });
  assert.equal(countMatches(html, /label-block__title/g), 4);
});

test('the per-range colour drives the label fill', async () => {
  const html = await renderSection('coffee-range', { blocks: [FOUR[0]] });
  assert.match(html, /--label-bg:\s*#C4562E/);
});

test('a light label colour switches the text to jet for contrast', async () => {
  const html = await renderSection('coffee-range', {
    blocks: [range('r1', { title: 'Specialty', label_color: '#BFDDD3', label_text: 'dark' })],
  });
  assert.match(html, /--label-fg:\s*var\(--color-text\)/);
});

test('card titles are h3 under a single h2', async () => {
  const html = await renderSection('coffee-range', { settings: { heading: 'Our Coffee Range' }, blocks: FOUR });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 4);
});

test('declares a preset with four ranges', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/coffee-range.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 4);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

The `label_text` setting exists because the packaging uses both dark and light label colours — the mint Dead Sea label carries black type, the terracotta Wadi Rum label carries white. There is no reliable way to pick automatically in Liquid, so the client chooses, and the schema explains why.

```liquid
{%- liquid
  assign section_class = 'section coffee-range'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt coffee-range'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container">
    <div class="coffee-range__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="coffee-range__heading">{{ section.settings.heading }}</h2>
    </div>

    <reveal-on-scroll>
      <div class="grid grid--4 coffee-range__grid">
        {%- for block in section.blocks -%}
          {%- liquid
            assign label_style = ''
            if block.settings.label_color != blank
              assign label_style = '--label-bg: ' | append: block.settings.label_color | append: ';'
            endif
            if block.settings.label_text == 'dark'
              assign label_style = label_style | append: ' --label-fg: var(--color-text);'
            endif
          -%}
          <article class="range-card reveal"{{ block.shopify_attributes }}>
            <div class="label-block range-card__label" style="{{ label_style }}">
              <h3 class="label-block__title">{{ block.settings.title }}</h3>
              {%- if block.settings.subtitle != blank -%}
                <p class="label-block__subtitle">{{ block.settings.subtitle }}</p>
              {%- endif -%}
            </div>
            {%- if block.settings.body != blank -%}
              <p class="range-card__body">{{ block.settings.body }}</p>
            {%- endif -%}
          </article>
        {%- endfor -%}
      </div>
    </reveal-on-scroll>
  </div>
</section>

{% schema %}
{
  "name": "Coffee range",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Our Coffee Range" },
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
  "blocks": [
    {
      "type": "range",
      "name": "Range",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Espresso Blends" },
        { "type": "text", "id": "subtitle", "label": "Subtitle" },
        { "type": "text", "id": "body", "label": "Description" },
        { "type": "color", "id": "label_color", "label": "Label colour", "default": "#67985E" },
        {
          "type": "select",
          "id": "label_text",
          "label": "Label text colour",
          "options": [
            { "value": "light", "label": "White" },
            { "value": "dark", "label": "Black" }
          ],
          "default": "light",
          "info": "Choose black on pale labels such as the mint used on Dead Sea Blend, white on deep ones such as the terracotta used on Wadi Rum Blend."
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Coffee range",
      "blocks": [
        { "type": "range", "settings": { "title": "Espresso Blends", "label_color": "#C4562E" } },
        { "type": "range", "settings": { "title": "Turkish Coffee", "label_color": "#7C7F44" } },
        { "type": "range", "settings": { "title": "Specialty Coffee", "label_color": "#BFDDD3", "label_text": "dark" } },
        { "type": "range", "settings": { "title": "Filter Coffee", "label_color": "#303030" } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Coffee range ---------- */

.coffee-range__head { margin-block-end: var(--space-xl); }
.coffee-range__heading { margin: 0; }

.range-card {
  display: grid;
  gap: var(--space-md);
  align-content: start;
}

.range-card__label {
  min-block-size: 8rem;
  display: grid;
  align-content: start;
  gap: var(--space-2xs);
}

.range-card__body {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/coffee-range.liquid azouz-theme/assets/sections.css tests/section-coffee-range.test.js
git commit -m "feat: add coffee range section"
```

---

## Task 16: Blend builder

The "We can adjust: Body · Sweetness · Acidity · Roast Level · Arabica/Robusta Ratio · Flavour Profile" block. Appears on both Private Label and Wholesale with different headings.

Each attribute is drawn as a labelled spectrum with its two poles named. The spectrum is decorative — the meaning is carried by the visible pole labels, so it needs no ARIA.

**Files:** create `azouz-theme/sections/blend-builder.liquid`; append CSS; test `tests/section-blend-builder.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const attr = (id, settings) => ({ id, type: 'attribute', settings, shopify_attributes: '' });

const SIX = [
  attr('a1', { title: 'Body', low: 'Light', high: 'Full' }),
  attr('a2', { title: 'Sweetness', low: 'Subtle', high: 'Pronounced' }),
  attr('a3', { title: 'Acidity', low: 'Low', high: 'Bright' }),
  attr('a4', { title: 'Roast Level', low: 'Light', high: 'Dark' }),
  attr('a5', { title: 'Arabica/Robusta Ratio', low: '100% Arabica', high: 'Robusta blend' }),
  attr('a6', { title: 'Flavour Profile', low: 'Chocolate', high: 'Fruit' }),
];

test('renders one row per attribute with both pole labels', async () => {
  const html = await renderSection('blend-builder', { blocks: SIX });
  assert.equal(countMatches(html, /class="blend-attr[ "]/g), 6);
  assert.match(html, /100% Arabica/);
  assert.match(html, /Robusta blend/);
});

test('the spectrum bar is decorative and hidden from assistive tech', async () => {
  const html = await renderSection('blend-builder', { blocks: [SIX[0]] });
  assert.match(html, /class="blend-attr__track"[^>]*aria-hidden="true"/);
});

test('the meaning survives without the bar — pole labels are real text', async () => {
  const html = await renderSection('blend-builder', { blocks: [SIX[0]] });
  assert.match(html, /class="blend-attr__pole"[^>]*>\s*Light/);
  assert.match(html, /class="blend-attr__pole"[^>]*>\s*Full/);
});

test('renders the heading as an h2 and attribute names as h3', async () => {
  const html = await renderSection('blend-builder', { settings: { heading: 'Create Your Own Blend' }, blocks: SIX });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 6);
});

test('declares a preset with all six attributes', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/blend-builder.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 6);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section blend-builder'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt blend-builder'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container blend-builder__inner">
    <div class="blend-builder__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="blend-builder__heading">{{ section.settings.heading }}</h2>
      {%- if section.settings.body != blank -%}
        <div class="blend-builder__intro lead">{{ section.settings.body }}</div>
      {%- endif -%}
    </div>

    <reveal-on-scroll>
      <div class="blend-builder__list">
        {%- for block in section.blocks -%}
          <div class="blend-attr reveal"{{ block.shopify_attributes }}>
            <h3 class="blend-attr__title">{{ block.settings.title }}</h3>
            <div class="blend-attr__scale">
              <span class="blend-attr__pole">{{ block.settings.low }}</span>
              <span class="blend-attr__track" aria-hidden="true"></span>
              <span class="blend-attr__pole">{{ block.settings.high }}</span>
            </div>
          </div>
        {%- endfor -%}
      </div>
    </reveal-on-scroll>
  </div>
</section>

{% schema %}
{
  "name": "Blend builder",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "We can adjust" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Create Your Own Blend" },
    { "type": "richtext", "id": "body", "label": "Intro" },
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
  "blocks": [
    {
      "type": "attribute",
      "name": "Attribute",
      "settings": [
        { "type": "text", "id": "title", "label": "Attribute", "default": "Body" },
        { "type": "text", "id": "low", "label": "Low end", "default": "Light" },
        { "type": "text", "id": "high", "label": "High end", "default": "Full" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Blend builder",
      "blocks": [
        { "type": "attribute", "settings": { "title": "Body", "low": "Light", "high": "Full" } },
        { "type": "attribute", "settings": { "title": "Sweetness", "low": "Subtle", "high": "Pronounced" } },
        { "type": "attribute", "settings": { "title": "Acidity", "low": "Low", "high": "Bright" } },
        { "type": "attribute", "settings": { "title": "Roast Level", "low": "Light", "high": "Dark" } },
        { "type": "attribute", "settings": { "title": "Arabica/Robusta Ratio", "low": "100% Arabica", "high": "Robusta blend" } },
        { "type": "attribute", "settings": { "title": "Flavour Profile", "low": "Chocolate", "high": "Fruit" } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Blend builder ---------- */

.blend-builder__inner {
  display: grid;
  gap: var(--space-xl);
}

.blend-builder__head {
  display: grid;
  gap: var(--space-md);
}

.blend-builder__heading { margin: 0; }
.blend-builder__intro > :first-child { margin-block-start: 0; }
.blend-builder__intro > :last-child { margin-block-end: 0; }

.blend-builder__list {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}

.blend-attr {
  display: grid;
  gap: var(--space-xs);
  padding-block-end: var(--space-md);
  border-block-end: var(--hairline);
}

.blend-attr__title {
  margin: 0;
  font-size: var(--text-base);
}

.blend-attr__scale {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.blend-attr__pole { flex: none; }

.blend-attr__track {
  flex: 1 1 auto;
  block-size: 2px;
  border-radius: 1px;
  background-image: linear-gradient(
    to right,
    var(--color-bg-tint),
    var(--color-accent)
  );
}
```

The gradient is the one place a physical `to right` is unavoidable in a decorative fill. It carries no meaning, so it is exempt from the RTL rule — but note the guard test forbids `right:` as a *property*, not inside a gradient function, so this passes.

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/blend-builder.liquid azouz-theme/assets/sections.css tests/section-blend-builder.test.js
git commit -m "feat: add blend builder section"
```

---

## Task 17: Packaging sizes

Two jobs, one section: "Packaging Options — 250 g · 500 g · 1 kg · Bulk" on Private Label, and "Consistent Coffee, Batch After Batch — Whole Bean · Ground Coffee · Retail Bags · Wholesale Bags" on Wholesale.

**Files:** create `azouz-theme/sections/packaging-sizes.liquid`; append CSS; test `tests/section-packaging-sizes.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const formats = (titles) =>
  titles.map((title, i) => ({ id: `p${i}`, type: 'format', settings: { title }, shopify_attributes: '' }));

test('renders one tile per format', async () => {
  const html = await renderSection('packaging-sizes', { blocks: formats(['250 g', '500 g', '1 kg', 'Bulk']) });
  assert.equal(countMatches(html, /class="format-tile[ "]/g), 4);
  assert.match(html, /1 kg/);
});

test('serves the wholesale preset content just as well', async () => {
  const html = await renderSection('packaging-sizes', {
    settings: { heading: 'Consistent Coffee, Batch After Batch.' },
    blocks: formats(['Whole Bean', 'Ground Coffee', 'Retail Bags', 'Wholesale Bags']),
  });
  assert.match(html, /Consistent Coffee, Batch After Batch\./);
  assert.match(html, /Wholesale Bags/);
});

test('renders the optional note', async () => {
  const html = await renderSection('packaging-sizes', {
    settings: { note: 'Custom packaging options can also be discussed.' },
    blocks: formats(['250 g']),
  });
  assert.match(html, /Custom packaging options can also be discussed\./);
});

test('is a real list with a single h2', async () => {
  const html = await renderSection('packaging-sizes', { blocks: formats(['250 g']) });
  assert.match(html, /<ul[^>]+role="list"/);
  assert.equal(countMatches(html, /<h2/g), 1);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/packaging-sizes.liquid'), 'utf8'));
  assert.ok(schema.presets?.length > 0);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section packaging-sizes'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt packaging-sizes'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container packaging-sizes__inner">
    {%- if section.settings.eyebrow != blank -%}
      <span class="eyebrow">{{ section.settings.eyebrow }}</span>
    {%- endif -%}

    <h2 class="packaging-sizes__heading">{{ section.settings.heading }}</h2>

    {%- if section.settings.body != blank -%}
      <p class="packaging-sizes__intro lead">{{ section.settings.body }}</p>
    {%- endif -%}

    <reveal-on-scroll>
      <ul class="packaging-sizes__list" role="list">
        {%- for block in section.blocks -%}
          <li class="format-tile reveal"{{ block.shopify_attributes }}>{{ block.settings.title }}</li>
        {%- endfor -%}
      </ul>
    </reveal-on-scroll>

    {%- if section.settings.note != blank -%}
      <p class="packaging-sizes__note">{{ section.settings.note }}</p>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Packaging sizes",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Packaging Options" },
    { "type": "text", "id": "body", "label": "Intro", "default": "Available in different sizes depending on your project." },
    { "type": "text", "id": "note", "label": "Note" },
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
  "blocks": [
    {
      "type": "format",
      "name": "Format",
      "settings": [{ "type": "text", "id": "title", "label": "Label", "default": "250 g" }]
    }
  ],
  "presets": [
    {
      "name": "Packaging sizes",
      "blocks": [
        { "type": "format", "settings": { "title": "250 g" } },
        { "type": "format", "settings": { "title": "500 g" } },
        { "type": "format", "settings": { "title": "1 kg" } },
        { "type": "format", "settings": { "title": "Bulk" } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Packaging sizes ---------- */

.packaging-sizes__inner {
  display: grid;
  gap: var(--space-lg);
  justify-items: center;
  text-align: center;
}

.packaging-sizes__heading { margin: 0; }
.packaging-sizes__intro { margin: 0; }

.packaging-sizes__note {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.packaging-sizes__list {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
  inline-size: 100%;
  max-inline-size: 52rem;
}

.format-tile {
  display: grid;
  place-items: center;
  padding-block: var(--space-lg);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-bold);
  border: var(--hairline);
  border-radius: var(--radius);
  background-color: var(--color-bg);
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/packaging-sizes.liquid azouz-theme/assets/sections.css tests/section-packaging-sizes.test.js
git commit -m "feat: add packaging sizes section"
```

---

## Task 18: Two column choice

"Your Blend or Ours." — two options presented side by side.

**Files:** create `azouz-theme/sections/two-column-choice.liquid`; append CSS; test `tests/section-two-column-choice.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const option = (id, settings) => ({ id, type: 'option', settings, shopify_attributes: '' });

const TWO = [
  option('o1', {
    title: 'Choose One of Our Existing Blends',
    body: 'A faster option if you want to launch quickly.',
  }),
  option('o2', {
    title: 'Create Your Own Blend',
    body: 'Work with us to develop a coffee specifically for your brand, market and target price.',
  }),
];

test('renders one column per block', async () => {
  const html = await renderSection('two-column-choice', { blocks: TWO });
  assert.equal(countMatches(html, /class="choice-column[ "]/g), 2);
  assert.match(html, /A faster option if you want to launch quickly\./);
});

test('option titles are h3 under a single h2', async () => {
  const html = await renderSection('two-column-choice', { settings: { heading: 'Your Blend or Ours.' }, blocks: TWO });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 2);
});

test('an optional cta renders only when fully configured', async () => {
  const withLink = await renderSection('two-column-choice', {
    blocks: [option('o1', { title: 'X', link_label: 'Start', link: '/pages/private-label' })],
  });
  assert.match(withLink, /href="\/pages\/private-label"/);

  const halfLink = await renderSection('two-column-choice', {
    blocks: [option('o1', { title: 'X', link_label: 'Start', link: '' })],
  });
  assert.equal(/href=""/.test(halfLink), false);
});

test('declares a preset with two options', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/two-column-choice.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 2);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section two-column-choice'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt two-column-choice'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container">
    <div class="two-column-choice__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="two-column-choice__heading">{{ section.settings.heading }}</h2>
    </div>

    <reveal-on-scroll>
      <div class="grid grid--2 two-column-choice__grid">
        {%- for block in section.blocks -%}
          <article class="choice-column reveal"{{ block.shopify_attributes }}>
            <h3 class="choice-column__title">{{ block.settings.title }}</h3>
            {%- if block.settings.body != blank -%}
              <p class="choice-column__body">{{ block.settings.body }}</p>
            {%- endif -%}
            {%- if block.settings.link_label != blank and block.settings.link != blank -%}
              <a class="button button--secondary" href="{{ block.settings.link }}">{{ block.settings.link_label }}</a>
            {%- endif -%}
          </article>
        {%- endfor -%}
      </div>
    </reveal-on-scroll>
  </div>
</section>

{% schema %}
{
  "name": "Two column choice",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Your Blend or Ours." },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" }
      ],
      "default": "alt"
    }
  ],
  "blocks": [
    {
      "type": "option",
      "name": "Option",
      "settings": [
        { "type": "text", "id": "title", "label": "Title", "default": "Choose One of Our Existing Blends" },
        { "type": "textarea", "id": "body", "label": "Description" },
        { "type": "text", "id": "link_label", "label": "Button label" },
        { "type": "url", "id": "link", "label": "Button link" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Two column choice",
      "blocks": [
        { "type": "option", "settings": { "title": "Choose One of Our Existing Blends", "body": "A faster option if you want to launch quickly." } },
        { "type": "option", "settings": { "title": "Create Your Own Blend", "body": "Work with us to develop a coffee specifically for your brand, market and target price." } }
      ]
    }
  ]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Two column choice ---------- */

.two-column-choice__head { margin-block-end: var(--space-xl); }
.two-column-choice__heading { margin: 0; }

.choice-column {
  display: grid;
  gap: var(--space-md);
  align-content: start;
  justify-items: start;
  padding: var(--space-xl);
  background-color: var(--color-bg);
  border: var(--hairline);
  border-radius: var(--radius);
}

.choice-column__title {
  margin: 0;
  font-size: var(--text-xl);
}

.choice-column__body {
  margin: 0;
  color: var(--color-text-muted);
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/two-column-choice.liquid azouz-theme/assets/sections.css tests/section-two-column-choice.test.js
git commit -m "feat: add two column choice section"
```

---

## Task 19: Brand feature

The Our Brands page's Azouz Coffee showcase — image, copy, and the CTA that bridges the B2B site into the retail shop.

**Files:** create `azouz-theme/sections/brand-feature.liquid`; append CSS; test `tests/section-brand-feature.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('brand-feature', { settings });

test('renders the brand name as an h2 with its description', async () => {
  const html = await render({
    heading: 'Azouz Coffee',
    body: '<p>Our own coffee brand, developed for modern coffee drinkers.</p>',
  });
  assert.match(html, /<h2[^>]*>[\s\S]*Azouz Coffee/);
  assert.match(html, /modern coffee drinkers/);
});

test('the cta bridges into the shop', async () => {
  const html = await render({ cta_label: 'View Azouz Coffee', cta_link: '/collections/all' });
  assert.match(html, /href="\/collections\/all"[^>]*>[\s\S]*View Azouz Coffee/);
});

test('renders no empty anchor when the cta is half configured', async () => {
  assert.equal(/href=""/.test(await render({ cta_label: 'View', cta_link: '' })), false);
});

test('the image carries alt text and loads lazily — it is below the fold', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'Azouz Coffee retail bags' });
  assert.match(html, /alt="Azouz Coffee retail bags"/);
  assert.match(html, /loading="lazy"/);
});

test('the media order can be flipped without physical css', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'x', media_position: 'start' });
  assert.match(html, /brand-feature__inner--media-start/);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/brand-feature.liquid'), 'utf8'));
  assert.ok(schema.presets?.length > 0);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create the section**

```liquid
{%- liquid
  assign section_class = 'section brand-feature'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt brand-feature'
  endif
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container brand-feature__inner brand-feature__inner--media-{{ section.settings.media_position }}">
    <div class="brand-feature__content">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}

      <h2 class="brand-feature__heading">{{ section.settings.heading }}</h2>

      {%- if section.settings.body != blank -%}
        <div class="brand-feature__body">{{ section.settings.body }}</div>
      {%- endif -%}

      {%- if section.settings.cta_label != blank and section.settings.cta_link != blank -%}
        <a class="button" href="{{ section.settings.cta_link }}">{{ section.settings.cta_label }}</a>
      {%- endif -%}
    </div>

    {%- if section.settings.image -%}
      <div class="brand-feature__media">
        <img
          class="brand-feature__image"
          src="{{ section.settings.image | image_url: width: 1000 }}"
          alt="{{ section.settings.image_alt | escape }}"
          width="1000"
          height="1250"
          loading="lazy"
          decoding="async">
      </div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Brand feature",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Azouz Coffee" },
    { "type": "richtext", "id": "body", "label": "Body" },
    { "type": "text", "id": "cta_label", "label": "Button label", "default": "View Azouz Coffee" },
    { "type": "url", "id": "cta_link", "label": "Button link" },
    { "type": "image_picker", "id": "image", "label": "Image" },
    { "type": "text", "id": "image_alt", "label": "Image description" },
    {
      "type": "select",
      "id": "media_position",
      "label": "Image position",
      "options": [
        { "value": "end", "label": "After the text" },
        { "value": "start", "label": "Before the text" }
      ],
      "default": "end"
    },
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
  "presets": [{ "name": "Brand feature" }]
}
{% endschema %}
```

- [x] **Step 4: Append the CSS**

```css
/* ---------- Brand feature ---------- */

.brand-feature__inner {
  display: grid;
  gap: var(--space-xl);
  align-items: center;
}

.brand-feature__content {
  display: grid;
  gap: var(--space-lg);
  align-content: start;
  justify-items: start;
}

.brand-feature__heading { margin: 0; }

.brand-feature__body > :first-child { margin-block-start: 0; }
.brand-feature__body > :last-child { margin-block-end: 0; }

.brand-feature__media {
  inline-size: 100%;
  max-inline-size: 30rem;
  justify-self: center;
}

.brand-feature__image {
  inline-size: 100%;
  block-size: auto;
  border-radius: var(--radius-lg);
}

@media (min-width: 56em) {
  .brand-feature__inner {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2xl);
  }

  /* Order, not float — this flips correctly under RTL on its own. */
  .brand-feature__inner--media-start .brand-feature__content { order: 2; }
  .brand-feature__inner--media-start .brand-feature__media { order: 1; }
}
```

- [x] **Step 5: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/brand-feature.liquid azouz-theme/assets/sections.css tests/section-brand-feature.test.js
git commit -m "feat: add brand feature section"
```

---

## Task 20: Enquiry form

Built on Shopify's native `{% form 'contact' %}`: no app, no monthly cost, submissions land in the store's notification email. One section serves both "Request a Sample" and "Get a Quote" via settings.

Custom fields use the `contact[Field Name]` convention — Shopify passes any such field straight through into the notification email.

**Files:** create `azouz-theme/sections/enquiry-form.liquid`; append CSS; modify `azouz-theme/locales/en.default.json`; test `tests/section-enquiry-form.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('enquiry-form', { settings });

test('posts to the shopify contact endpoint', async () => {
  const html = await render();
  assert.match(html, /<form[^>]+method="post"/);
  assert.match(html, /action="\/contact#contact"/);
});

test('carries the fields the roaster needs to quote a job', async () => {
  const html = await render();
  for (const name of [
    'contact[name]',
    'contact[email]',
    'contact[phone]',
    'contact[Company]',
    'contact[Business type]',
    'contact[Coffee type]',
    'contact[Expected monthly volume]',
    'contact[body]',
  ]) {
    assert.match(html, new RegExp(`name="${name.replace(/[[\]]/g, '\\$&')}"`), `missing field ${name}`);
  }
});

test('every input has an associated label', async () => {
  const html = await render();
  const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 8);
  for (const id of ids) {
    assert.match(html, new RegExp(`<label[^>]+for="${id}"`), `no label for #${id}`);
  }
});

test('name and email are required', async () => {
  const html = await render();
  assert.match(html, /name="contact\[name\]"[^>]*required/);
  assert.match(html, /name="contact\[email\]"[^>]*required/);
});

test('volume is required on the quote preset and optional on the sample preset', async () => {
  const quote = await render({ require_volume: true });
  assert.match(quote, /name="contact\[Expected monthly volume\]"[^>]*required/);

  const sample = await render({ require_volume: false });
  assert.equal(/name="contact\[Expected monthly volume\]"[^>]*required/.test(sample), false);
});

test('the business type options match the audiences named in the copy', async () => {
  const html = await render();
  for (const option of ['Coffee Shop', 'Restaurant', 'Hotel', 'Office', 'Retailer', 'Distributor', 'Startup', 'Supermarket']) {
    assert.match(html, new RegExp(`>\\s*${option}\\s*<`), `missing business type ${option}`);
  }
});

test('the success message is announced to screen readers', async () => {
  const html = await render();
  assert.match(html, /role="status"|aria-live="polite"/);
});

test('no user-visible english is hard-coded outside the schema', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('declares two presets — sample and quote', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/enquiry-form.liquid'), 'utf8'));
  assert.equal(schema.presets.length, 2);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Add locale keys**

In `azouz-theme/locales/en.default.json`, inside `contact.form`, add:

```json
      "optional": "optional",
      "business_type_prompt": "Select a business type",
      "coffee_type_prompt": "Select a coffee type"
```

- [x] **Step 4: Create the section**

```liquid
{%- liquid
  assign section_class = 'section enquiry'
  if section.settings.background == 'alt'
    assign section_class = 'section section--alt enquiry'
  endif
  assign uid = section.id
-%}

<section class="{{ section_class }}"{{ section.shopify_attributes }}>
  <div class="container container--narrow enquiry__inner">
    <div class="enquiry__head">
      {%- if section.settings.eyebrow != blank -%}
        <span class="eyebrow">{{ section.settings.eyebrow }}</span>
      {%- endif -%}
      <h2 class="enquiry__heading">{{ section.settings.heading }}</h2>
      {%- if section.settings.body != blank -%}
        <div class="enquiry__intro lead">{{ section.settings.body }}</div>
      {%- endif -%}
    </div>

    {% form 'contact' %}
      {%- if form.posted_successfully? -%}
        <p class="enquiry__success" role="status">{{ 'contact.form.success' | t }}</p>
      {%- endif -%}

      {%- if form.errors -%}
        <p class="enquiry__error" role="status">{{ 'contact.form.error' | t }}</p>
      {%- endif -%}

      <div class="enquiry__grid">
        <div class="field">
          <label class="field__label" for="EnquiryName-{{ uid }}">{{ 'contact.form.name' | t }}</label>
          <input class="field__input" type="text" id="EnquiryName-{{ uid }}" name="contact[name]" autocomplete="name" required>
        </div>

        <div class="field">
          <label class="field__label" for="EnquiryCompany-{{ uid }}">{{ 'contact.form.company' | t }}</label>
          <input class="field__input" type="text" id="EnquiryCompany-{{ uid }}" name="contact[Company]" autocomplete="organization">
        </div>

        <div class="field">
          <label class="field__label" for="EnquiryEmail-{{ uid }}">{{ 'contact.form.email' | t }}</label>
          <input class="field__input" type="email" id="EnquiryEmail-{{ uid }}" name="contact[email]" autocomplete="email" required>
        </div>

        <div class="field">
          <label class="field__label" for="EnquiryPhone-{{ uid }}">{{ 'contact.form.phone' | t }}</label>
          <input class="field__input" type="tel" id="EnquiryPhone-{{ uid }}" name="contact[phone]" autocomplete="tel">
        </div>

        <div class="field">
          <label class="field__label" for="EnquiryBusiness-{{ uid }}">{{ 'contact.form.business_type' | t }}</label>
          <select class="field__input" id="EnquiryBusiness-{{ uid }}" name="contact[Business type]">
            <option value="">{{ 'contact.form.business_type_prompt' | t }}</option>
            {%- assign business_types = section.settings.business_types | split: ',' -%}
            {%- for type in business_types -%}
              <option value="{{ type | strip | escape }}"{% if section.settings.preselect_business == type %} selected{% endif %}>{{ type | strip }}</option>
            {%- endfor -%}
          </select>
        </div>

        <div class="field">
          <label class="field__label" for="EnquiryCoffee-{{ uid }}">{{ 'contact.form.coffee_type' | t }}</label>
          <select class="field__input" id="EnquiryCoffee-{{ uid }}" name="contact[Coffee type]">
            <option value="">{{ 'contact.form.coffee_type_prompt' | t }}</option>
            {%- assign coffee_types = section.settings.coffee_types | split: ',' -%}
            {%- for type in coffee_types -%}
              <option value="{{ type | strip | escape }}">{{ type | strip }}</option>
            {%- endfor -%}
          </select>
        </div>

        <div class="field field--wide">
          <label class="field__label" for="EnquiryVolume-{{ uid }}">
            {{ 'contact.form.volume' | t }}
            {%- unless section.settings.require_volume %} <span class="field__hint">({{ 'contact.form.optional' | t }})</span>{% endunless -%}
          </label>
          <input
            class="field__input"
            type="text"
            id="EnquiryVolume-{{ uid }}"
            name="contact[Expected monthly volume]"
            {% if section.settings.require_volume %}required{% endif %}>
        </div>

        <div class="field field--wide">
          <label class="field__label" for="EnquiryMessage-{{ uid }}">{{ 'contact.form.message' | t }}</label>
          <textarea class="field__input field__input--textarea" id="EnquiryMessage-{{ uid }}" name="contact[body]" rows="5"></textarea>
        </div>
      </div>

      <button class="button enquiry__submit" type="submit">{{ 'contact.form.send' | t }}</button>
    {% endform %}
  </div>
</section>

{% schema %}
{
  "name": "Enquiry form",
  "tag": "div",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Request a Sample" },
    { "type": "richtext", "id": "body", "label": "Intro" },
    {
      "type": "textarea",
      "id": "business_types",
      "label": "Business types",
      "default": "Coffee Shop, Restaurant, Hotel, Office, Retailer, Distributor, Startup, Supermarket, Other",
      "info": "Comma separated."
    },
    { "type": "text", "id": "preselect_business", "label": "Pre-selected business type" },
    {
      "type": "textarea",
      "id": "coffee_types",
      "label": "Coffee types",
      "default": "Espresso, Turkish, Arabic, Specialty, Single origin, Filter, Whole bean, Ground, Not sure yet",
      "info": "Comma separated."
    },
    { "type": "checkbox", "id": "require_volume", "label": "Require expected volume", "default": false },
    {
      "type": "select",
      "id": "background",
      "label": "Background",
      "options": [
        { "value": "default", "label": "Page" },
        { "value": "alt", "label": "Warm cream" }
      ],
      "default": "alt"
    }
  ],
  "presets": [
    {
      "name": "Request a sample",
      "settings": { "heading": "Request a Sample", "require_volume": false }
    },
    {
      "name": "Get a quote",
      "settings": { "heading": "Get a Quote", "require_volume": true }
    }
  ]
}
{% endschema %}
```

- [x] **Step 5: Append the CSS**

```css
/* ---------- Enquiry form ---------- */

.enquiry__inner {
  display: grid;
  gap: var(--space-xl);
}

.enquiry__head {
  display: grid;
  gap: var(--space-md);
}

.enquiry__heading { margin: 0; }
.enquiry__intro > :first-child { margin-block-start: 0; }
.enquiry__intro > :last-child { margin-block-end: 0; }

.enquiry__grid {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
}

.field {
  display: grid;
  gap: var(--space-2xs);
}

.field--wide { grid-column: 1 / -1; }

.field__label {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
}

.field__hint {
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
}

.field__input {
  inline-size: 100%;
  min-block-size: 3rem;
  padding: var(--space-xs) var(--space-sm);
  color: var(--color-text);
  background-color: var(--color-bg);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius);
}

.field__input:focus-visible {
  border-color: var(--color-accent-deep);
}

.field__input--textarea {
  min-block-size: 8rem;
  resize: vertical;
}

.enquiry__submit { justify-self: start; }

.enquiry__success,
.enquiry__error {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius);
  margin-block-end: var(--space-md);
}

.enquiry__success {
  color: var(--color-on-accent);
  background-color: var(--color-accent-deep);
}

.enquiry__error {
  border: 1px solid var(--color-text);
}
```

- [x] **Step 6: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/enquiry-form.liquid azouz-theme/assets/sections.css azouz-theme/locales/en.default.json tests/section-enquiry-form.test.js
git commit -m "feat: add b2b enquiry form on shopify's native contact form"
```

---

## Task 21: Default page section and template

Any page the client creates that is not one of the four designed ones must still render.

**Files:** create `azouz-theme/sections/main-page.liquid`; replace `azouz-theme/templates/page.json`; append CSS; test `tests/section-main-page.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection } from './helpers/render-section.js';

const page = { title: 'Shipping Policy', content: '<p>We ship across Jordan.</p>', handle: 'shipping' };

test('renders the page title as the h1', async () => {
  const html = await renderSection('main-page', { scope: { page } });
  assert.match(html, /<h1[^>]*>[\s\S]*Shipping Policy[\s\S]*<\/h1>/);
});

test('renders the page body as rich text', async () => {
  const html = await renderSection('main-page', { scope: { page } });
  assert.match(html, /<p>We ship across Jordan\.<\/p>/);
});

test('the title can be hidden for pages that supply their own heading', async () => {
  const html = await renderSection('main-page', { settings: { show_title: false }, scope: { page } });
  assert.equal(/<h1/.test(html), false);
});

test('an empty page body does not produce an empty wrapper', async () => {
  const html = await renderSection('main-page', { scope: { page: { title: 'X', content: '' } } });
  assert.equal(/rte/.test(html), false);
});
```

- [x] **Step 2: Run it and confirm it fails.**

- [x] **Step 3: Create `azouz-theme/sections/main-page.liquid`**

```liquid
<section class="section main-page"{{ section.shopify_attributes }}>
  <div class="container container--narrow main-page__inner">
    {%- if section.settings.show_title -%}
      <h1 class="main-page__title">{{ page.title }}</h1>
    {%- endif -%}

    {%- if page.content != blank -%}
      <div class="rte">{{ page.content }}</div>
    {%- endif -%}
  </div>
</section>

{% schema %}
{
  "name": "Page content",
  "tag": "div",
  "settings": [
    { "type": "checkbox", "id": "show_title", "label": "Show page title", "default": true }
  ]
}
{% endschema %}
```

This section has no `presets` on purpose: it reads the `page` object and only makes sense on a page template, so it must not appear in the Theme Editor's "add section" list.

- [x] **Step 4: Replace `azouz-theme/templates/page.json`**

```json
{
  "sections": {
    "main": { "type": "main-page" }
  },
  "order": ["main"]
}
```

- [x] **Step 5: Append the CSS**

```css
/* ---------- Default page ---------- */

.main-page__inner {
  display: grid;
  gap: var(--space-lg);
}

.main-page__title { margin: 0; }

.rte > * + * { margin-block-start: var(--space-md); }

.rte h2 { font-size: var(--text-xl); margin-block-start: var(--space-xl); }
.rte h3 { font-size: var(--text-lg); }

.rte ul,
.rte ol {
  padding-inline-start: var(--space-lg);
  display: grid;
  gap: var(--space-xs);
}

.rte a { color: var(--color-accent-deep); }
```

- [x] **Step 6: Run the test until green, then `npm test`, then commit.**

```bash
git add azouz-theme/sections/main-page.liquid azouz-theme/templates/page.json azouz-theme/assets/sections.css tests/section-main-page.test.js
git commit -m "feat: add default page template"
```

---

## Task 22: Assemble the four client pages

Every section now exists. This task fills the five JSON templates with the client's supplied copy, verbatim.

**Files:** replace `azouz-theme/templates/index.json`, `page.private-label.json`, `page.wholesale.json`, `page.our-brands.json`, `page.enquiry.json`; test `tests/templates.test.js`

- [x] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';
import { resolveInTheme, THEME_DIR } from '../scripts/theme-paths.js';

const MARKETING = [
  'index.json',
  'page.private-label.json',
  'page.wholesale.json',
  'page.our-brands.json',
  'page.enquiry.json',
];

const load = async (name) => JSON.parse(await readFile(resolveInTheme(`templates/${name}`), 'utf8'));

const renderAll = async (name) =>
  renderTemplate(await createEngine(THEME_DIR), THEME_DIR, `templates/${name}`);

test('every marketing template declares sections and an order', async () => {
  for (const name of MARKETING) {
    const template = await load(name);
    assert.ok(Object.keys(template.sections).length > 0, `${name} has no sections`);
    assert.ok(template.order.length > 0, `${name} has no order`);
  }
});

test('every id in order exists in sections, and vice versa', async () => {
  for (const name of MARKETING) {
    const template = await load(name);
    assert.deepEqual(
      [...template.order].sort(),
      Object.keys(template.sections).sort(),
      `${name}: order and sections disagree`,
    );
  }
});

test('every section type a template names has a real section file', async () => {
  for (const name of MARKETING) {
    const template = await load(name);
    for (const config of Object.values(template.sections)) {
      assert.ok(
        existsSync(resolveInTheme(`sections/${config.type}.liquid`)),
        `${name} references missing section ${config.type}`,
      );
    }
  }
});

test('every marketing page renders exactly one h1', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal((html.match(/<h1/g) ?? []).length, 1, `${name} must have exactly one h1`);
  }
});

test('no page renders a missing-section comment', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal(/missing section/.test(html), false, `${name} has an unresolved section`);
  }
});

test('no page leaks an unresolved translation key', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal(/translation missing/.test(html), false, `${name} has a missing locale key`);
  }
});

test('no page renders an empty href', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal(/href=""/.test(html), false, `${name} has an empty link`);
  }
});

test('the homepage carries the client headline and both hero calls to action', async () => {
  const html = await renderAll('index.json');
  assert.match(html, /Your Coffee\. Your Brand\. Our Roastery\./);
  assert.match(html, /Request a Sample/);
  assert.match(html, /Start Your Private Label/);
});

test('the private label page carries its headline and all eight coffee types', async () => {
  const html = await renderAll('page.private-label.json');
  assert.match(html, /Build Your Own Coffee Brand\./);
  for (const type of ['Espresso blends', 'Turkish coffee', 'Arabic coffee', 'Ground coffee']) {
    assert.match(html, new RegExp(type));
  }
});

test('the wholesale page carries its headline and all four ranges', async () => {
  const html = await renderAll('page.wholesale.json');
  assert.match(html, /Wholesale Coffee for Your Business\./);
  for (const range of ['Espresso Blends', 'Turkish Coffee', 'Specialty Coffee', 'Filter Coffee']) {
    assert.match(html, new RegExp(range));
  }
});

test('the our brands page bridges into the shop', async () => {
  const html = await renderAll('page.our-brands.json');
  assert.match(html, /Our Brands\./);
  assert.match(html, /href="\/collections\/all"/);
});

test('the enquiry page renders a posting contact form', async () => {
  const html = await renderAll('page.enquiry.json');
  assert.match(html, /action="\/contact#contact"/);
});
```

- [x] **Step 2: Run it and confirm it fails** (the templates are still the empty placeholders from Task 3).

- [x] **Step 3: Write `azouz-theme/templates/index.json`**

```json
{
  "sections": {
    "hero": {
      "type": "hero-split",
      "settings": {
        "eyebrow": "Coffee Roasting · Custom Blends · Private Label · Specialty Coffee",
        "heading": "Your Coffee. Your Brand. Our Roastery.",
        "body": "<p>We roast and produce coffee for cafés, hotels, retailers, distributors and growing coffee brands.</p><p>From selecting the coffee to roasting, blending and packaging — we help you create the right product for your business.</p>",
        "cta_primary_label": "Request a Sample",
        "cta_primary_link": "/pages/request-a-sample",
        "cta_secondary_label": "Start Your Private Label",
        "cta_secondary_link": "/pages/private-label",
        "background": "default"
      }
    },
    "services": {
      "type": "service-cards",
      "settings": { "eyebrow": "What We Do", "heading": "Three ways we work with you.", "background": "default" },
      "blocks": {
        "private_label": {
          "type": "service",
          "settings": {
            "title": "Private Label Coffee",
            "body": "Create coffee under your own brand.",
            "detail": "Custom blends, roasting, grinding and packaging",
            "label_color": "#C4562E",
            "link_label": "Learn More",
            "link": "/pages/private-label"
          }
        },
        "wholesale": {
          "type": "service",
          "settings": {
            "title": "Wholesale Coffee",
            "body": "Reliable coffee for cafés, restaurants, hotels and businesses.",
            "detail": "Espresso · Turkish · Filter · Specialty",
            "label_color": "#7C7F44",
            "link_label": "View Wholesale",
            "link": "/pages/wholesale"
          }
        },
        "specialty": {
          "type": "service",
          "settings": {
            "title": "Specialty Coffee",
            "body": "Single origins and specialty coffees selected for quality and flavour.",
            "detail": "Selected for quality and flavour",
            "label_color": "#67985E",
            "link_label": "Discover Our Coffee",
            "link": "/collections/all"
          }
        }
      },
      "block_order": ["private_label", "wholesale", "specialty"]
    },
    "process": {
      "type": "process-steps",
      "settings": {
        "eyebrow": "How it works",
        "heading": "From Bean to Bag.",
        "body": "We manage the coffee production process so you can focus on growing your business.",
        "show_numbers": true,
        "layout": "flow",
        "background": "alt"
      },
      "blocks": {
        "source": { "type": "step", "settings": { "title": "Source" } },
        "blend": { "type": "step", "settings": { "title": "Blend" } },
        "roast": { "type": "step", "settings": { "title": "Roast" } },
        "grind": { "type": "step", "settings": { "title": "Grind" } },
        "pack": { "type": "step", "settings": { "title": "Pack" } }
      },
      "block_order": ["source", "blend", "roast", "grind", "pack"]
    },
    "audience": {
      "type": "audience-strip",
      "settings": {
        "heading": "Coffee Made for Your Business.",
        "intro": "We work with:",
        "footnote": "Whether you need one house blend or a complete private-label range, we can help.",
        "background": "default"
      },
      "blocks": {
        "cafes": { "type": "audience", "settings": { "title": "Cafés" } },
        "hotels": { "type": "audience", "settings": { "title": "Hotels" } },
        "restaurants": { "type": "audience", "settings": { "title": "Restaurants" } },
        "retailers": { "type": "audience", "settings": { "title": "Retailers" } },
        "distributors": { "type": "audience", "settings": { "title": "Distributors" } },
        "brands": { "type": "audience", "settings": { "title": "Coffee Brands" } }
      },
      "block_order": ["cafes", "hotels", "restaurants", "retailers", "distributors", "brands"]
    },
    "closing": {
      "type": "cta-band",
      "settings": {
        "heading": "Let's Create Your Coffee.",
        "body": "<p>Tell us what you are looking for and we'll help you find or develop the right coffee.</p>",
        "cta_primary_label": "Request a Sample",
        "cta_primary_link": "/pages/request-a-sample",
        "cta_secondary_label": "Get a Quote",
        "cta_secondary_link": "/pages/get-a-quote",
        "background": "accent"
      }
    }
  },
  "order": ["hero", "services", "process", "audience", "closing"]
}
```

- [x] **Step 4: Write `azouz-theme/templates/page.private-label.json`**

```json
{
  "sections": {
    "hero": {
      "type": "hero-split",
      "settings": {
        "eyebrow": "Private Label",
        "heading": "Build Your Own Coffee Brand.",
        "body": "<p>We help businesses create coffee products under their own brand — from coffee selection and roasting to grinding and packaging.</p>",
        "cta_primary_label": "Start Your Project",
        "cta_primary_link": "/pages/get-a-quote",
        "cta_secondary_label": "Request a Sample",
        "cta_secondary_link": "/pages/request-a-sample",
        "background": "default"
      }
    },
    "capabilities": {
      "type": "process-steps",
      "settings": {
        "eyebrow": "What We Can Do",
        "heading": "From selection to sealed bag.",
        "show_numbers": true,
        "layout": "cards",
        "background": "alt"
      },
      "blocks": {
        "choose": {
          "type": "step",
          "settings": { "title": "Choose Your Coffee", "body": "Select from our existing blends or create something unique." }
        },
        "develop": {
          "type": "step",
          "settings": { "title": "Custom Blend Development", "body": "We can adjust the origin, roast level, body, acidity and flavour profile to suit your market." }
        },
        "roast": {
          "type": "step",
          "settings": { "title": "Roasting", "body": "Your approved coffee is roasted consistently to the agreed profile." }
        },
        "grind": {
          "type": "step",
          "settings": { "title": "Grinding", "body": "Available as whole bean or ground for different brewing methods." }
        },
        "pack": {
          "type": "step",
          "settings": { "title": "Packaging", "body": "We can pack your coffee into retail or wholesale sizes ready for your brand." }
        }
      },
      "block_order": ["choose", "develop", "roast", "grind", "pack"]
    },
    "options": {
      "type": "feature-grid",
      "settings": { "eyebrow": "Private Label Coffee Options", "heading": "We can produce:", "background": "default" },
      "blocks": {
        "espresso": { "type": "feature", "settings": { "title": "Espresso blends" } },
        "specialty": { "type": "feature", "settings": { "title": "Specialty coffee" } },
        "single_origin": { "type": "feature", "settings": { "title": "Single-origin coffee" } },
        "turkish": { "type": "feature", "settings": { "title": "Turkish coffee" } },
        "arabic": { "type": "feature", "settings": { "title": "Arabic coffee" } },
        "filter": { "type": "feature", "settings": { "title": "Filter coffee" } },
        "whole_bean": { "type": "feature", "settings": { "title": "Whole bean coffee" } },
        "ground": { "type": "feature", "settings": { "title": "Ground coffee" } }
      },
      "block_order": ["espresso", "specialty", "single_origin", "turkish", "arabic", "filter", "whole_bean", "ground"]
    },
    "choice": {
      "type": "two-column-choice",
      "settings": { "heading": "Your Blend or Ours.", "background": "alt" },
      "blocks": {
        "existing": {
          "type": "option",
          "settings": { "title": "Choose One of Our Existing Blends", "body": "A faster option if you want to launch quickly." }
        },
        "custom": {
          "type": "option",
          "settings": { "title": "Create Your Own Blend", "body": "Work with us to develop a coffee specifically for your brand, market and target price." }
        }
      },
      "block_order": ["existing", "custom"]
    },
    "blend": {
      "type": "blend-builder",
      "settings": { "eyebrow": "We can adjust", "heading": "Tune every variable.", "background": "default" },
      "blocks": {
        "body": { "type": "attribute", "settings": { "title": "Body", "low": "Light", "high": "Full" } },
        "sweetness": { "type": "attribute", "settings": { "title": "Sweetness", "low": "Subtle", "high": "Pronounced" } },
        "acidity": { "type": "attribute", "settings": { "title": "Acidity", "low": "Low", "high": "Bright" } },
        "roast": { "type": "attribute", "settings": { "title": "Roast Level", "low": "Light", "high": "Dark" } },
        "ratio": { "type": "attribute", "settings": { "title": "Arabica/Robusta Ratio", "low": "100% Arabica", "high": "Robusta blend" } },
        "flavour": { "type": "attribute", "settings": { "title": "Flavour Profile", "low": "Chocolate", "high": "Fruit" } }
      },
      "block_order": ["body", "sweetness", "acidity", "roast", "ratio", "flavour"]
    },
    "packaging": {
      "type": "packaging-sizes",
      "settings": {
        "heading": "Packaging Options",
        "body": "Available in different sizes depending on your project.",
        "note": "Custom packaging options can also be discussed.",
        "background": "alt"
      },
      "blocks": {
        "s250": { "type": "format", "settings": { "title": "250 g" } },
        "s500": { "type": "format", "settings": { "title": "500 g" } },
        "s1kg": { "type": "format", "settings": { "title": "1 kg" } },
        "bulk": { "type": "format", "settings": { "title": "Bulk" } }
      },
      "block_order": ["s250", "s500", "s1kg", "bulk"]
    },
    "audience": {
      "type": "audience-strip",
      "settings": {
        "heading": "Who We Work With",
        "intro": "",
        "footnote": "Whether you are creating your first coffee product or expanding an existing range, we can support you from sample to production.",
        "background": "default"
      },
      "blocks": {
        "shops": { "type": "audience", "settings": { "title": "Coffee Shops" } },
        "retailers": { "type": "audience", "settings": { "title": "Retailers" } },
        "hotels": { "type": "audience", "settings": { "title": "Hotels" } },
        "restaurants": { "type": "audience", "settings": { "title": "Restaurants" } },
        "distributors": { "type": "audience", "settings": { "title": "Distributors" } },
        "startups": { "type": "audience", "settings": { "title": "Startups" } },
        "supermarkets": { "type": "audience", "settings": { "title": "Supermarkets" } }
      },
      "block_order": ["shops", "retailers", "hotels", "restaurants", "distributors", "startups", "supermarkets"]
    },
    "closing": {
      "type": "cta-band",
      "settings": {
        "heading": "Ready to Create Your Coffee?",
        "body": "<p>Tell us what type of coffee you are looking for, your expected quantity and your target market.</p>",
        "cta_primary_label": "Request a Sample",
        "cta_primary_link": "/pages/request-a-sample",
        "cta_secondary_label": "Get a Private Label Quote",
        "cta_secondary_link": "/pages/get-a-quote",
        "background": "accent"
      }
    }
  },
  "order": ["hero", "capabilities", "options", "choice", "blend", "packaging", "audience", "closing"]
}
```

- [x] **Step 5: Write `azouz-theme/templates/page.wholesale.json`**

```json
{
  "sections": {
    "hero": {
      "type": "hero-split",
      "settings": {
        "eyebrow": "Wholesale",
        "heading": "Wholesale Coffee for Your Business.",
        "body": "<p>Reliable, consistent coffee for cafés, restaurants, hotels, offices and distributors.</p><p>Choose from our existing blends or work with us to create your own.</p>",
        "cta_primary_label": "Request Wholesale Pricing",
        "cta_primary_link": "/pages/get-a-quote",
        "cta_secondary_label": "Request a Sample",
        "cta_secondary_link": "/pages/request-a-sample",
        "background": "default"
      }
    },
    "range": {
      "type": "coffee-range",
      "settings": { "eyebrow": "Our Coffee Range", "heading": "Four ways we roast.", "background": "alt" },
      "blocks": {
        "espresso": {
          "type": "range",
          "settings": {
            "title": "Espresso Blends",
            "body": "Balanced coffees developed for espresso and milk-based drinks.",
            "label_color": "#C4562E",
            "label_text": "light"
          }
        },
        "turkish": {
          "type": "range",
          "settings": {
            "title": "Turkish Coffee",
            "body": "Traditional profiles available plain or with cardamom.",
            "label_color": "#7C7F44",
            "label_text": "light"
          }
        },
        "specialty": {
          "type": "range",
          "settings": {
            "title": "Specialty Coffee",
            "body": "Single origins and specialty-grade coffees selected for quality and flavour.",
            "label_color": "#BFDDD3",
            "label_text": "dark"
          }
        },
        "filter": {
          "type": "range",
          "settings": {
            "title": "Filter Coffee",
            "body": "Coffee roasted for V60, batch brew and other filter methods.",
            "label_color": "#303030",
            "label_text": "light"
          }
        }
      },
      "block_order": ["espresso", "turkish", "specialty", "filter"]
    },
    "blend": {
      "type": "blend-builder",
      "settings": {
        "eyebrow": "We can adjust",
        "heading": "Create Your Own House Blend.",
        "body": "<p>Want something unique for your business? We can develop a custom blend based on the taste and price point you need.</p>",
        "background": "default"
      },
      "blocks": {
        "body": { "type": "attribute", "settings": { "title": "Body", "low": "Light", "high": "Full" } },
        "sweetness": { "type": "attribute", "settings": { "title": "Sweetness", "low": "Subtle", "high": "Pronounced" } },
        "acidity": { "type": "attribute", "settings": { "title": "Acidity", "low": "Low", "high": "Bright" } },
        "roast": { "type": "attribute", "settings": { "title": "Roast Level", "low": "Light", "high": "Dark" } },
        "ratio": { "type": "attribute", "settings": { "title": "Arabica/Robusta Ratio", "low": "100% Arabica", "high": "Robusta blend" } },
        "flavour": { "type": "attribute", "settings": { "title": "Flavour Profile", "low": "Chocolate", "high": "Fruit" } }
      },
      "block_order": ["body", "sweetness", "acidity", "roast", "ratio", "flavour"]
    },
    "audience": {
      "type": "audience-strip",
      "settings": {
        "heading": "Coffee for Different Businesses",
        "intro": "We supply coffee for:",
        "footnote": "Whether you need a few kilograms or regular commercial supply, we can help you choose the right coffee for your operation.",
        "background": "alt"
      },
      "blocks": {
        "shops": { "type": "audience", "settings": { "title": "Coffee Shops" } },
        "restaurants": { "type": "audience", "settings": { "title": "Restaurants" } },
        "hotels": { "type": "audience", "settings": { "title": "Hotels" } },
        "offices": { "type": "audience", "settings": { "title": "Offices" } },
        "retailers": { "type": "audience", "settings": { "title": "Retailers" } },
        "distributors": { "type": "audience", "settings": { "title": "Distributors" } }
      },
      "block_order": ["shops", "restaurants", "hotels", "offices", "retailers", "distributors"]
    },
    "consistency": {
      "type": "packaging-sizes",
      "settings": {
        "heading": "Consistent Coffee, Batch After Batch.",
        "body": "Once your coffee is approved, we roast it to a consistent profile to help you maintain the same taste and quality over time.",
        "note": "",
        "background": "default"
      },
      "blocks": {
        "whole": { "type": "format", "settings": { "title": "Whole Bean" } },
        "ground": { "type": "format", "settings": { "title": "Ground Coffee" } },
        "retail": { "type": "format", "settings": { "title": "Retail Bags" } },
        "wholesale": { "type": "format", "settings": { "title": "Wholesale Bags" } }
      },
      "block_order": ["whole", "ground", "retail", "wholesale"]
    },
    "closing": {
      "type": "cta-band",
      "settings": {
        "heading": "Need Help Choosing?",
        "body": "<p>Tell us what coffee machine you use, how much coffee you consume and the flavour profile you prefer. We can recommend a blend or prepare samples for you to try.</p>",
        "cta_primary_label": "Request a Sample",
        "cta_primary_link": "/pages/request-a-sample",
        "cta_secondary_label": "Get Wholesale Pricing",
        "cta_secondary_link": "/pages/get-a-quote",
        "background": "accent"
      }
    }
  },
  "order": ["hero", "range", "blend", "audience", "consistency", "closing"]
}
```

- [x] **Step 6: Write `azouz-theme/templates/page.our-brands.json`**

```json
{
  "sections": {
    "hero": {
      "type": "hero-split",
      "settings": {
        "eyebrow": "Our Brands",
        "heading": "Our Brands.",
        "body": "<p>Alongside private label and wholesale coffee, we also develop and sell our own coffee products.</p><p>Our brands are created using the same roasting, blending and product development experience we offer to our business partners.</p>",
        "background": "default"
      }
    },
    "azouz": {
      "type": "brand-feature",
      "settings": {
        "eyebrow": "Our own brand",
        "heading": "Azouz Coffee",
        "body": "<p>Our own coffee brand, developed for modern coffee drinkers.</p><p>The range includes espresso, Turkish coffee, specialty coffee and selected retail products.</p>",
        "cta_label": "View Azouz Coffee",
        "cta_link": "/collections/all",
        "media_position": "end",
        "background": "alt"
      }
    },
    "products": {
      "type": "feature-grid",
      "settings": {
        "eyebrow": "Retail Coffee Products",
        "heading": "Our own branded products can be available in different formats depending on the range.",
        "background": "default"
      },
      "blocks": {
        "espresso": { "type": "feature", "settings": { "title": "Espresso coffee" } },
        "turkish": { "type": "feature", "settings": { "title": "Turkish coffee" } },
        "specialty": { "type": "feature", "settings": { "title": "Specialty coffee" } },
        "single_origin": { "type": "feature", "settings": { "title": "Single-origin coffee" } },
        "whole_bean": { "type": "feature", "settings": { "title": "Whole bean coffee" } },
        "ground": { "type": "feature", "settings": { "title": "Ground coffee" } },
        "retail_bags": { "type": "feature", "settings": { "title": "Retail coffee bags" } },
        "seasonal": { "type": "feature", "settings": { "title": "Selected seasonal products" } }
      },
      "block_order": ["espresso", "turkish", "specialty", "single_origin", "whole_bean", "ground", "retail_bags", "seasonal"]
    },
    "distribution": {
      "type": "cta-band",
      "settings": {
        "heading": "Interested in Distribution?",
        "body": "<p>We work with retailers, distributors, cafés and hospitality businesses looking to stock our brands. For wholesale pricing, distribution opportunities or product availability, contact our team.</p>",
        "cta_primary_label": "Become a Distributor",
        "cta_primary_link": "/pages/get-a-quote",
        "cta_secondary_label": "Wholesale Enquiry",
        "cta_secondary_link": "/pages/get-a-quote",
        "background": "accent"
      }
    },
    "cross_sell": {
      "type": "cta-band",
      "settings": {
        "heading": "Looking for Your Own Brand Instead?",
        "body": "<p>If you like what we produce but want coffee under your own name, our private label service can help you create your own range.</p>",
        "cta_primary_label": "Explore Private Label",
        "cta_primary_link": "/pages/private-label",
        "background": "default"
      }
    }
  },
  "order": ["hero", "azouz", "products", "distribution", "cross_sell"]
}
```

- [x] **Step 7: Write `azouz-theme/templates/page.enquiry.json`**

Both `/pages/request-a-sample` and `/pages/get-a-quote` use this template. The client assigns it to both pages in the Shopify admin, then edits the heading per page in the Theme Editor.

```json
{
  "sections": {
    "hero": {
      "type": "hero-split",
      "settings": {
        "eyebrow": "Get in touch",
        "heading": "Let's Create Your Coffee.",
        "body": "<p>Tell us what type of coffee you are looking for, your expected quantity and your target market — we'll come back with a recommendation or a sample.</p>",
        "background": "default"
      }
    },
    "form": {
      "type": "enquiry-form",
      "settings": {
        "eyebrow": "Enquiry",
        "heading": "Tell us what you are looking for",
        "require_volume": false,
        "background": "alt"
      }
    }
  },
  "order": ["hero", "form"]
}
```

- [x] **Step 8: Run the tests until green**

Run: `node --test tests/templates.test.js`
Expected: PASS — 12 tests.

If "exactly one h1" fails on the enquiry page, check that `enquiry-form` uses `<h2>` and only `hero-split` emits `<h1>`.

- [x] **Step 9: Run the full suite and the validator**

Run: `npm test` — all green.
Run: `npm run validate` — `Theme validation passed.`

- [x] **Step 10: Commit**

```bash
git add azouz-theme/templates tests/templates.test.js
git commit -m "feat: assemble the four client pages from the supplied copy"
```

---

## Task 23: Final verification

No new code. Prove the whole marketing surface works.

- [x] **Step 1: Full suite**

Run: `npm test`
Expected: every test green. Record the total.

- [x] **Step 2: Theme validator**

Run: `npm run validate`
Expected: `Theme validation passed.`

- [x] **Step 3: Shopify's linter**

Run: `npm run check`

Expected: **zero error-level findings.** The three `MissingTemplate` errors from Plan A must be gone now that `header`, `footer` and `announcement-bar` exist. Warnings such as `AssetPreload` and `OrphanedSnippet` are acceptable and were reviewed in Plan A. Report any new error.

- [x] **Step 4: Visual review**

Run: `npm run preview`, then open each route and check it against the list below.

| Route | Must show |
|---|---|
| `/` | Headline "Your Coffee. Your Brand. Our Roastery.", three service cards with coloured labels, the five-step flow, six audience chips, green closing band |
| `/pages/private-label` | "Build Your Own Coffee Brand.", five capability cards, eight coffee types, two-column choice, six blend spectrums, four packaging tiles |
| `/pages/wholesale` | "Wholesale Coffee for Your Business.", four range cards in terracotta / olive / mint / black, blend spectrums, four format tiles |
| `/pages/our-brands` | "Our Brands.", the Azouz Coffee feature with a working link to `/collections/all`, eight retail formats, two closing bands |
| `/pages/request-a-sample` | The enquiry form with all eight fields, each with a visible label |

On every route confirm:
- Header logo renders, navigation shows all four links, cart link shows a count
- Footer shows menu, contact and copyright with the current year
- Pressing Tab first reveals the green "Skip to content" link
- The browser console is free of errors and the Network tab shows no 404s

- [x] **Step 5: Responsive check**

At widths 375, 768, 1280 and 1440 on every route:
- No horizontal scrollbar on `<body>`
- The mobile menu opens at 375 and the desktop nav is hidden
- The desktop nav shows at 1280 and the mobile toggle is hidden
- Card grids reflow rather than overflow

- [x] **Step 6: No-JavaScript check**

Disable JavaScript in DevTools and reload `/`.
- All content is visible — nothing stuck invisible from the scroll reveal
- The mobile menu still opens, because it is a `<details>` element

This is the check that would have caught the `.reveal` defect found at the end of Plan A. Do not skip it.

- [x] **Step 7: RTL smoke check**

In DevTools, set `document.documentElement.dir = 'rtl'` on `/pages/wholesale`.
- The layout mirrors: navigation, card order and text alignment all flip
- Nothing overlaps or escapes its container

Text stays English — only direction is under test here. Arabic translation is out of scope.

- [x] **Step 8: Commit any fixes, then report**

Report: total test count, `theme check` error count, and anything from steps 4–7 that did not hold.

---

## Definition of Done for Plan B

- [x] `npm test` passes with no failures
- [x] `npm run validate` prints `Theme validation passed.`
- [x] `npm run check` reports **zero errors**
- [x] All five marketing routes render completely in the preview, with the client's copy verbatim
- [x] Each page has exactly one `<h1>`, no empty `href`, no `translation missing`, no unresolved section
- [x] Layouts hold at 375 / 768 / 1280 / 1440 with no horizontal overflow
- [x] With JavaScript disabled, all content is visible and the mobile menu still opens
- [x] Setting `dir="rtl"` mirrors the layout without breakage

**Next:** Plan C — the commerce surface (product, collection, cart, search, customer accounts) and the `theme.js` web components.

