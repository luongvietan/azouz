# Azouz Coffee Theme — Plan A: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the build tooling, validators, Liquid preview harness, brand design tokens, self-hosted fonts, vector logo assets, `base.css`, and `layout/theme.liquid` — so that every later plan has a tested foundation and a way to see its work in a browser.

**Architecture:** A Node workspace wrapping a Shopify Online Store 2.0 theme directory. Tests are `node:test` (zero extra dependency) and fall into three families: **structure validators** that assert the theme will survive Shopify's zip upload, **render tests** that run real `.liquid` files through a LiquidJS engine fitted with Shopify-compatible tag and filter shims, and a **contrast guard** that reads the CSS token file and fails if any brand colour pairing drops below its WCAG target. The preview server renders the same theme files the client receives, so what is reviewed is what ships.

**Tech Stack:** Node 24, `node:test`, LiquidJS 10, archiver 8, `@shopify/cli` (for `theme check`), Python + PyMuPDF (one-off vector extraction from the client's `.ai` files).

**Spec:** `docs/superpowers/specs/2026-08-16-azouz-coffee-shopify-theme-design.md`

**Working directory:** `C:\Users\admin\Desktop\Azouz` — all paths below are relative to it. Shell is PowerShell; `npm` and `git` are on PATH.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Scripts and dev dependencies |
| `.gitignore` | Exclude `node_modules`, CLI caches |
| `scripts/theme-paths.js` | Single source of truth for directory locations |
| `scripts/validate-structure.js` | Required files, allowed top-level dirs |
| `scripts/validate-json.js` | Every `.json` in the theme parses |
| `scripts/schema-parser.js` | Extract `{% schema %}` bodies and derive default settings |
| `scripts/contrast.js` | WCAG relative luminance + contrast ratio |
| `scripts/css-tokens.js` | Read `--token: #hex` pairs out of a CSS file |
| `preview/shims/filters.js` | Shopify-specific Liquid filters |
| `preview/shims/tags.js` | Shopify-specific Liquid tags |
| `preview/fixtures.js` | Fake `shop`/`product`/`collection`/`cart`/`linklists` data |
| `preview/engine.js` | Builds a configured LiquidJS instance |
| `preview/server.js` | Dev HTTP server rendering the theme |
| `azouz-theme/assets/tokens.css` | Brand design tokens (the contrast test's subject) |
| `azouz-theme/assets/base.css` | Reset, typography, layout primitives |
| `azouz-theme/assets/*.woff2` | Self-hosted Baloo Bhaijaan 2 |
| `azouz-theme/assets/logo-*.svg`, `logomark.svg` | Vector logo, extracted from the client's `.ai` |
| `azouz-theme/assets/pattern-kufi.svg` | Section-divider texture |
| `azouz-theme/assets/placeholder.svg` | Fallback for missing product imagery |
| `azouz-theme/assets/theme.js` | Runtime custom elements (scroll reveal in this plan) |
| `azouz-theme/config/settings_schema.json` | Theme Editor settings — required by Shopify |
| `azouz-theme/config/settings_data.json` | Preset values, pre-filled with the Azouz brand |
| `azouz-theme/locales/en.default.json` | Every storefront string |
| `azouz-theme/snippets/meta-tags.liquid` | `<title>`, description, Open Graph, Twitter |
| `azouz-theme/snippets/structured-data.liquid` | JSON-LD |
| `azouz-theme/layout/theme.liquid` | Document shell |
| `tests/*.test.js` | One test file per module above |

`scripts/` holds code that runs at build/validate time. `preview/` holds the dev harness. Neither ships in the delivered zip — only `azouz-theme/` does.

---

## Task 1: Node workspace scaffold

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `scripts/theme-paths.js`
- Test: `tests/theme-paths.test.js`

- [ ] **Step 1: Initialise git**

```bash
git init
git config user.name "Viet An Luong"
git config user.email "luongvietan.231123@gmail.com"
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "azouz-coffee-theme",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Custom Shopify Online Store 2.0 theme for Azouz Coffee",
  "scripts": {
    "test": "node --test tests/",
    "preview": "node preview/server.js",
    "validate": "node scripts/validate-all.js",
    "check": "shopify theme check azouz-theme",
    "package": "node scripts/package-theme.js"
  },
  "devDependencies": {
    "@shopify/cli": "^4.6.1",
    "archiver": "^8.0.0",
    "liquidjs": "^10.29.0"
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```gitignore
node_modules/
.shopify/
*.log
.DS_Store
Thumbs.db
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created; `liquidjs`, `archiver`, `@shopify/cli` present. Warnings about peer deps are fine.

- [ ] **Step 5: Write the failing test for `theme-paths.js`**

Create `tests/theme-paths.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { THEME_DIR, THEME_SUBDIRS, resolveInTheme } from '../scripts/theme-paths.js';

test('THEME_DIR points at an existing directory', () => {
  assert.ok(existsSync(THEME_DIR), `${THEME_DIR} should exist`);
});

test('THEME_SUBDIRS lists exactly the directories Shopify allows at a theme root', () => {
  assert.deepEqual(
    [...THEME_SUBDIRS].sort(),
    ['assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'],
  );
});

test('resolveInTheme joins a POSIX-style relative path onto the theme root', () => {
  const resolved = resolveInTheme('layout/theme.liquid');
  assert.ok(resolved.startsWith(THEME_DIR));
  assert.ok(resolved.endsWith('theme.liquid'));
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `node --test tests/theme-paths.test.js`
Expected: FAIL — `Cannot find module '../scripts/theme-paths.js'`

- [ ] **Step 7: Create `scripts/theme-paths.js`**

```js
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root — one level above `scripts/`. */
export const ROOT = resolve(here, '..');

/** The Shopify theme source. This directory, and only this, becomes the zip. */
export const THEME_DIR = join(ROOT, 'azouz-theme');

/** Where the packaged zip is written. */
export const DIST_DIR = join(ROOT, 'dist');

/**
 * The only directory names Shopify accepts at a theme root.
 * Anything else present will cause the zip upload to be rejected.
 */
export const THEME_SUBDIRS = new Set([
  'assets',
  'blocks',
  'config',
  'layout',
  'locales',
  'sections',
  'snippets',
  'templates',
]);

/** Resolve a POSIX-style theme-relative path (e.g. 'layout/theme.liquid') to absolute. */
export function resolveInTheme(relativePath) {
  return join(THEME_DIR, ...relativePath.split('/'));
}
```

- [ ] **Step 8: Create the theme directory skeleton**

```bash
mkdir -p azouz-theme/assets azouz-theme/config azouz-theme/layout azouz-theme/locales azouz-theme/sections azouz-theme/snippets azouz-theme/templates/customers tests preview/shims
```

- [ ] **Step 9: Run the test to verify it passes**

Run: `node --test tests/theme-paths.test.js`
Expected: PASS — 3 tests.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json .gitignore scripts/theme-paths.js tests/theme-paths.test.js
git commit -m "chore: scaffold node workspace and theme directory skeleton"
```

---

## Task 2: Structure validator

Shopify rejects a theme zip that is missing required files or contains unexpected top-level directories. This catches both before packaging.

**Files:**
- Create: `scripts/validate-structure.js`
- Test: `tests/validate-structure.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/validate-structure.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findMissingRequiredFiles,
  findDisallowedTopLevelEntries,
  findDefaultLocale,
} from '../scripts/validate-structure.js';

/** Build a throwaway theme directory. `files` maps POSIX paths to contents. */
async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-theme-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

const VALID = {
  'layout/theme.liquid': '<!doctype html>',
  'config/settings_schema.json': '[]',
  'locales/en.default.json': '{}',
};

test('a valid theme reports no missing required files', async () => {
  const dir = await makeTheme(VALID);
  assert.deepEqual(await findMissingRequiredFiles(dir), []);
});

test('a missing layout is reported', async () => {
  const dir = await makeTheme({
    'config/settings_schema.json': '[]',
    'locales/en.default.json': '{}',
  });
  assert.deepEqual(await findMissingRequiredFiles(dir), ['layout/theme.liquid']);
});

test('a missing settings_schema is reported', async () => {
  const dir = await makeTheme({
    'layout/theme.liquid': '<!doctype html>',
    'locales/en.default.json': '{}',
  });
  assert.deepEqual(await findMissingRequiredFiles(dir), ['config/settings_schema.json']);
});

test('a theme with no default locale is reported', async () => {
  const dir = await makeTheme({
    'layout/theme.liquid': '<!doctype html>',
    'config/settings_schema.json': '[]',
    'locales/en.json': '{}',
  });
  assert.equal(await findDefaultLocale(dir), null);
});

test('a default locale is found by its .default.json suffix', async () => {
  const dir = await makeTheme(VALID);
  assert.equal(await findDefaultLocale(dir), 'en.default.json');
});

test('allowed top-level directories produce no complaints', async () => {
  const dir = await makeTheme(VALID);
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), []);
});

test('an unexpected top-level directory is reported', async () => {
  const dir = await makeTheme({ ...VALID, 'node_modules/pkg/index.js': '' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['node_modules']);
});

test('a stray top-level file is reported', async () => {
  const dir = await makeTheme({ ...VALID, 'README.md': '# hi' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['README.md']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/validate-structure.test.js`
Expected: FAIL — `Cannot find module '../scripts/validate-structure.js'`

- [ ] **Step 3: Create `scripts/validate-structure.js`**

```js
import { readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { THEME_SUBDIRS } from './theme-paths.js';

/**
 * Files Shopify requires before it will accept a theme.
 * A default locale is required too, but its name varies — see findDefaultLocale.
 */
export const REQUIRED_FILES = ['layout/theme.liquid', 'config/settings_schema.json'];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** @returns {Promise<string[]>} required paths that are absent, in REQUIRED_FILES order. */
export async function findMissingRequiredFiles(themeDir) {
  const missing = [];
  for (const relative of REQUIRED_FILES) {
    if (!(await exists(join(themeDir, ...relative.split('/'))))) missing.push(relative);
  }
  return missing;
}

/** @returns {Promise<string|null>} the `*.default.json` filename in locales/, or null. */
export async function findDefaultLocale(themeDir) {
  let entries;
  try {
    entries = await readdir(join(themeDir, 'locales'));
  } catch {
    return null;
  }
  return entries.find((name) => name.endsWith('.default.json')) ?? null;
}

/** @returns {Promise<string[]>} top-level entries Shopify does not permit, sorted. */
export async function findDisallowedTopLevelEntries(themeDir) {
  const entries = await readdir(themeDir, { withFileTypes: true });
  return entries
    .filter((entry) => !(entry.isDirectory() && THEME_SUBDIRS.has(entry.name)))
    .map((entry) => entry.name)
    .sort();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/validate-structure.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-structure.js tests/validate-structure.test.js
git commit -m "feat: validate theme structure against Shopify upload requirements"
```

---

## Task 3: JSON validator

A single malformed JSON file causes Shopify to reject the whole upload with an unhelpful message. Catch it locally with the offending path and parse error.

**Files:**
- Create: `scripts/validate-json.js`
- Test: `tests/validate-json.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/validate-json.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findInvalidJson } from '../scripts/validate-json.js';

async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-json-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

test('well-formed JSON anywhere in the theme produces no findings', async () => {
  const dir = await makeTheme({
    'config/settings_schema.json': '[{"name":"theme_info"}]',
    'locales/en.default.json': '{"general":{"skip":"Skip"}}',
    'templates/index.json': '{"sections":{}}',
    'templates/customers/login.json': '{"sections":{}}',
  });
  assert.deepEqual(await findInvalidJson(dir), []);
});

test('a malformed file is reported with its theme-relative POSIX path', async () => {
  const dir = await makeTheme({
    'config/settings_schema.json': '[]',
    'templates/index.json': '{"sections":{},}',
  });
  const findings = await findInvalidJson(dir);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'templates/index.json');
  assert.match(findings[0].message, /JSON/i);
});

test('nested template directories are searched', async () => {
  const dir = await makeTheme({ 'templates/customers/order.json': 'not json at all' });
  const findings = await findInvalidJson(dir);
  assert.equal(findings[0].file, 'templates/customers/order.json');
});

test('non-JSON files are ignored', async () => {
  const dir = await makeTheme({ 'layout/theme.liquid': '{{ this is not json }}' });
  assert.deepEqual(await findInvalidJson(dir), []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/validate-json.test.js`
Expected: FAIL — `Cannot find module '../scripts/validate-json.js'`

- [ ] **Step 3: Create `scripts/validate-json.js`**

```js
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Parse every .json file under themeDir.
 * @returns {Promise<Array<{file: string, message: string}>>} findings, sorted by path.
 */
export async function findInvalidJson(themeDir) {
  const findings = [];
  for await (const absolute of walk(themeDir)) {
    if (!absolute.endsWith('.json')) continue;
    const contents = await readFile(absolute, 'utf8');
    try {
      JSON.parse(contents);
    } catch (error) {
      findings.push({
        file: relative(themeDir, absolute).split(sep).join('/'),
        message: error.message,
      });
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/validate-json.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-json.js tests/validate-json.test.js
git commit -m "feat: validate every JSON file in the theme parses"
```

---

## Task 4: Schema parser

`{% schema %}` blocks carry each section's editable settings. The preview harness needs their defaults so sections render with real content instead of blanks, and later plans need to assert schema validity.

**Files:**
- Create: `scripts/schema-parser.js`
- Test: `tests/schema-parser.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/schema-parser.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractSchema, defaultSettings, defaultBlocks } from '../scripts/schema-parser.js';

const SECTION = `
<div class="hero">{{ section.settings.heading }}</div>
{% schema %}
{
  "name": "Hero",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Your Coffee." },
    { "type": "checkbox", "id": "show_image", "label": "Show image", "default": true },
    { "type": "url", "id": "link", "label": "Link" }
  ],
  "blocks": [
    { "type": "step", "name": "Step", "settings": [
      { "type": "text", "id": "title", "label": "Title", "default": "Source" }
    ]}
  ],
  "presets": [
    { "name": "Hero", "blocks": [
      { "type": "step", "settings": { "title": "Roast" } },
      { "type": "step" }
    ]}
  ]
}
{% endschema %}
`;

test('extractSchema returns the parsed JSON body', () => {
  const schema = extractSchema(SECTION);
  assert.equal(schema.name, 'Hero');
  assert.equal(schema.settings.length, 3);
});

test('extractSchema tolerates whitespace-control markers', () => {
  const schema = extractSchema('{%- schema -%}{"name":"X"}{%- endschema -%}');
  assert.equal(schema.name, 'X');
});

test('extractSchema returns null when there is no schema block', () => {
  assert.equal(extractSchema('<div>no schema here</div>'), null);
});

test('extractSchema throws a path-bearing error on malformed JSON', () => {
  assert.throws(
    () => extractSchema('{% schema %}{ "name": }{% endschema %}', 'sections/hero.liquid'),
    /sections\/hero\.liquid/,
  );
});

test('defaultSettings collects declared defaults', () => {
  const settings = defaultSettings(extractSchema(SECTION));
  assert.equal(settings.heading, 'Your Coffee.');
  assert.equal(settings.show_image, true);
});

test('defaultSettings omits settings that declare no default', () => {
  const settings = defaultSettings(extractSchema(SECTION));
  assert.equal('link' in settings, false);
});

test('defaultSettings returns an empty object for a null schema', () => {
  assert.deepEqual(defaultSettings(null), {});
});

test('defaultBlocks expands the first preset, merging block-type defaults', () => {
  const blocks = defaultBlocks(extractSchema(SECTION));
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, 'step');
  assert.equal(blocks[0].settings.title, 'Roast');
  assert.equal(blocks[1].settings.title, 'Source');
});

test('defaultBlocks gives every block a distinct id', () => {
  const blocks = defaultBlocks(extractSchema(SECTION));
  assert.notEqual(blocks[0].id, blocks[1].id);
});

test('defaultBlocks returns an empty array when there are no presets', () => {
  assert.deepEqual(defaultBlocks(extractSchema('{% schema %}{"name":"X"}{% endschema %}')), []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/schema-parser.test.js`
Expected: FAIL — `Cannot find module '../scripts/schema-parser.js'`

- [ ] **Step 3: Create `scripts/schema-parser.js`**

```js
const SCHEMA_PATTERN = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/;

/**
 * Pull the JSON body out of a section's {% schema %} block.
 * @param {string} source raw .liquid contents
 * @param {string} [label] path used in error messages
 * @returns {object|null} parsed schema, or null when the file has no schema block
 */
export function extractSchema(source, label = 'section') {
  const match = SCHEMA_PATTERN.exec(source);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid {% schema %} JSON in ${label}: ${error.message}`);
  }
}

/**
 * Build the settings object Shopify would hand a freshly-added section.
 * Settings without a `default` are omitted, matching Shopify's behaviour of
 * leaving them nil rather than empty-string.
 */
export function defaultSettings(schema) {
  const settings = {};
  for (const setting of schema?.settings ?? []) {
    if (setting && 'default' in setting && setting.id) settings[setting.id] = setting.default;
  }
  return settings;
}

/**
 * Expand the first preset into concrete blocks, filling each block's settings
 * from its block-type defaults and then overriding with the preset's values.
 */
export function defaultBlocks(schema) {
  const preset = schema?.presets?.[0];
  if (!preset?.blocks?.length) return [];

  const typeDefaults = new Map(
    (schema.blocks ?? []).map((blockType) => [blockType.type, defaultSettings(blockType)]),
  );

  return preset.blocks.map((block, index) => ({
    id: `${block.type}-${index}`,
    type: block.type,
    settings: { ...(typeDefaults.get(block.type) ?? {}), ...(block.settings ?? {}) },
    shopify_attributes: '',
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/schema-parser.test.js`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/schema-parser.js tests/schema-parser.test.js
git commit -m "feat: parse section schemas and derive editor defaults"
```

---

## Task 5: Shopify filter shims

LiquidJS ships the standard Liquid filters. Shopify adds its own; these are the ones this theme uses.

**Files:**
- Create: `preview/shims/filters.js`
- Test: `tests/filters.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/filters.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Liquid } from 'liquidjs';
import { registerShopifyFilters } from '../preview/shims/filters.js';

function makeEngine() {
  const engine = new Liquid({ extname: '.liquid' });
  registerShopifyFilters(engine, {
    assetBase: '/assets/',
    currency: 'JOD',
    locale: 'en',
    translations: { general: { search: { title: 'Search' } }, greeting: 'Hello, {{ name }}' },
  });
  return engine;
}

const render = (template, scope = {}) => makeEngine().parseAndRenderSync(template, scope);

test('asset_url prefixes the asset base', () => {
  assert.equal(render(`{{ 'base.css' | asset_url }}`), '/assets/base.css');
});

test('image_url applies the width argument as a query parameter', () => {
  const out = render(`{{ src | image_url: width: 600 }}`, { src: '/img/bag.jpg' });
  assert.equal(out, '/img/bag.jpg?width=600');
});

test('image_url returns a placeholder when the source is nil', () => {
  assert.match(render(`{{ nothing | image_url: width: 200 }}`), /placeholder/);
});

test('money formats minor units using the shop currency', () => {
  assert.match(render(`{{ 1250 | money }}`), /12\.50/);
});

test('money renders zero rather than blank for a nil amount', () => {
  assert.match(render(`{{ nothing | money }}`), /0\.00/);
});

test('handleize lowercases and hyphenates', () => {
  assert.equal(render(`{{ 'Wadi Rum Blend' | handleize }}`), 'wadi-rum-blend');
});

test('handleize strips punctuation and collapses separators', () => {
  assert.equal(render(`{{ '  Espresso — 250g / 1kg!  ' | handle }}`), 'espresso-250g-1kg');
});

test('t looks a translation up by dotted key', () => {
  assert.equal(render(`{{ 'general.search.title' | t }}`), 'Search');
});

test('t interpolates named arguments', () => {
  assert.equal(render(`{{ 'greeting' | t: name: 'Anwar' }}`), 'Hello, Anwar');
});

test('t echoes the key when the translation is missing', () => {
  assert.equal(render(`{{ 'nope.missing' | t }}`), 'translation missing: nope.missing');
});

test('stylesheet_tag emits a link element', () => {
  assert.equal(
    render(`{{ 'base.css' | asset_url | stylesheet_tag }}`),
    '<link rel="stylesheet" href="/assets/base.css" media="all">',
  );
});

test('script_tag emits a script element', () => {
  assert.equal(
    render(`{{ 'theme.js' | asset_url | script_tag }}`),
    '<script src="/assets/theme.js" defer="defer"></script>',
  );
});

test('within builds a collection-scoped product URL', () => {
  const out = render(`{{ product.url | within: collection }}`, {
    product: { url: '/products/wadi-rum' },
    collection: { handle: 'espresso' },
  });
  assert.equal(out, '/collections/espresso/products/wadi-rum');
});

test('weight_with_unit appends the unit to a gram weight', () => {
  assert.equal(render(`{{ 250 | weight_with_unit: 'g' }}`), '250 g');
});

test('link_to wraps text in an anchor', () => {
  assert.equal(render(`{{ 'Shop' | link_to: '/collections/all' }}`), '<a href="/collections/all">Shop</a>');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/filters.test.js`
Expected: FAIL — `Cannot find module '../preview/shims/filters.js'`

- [ ] **Step 3: Create `preview/shims/filters.js`**

```js
/**
 * Shopify-specific Liquid filters, approximated closely enough for local preview.
 *
 * These exist so the real theme files render outside Shopify. They are NOT a
 * reimplementation of Shopify's behaviour — money formatting in particular is
 * indicative only; the live store formats via the shop's own money format string.
 */

const PLACEHOLDER = '/assets/placeholder.svg';

/** LiquidJS passes `key: value` filter arguments as a trailing plain object. */
function keywordArgs(args) {
  const last = args[args.length - 1];
  const isPlainObject =
    last !== null && typeof last === 'object' && !Array.isArray(last) && last.constructor === Object;
  return isPlainObject ? last : {};
}

export function handleize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Resolve a dotted key against a nested translations object. */
function lookupTranslation(translations, key) {
  return String(key)
    .split('.')
    .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), translations);
}

export function registerShopifyFilters(engine, options = {}) {
  const {
    assetBase = '/assets/',
    currency = 'JOD',
    locale = 'en',
    translations = {},
  } = options;

  const moneyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  });

  engine.registerFilter('asset_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('asset_img_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('file_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('shopify_asset_url', (value) => `${assetBase}${value}`);

  engine.registerFilter('image_url', (source, ...args) => {
    if (!source) return PLACEHOLDER;
    const { width, height, crop } = keywordArgs(args);
    const params = new URLSearchParams();
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (crop) params.set('crop', String(crop));
    const query = params.toString();
    return query ? `${source}?${query}` : String(source);
  });

  engine.registerFilter('img_url', (source, size) => {
    if (!source) return PLACEHOLDER;
    return size ? `${source}?size=${size}` : String(source);
  });

  // Shopify stores money in the currency's minor units.
  const formatMoney = (cents) => moneyFormatter.format(Number(cents ?? 0) / 100);
  engine.registerFilter('money', formatMoney);
  engine.registerFilter('money_with_currency', (cents) => `${formatMoney(cents)} ${currency}`);
  engine.registerFilter('money_without_trailing_zeros', formatMoney);
  engine.registerFilter('money_without_currency', (cents) =>
    (Number(cents ?? 0) / 100).toFixed(2),
  );

  engine.registerFilter('handle', handleize);
  engine.registerFilter('handleize', handleize);

  engine.registerFilter('t', (key, ...args) => {
    const found = lookupTranslation(translations, key);
    if (typeof found !== 'string') return `translation missing: ${key}`;
    const values = keywordArgs(args);
    return found.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name) =>
      name in values ? String(values[name]) : whole,
    );
  });

  engine.registerFilter(
    'stylesheet_tag',
    (href) => `<link rel="stylesheet" href="${href}" media="all">`,
  );
  engine.registerFilter('script_tag', (src) => `<script src="${src}" defer="defer"></script>`);

  engine.registerFilter('within', (url, collection) =>
    collection?.handle ? `/collections/${collection.handle}${url}` : String(url),
  );

  engine.registerFilter('weight_with_unit', (grams, unit = 'g') => `${grams} ${unit}`);
  engine.registerFilter('link_to', (text, url) => `<a href="${url}">${text}</a>`);

  engine.registerFilter('default_pagination', (paginate) => {
    const pages = paginate?.pages ?? 1;
    if (pages <= 1) return '';
    return Array.from({ length: pages }, (unused, index) => {
      const page = index + 1;
      return page === paginate.current_page
        ? `<span class="page current">${page}</span>`
        : `<a href="?page=${page}">${page}</a>`;
    }).join(' ');
  });

  engine.registerFilter('payment_type_svg_tag', (type) => `<span class="payment-icon">${type}</span>`);
  engine.registerFilter('format_address', (address) =>
    [address?.address1, address?.city, address?.country].filter(Boolean).join('<br>'),
  );
  engine.registerFilter('font_face', () => '');
  engine.registerFilter('font_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('highlight', (text) => text);
  engine.registerFilter('camelize', (value) =>
    String(value ?? '').replace(/[-_](\w)/g, (whole, char) => char.toUpperCase()),
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/filters.test.js`
Expected: PASS — 15 tests.

If the `image_url` keyword-argument tests fail, log `args` inside the filter to confirm how the installed LiquidJS version delivers named arguments, and adjust `keywordArgs` accordingly. Do not change the test — the Liquid syntax it uses is what Shopify requires.

- [ ] **Step 5: Commit**

```bash
git add preview/shims/filters.js tests/filters.test.js
git commit -m "feat: add Shopify liquid filter shims for local preview"
```

---

## Task 6: Shopify tag shims

**Files:**
- Create: `preview/shims/tags.js`
- Test: `tests/tags.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/tags.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Liquid } from 'liquidjs';
import { registerShopifyTags } from '../preview/shims/tags.js';

function makeEngine() {
  const engine = new Liquid({ extname: '.liquid' });
  registerShopifyTags(engine, { sectionsDir: null });
  return engine;
}

const render = (template, scope = {}) => makeEngine().parseAndRenderSync(template, scope);

test('schema blocks render nothing', () => {
  assert.equal(render(`A{% schema %}{"name":"X"}{% endschema %}B`).trim(), 'AB');
});

test('schema blocks containing liquid-like text still render nothing', () => {
  const out = render(`A{% schema %}{"default":"{{ oops }}"}{% endschema %}B`);
  assert.equal(out.trim(), 'AB');
});

test('whitespace-controlled schema blocks render nothing', () => {
  assert.equal(render(`A{%- schema -%}{}{%- endschema -%}B`).trim(), 'AB');
});

test('style tags wrap their body in a style element and evaluate liquid inside', () => {
  const out = render(`{% style %}.a{color:{{ colour }}}{% endstyle %}`, { colour: '#67985E' });
  assert.equal(out, '<style>.a{color:#67985E}</style>');
});

test('stylesheet tags render nothing inline', () => {
  assert.equal(render(`{% stylesheet %}.a{color:red}{% endstylesheet %}`).trim(), '');
});

test('javascript tags render nothing inline', () => {
  assert.equal(render(`{% javascript %}console.log(1){% endjavascript %}`).trim(), '');
});

test('form tags emit a post form with the Shopify form type as a class', () => {
  const out = render(`{% form 'contact' %}<input name="x">{% endform %}`);
  assert.match(out, /<form[^>]+method="post"/);
  assert.match(out, /action="\/contact#contact"/);
  assert.match(out, /class="[^"]*contact-form/);
  assert.match(out, /<input name="x">/);
  assert.match(out, /<\/form>/);
});

test('form tags expose a form object with no errors by default', () => {
  const out = render(`{% form 'contact' %}{% if form.errors %}BAD{% else %}OK{% endif %}{% endform %}`);
  assert.match(out, /OK/);
});

test('paginate exposes the collection slice and page metadata', () => {
  const items = Array.from({ length: 25 }, (unused, index) => index + 1);
  const out = render(
    `{% paginate items by 10 %}{{ paginate.pages }}|{{ paginate.current_page }}|{{ items | size }}{% endpaginate %}`,
    { items },
  );
  assert.equal(out, '3|1|25');
});

test('paginate renders its body once', () => {
  const out = render(`{% paginate items by 10 %}X{% endpaginate %}`, { items: [1, 2, 3] });
  assert.equal(out, 'X');
});

test('section tags render a comment placeholder when no sections directory is configured', () => {
  assert.match(render(`{% section 'header' %}`), /header/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/tags.test.js`
Expected: FAIL — `Cannot find module '../preview/shims/tags.js'`

- [ ] **Step 3: Create `preview/shims/tags.js`**

```js
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractSchema, defaultSettings, defaultBlocks } from '../../scripts/schema-parser.js';

/**
 * Consume raw tokens until the matching end tag, returning their source text.
 * Used for tags whose bodies are not Liquid (schema JSON, stylesheet, javascript).
 */
function consumeRaw(remainTokens, endTagName) {
  let raw = '';
  let token;
  while ((token = remainTokens.shift())) {
    if (token.name === endTagName) return raw;
    raw += typeof token.getText === 'function' ? token.getText() : (token.raw ?? '');
  }
  throw new Error(`Missing {% ${endTagName} %}`);
}

/** A tag that swallows a raw body and emits nothing. */
function rawSwallowTag(endTagName) {
  return {
    parse(tagToken, remainTokens) {
      this.body = consumeRaw(remainTokens, endTagName);
    },
    render() {
      return '';
    },
  };
}

export function registerShopifyTags(engine, options = {}) {
  const { sectionsDir = null, sectionOverrides = {} } = options;

  engine.registerTag('schema', rawSwallowTag('endschema'));
  engine.registerTag('stylesheet', rawSwallowTag('endstylesheet'));
  engine.registerTag('javascript', rawSwallowTag('endjavascript'));

  // {% style %} bodies ARE Liquid — they interpolate section settings.
  engine.registerTag('style', {
    parse(tagToken, remainTokens) {
      this.templates = [];
      const stream = engine.parser
        .parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endstyle', function () {
          this.stop();
        })
        .on('end', () => {
          throw new Error('Missing {% endstyle %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      emitter.write('<style>');
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      emitter.write('</style>');
    },
  });

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
      emitter.write(
        `<form method="post" action="/${formType}#${formType}" accept-charset="UTF-8"` +
          ` class="${formType}-form">` +
          `<input type="hidden" name="form_type" value="${formType}">` +
          `<input type="hidden" name="utf8" value="✓">`,
      );
      ctx.push({ form: { posted_successfully: false, errors: null } });
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    },
  });

  engine.registerTag('paginate', {
    parse(tagToken, remainTokens) {
      // e.g. "collection.products by 12"
      const match = /^(.+?)\s+by\s+(\d+)\s*$/.exec(tagToken.args.trim());
      this.collectionExpression = match ? match[1].trim() : tagToken.args.trim();
      this.pageSize = match ? Number(match[2]) : 20;
      this.templates = [];
      const stream = engine.parser
        .parseStream(remainTokens)
        .on('template', (tpl) => this.templates.push(tpl))
        .on('tag:endpaginate', function () {
          this.stop();
        })
        .on('end', () => {
          throw new Error('Missing {% endpaginate %}');
        });
      stream.start();
    },
    *render(ctx, emitter) {
      const collection = yield engine.evalValue(this.collectionExpression, ctx);
      const items = Array.isArray(collection) ? collection : (collection?.products ?? []);
      const pages = Math.max(1, Math.ceil(items.length / this.pageSize));
      ctx.push({
        paginate: {
          items: items.length,
          current_page: 1,
          current_offset: 0,
          page_size: this.pageSize,
          pages,
          parts: [],
          next: pages > 1 ? { title: 'Next', url: '?page=2', is_link: true } : null,
          previous: null,
        },
      });
      yield engine.renderer.renderTemplates(this.templates, ctx, emitter);
      ctx.pop();
    },
  });

  engine.registerTag('section', {
    parse(tagToken) {
      this.args = tagToken.args;
    },
    *render(ctx, emitter) {
      const name = (this.args.match(/'([^']+)'|"([^"]+)"/) || [])[1];
      if (!name) return;
      if (!sectionsDir) {
        emitter.write(`<!-- section: ${name} -->`);
        return;
      }
      const file = join(sectionsDir, `${name}.liquid`);
      if (!existsSync(file)) {
        emitter.write(`<!-- missing section: ${name} -->`);
        return;
      }
      const source = readFileSync(file, 'utf8');
      const schema = extractSchema(source, `sections/${name}.liquid`);
      const override = sectionOverrides[name] ?? {};
      ctx.push({
        section: {
          id: name,
          settings: { ...defaultSettings(schema), ...(override.settings ?? {}) },
          blocks: override.blocks ?? defaultBlocks(schema),
          shopify_attributes: '',
        },
      });
      const templates = engine.parse(source, file);
      yield engine.renderer.renderTemplates(templates, ctx, emitter);
      ctx.pop();
    },
  });

  // {% sections 'group' %} — section groups are not modelled in preview.
  engine.registerTag('sections', {
    parse(tagToken) {
      this.args = tagToken.args;
    },
    render() {
      return '';
    },
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/tags.test.js`
Expected: PASS — 11 tests.

If `engine.parser.parseStream` is not available on the installed LiquidJS, check the version with `npm ls liquidjs` and consult its `registerTag` docs for the block-tag API; the shape above targets LiquidJS 10.

- [ ] **Step 5: Commit**

```bash
git add preview/shims/tags.js tests/tags.test.js
git commit -m "feat: add Shopify liquid tag shims for local preview"
```

---

## Task 7: Fixture data

Realistic fixtures make the preview meaningful. Products mirror the client's actual packaging mockups.

**Files:**
- Create: `preview/fixtures.js`
- Test: `tests/fixtures.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/fixtures.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';

test('the shop fixture uses Jordanian dinar', () => {
  assert.equal(buildFixtures().shop.currency, 'JOD');
});

test('the four packaging products from the client mockups are present', () => {
  const handles = buildFixtures().collections.all.products.map((product) => product.handle);
  assert.deepEqual(handles, [
    'wadi-rum-blend',
    'dead-sea-blend',
    'downtown-blend',
    'filtered-coffee-bags',
  ]);
});

test('each blend carries the metafields the theme reads', () => {
  for (const product of buildFixtures().collections.all.products.slice(0, 3)) {
    const custom = product.metafields.custom;
    assert.equal(typeof custom.roast_level.value, 'number');
    assert.ok(Array.isArray(custom.tasting_notes.value));
    assert.match(custom.label_color.value, /^#[0-9A-Fa-f]{6}$/);
  }
});

test('label colours match the printed packaging', () => {
  const byHandle = Object.fromEntries(
    buildFixtures().collections.all.products.map((p) => [p.handle, p]),
  );
  assert.equal(byHandle['wadi-rum-blend'].metafields.custom.label_color.value, '#C4562E');
  assert.equal(byHandle['dead-sea-blend'].metafields.custom.label_color.value, '#BFDDD3');
  assert.equal(byHandle['downtown-blend'].metafields.custom.label_color.value, '#7C7F44');
});

test('products expose variants with weight and grind options', () => {
  const product = buildFixtures().collections.all.products[0];
  assert.deepEqual(product.options, ['Weight', 'Grind']);
  assert.ok(product.variants.length >= 2);
  assert.equal(typeof product.variants[0].price, 'number');
  assert.equal(product.variants[0].available, true);
});

test('the cart fixture is empty by default', () => {
  const cart = buildFixtures().cart;
  assert.equal(cart.item_count, 0);
  assert.deepEqual(cart.items, []);
});

test('the main menu links to the four marketing pages and the shop', () => {
  const urls = buildFixtures().linklists['main-menu'].links.map((link) => link.url);
  assert.deepEqual(urls, [
    '/pages/private-label',
    '/pages/wholesale',
    '/pages/our-brands',
    '/collections/all',
  ]);
});
```

The three label colours are sampled from the client's packaging mockups: terracotta for Wadi Rum, mint for Dead Sea, olive for Downtown.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/fixtures.test.js`
Expected: FAIL — `Cannot find module '../preview/fixtures.js'`

- [ ] **Step 3: Create `preview/fixtures.js`**

```js
/**
 * Fake Shopify objects for local preview.
 * Product data mirrors the packaging mockups supplied by the client.
 * Prices are placeholders — see dist/products.csv for the values the client edits.
 */

const metafield = (value, type) => ({ value, type });

function makeBlend({ handle, title, roast, notes, labelColor, description }) {
  const variants = [
    { id: `${handle}-250-wb`, title: '250g / Whole Bean', option1: '250g', option2: 'Whole Bean', price: 750, available: true },
    { id: `${handle}-1kg-wb`, title: '1kg / Whole Bean', option1: '1kg', option2: 'Whole Bean', price: 2600, available: true },
    { id: `${handle}-1kg-esp`, title: '1kg / Espresso', option1: '1kg', option2: 'Espresso', price: 2600, available: true },
  ];
  return {
    id: handle,
    handle,
    title,
    description,
    url: `/products/${handle}`,
    available: true,
    price: variants[0].price,
    price_min: 750,
    price_max: 2600,
    compare_at_price: null,
    options: ['Weight', 'Grind'],
    options_with_values: [
      { name: 'Weight', values: ['250g', '1kg'] },
      { name: 'Grind', values: ['Whole Bean', 'Espresso'] },
    ],
    variants,
    selected_or_first_available_variant: variants[0],
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

export function buildFixtures() {
  const products = [
    makeBlend({
      handle: 'wadi-rum-blend',
      title: 'Wadi Rum Blend',
      roast: 4,
      notes: ['Dark Chocolate', 'Caramel', 'Spice'],
      labelColor: '#C4562E',
      description: 'An espresso roast built for depth — dark chocolate and caramel with a warm spice finish.',
    }),
    makeBlend({
      handle: 'dead-sea-blend',
      title: 'Dead Sea Blend',
      roast: 4,
      notes: ['Dark Chocolate', 'Toffee', 'Balanced'],
      labelColor: '#BFDDD3',
      description: 'Balanced and rounded, with dark chocolate and toffee through the cup.',
    }),
    makeBlend({
      handle: 'downtown-blend',
      title: 'Downtown Blend',
      roast: 4,
      notes: ['Chocolate', 'Caramel', 'Smooth'],
      labelColor: '#7C7F44',
      description: 'Smooth and approachable — chocolate and caramel, made for milk drinks.',
    }),
    {
      id: 'filtered-coffee-bags',
      handle: 'filtered-coffee-bags',
      title: 'Filtered Coffee Bags',
      description: 'Single-serve filter bags, 12 g each. Specialty coffee wherever you are.',
      url: '/products/filtered-coffee-bags',
      available: true,
      price: 900,
      price_min: 900,
      price_max: 900,
      compare_at_price: null,
      options: ['Weight', 'Grind'],
      options_with_values: [
        { name: 'Weight', values: ['Box of 10'] },
        { name: 'Grind', values: ['Filter'] },
      ],
      variants: [
        { id: 'fcb-box10', title: 'Box of 10 / Filter', option1: 'Box of 10', option2: 'Filter', price: 900, available: true },
      ],
      selected_or_first_available_variant: {
        id: 'fcb-box10', title: 'Box of 10 / Filter', option1: 'Box of 10', option2: 'Filter', price: 900, available: true,
      },
      featured_image: '/preview-media/filtered-coffee-bags.jpg',
      images: ['/preview-media/filtered-coffee-bags.jpg'],
      tags: ['filter'],
      type: 'Coffee',
      vendor: 'Azouz Coffee',
      metafields: {
        custom: {
          roast_level: metafield(5, 'number_integer'),
          tasting_notes: metafield(['Rich', 'Full Bodied'], 'list.single_line_text_field'),
          origin: metafield('Blend', 'single_line_text_field'),
          process: metafield('Washed', 'single_line_text_field'),
          altitude: metafield('1,400 masl', 'single_line_text_field'),
          brew_methods: metafield(['Pour Over'], 'list.single_line_text_field'),
          label_color: metafield('#303030', 'color'),
        },
      },
    },
  ];

  const allCollection = {
    id: 'all',
    handle: 'all',
    title: 'Azouz Coffee',
    description: 'Espresso, Turkish, specialty and filter coffee, roasted in Jordan.',
    url: '/collections/all',
    products,
    products_count: products.length,
    all_products_count: products.length,
    image: null,
  };

  return {
    shop: {
      name: 'Azouz Coffee',
      description: 'Specialty coffee roasters. Private label, wholesale and retail coffee, roasted in Jordan.',
      url: 'https://www.azouzcoffee.com',
      domain: 'www.azouzcoffee.com',
      currency: 'JOD',
      money_format: '{{ amount }} JOD',
      email: 'hello@azouzcoffee.com',
      phone: '',
      address: { city: 'Amman', country: 'Jordan' },
    },
    cart: { item_count: 0, items: [], total_price: 0, currency: 'JOD', note: null },
    collections: { all: allCollection },
    products,
    linklists: {
      'main-menu': {
        links: [
          { title: 'Private Label', url: '/pages/private-label', active: false, links: [] },
          { title: 'Wholesale', url: '/pages/wholesale', active: false, links: [] },
          { title: 'Our Brands', url: '/pages/our-brands', active: false, links: [] },
          { title: 'Shop', url: '/collections/all', active: false, links: [] },
        ],
      },
      footer: {
        links: [
          { title: 'Request a Sample', url: '/pages/request-a-sample', active: false, links: [] },
          { title: 'Get a Quote', url: '/pages/get-a-quote', active: false, links: [] },
        ],
      },
    },
    routes: {
      root_url: '/',
      cart_url: '/cart',
      cart_add_url: '/cart/add',
      cart_change_url: '/cart/change',
      search_url: '/search',
      predictive_search_url: '/search/suggest',
      all_products_collection_url: '/collections/all',
      account_url: '/account',
      account_login_url: '/account/login',
    },
    request: { locale: { iso_code: 'en', endonym_name: 'English' }, page_type: 'index', design_mode: false },
    canonical_url: 'https://www.azouzcoffee.com/',
    page_title: 'Azouz Coffee',
    page_description: 'Specialty coffee roasters in Jordan.',
    content_for_header: '',
    content_for_layout: '',
    powered_by_link: '',
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/fixtures.test.js`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add preview/fixtures.js tests/fixtures.test.js
git commit -m "feat: add preview fixtures mirroring the client's real products"
```

---

## Task 8: Liquid engine factory

**Files:**
- Create: `preview/engine.js`
- Test: `tests/engine.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/engine.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEngine, renderThemeFile } from '../preview/engine.js';

async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-engine-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

test('render resolves {% render %} against the snippets directory', async () => {
  const dir = await makeTheme({
    'snippets/badge.liquid': '<span>{{ label }}</span>',
    'sections/demo.liquid': `{% render 'badge', label: 'Espresso' %}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/demo.liquid');
  assert.equal(out.trim(), '<span>Espresso</span>');
});

test('render exposes section settings from the schema defaults', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': `<h1>{{ section.settings.heading }}</h1>
{% schema %}{"name":"Hero","settings":[{"type":"text","id":"heading","default":"Our Roastery."}]}{% endschema %}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/hero.liquid');
  assert.match(out, /<h1>Our Roastery\.<\/h1>/);
});

test('render exposes the fixture globals', async () => {
  const dir = await makeTheme({ 'sections/shopname.liquid': '{{ shop.name }}' });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/shopname.liquid');
  assert.equal(out.trim(), 'Azouz Coffee');
});

test('render resolves translations from the theme locale file', async () => {
  const dir = await makeTheme({
    'locales/en.default.json': '{"general":{"skip":"Skip to content"}}',
    'sections/skip.liquid': `{{ 'general.skip' | t }}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/skip.liquid');
  assert.equal(out.trim(), 'Skip to content');
});

test('{% section %} renders the referenced section file', async () => {
  const dir = await makeTheme({
    'sections/header.liquid': '<header>AZOUZ</header>',
    'layout/theme.liquid': `{% section 'header' %}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'layout/theme.liquid');
  assert.match(out, /<header>AZOUZ<\/header>/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/engine.test.js`
Expected: FAIL — `Cannot find module '../preview/engine.js'`

- [ ] **Step 3: Create `preview/engine.js`**

```js
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Liquid } from 'liquidjs';
import { registerShopifyFilters } from './shims/filters.js';
import { registerShopifyTags } from './shims/tags.js';
import { buildFixtures } from './fixtures.js';

async function readTranslations(themeDir) {
  try {
    return JSON.parse(await readFile(join(themeDir, 'locales', 'en.default.json'), 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Build a LiquidJS engine configured to render this theme's real files.
 * `root` mirrors Shopify's lookup: {% render 'x' %} finds snippets/x.liquid.
 */
export async function createEngine(themeDir) {
  const engine = new Liquid({
    root: [join(themeDir, 'snippets'), join(themeDir, 'sections'), join(themeDir, 'layout')],
    extname: '.liquid',
    jsTruthy: true,
    strictFilters: false,
    strictVariables: false,
    relativeReference: false,
  });

  registerShopifyFilters(engine, {
    assetBase: '/assets/',
    currency: 'JOD',
    locale: 'en',
    translations: await readTranslations(themeDir),
  });
  registerShopifyTags(engine, { sectionsDir: join(themeDir, 'sections') });

  return engine;
}

/**
 * Render one theme file with fixture globals plus its own schema defaults.
 * @param {import('liquidjs').Liquid} engine
 * @param {string} themeDir
 * @param {string} relativePath POSIX-style, e.g. 'sections/hero.liquid'
 * @param {object} [extraScope] values merged over the fixtures
 */
export async function renderThemeFile(engine, themeDir, relativePath, extraScope = {}) {
  const absolute = join(themeDir, ...relativePath.split('/'));
  const source = await readFile(absolute, 'utf8');

  const scope = { ...buildFixtures(), ...extraScope };

  if (relativePath.startsWith('sections/')) {
    const { extractSchema, defaultSettings, defaultBlocks } = await import(
      '../scripts/schema-parser.js'
    );
    const schema = extractSchema(source, relativePath);
    scope.section = {
      id: relativePath.replace('sections/', '').replace('.liquid', ''),
      settings: { ...defaultSettings(schema), ...(extraScope.section?.settings ?? {}) },
      blocks: extraScope.section?.blocks ?? defaultBlocks(schema),
      shopify_attributes: '',
    };
  }

  return engine.parseAndRender(source, scope);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/engine.test.js`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add preview/engine.js tests/engine.test.js
git commit -m "feat: wire a LiquidJS engine that renders real theme files"
```

---

## Task 9: Contrast guard

The brand's primary green cannot carry body-size text. This test encodes that finding so no later change silently regresses it.

**Files:**
- Create: `scripts/contrast.js`
- Create: `scripts/css-tokens.js`
- Test: `tests/contrast.test.js`

- [ ] **Step 1: Write the failing test for the contrast maths**

Create `tests/contrast.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, relativeLuminance } from '../scripts/contrast.js';
import { readCssTokens } from '../scripts/css-tokens.js';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const close = (actual, expected, tolerance = 0.05) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual.toFixed(3)} to be within ${tolerance} of ${expected}`,
  );

test('relativeLuminance is 0 for black and 1 for white', () => {
  close(relativeLuminance('#000000'), 0, 0.001);
  close(relativeLuminance('#FFFFFF'), 1, 0.001);
});

test('contrastRatio of black on white is 21', () => {
  close(contrastRatio('#000000', '#FFFFFF'), 21, 0.01);
});

test('contrastRatio is symmetric', () => {
  close(contrastRatio('#67985E', '#FFFFFF'), contrastRatio('#FFFFFF', '#67985E'));
});

test('contrastRatio matches the hand-computed brand values', () => {
  close(contrastRatio('#FFFFFF', '#67985E'), 3.37);
  close(contrastRatio('#303030', '#FFFBF8'), 12.83);
  close(contrastRatio('#C5B7A4', '#FFFBF8'), 1.91);
  close(contrastRatio('#FFFFFF', '#4F7748'), 5.16);
});

test('shorthand hex is expanded', () => {
  close(contrastRatio('#000', '#fff'), 21, 0.01);
});

test('readCssTokens reads a literal hex declaration', () => {
  assert.equal(readCssTokens(':root{--a:#67985E;}').get('--a'), '#67985E');
});

test('readCssTokens follows a var() chain to the underlying hex', () => {
  const css = ':root{--brand:#67985E;--accent:var(--brand);--button:var(--accent);}';
  assert.equal(readCssTokens(css).get('--button'), '#67985E');
});

test('readCssTokens omits declarations that never resolve to a colour', () => {
  const css = ':root{--gap:1rem;--shadow:0 1px 2px rgb(0 0 0 / 5%);--font:sans-serif;}';
  assert.deepEqual([...readCssTokens(css).keys()], []);
});

test('readCssTokens does not hang on a circular reference', () => {
  const tokens = readCssTokens(':root{--a:var(--b);--b:var(--a);}');
  assert.equal(tokens.has('--a'), false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/contrast.test.js`
Expected: FAIL — `Cannot find module '../scripts/contrast.js'`

- [ ] **Step 3: Create `scripts/contrast.js`**

```js
/** WCAG 2.1 relative luminance and contrast ratio. */

function parseHex(hex) {
  let value = String(hex).trim().replace(/^#/, '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Create `scripts/css-tokens.js`**

```js
/**
 * Read colour custom properties out of a CSS source.
 *
 * Semantic tokens point at brand tokens (`--color-bg: var(--azouz-off-white)`),
 * so a single level of `var()` indirection is not enough — follow the chain
 * until a literal hex is reached. Declarations that never resolve to a hex
 * (shadows, `color-mix`, font stacks, lengths) are omitted.
 */
export function readCssTokens(css) {
  const declared = new Map();
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;}]+?)\s*(?:;|\})/g;
  for (const match of css.matchAll(pattern)) declared.set(match[1], match[2].trim());

  const resolve = (value, seen = new Set()) => {
    const reference = /^var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)$/.exec(value);
    if (!reference) return value;
    const name = reference[1];
    if (seen.has(name)) return value; // circular — give up rather than loop
    seen.add(name);
    const next = declared.get(name);
    return next === undefined ? value : resolve(next, seen);
  };

  const tokens = new Map();
  for (const [name, raw] of declared) {
    const resolved = resolve(raw);
    if (/^#[0-9a-fA-F]{3,8}$/.test(resolved)) tokens.set(name, resolved);
  }
  return tokens;
}
```

- [ ] **Step 5: Run the maths tests to verify they pass**

Run: `node --test tests/contrast.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 6: Add the failing token-contract test**

Append to `tests/contrast.test.js`:

```js
const REQUIRED_TOKENS = [
  '--color-bg',
  '--color-bg-alt',
  '--color-text',
  '--color-text-muted',
  '--color-accent',
  '--color-accent-deep',
  '--color-on-accent',
  '--color-hairline',
];

async function tokens() {
  return readCssTokens(await readFile(resolveInTheme('assets/tokens.css'), 'utf8'));
}

test('every semantic colour token is defined', async () => {
  const map = await tokens();
  for (const name of REQUIRED_TOKENS) assert.ok(map.has(name), `${name} must be defined`);
});

test('the brand primary is exactly the guideline value', async () => {
  assert.equal((await tokens()).get('--color-accent').toUpperCase(), '#67985E');
});

test('body text on both page grounds reaches AAA', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-text'), map.get('--color-bg')) >= 7);
  assert.ok(contrastRatio(map.get('--color-text'), map.get('--color-bg-alt')) >= 7);
});

test('muted text on both page grounds reaches AA', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-text-muted'), map.get('--color-bg')) >= 4.5);
  assert.ok(contrastRatio(map.get('--color-text-muted'), map.get('--color-bg-alt')) >= 4.5);
});

test('the primary green clears AA-large against its on-colour', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-accent')) >= 3);
});

test('the deep green clears AA-normal against its on-colour', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-accent-deep')) >= 4.5);
});

test('deep green as text clears AA-normal on both page grounds', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-accent-deep'), map.get('--color-bg')) >= 4.5);
  assert.ok(contrastRatio(map.get('--color-accent-deep'), map.get('--color-bg-alt')) >= 4.5);
});

test('the hairline token is documented as non-text — it fails text contrast by design', async () => {
  const map = await tokens();
  assert.ok(
    contrastRatio(map.get('--color-hairline'), map.get('--color-bg')) < 4.5,
    'if this ever passes, update the spec: hairline could then be used for text',
  );
});
```

- [ ] **Step 7: Run to verify the new tests fail**

Run: `node --test tests/contrast.test.js`
Expected: FAIL — `ENOENT ... assets/tokens.css`

- [ ] **Step 8: Create `azouz-theme/assets/tokens.css`**

```css
/*
  Azouz Coffee — design tokens
  Source of truth: Azouz Brand Guidelines (17pp), Colour Scheme Guide.

  ACCESSIBILITY CONTRACT — enforced by tests/contrast.test.js.
  Measured WCAG 2.1 ratios:
    Jet        on Off White  12.8:1  AAA
    Muted grey on Off White   5.2:1  AA
    White      on Asparagus   3.4:1  LARGE TEXT ONLY (>=24px, or >=18.66px bold)
    Jet        on Asparagus   3.9:1  LARGE TEXT ONLY
    Taupe      on Off White   1.9:1  NEVER FOR TEXT — borders and rules only
    White      on Deep Green  5.2:1  AA
    Deep Green on Off White   5.0:1  AA

  Therefore: --color-accent is for fills, large display type and button labels.
  Wherever green must carry or sit behind body-size text, use --color-accent-deep.
*/

:root {
  /* --- Brand palette, verbatim from the guidelines --- */
  --azouz-asparagus: #67985e;  /* PRIMARY   — PANTONE 7731 C */
  --azouz-warm-cream: #f6f1e8; /* SECONDARY */
  --azouz-taupe: #c5b7a4;      /* ACCENT            — non-text */
  --azouz-sage: #dee6d5;       /* SUPPORTING ACCENT — non-text */
  --azouz-off-white: #fffbf8;  /* BASE */
  --azouz-jet: #303030;        /* TEXT */

  /* --- Derived for accessibility, same hue family --- */
  --azouz-asparagus-deep: #4f7748;
  --azouz-grey: #6b6b6b;

  /* --- Semantic --- */
  --color-bg: var(--azouz-off-white);
  --color-bg-alt: var(--azouz-warm-cream);
  --color-bg-tint: var(--azouz-sage);
  --color-text: var(--azouz-jet);
  --color-text-muted: var(--azouz-grey);
  --color-accent: var(--azouz-asparagus);
  --color-accent-deep: var(--azouz-asparagus-deep);
  --color-on-accent: #ffffff;
  --color-hairline: var(--azouz-taupe);
  --color-focus: var(--azouz-asparagus-deep);

  /* --- Typography --- */
  --font-body: 'Baloo Bhaijaan 2', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1.0625rem;           /* 17px — guideline digital body minimum */
  --text-lg: 1.25rem;
  --text-xl: clamp(1.5rem, 2.2vw, 1.875rem);
  --text-2xl: clamp(1.875rem, 3.2vw, 2.75rem);
  --text-3xl: clamp(2.25rem, 4.4vw, 3.5rem);
  --text-display: clamp(2.75rem, 6vw, 5rem);

  --leading-display: 1.02;
  --leading-heading: 1.12;
  --leading-body: 1.65;
  --tracking-display: -0.02em;
  --tracking-eyebrow: 0.18em;

  /* --- Space --- */
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1.25rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 4.5rem;
  --space-section: clamp(4rem, 9vw, 8rem);

  /* --- Layout --- */
  --content-max: 80rem;      /* 1280px */
  --content-wide: 90rem;     /* 1440px */
  --content-narrow: 44rem;
  --gutter: clamp(1.25rem, 4vw, 2rem);

  /* --- Surface --- */
  --radius: 4px;
  --radius-lg: 8px;
  --hairline: 1px solid color-mix(in srgb, var(--color-hairline) 40%, transparent);
  --shadow-card: 0 1px 2px rgb(48 48 48 / 4%), 0 8px 24px rgb(48 48 48 / 6%);

  /* --- Motion --- */
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --duration-fast: 160ms;
  --duration: 280ms;
  --duration-slow: 560ms;
}
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `node --test tests/contrast.test.js`
Expected: PASS — 17 tests.

- [ ] **Step 10: Commit**

```bash
git add scripts/contrast.js scripts/css-tokens.js azouz-theme/assets/tokens.css tests/contrast.test.js
git commit -m "feat: add brand design tokens with an enforced WCAG contrast contract"
```

---

## Task 10: Self-hosted fonts

**Files:**
- Create: `scripts/fetch-fonts.js`
- Create: `azouz-theme/assets/fonts.css`
- Create: `azouz-theme/assets/OFL.txt`
- Create: `azouz-theme/assets/baloo-*.woff2` (generated)
- Test: `tests/fonts.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/fonts.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('woff2 files are present for all three weights', async () => {
  const files = await readdir(resolveInTheme('assets'));
  for (const weight of ['400', '600', '700']) {
    assert.ok(
      files.some((name) => name.startsWith('baloo-') && name.includes(weight) && name.endsWith('.woff2')),
      `expected a baloo-*${weight}*.woff2 asset`,
    );
  }
});

test('each woff2 asset is a real font file, not an error page', async () => {
  const files = (await readdir(resolveInTheme('assets'))).filter((n) => n.endsWith('.woff2'));
  assert.ok(files.length > 0);
  for (const name of files) {
    const info = await stat(resolveInTheme(`assets/${name}`));
    assert.ok(info.size > 2000, `${name} is only ${info.size} bytes`);
    const head = await readFile(resolveInTheme(`assets/${name}`));
    assert.equal(head.subarray(0, 4).toString('latin1'), 'wOF2', `${name} lacks the wOF2 signature`);
  }
});

test('fonts.css declares font-display swap for every face', async () => {
  const css = await readFile(resolveInTheme('assets/fonts.css'), 'utf8');
  const faces = css.match(/@font-face/g) ?? [];
  const swaps = css.match(/font-display:\s*swap/g) ?? [];
  assert.ok(faces.length >= 3);
  assert.equal(faces.length, swaps.length);
});

test('fonts.css references only local asset filenames', async () => {
  const css = await readFile(resolveInTheme('assets/fonts.css'), 'utf8');
  assert.equal(/https?:\/\//.test(css), false, 'no external font URLs may remain');
});

test('the OFL licence ships with the fonts', async () => {
  const licence = await readFile(resolveInTheme('assets/OFL.txt'), 'utf8');
  assert.match(licence, /SIL OPEN FONT LICENSE/i);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/fonts.test.js`
Expected: FAIL — `ENOENT` on the assets listing or `fonts.css`.

- [ ] **Step 3: Create `scripts/fetch-fonts.js`**

```js
/**
 * Download Baloo Bhaijaan 2 woff2 files from Google Fonts and emit a local
 * @font-face stylesheet. Self-hosting removes a third-party request on every
 * page load and keeps visitor IPs off Google's servers.
 *
 * Run once: node scripts/fetch-fonts.js
 */
import { writeFile } from 'node:fs/promises';
import { resolveInTheme } from './theme-paths.js';

const FAMILY = 'Baloo Bhaijaan 2';
const WEIGHTS = [400, 600, 700];
const SUBSETS_WANTED = ['latin', 'latin-ext', 'arabic'];

// A modern browser UA is required or Google serves legacy ttf instead of woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const cssUrl =
  `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY).replace(/%20/g, '+')}` +
  `:wght@${WEIGHTS.join(';')}&display=swap`;

/** Split the Google CSS into blocks, each preceded by its `/* subset *\/` comment. */
function parseFaces(css) {
  const faces = [];
  const pattern = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  for (const match of css.matchAll(pattern)) {
    const [, subset, body] = match;
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const url = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
    const unicodeRange = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim();
    if (subset && weight && url) faces.push({ subset, weight, url, unicodeRange });
  }
  return faces;
}

const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then((response) => {
  if (!response.ok) throw new Error(`Google Fonts returned ${response.status}`);
  return response.text();
});

const faces = parseFaces(css).filter((face) => SUBSETS_WANTED.includes(face.subset));
if (faces.length === 0) throw new Error('No matching @font-face blocks were parsed');

const blocks = [];
for (const face of faces) {
  const filename = `baloo-${face.subset}-${face.weight}.woff2`;
  const bytes = Buffer.from(
    await fetch(face.url, { headers: { 'User-Agent': UA } }).then((r) => r.arrayBuffer()),
  );
  if (bytes.subarray(0, 4).toString('latin1') !== 'wOF2') {
    throw new Error(`${filename} is not a woff2 file`);
  }
  await writeFile(resolveInTheme(`assets/${filename}`), bytes);
  console.log(`wrote assets/${filename} (${bytes.length} bytes)`);

  blocks.push(
    [
      '@font-face {',
      `  font-family: '${FAMILY}';`,
      '  font-style: normal;',
      `  font-weight: ${face.weight};`,
      '  font-display: swap;',
      `  src: url('${filename}') format('woff2');`,
      face.unicodeRange ? `  unicode-range: ${face.unicodeRange};` : null,
      '}',
    ]
      .filter(Boolean)
      .join('\n'),
  );
}

const header = `/* Baloo Bhaijaan 2 — SIL Open Font License 1.1. See OFL.txt.
   Generated by scripts/fetch-fonts.js. Do not edit by hand. */\n\n`;
await writeFile(resolveInTheme('assets/fonts.css'), header + blocks.join('\n\n') + '\n', 'utf8');
console.log(`wrote assets/fonts.css with ${blocks.length} faces`);
```

- [ ] **Step 4: Run the font fetch**

Run: `node scripts/fetch-fonts.js`
Expected: several `wrote assets/baloo-…woff2` lines, then `wrote assets/fonts.css with N faces`.

If the machine has no outbound network, download the family manually from `https://fonts.google.com/specimen/Baloo+Bhaijaan+2`, convert the ttf files to woff2, place them in `azouz-theme/assets/` using the `baloo-<subset>-<weight>.woff2` naming, and hand-write `fonts.css` in the same shape. The tests in Step 1 define what "correct" means either way.

- [ ] **Step 5: Save the licence**

Download `OFL.txt` from the family's Google Fonts page (the "License" tab) and save it to `azouz-theme/assets/OFL.txt`. Verify it opens with the words `SIL OPEN FONT LICENSE`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test tests/fonts.test.js`
Expected: PASS — 5 tests.

- [ ] **Step 7: Commit**

```bash
git add scripts/fetch-fonts.js azouz-theme/assets/fonts.css azouz-theme/assets/OFL.txt azouz-theme/assets/baloo-*.woff2 tests/fonts.test.js
git commit -m "feat: self-host Baloo Bhaijaan 2 with an OFL notice"
```

---

## Task 11: Vector logo assets

The client's `.ai` files are PDF-compatible containers holding pure vector paths — confirmed during planning. Extract real SVG rather than tracing the low-resolution PNGs.

**Files:**
- Create: `scripts/extract-logo.py`
- Create: `azouz-theme/assets/logo-primary.svg`, `logo-black.svg`, `logo-white.svg`, `logomark.svg`
- Test: `tests/logo.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/logo.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const VARIANTS = ['logo-primary', 'logo-black', 'logo-white', 'logomark'];

async function svg(name) {
  return readFile(resolveInTheme(`assets/${name}.svg`), 'utf8');
}

test('every logo variant exists and is an svg root element', async () => {
  for (const name of VARIANTS) assert.match(await svg(name), /<svg[\s>]/);
});

test('every logo variant declares a viewBox so it scales cleanly', async () => {
  for (const name of VARIANTS) assert.match(await svg(name), /viewBox="[\d.\s-]+"/);
});

test('no logo variant hard-codes pixel width or height on the root', async () => {
  for (const name of VARIANTS) {
    const root = /<svg[^>]*>/.exec(await svg(name))[0];
    assert.equal(/\swidth="\d/.test(root), false, `${name} pins a width`);
    assert.equal(/\sheight="\d/.test(root), false, `${name} pins a height`);
  }
});

test('the vector content survived extraction', async () => {
  for (const name of VARIANTS) {
    const paths = (await svg(name)).match(/<path/g) ?? [];
    assert.ok(paths.length >= 15, `${name} has only ${paths.length} paths`);
  }
});

test('the primary logo uses the guideline green, not the .ai source green', async () => {
  const source = (await svg('logo-primary')).toLowerCase();
  assert.match(source, /#67985e/);
  assert.equal(source.includes('#67995f'), false, 'the off-by-one .ai green must be normalised');
});

test('the black logo is monochrome jet-black', async () => {
  const fills = new Set((await svg('logo-black')).toLowerCase().match(/#[0-9a-f]{6}/g) ?? []);
  assert.deepEqual([...fills], ['#161617']);
});

test('the white logo is monochrome white', async () => {
  const fills = new Set((await svg('logo-white')).toLowerCase().match(/#[0-9a-f]{6}/g) ?? []);
  assert.deepEqual([...fills], ['#ffffff']);
});

test('the logomark is the wordmark alone — wider aspect than the full lockup', async () => {
  const ratio = async (name) => {
    const [, , w, h] = /viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/
      .exec(await svg(name))
      .slice(1)
      .map(Number);
    return w / h;
  };
  assert.ok(
    (await ratio('logomark')) > (await ratio('logo-black')),
    'the wordmark alone should be proportionally wider than the lockup',
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/logo.test.js`
Expected: FAIL — `ENOENT ... assets/logo-primary.svg`

- [ ] **Step 3: Create `scripts/extract-logo.py`**

```python
"""
Extract vector logo artwork from the client's Illustrator files.

Both .ai files are PDF-compatible containers of pure vector paths (no embedded
images, no embedded fonts), so PyMuPDF can emit clean SVG directly.

Page map, established by rendering each page during planning:
  azouz-logo.ai      p1 white-on-green   p2 white-on-white
                     p3 green-on-white   p4 green-on-black
  AzouzLogoBlack.ai  p1 black lockup, tightly cropped

Run once:  python scripts/extract-logo.py
Requires:  python -m pip install pymupdf
"""
import os
import re

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = ROOT
OUT = os.path.join(ROOT, "azouz-theme", "assets")

# The guidelines PDF is authoritative; the .ai file is one step off.
AI_GREEN = "#67995f"
BRAND_GREEN = "#67985e"


def tidy(svg: str) -> str:
    """Normalise brand green and drop the root's fixed pixel dimensions."""
    svg = re.sub(AI_GREEN, BRAND_GREEN, svg, flags=re.IGNORECASE)
    svg = re.sub(r'(<svg[^>]*?)\s+width="[^"]*"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\s+height="[^"]*"', r"\1", svg, count=1)
    return svg


def write(name: str, svg: str) -> None:
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(tidy(svg))
    print(f"wrote assets/{name} ({len(svg)} bytes)")


def ink_bbox(page) -> fitz.Rect:
    """Union of every drawn path's bounding box."""
    box = fitz.Rect()
    for drawing in page.get_drawings():
        box |= drawing["rect"]
    return box


def main() -> None:
    # --- Full lockup, three colourways -------------------------------------
    colour = fitz.open(os.path.join(SRC, "azouz-logo.ai"))
    write("logo-primary.svg", colour[2].get_svg_image(text_as_path=True))  # green on white
    write("logo-white.svg", colour[1].get_svg_image(text_as_path=True))    # white on white
    colour.close()

    black = fitz.open(os.path.join(SRC, "AzouzLogoBlack.ai"))
    page = black[0]
    write("logo-black.svg", page.get_svg_image(text_as_path=True))

    # --- Logomark: the wordmark alone, without "azouz coffee" --------------
    # Cluster path bounding boxes by vertical position. The wordmark is the
    # tall upper cluster; the strapline is the short lower one. The gap
    # between them is the largest vertical gap in the drawing list.
    rects = sorted((d["rect"] for d in page.get_drawings()), key=lambda r: r.y0)
    gaps = [
        (rects[i + 1].y0 - rects[i].y1, i)
        for i in range(len(rects) - 1)
        if rects[i + 1].y0 > rects[i].y1
    ]
    if not gaps:
        raise SystemExit("Could not find a gap between wordmark and strapline")
    _, split_index = max(gaps)

    wordmark = fitz.Rect()
    for rect in rects[: split_index + 1]:
        wordmark |= rect

    pad = 1.0
    crop = fitz.Rect(
        wordmark.x0 - pad, wordmark.y0 - pad, wordmark.x1 + pad, wordmark.y1 + pad
    ) & page.rect
    page.set_cropbox(crop)
    write("logomark.svg", page.get_svg_image(text_as_path=True))
    black.close()


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the extraction**

Run: `python scripts/extract-logo.py`
Expected: four `wrote assets/…svg` lines.

- [ ] **Step 5: Verify the logomark visually**

The split heuristic must be checked by eye — a wrong split silently produces a broken logo.

```bash
python -c "import fitz; d=fitz.open('azouz-theme/assets/logomark.svg'); d[0].get_pixmap(dpi=300).save('logomark-check.png'); d.close()"
```

Open `logomark-check.png`. It must show the Arabic wordmark عزوز **only**, with no "azouz coffee" strapline and no clipped strokes. If the strapline is still present or the wordmark is cut, adjust `split_index` in the script and re-run. Delete `logomark-check.png` when satisfied.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --test tests/logo.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 7: Commit**

```bash
git add scripts/extract-logo.py azouz-theme/assets/logo-primary.svg azouz-theme/assets/logo-black.svg azouz-theme/assets/logo-white.svg azouz-theme/assets/logomark.svg tests/logo.test.js
git commit -m "feat: extract vector logo variants from the client's illustrator files"
```

---

## Task 12: Kufi pattern texture

The cup mockup carries a geometric Kufi pattern. Rebuild it as a tileable SVG for section dividers at very low opacity.

**Files:**
- Create: `azouz-theme/assets/pattern-kufi.svg`
- Test: `tests/pattern.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/pattern.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = () => readFile(resolveInTheme('assets/pattern-kufi.svg'), 'utf8');

test('the pattern is a square tile', async () => {
  const [, , width, height] = /viewBox="([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/
    .exec(await load())
    .slice(1)
    .map(Number);
  assert.equal(width, height);
});

test('the pattern uses currentColor so it inherits the surrounding text colour', async () => {
  const svg = await load();
  assert.match(svg, /currentColor/);
  assert.equal(/#[0-9a-fA-F]{6}/.test(svg), false, 'no hard-coded colours');
});

test('the pattern has no fill, only strokes — it must read as a line texture', async () => {
  assert.match(await load(), /fill="none"/);
});

test('the pattern contains enough geometry to read as a motif', async () => {
  const shapes = (await load()).match(/<(path|rect|line)\b/g) ?? [];
  assert.ok(shapes.length >= 8, `only ${shapes.length} shapes`);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/pattern.test.js`
Expected: FAIL — `ENOENT ... assets/pattern-kufi.svg`

- [ ] **Step 3: Create `azouz-theme/assets/pattern-kufi.svg`**

Square Kufic meander: interlocking right-angle keys on a 120-unit tile, echoing the cup artwork. Strokes only, `currentColor`, so it takes the colour of whatever it sits inside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"
     stroke="currentColor" stroke-width="6" stroke-linecap="square">
  <path d="M10 10 H50 V38 H26 V62 H50" />
  <path d="M70 10 H110 V50 H86" />
  <path d="M10 82 H34 V110" />
  <path d="M58 86 H86 V62 H110" />
  <path d="M58 110 V86" />
  <path d="M34 34 H42" />
  <path d="M94 74 H110" />
  <rect x="70" y="26" width="16" height="16" />
  <rect x="10" y="46" width="8" height="24" />
</svg>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/pattern.test.js`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add azouz-theme/assets/pattern-kufi.svg tests/pattern.test.js
git commit -m "feat: add tileable kufi pattern texture"
```

---

## Task 13: base.css foundation

**Files:**
- Create: `azouz-theme/assets/base.css`
- Test: `tests/base-css.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/base-css.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = () => readFile(resolveInTheme('assets/base.css'), 'utf8');

test('no physical directional properties are used — RTL readiness', async () => {
  const css = await load();
  const offenders = [];
  const forbidden = [
    /(?<![-\w])margin-left\s*:/g,
    /(?<![-\w])margin-right\s*:/g,
    /(?<![-\w])padding-left\s*:/g,
    /(?<![-\w])padding-right\s*:/g,
    /(?<![-\w])border-left\s*:/g,
    /(?<![-\w])border-right\s*:/g,
    /text-align\s*:\s*(left|right)/g,
  ];
  for (const pattern of forbidden) {
    for (const match of css.matchAll(pattern)) offenders.push(match[0]);
  }
  assert.deepEqual(offenders, [], `use logical properties instead: ${offenders.join(', ')}`);
});

test('all motion is gated behind prefers-reduced-motion', async () => {
  const css = await load();
  const transitions = (css.match(/transition\s*:/g) ?? []).length;
  const animations = (css.match(/animation\s*:/g) ?? []).length;
  if (transitions + animations > 0) {
    assert.match(css, /@media\s*\(prefers-reduced-motion/);
  }
});

test('focus is never removed without a visible replacement', async () => {
  const css = await load();
  for (const match of css.matchAll(/outline\s*:\s*(none|0)/g)) {
    const after = css.slice(match.index, match.index + 400);
    assert.match(after, /outline|box-shadow/, 'outline removal must be paired with a visible ring');
  }
});

test('colour values come from tokens, not literals', async () => {
  const body = (await load()).replace(/\/\*[\s\S]*?\*\//g, '');
  const literals = body.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  assert.deepEqual(literals, [], `move these into tokens.css: ${literals.join(', ')}`);
});

test('the body font resolves through the token', async () => {
  assert.match(await load(), /font-family:\s*var\(--font-body\)/);
});

test('a skip link is styled', async () => {
  assert.match(await load(), /\.skip-link/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/base-css.test.js`
Expected: FAIL — `ENOENT ... assets/base.css`

- [ ] **Step 3: Create `azouz-theme/assets/base.css`**

```css
/*
  Azouz Coffee — foundation styles.
  Tokens live in tokens.css; this file must not contain colour literals.
  All directional properties are logical so the theme flips for Arabic.
*/

/* ---------- Reset ---------- */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body,
h1, h2, h3, h4, h5, h6,
p, figure, blockquote, dl, dd {
  margin: 0;
}

ul[role='list'],
ol[role='list'] {
  list-style: none;
  padding: 0;
  margin: 0;
}

img,
picture,
svg,
video {
  display: block;
  max-width: 100%;
}

img {
  height: auto;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
}

/* ---------- Document ---------- */

body {
  font-family: var(--font-body);
  font-weight: var(--font-weight-regular);
  font-size: var(--text-base);
  line-height: var(--leading-body);
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ---------- Typography ---------- */

h1, h2, h3, h4 {
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-display);
  text-wrap: balance;
}

h1 { font-size: var(--text-display); line-height: var(--leading-display); }
h2 { font-size: var(--text-3xl); }
h3 { font-size: var(--text-xl); }
h4 { font-size: var(--text-lg); }

p {
  text-wrap: pretty;
  max-width: 68ch;
}

a {
  color: inherit;
  text-underline-offset: 0.18em;
  text-decoration-thickness: 1px;
}

/*
  The eyebrow label, lifted from the packaging ("SPECIALTY COFFEE ROASTERS").
  Uses muted grey — Taupe Beige is 1.9:1 here and must never carry text.
*/
.eyebrow {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-eyebrow);
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-block-end: var(--space-md);
}

.lead {
  font-size: var(--text-lg);
  color: var(--color-text-muted);
}

/* ---------- Layout primitives ---------- */

.container {
  inline-size: 100%;
  max-inline-size: var(--content-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.container--wide { max-inline-size: var(--content-wide); }
.container--narrow { max-inline-size: var(--content-narrow); }

.section {
  padding-block: var(--space-section);
}

.section--alt { background-color: var(--color-bg-alt); }
.section--tint { background-color: var(--color-bg-tint); }

/* The one deliberate green band per page. Body text inside uses the deep
   green so white copy clears AA rather than AA-large. */
.section--accent {
  background-color: var(--color-accent-deep);
  color: var(--color-on-accent);
}

.section--accent .eyebrow,
.section--accent .lead {
  color: var(--color-on-accent);
}

.stack > * + * { margin-block-start: var(--space-md); }
.stack--lg > * + * { margin-block-start: var(--space-lg); }

.grid {
  display: grid;
  gap: var(--space-lg);
}

.grid--2 { grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr)); }
.grid--3 { grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)); }
.grid--4 { grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); }

.rule {
  border: 0;
  border-block-start: var(--hairline);
  margin-block: var(--space-md);
}

/* ---------- Buttons ---------- */

.button {
  --button-bg: var(--color-accent);
  --button-fg: var(--color-on-accent);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  min-block-size: 3rem;
  padding-inline: var(--space-lg);
  padding-block: var(--space-sm);

  /* 18px semibold clears WCAG's large-text threshold, which is what makes
     white-on-primary-green (3.4:1) permissible here. */
  font-size: 1.125rem;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  letter-spacing: 0.01em;
  text-decoration: none;

  color: var(--button-fg);
  background-color: var(--button-bg);
  border: 1px solid transparent;
  border-radius: var(--radius);
}

.button:hover { --button-bg: var(--color-accent-deep); }

.button--secondary {
  --button-bg: transparent;
  --button-fg: var(--color-text);
  border-color: var(--color-text);
}

.button--secondary:hover {
  --button-bg: var(--color-text);
  --button-fg: var(--color-bg);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

/* ---------- The packaging label block ----------
   The signature component, taken directly from the coffee bags: a solid
   colour panel, a tight title, a hairline, then a spec grid. Its fill comes
   from the product's label_color metafield via the --label-bg custom property.
   Titles inside are >=24px, which is why they may sit on the primary green. */

.label-block {
  --label-bg: var(--color-accent);
  --label-fg: var(--color-on-accent);

  padding: var(--space-lg);
  color: var(--label-fg);
  background-color: var(--label-bg);
  border-radius: var(--radius);
}

.label-block__title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--leading-heading);
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.label-block__subtitle {
  font-size: var(--text-sm);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.label-block__rule {
  border: 0;
  border-block-start: 1px solid currentColor;
  opacity: 0.35;
  margin-block: var(--space-md);
}

.label-block__specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
}

/* ---------- Roast meter ---------- */

.roast-meter {
  display: inline-flex;
  gap: 0.4em;
  align-items: center;
}

.roast-meter__dot {
  inline-size: 0.6em;
  block-size: 0.6em;
  border-radius: 50%;
  border: 1px solid currentColor;
}

.roast-meter__dot--filled { background-color: currentColor; }

/* ---------- Texture ---------- */

.texture-kufi {
  background-image: url('pattern-kufi.svg');
  background-repeat: repeat;
  background-size: 120px 120px;
  opacity: 0.04;
  pointer-events: none;
}

/* ---------- Accessibility ---------- */

.visually-hidden:not(:focus):not(:active) {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.skip-link {
  position: absolute;
  inset-block-start: var(--space-xs);
  inset-inline-start: var(--space-xs);
  z-index: 100;
  padding: var(--space-sm) var(--space-md);
  color: var(--color-on-accent);
  background-color: var(--color-accent-deep);
  border-radius: var(--radius);
  transform: translateY(-200%);
}

.skip-link:focus { transform: translateY(0); }

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

/* ---------- Motion ---------- */

@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 0;
    transform: translateY(1.25rem);
    transition:
      opacity var(--duration-slow) var(--ease),
      transform var(--duration-slow) var(--ease);
  }

  .reveal.is-visible {
    opacity: 1;
    transform: none;
  }

  .button {
    transition:
      background-color var(--duration-fast) var(--ease),
      color var(--duration-fast) var(--ease);
  }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/base-css.test.js`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add azouz-theme/assets/base.css tests/base-css.test.js
git commit -m "feat: add base stylesheet with logical properties and the label-block component"
```

---

## Task 14: Meta tags and structured data snippets

**Files:**
- Create: `azouz-theme/snippets/meta-tags.liquid`
- Create: `azouz-theme/snippets/structured-data.liquid`
- Test: `tests/meta-tags.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/meta-tags.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const renderSnippet = async (name, scope) => {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, `snippets/${name}.liquid`, scope);
};

test('meta-tags renders a title element', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /<title>/);
});

test('meta-tags falls back to the shop name when there is no page title', async () => {
  const out = await renderSnippet('meta-tags', { page_title: null });
  assert.match(out, /Azouz Coffee/);
});

test('meta-tags emits a canonical link', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /<link rel="canonical" href="https:\/\/www\.azouzcoffee\.com\/">/);
});

test('meta-tags emits Open Graph and Twitter card tags', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /property="og:title"/);
  assert.match(out, /property="og:type"/);
  assert.match(out, /name="twitter:card"/);
});

test('meta-tags sets the viewport', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /name="viewport"[^>]*width=device-width/);
});

test('structured-data emits valid Organization JSON-LD', async () => {
  const out = await renderSnippet('structured-data', {});
  const json = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(out)[1]);
  assert.equal(json['@type'], 'Organization');
  assert.equal(json.name, 'Azouz Coffee');
  assert.equal(json.url, 'https://www.azouzcoffee.com');
});

test('structured-data emits Product JSON-LD on a product page', async () => {
  const fixtureProduct = {
    title: 'Wadi Rum Blend',
    description: 'An espresso roast.',
    url: '/products/wadi-rum-blend',
    featured_image: '/preview-media/wadi-rum-blend.jpg',
    vendor: 'Azouz Coffee',
    price: 750,
    available: true,
  };
  const out = await renderSnippet('structured-data', {
    request: { page_type: 'product' },
    product: fixtureProduct,
  });
  const blocks = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = blocks.map((block) => JSON.parse(block[1])['@type']);
  assert.ok(types.includes('Product'), `got ${types.join(', ')}`);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/meta-tags.test.js`
Expected: FAIL — the snippet files do not exist.

- [ ] **Step 3: Create `azouz-theme/snippets/meta-tags.liquid`**

```liquid
{%- comment -%}
  Document head metadata. Rendered once from layout/theme.liquid.
{%- endcomment -%}

<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

{%- liquid
  assign meta_title = page_title | default: shop.name
  assign meta_description = page_description | default: shop.description
-%}

<title>{{ meta_title }}{% unless page_title contains shop.name %} &middot; {{ shop.name }}{% endunless %}</title>

{%- if meta_description != blank -%}
  <meta name="description" content="{{ meta_description | escape }}">
{%- endif -%}

{%- if canonical_url != blank -%}
  <link rel="canonical" href="{{ canonical_url }}">
{%- endif -%}

<meta property="og:site_name" content="{{ shop.name | escape }}">
<meta property="og:title" content="{{ meta_title | escape }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:type" content="{% if request.page_type == 'product' %}product{% else %}website{% endif %}">
{%- if meta_description != blank -%}
  <meta property="og:description" content="{{ meta_description | escape }}">
{%- endif -%}
{%- if request.page_type == 'product' and product.featured_image -%}
  <meta property="og:image" content="{{ product.featured_image | image_url: width: 1200 }}">
{%- else -%}
  <meta property="og:image" content="{{ 'logo-primary.svg' | asset_url }}">
{%- endif -%}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ meta_title | escape }}">
{%- if meta_description != blank -%}
  <meta name="twitter:description" content="{{ meta_description | escape }}">
{%- endif -%}

<meta name="theme-color" content="{{ settings.color_accent | default: '#67985E' }}">
```

- [ ] **Step 4: Create `azouz-theme/snippets/structured-data.liquid`**

```liquid
{%- comment -%}
  JSON-LD. Organization on every page; Product and BreadcrumbList where relevant.
{%- endcomment -%}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": {{ shop.name | json }},
  "url": {{ shop.url | json }},
  "logo": {{ 'logo-primary.svg' | asset_url | json }},
  "description": {{ shop.description | json }}
  {%- if shop.address.country != blank -%},
  "address": {
    "@type": "PostalAddress",
    "addressLocality": {{ shop.address.city | json }},
    "addressCountry": {{ shop.address.country | json }}
  }
  {%- endif -%}
}
</script>

{%- if request.page_type == 'product' and product -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": {{ product.title | json }},
  "description": {{ product.description | strip_html | json }},
  "url": {{ product.url | json }},
  "image": {{ product.featured_image | json }},
  "brand": { "@type": "Brand", "name": {{ product.vendor | default: shop.name | json }} },
  "offers": {
    "@type": "Offer",
    "price": {{ product.price | divided_by: 100.0 | json }},
    "priceCurrency": {{ shop.currency | json }},
    "availability": "https://schema.org/{% if product.available %}InStock{% else %}OutOfStock{% endif %}",
    "url": {{ product.url | json }}
  }
}
</script>
{%- endif -%}

{%- if request.page_type == 'collection' and collection -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": {{ shop.url | json }} },
    { "@type": "ListItem", "position": 2, "name": {{ collection.title | json }} }
  ]
}
</script>
{%- endif -%}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/meta-tags.test.js`
Expected: PASS — 7 tests.

- [ ] **Step 6: Commit**

```bash
git add azouz-theme/snippets/meta-tags.liquid azouz-theme/snippets/structured-data.liquid tests/meta-tags.test.js
git commit -m "feat: add meta tag and JSON-LD snippets"
```

---

## Task 15: Base locale file

Every user-visible string lives here, so Arabic can be added later without touching markup.

**Files:**
- Create: `azouz-theme/locales/en.default.json`
- Create: `azouz-theme/locales/en.default.schema.json`
- Test: `tests/locales.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/locales.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = async (name) => JSON.parse(await readFile(resolveInTheme(`locales/${name}`), 'utf8'));

const REQUIRED_KEYS = [
  'general.accessibility.skip_to_content',
  'general.accessibility.close',
  'general.accessibility.menu',
  'general.search.title',
  'general.meta.tags',
  'products.product.add_to_cart',
  'products.product.sold_out',
  'products.product.roast_level',
  'products.product.tasting_notes',
  'cart.general.title',
  'cart.general.empty',
  'cart.general.checkout',
  'contact.form.name',
  'contact.form.email',
  'contact.form.send',
  'contact.form.success',
];

function lookup(object, dottedKey) {
  return dottedKey.split('.').reduce((node, part) => (node ? node[part] : undefined), object);
}

test('every key the theme relies on is present', async () => {
  const locale = await load('en.default.json');
  const missing = REQUIRED_KEYS.filter((key) => typeof lookup(locale, key) !== 'string');
  assert.deepEqual(missing, []);
});

test('no translation value is left blank', async () => {
  const locale = await load('en.default.json');
  const blanks = [];
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      const next = path ? `${path}.${key}` : key;
      if (typeof value === 'string') {
        if (value.trim() === '') blanks.push(next);
      } else if (value && typeof value === 'object') {
        walk(value, next);
      }
    }
  };
  walk(locale, '');
  assert.deepEqual(blanks, []);
});

test('the schema locale carries theme editor labels', async () => {
  const schema = await load('en.default.schema.json');
  assert.equal(typeof schema.settings_schema, 'object');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/locales.test.js`
Expected: FAIL — `ENOENT ... locales/en.default.json`

- [ ] **Step 3: Create `azouz-theme/locales/en.default.json`**

```json
{
  "general": {
    "accessibility": {
      "skip_to_content": "Skip to content",
      "close": "Close",
      "menu": "Menu",
      "open_cart": "Open cart",
      "previous": "Previous",
      "next": "Next"
    },
    "search": {
      "title": "Search",
      "placeholder": "Search coffee",
      "submit": "Search",
      "no_results": "No results for \"{{ terms }}\"."
    },
    "meta": {
      "tags": "Tagged \"{{ tags }}\"",
      "page": "Page {{ page }}"
    },
    "newsletter": {
      "label": "Email",
      "submit": "Subscribe",
      "success": "Thanks for subscribing."
    },
    "404": {
      "title": "Page not found",
      "subtext": "The page you were looking for does not exist.",
      "link": "Back to home"
    }
  },
  "products": {
    "product": {
      "add_to_cart": "Add to cart",
      "sold_out": "Sold out",
      "unavailable": "Unavailable",
      "quantity": "Quantity",
      "price": "Price",
      "from_price": "From {{ price }}",
      "roast_level": "Roast level",
      "tasting_notes": "Tasting notes",
      "origin": "Origin",
      "process": "Process",
      "altitude": "Altitude",
      "brew_methods": "Brewing methods",
      "view_details": "View details"
    }
  },
  "collections": {
    "general": {
      "no_products": "No products in this collection yet.",
      "product_count": "{{ count }} products"
    }
  },
  "cart": {
    "general": {
      "title": "Your cart",
      "empty": "Your cart is empty.",
      "continue_shopping": "Continue shopping",
      "subtotal": "Subtotal",
      "checkout": "Check out",
      "remove": "Remove",
      "taxes_note": "Taxes and shipping calculated at checkout."
    }
  },
  "contact": {
    "form": {
      "heading": "Tell us what you are looking for",
      "name": "Name",
      "company": "Company",
      "email": "Email",
      "phone": "Phone",
      "business_type": "Business type",
      "coffee_type": "Coffee type",
      "volume": "Expected monthly volume",
      "message": "Message",
      "send": "Send enquiry",
      "success": "Thanks — we have your enquiry and will be in touch shortly.",
      "error": "Please check the highlighted fields and try again."
    }
  },
  "layout": {
    "footer": {
      "copyright": "Azouz Coffee",
      "rights": "All rights reserved."
    }
  }
}
```

- [ ] **Step 4: Create `azouz-theme/locales/en.default.schema.json`**

```json
{
  "settings_schema": {
    "brand": {
      "name": "Brand",
      "settings": {
        "logo": { "label": "Logo", "info": "SVG recommended. Never display below 57 px tall." },
        "logo_width": { "label": "Logo width" },
        "favicon": { "label": "Favicon" }
      }
    },
    "colors": {
      "name": "Colours",
      "settings": {
        "color_accent": { "label": "Primary green" },
        "color_accent_deep": { "label": "Deep green" }
      }
    },
    "social": {
      "name": "Social",
      "settings": {
        "instagram": { "label": "Instagram URL" },
        "facebook": { "label": "Facebook URL" },
        "whatsapp": { "label": "WhatsApp number" }
      }
    }
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/locales.test.js`
Expected: PASS — 3 tests.

- [ ] **Step 6: Commit**

```bash
git add azouz-theme/locales tests/locales.test.js
git commit -m "feat: add english locale files"
```

---

## Task 16: theme.liquid layout

**Files:**
- Create: `azouz-theme/layout/theme.liquid`
- Test: `tests/theme-layout.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/theme-layout.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const renderLayout = async (scope = {}) => {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', scope);
};

test('the layout renders a complete html document', async () => {
  const out = await renderLayout();
  assert.match(out, /^<!doctype html>/i);
  assert.match(out, /<\/html>\s*$/i);
});

test('the html element carries lang and dir from the request locale', async () => {
  const out = await renderLayout();
  assert.match(out, /<html[^>]+lang="en"/);
  assert.match(out, /<html[^>]+dir="ltr"/);
});

test('the html element flips to rtl for a right-to-left locale', async () => {
  const out = await renderLayout({ request: { locale: { iso_code: 'ar' }, page_type: 'index' } });
  assert.match(out, /<html[^>]+lang="ar"/);
  assert.match(out, /<html[^>]+dir="rtl"/);
});

test('the layout links the token, font and base stylesheets in that order', async () => {
  const out = await renderLayout();
  const order = ['tokens.css', 'fonts.css', 'base.css'].map((name) => out.indexOf(name));
  assert.ok(order.every((index) => index > -1), 'all three stylesheets must be linked');
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'tokens must load before base');
});

test('the layout preloads the regular-weight latin font', async () => {
  const out = await renderLayout();
  assert.match(out, /<link rel="preload"[^>]+baloo-latin-400\.woff2[^>]+as="font"/);
});

test('the layout renders a skip link before the header', async () => {
  const out = await renderLayout();
  assert.ok(out.indexOf('skip-link') < out.indexOf('<!-- section: header -->') ||
            out.indexOf('skip-link') < out.indexOf('<header'));
});

test('the layout has a main landmark with the skip-link target id', async () => {
  const out = await renderLayout();
  assert.match(out, /<main[^>]+id="MainContent"/);
  assert.match(out, /href="#MainContent"/);
});

test('the layout yields content_for_layout inside main', async () => {
  const out = await renderLayout({ content_for_layout: '<p>PAGE BODY</p>' });
  const main = /<main[\s\S]*?<\/main>/.exec(out)[0];
  assert.match(main, /<p>PAGE BODY<\/p>/);
});

test('the layout renders the meta tags and structured data snippets', async () => {
  const out = await renderLayout();
  assert.match(out, /<title>/);
  assert.match(out, /application\/ld\+json/);
});

test('theme.js is deferred so it never blocks rendering', async () => {
  const out = await renderLayout();
  assert.match(out, /theme\.js[^>]*defer/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/theme-layout.test.js`
Expected: FAIL — `ENOENT ... layout/theme.liquid`

- [ ] **Step 3: Create `azouz-theme/layout/theme.liquid`**

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

    <link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
    <link rel="icon" type="image/svg+xml" href="{{ 'logomark.svg' | asset_url }}">

    {%- comment -%}
      Only the regular-weight Latin face is preloaded. It carries the body copy
      and is needed for first paint; the other faces load on demand via swap.
    {%- endcomment -%}
    <link rel="preload" href="{{ 'baloo-latin-400.woff2' | asset_url }}" as="font" type="font/woff2" crossorigin>

    {{ 'tokens.css' | asset_url | stylesheet_tag }}
    {{ 'fonts.css' | asset_url | stylesheet_tag }}
    {{ 'base.css' | asset_url | stylesheet_tag }}

    <script>document.documentElement.classList.replace('no-js', 'js');</script>
    <script src="{{ 'theme.js' | asset_url }}" defer="defer"></script>

    {%- render 'structured-data' -%}

    {{ content_for_header }}
  </head>

  <body class="template-{{ request.page_type | default: 'index' }}">
    <a class="skip-link" href="#MainContent">{{ 'general.accessibility.skip_to_content' | t }}</a>

    {% section 'announcement-bar' %}
    {% section 'header' %}

    <main id="MainContent" tabindex="-1">
      {{ content_for_layout }}
    </main>

    {% section 'footer' %}
  </body>
</html>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/theme-layout.test.js`
Expected: PASS — 10 tests.

The `{% section %}` calls for `announcement-bar`, `header` and `footer` render as `<!-- missing section: … -->` comments at this stage. Those sections are built in Plan B; the layout tests deliberately do not depend on them.

- [ ] **Step 5: Commit**

```bash
git add azouz-theme/layout/theme.liquid tests/theme-layout.test.js
git commit -m "feat: add theme layout with rtl-aware document shell"
```

---

## Task 17: Theme settings, runtime script, image placeholder

Three loose ends that the layout and the validators already depend on:
`config/settings_schema.json` is required by Shopify, `theme.js` is referenced by
`theme.liquid`, and `placeholder.svg` is what the preview's `image_url` shim
falls back to. Without these the preview 404s and Task 18's validator fails.

**Files:**
- Create: `azouz-theme/config/settings_schema.json`
- Create: `azouz-theme/config/settings_data.json`
- Create: `azouz-theme/assets/theme.js`
- Create: `azouz-theme/assets/placeholder.svg`
- Test: `tests/settings.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/settings.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const loadJson = async (path) => JSON.parse(await readFile(resolveInTheme(path), 'utf8'));

test('settings_schema is an array whose first entry is theme_info', async () => {
  const schema = await loadJson('config/settings_schema.json');
  assert.ok(Array.isArray(schema));
  assert.equal(schema[0].name, 'theme_info');
  assert.equal(typeof schema[0].theme_name, 'string');
  assert.equal(typeof schema[0].theme_version, 'string');
});

test('every settings group declares a name and a settings array', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  assert.ok(groups.length > 0);
  for (const group of groups) {
    assert.equal(typeof group.name, 'string');
    assert.ok(Array.isArray(group.settings), `${group.name} needs a settings array`);
  }
});

test('every setting has a unique id', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  const ids = groups.flatMap((group) =>
    group.settings.filter((setting) => setting.id).map((setting) => setting.id),
  );
  assert.deepEqual([...new Set(ids)], ids, 'duplicate setting ids');
});

test('the accent colour defaults to the guideline primary', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  const accent = groups
    .flatMap((group) => group.settings)
    .find((setting) => setting.id === 'color_accent');
  assert.equal(accent.default.toUpperCase(), '#67985E');
});

test('settings_data provides a current preset', async () => {
  const data = await loadJson('config/settings_data.json');
  assert.equal(typeof data.current, 'object');
});

test('every id in settings_data exists in settings_schema', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  const known = new Set(
    groups.flatMap((group) => group.settings.map((setting) => setting.id)).filter(Boolean),
  );
  const data = await loadJson('config/settings_data.json');
  const unknown = Object.keys(data.current).filter((key) => !known.has(key));
  assert.deepEqual(unknown, []);
});

test('theme.js registers the reveal element base.css styles', async () => {
  const js = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(js, /customElements\.define\(\s*'reveal-on-scroll'/);
});

test('theme.js respects prefers-reduced-motion', async () => {
  const js = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(js, /prefers-reduced-motion/);
});

test('the placeholder is an svg using currentColor', async () => {
  const svg = await readFile(resolveInTheme('assets/placeholder.svg'), 'utf8');
  assert.match(svg, /<svg/);
  assert.match(svg, /viewBox=/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/settings.test.js`
Expected: FAIL — `ENOENT ... config/settings_schema.json`

- [ ] **Step 3: Create `azouz-theme/config/settings_schema.json`**

```json
[
  {
    "name": "theme_info",
    "theme_name": "Azouz",
    "theme_version": "1.0.0",
    "theme_author": "Viet An Luong",
    "theme_documentation_url": "https://www.azouzcoffee.com",
    "theme_support_url": "https://www.azouzcoffee.com"
  },
  {
    "name": "Brand",
    "settings": [
      {
        "type": "image_picker",
        "id": "logo",
        "label": "Logo",
        "info": "SVG recommended. The brand guidelines set a minimum display height of 57 px for the full lockup."
      },
      {
        "type": "range",
        "id": "logo_height",
        "label": "Logo height",
        "min": 57,
        "max": 120,
        "step": 1,
        "unit": "px",
        "default": 64,
        "info": "Cannot go below 57 px — that is the brand guidelines minimum."
      },
      {
        "type": "image_picker",
        "id": "favicon",
        "label": "Favicon",
        "info": "Uses the logomark. Square image, at least 96 x 96 px."
      }
    ]
  },
  {
    "name": "Colours",
    "settings": [
      {
        "type": "color",
        "id": "color_accent",
        "label": "Primary green",
        "default": "#67985E",
        "info": "PANTONE 7731 C. Used for fills, large headings and buttons."
      },
      {
        "type": "color",
        "id": "color_accent_deep",
        "label": "Deep green",
        "default": "#4F7748",
        "info": "Darker shade used wherever green sits behind body-size text, so the contrast passes WCAG AA. Changing this can break accessibility."
      },
      {
        "type": "color",
        "id": "color_background",
        "label": "Page background",
        "default": "#FFFBF8"
      },
      {
        "type": "color",
        "id": "color_background_alt",
        "label": "Alternate band background",
        "default": "#F6F1E8"
      },
      {
        "type": "color",
        "id": "color_text",
        "label": "Text",
        "default": "#303030"
      }
    ]
  },
  {
    "name": "Enquiries",
    "settings": [
      {
        "type": "paragraph",
        "content": "Enquiry forms are delivered to the store's sender email, set in Shopify admin under Settings → Notifications."
      },
      {
        "type": "url",
        "id": "sample_page_url",
        "label": "Request a sample page"
      },
      {
        "type": "url",
        "id": "quote_page_url",
        "label": "Get a quote page"
      }
    ]
  },
  {
    "name": "Social",
    "settings": [
      { "type": "url", "id": "social_instagram", "label": "Instagram" },
      { "type": "url", "id": "social_facebook", "label": "Facebook" },
      {
        "type": "text",
        "id": "social_whatsapp",
        "label": "WhatsApp number",
        "info": "International format, e.g. 962790000000"
      }
    ]
  }
]
```

- [ ] **Step 4: Create `azouz-theme/config/settings_data.json`**

```json
{
  "current": {
    "logo_height": 64,
    "color_accent": "#67985E",
    "color_accent_deep": "#4F7748",
    "color_background": "#FFFBF8",
    "color_background_alt": "#F6F1E8",
    "color_text": "#303030",
    "sample_page_url": "/pages/request-a-sample",
    "quote_page_url": "/pages/get-a-quote",
    "social_instagram": "",
    "social_facebook": "",
    "social_whatsapp": ""
  }
}
```

- [ ] **Step 5: Create `azouz-theme/assets/theme.js`**

Only the scroll reveal belongs in Plan A — `base.css` already styles `.reveal`, so without this the class would sit at `opacity: 0` forever. Cart, variant picker and quantity components arrive in Plan C.

```js
/*
  Azouz Coffee — theme runtime.
  Vanilla custom elements, no dependencies. Every component degrades to
  working HTML when JavaScript is unavailable.
*/

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * <reveal-on-scroll> fades its children up as they enter the viewport.
 *
 * Content is visible by default in CSS; this element only *adds* the
 * animation. If the script never runs, or motion is reduced, everything is
 * simply shown — nothing is ever hidden by JavaScript alone.
 */
class RevealOnScroll extends HTMLElement {
  connectedCallback() {
    const targets = this.querySelectorAll('.reveal');
    if (targets.length === 0) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((element) => element.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          entry.target.style.transitionDelay = `${Math.min(index, 6) * 60}ms`;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );

    targets.forEach((element) => observer.observe(element));
  }
}

if (!customElements.get('reveal-on-scroll')) {
  customElements.define('reveal-on-scroll', RevealOnScroll);
}
```

- [ ] **Step 6: Create `azouz-theme/assets/placeholder.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5" role="img" aria-label="Coffee bag placeholder">
  <rect width="4" height="5" fill="currentColor" opacity="0.06" />
  <rect x="0.7" y="0.6" width="2.6" height="3.8" rx="0.12" fill="currentColor" opacity="0.12" />
  <rect x="1.3" y="2.1" width="1.4" height="0.9" rx="0.06" fill="currentColor" opacity="0.18" />
</svg>
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `node --test tests/settings.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 8: Commit**

```bash
git add azouz-theme/config azouz-theme/assets/theme.js azouz-theme/assets/placeholder.svg tests/settings.test.js
git commit -m "feat: add theme settings schema, runtime script and image placeholder"
```

---

## Task 18: Preview server and full-suite green

**Files:**
- Create: `preview/server.js`
- Create: `scripts/validate-all.js`
- Test: `tests/validate-all.test.js`

- [ ] **Step 1: Write the failing test for the aggregate validator**

Create `tests/validate-all.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectFindings } from '../scripts/validate-all.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

test('the real theme directory has no structural or JSON findings', async () => {
  const findings = await collectFindings(THEME_DIR);
  assert.deepEqual(findings, [], findings.map((f) => `${f.kind}: ${f.detail}`).join('\n'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/validate-all.test.js`
Expected: FAIL — `Cannot find module '../scripts/validate-all.js'`

- [ ] **Step 3: Create `scripts/validate-all.js`**

```js
import {
  findMissingRequiredFiles,
  findDisallowedTopLevelEntries,
  findDefaultLocale,
} from './validate-structure.js';
import { findInvalidJson } from './validate-json.js';
import { THEME_DIR } from './theme-paths.js';

/** @returns {Promise<Array<{kind: string, detail: string}>>} */
export async function collectFindings(themeDir) {
  const findings = [];

  for (const file of await findMissingRequiredFiles(themeDir)) {
    findings.push({ kind: 'missing-required-file', detail: file });
  }

  if (!(await findDefaultLocale(themeDir))) {
    findings.push({ kind: 'missing-default-locale', detail: 'locales/*.default.json' });
  }

  for (const entry of await findDisallowedTopLevelEntries(themeDir)) {
    findings.push({ kind: 'disallowed-top-level-entry', detail: entry });
  }

  for (const finding of await findInvalidJson(themeDir)) {
    findings.push({ kind: 'invalid-json', detail: `${finding.file}: ${finding.message}` });
  }

  return findings;
}

// CLI entry point: `npm run validate`
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const findings = await collectFindings(THEME_DIR);
  if (findings.length === 0) {
    console.log('Theme validation passed.');
  } else {
    for (const finding of findings) console.error(`[${finding.kind}] ${finding.detail}`);
    process.exitCode = 1;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/validate-all.test.js`
Expected: PASS — 1 test.

- [ ] **Step 5: Create `preview/server.js`**

```js
/**
 * Local preview server. Renders the real theme files so what is reviewed is
 * what ships. This is a development aid, not a Shopify emulator — see the
 * spec's "Stated limitations" for what cannot be verified here.
 *
 * Run: npm run preview   ->   http://localhost:4321
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createEngine, renderThemeFile } from './engine.js';
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

/** URL path -> the page_type and extra scope the theme should render with. */
const ROUTES = {
  '/': { page_type: 'index' },
  '/pages/private-label': { page_type: 'page' },
  '/pages/wholesale': { page_type: 'page' },
  '/pages/our-brands': { page_type: 'page' },
  '/pages/request-a-sample': { page_type: 'page' },
  '/pages/get-a-quote': { page_type: 'page' },
  '/collections/all': { page_type: 'collection' },
  '/cart': { page_type: 'cart' },
  '/search': { page_type: 'search' },
};

async function serveAsset(response, urlPath) {
  // Strip the leading /assets/ and refuse anything that escapes the directory.
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

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path.startsWith('/assets/')) return serveAsset(response, path);

  const route = ROUTES[path.replace(/\/$/, '') || '/'] ?? { page_type: 'page' };

  try {
    const engine = await createEngine(THEME_DIR);
    const fixtures = buildFixtures();
    const html = await renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
      ...fixtures,
      request: { ...fixtures.request, page_type: route.page_type },
      content_for_layout: `<div class="container section"><p class="lead">Preview route <code>${path}</code> — templates arrive in Plan B.</p></div>`,
    });
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
  } catch (error) {
    response
      .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      .end(`Render error on ${path}\n\n${error.stack}`);
  }
});

server.listen(PORT, () => {
  console.log(`Azouz preview: http://localhost:${PORT}`);
  for (const route of Object.keys(ROUTES)) console.log(`  http://localhost:${PORT}${route}`);
});
```

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS — every test file green: 133 tests across 18 files.

| File | Tests |
|---|---|
| `theme-paths` | 3 |
| `validate-structure` | 8 |
| `validate-json` | 4 |
| `schema-parser` | 10 |
| `filters` | 15 |
| `tags` | 11 |
| `fixtures` | 7 |
| `engine` | 5 |
| `contrast` | 17 |
| `fonts` | 5 |
| `logo` | 8 |
| `pattern` | 4 |
| `base-css` | 6 |
| `meta-tags` | 7 |
| `locales` | 3 |
| `settings` | 9 |
| `theme-layout` | 10 |
| `validate-all` | 1 |

- [ ] **Step 7: Run the aggregate validator**

Run: `npm run validate`
Expected: `Theme validation passed.`

- [ ] **Step 8: Run Shopify's own linter**

Run: `npx shopify theme check azouz-theme`
Expected: no errors. Warnings about missing templates are expected at this stage — Plan B and Plan C add them. Record any **error**-level finding and fix it before committing.

- [ ] **Step 9: Start the preview and confirm it renders**

Run: `npm run preview`

Open `http://localhost:4321` and confirm:
- the page background is the warm off-white, not browser default white
- body text renders in Baloo Bhaijaan 2, not a system fallback
- pressing Tab first reveals the green "Skip to content" link
- the browser tab shows the Azouz logomark as its favicon
- DevTools Network shows `tokens.css`, `fonts.css`, `base.css`, `theme.js` and at least one `.woff2` all returning 200 — no 404s
- DevTools Console is free of errors

Stop the server with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
git add preview/server.js scripts/validate-all.js tests/validate-all.test.js
git commit -m "feat: add preview server and aggregate theme validator"
```

---

## Definition of Done for Plan A

- [ ] `npm test` passes with no failures
- [ ] `npm run validate` prints `Theme validation passed.`
- [ ] `npx shopify theme check azouz-theme` reports no error-level findings
- [ ] `npm run preview` serves a styled document at `http://localhost:4321` with brand fonts, brand colours, working skip link and favicon
- [ ] The contrast guard is green, encoding the finding that primary green cannot carry body-size text
- [ ] Four vector logo variants exist, visually verified, normalised to `#67985E`
- [ ] Every commit above is on the branch

**Next:** Plan B — marketing sections and the four client pages.
