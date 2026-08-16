import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractSchema, defaultSettings } from '../scripts/schema-parser.js';
import { buildFixtures } from './fixtures.js';
import { resolveSettings } from './settings-resolver.js';
import { demoImageFor } from './demo-media.js';

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
      settings: resolveSettings(
        (schema?.blocks ?? []).find((b) => b.type === declared[id].type) ?? null,
        {
          ...(typeDefaults.get(declared[id].type) ?? {}),
          ...(declared[id].settings ?? {}),
        },
        buildFixtures(),
      ),
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

    // The shipped templates leave `image` unset — a path there fails Shopify's
    // validation and costs the whole template. Demo imagery is preview-only.
    const demoImage = demoImageFor(templatePath, id);
    const settings = { ...defaultSettings(schema), ...(config.settings ?? {}) };
    if (demoImage && !settings.image) settings.image = demoImage;

    const scope = {
      ...fixtures,
      ...extraScope,
      section: {
        id,
        settings: resolveSettings(schema, settings, fixtures),
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
