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
  assert.equal(countMatches(html, /class="audience-strip__chip[ "]/g), 6);
  assert.ok(html.indexOf('Cafés') < html.indexOf('Hotels'));
});

test('the chip list is a real list for screen readers', async () => {
  const html = await renderSection('audience-strip', { blocks: blocks(['Cafés']) });
  assert.match(html, /<ul[^>]+role="list"/);
  assert.match(html, /<li/);
});

test('each chip carries shopify_attributes so theme editor selection works', async () => {
  const html = await renderSection('audience-strip', {
    blocks: [{ id: 'a0', type: 'audience', settings: { title: 'Cafés' }, shopify_attributes: ' data-shopify-editor-block' }],
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
