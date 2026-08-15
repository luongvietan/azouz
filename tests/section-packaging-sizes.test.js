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
