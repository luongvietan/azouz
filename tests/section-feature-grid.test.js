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
