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
