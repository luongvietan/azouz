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
  assert.match(html, /<h1[^>]*>[\s\S]*Our Coffee[\s\S]*<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders a card per product', async () => {
  const html = await render();
  assert.equal(countMatches(html, /class="product-card"/g), 3);
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

// Sorting appears once a collection has more than six products; a store that
// grows past the current three gets it back without a theme change.
const large = { ...collection, products_count: 12, all_products_count: 12 };

test('a collection of six or fewer products offers no sort control', async () => {
  const html = await render();
  assert.equal(/collection__sort/.test(html), false);
  assert.equal(/name="sort_by"/.test(html), false);
});

test('the collection can be sorted, and the sort is a shareable url', async () => {
  const html = await render({ collection: large });
  assert.match(html, /<form[^>]+class="collection__sort"[^>]*method="get"|<form[^>]+method="get"[^>]*class="collection__sort"/);
  assert.match(html, /name="sort_by"/);
  assert.match(html, /<label[^>]+for="CollectionSort"/);
});

test('sorting works with scripting off — there is a real submit button', async () => {
  assert.match(await render({ collection: large }), /collection__sort-apply[\s\S]*?type="submit"|type="submit"[^>]*collection__sort-apply/);
});
