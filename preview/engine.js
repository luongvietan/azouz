import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Liquid } from 'liquidjs';
import { registerShopifyFilters } from './shims/filters.js';
import { registerShopifyTags } from './shims/tags.js';
import { buildFixtures } from './fixtures.js';
import { resolveSettings } from './settings-resolver.js';
import { parseThemeJson } from '../scripts/theme-json.js';

async function readTranslations(themeDir) {
  try {
    const source = await readFile(join(themeDir, 'locales', 'en.default.json'), 'utf8');
    return parseThemeJson(source, 'locales/en.default.json');
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
      settings: resolveSettings(
        schema,
        { ...defaultSettings(schema), ...(extraScope.section?.settings ?? {}) },
        scope,
      ),
      blocks: extraScope.section?.blocks ?? defaultBlocks(schema),
      shopify_attributes: '',
    };
  }

  // LiquidJS `{% render %}` isolates local scope. Shopify still exposes
  // global drops (shop, request, page_title, …) inside snippets — pass the
  // same object as `globals` so preview matches that contract.
  return engine.parseAndRender(source, scope, { globals: scope });
}
