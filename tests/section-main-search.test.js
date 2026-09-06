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
  const html = await render('turkish');
  assert.match(html, /value="turkish"/);
});

test('renders a card per result', async () => {
  const html = await render('coffee');
  assert.equal(countMatches(html, /class="product-card"/g), 2);
});

test('states how many results were found', async () => {
  const html = await render('turkish');
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

test('the search form asks Shopify for products only', async () => {
  // Without this, `search.results` also carries pages and articles, which the
  // product-card snippet renders as an empty tile with no price.
  const html = await render('');
  assert.match(html, /<input[^>]+type="hidden"[^>]+name="type"[^>]+value="product"|<input[^>]+name="type"[^>]+value="product"/);
});

test('a non-product result is never rendered as a product card', async () => {
  const html = await renderSection('main-search', {
    scope: {
      search: {
        performed: true,
        terms: 'label',
        results_count: 2,
        results: [
          { object_type: 'page', title: 'Private Label', url: '/pages/private-label' },
          {
            object_type: 'product',
            title: 'Espresso Arabica Beans',
            url: '/products/espresso-arabica-beans',
            price: 7500,
            price_min: 7500,
            price_max: 7500,
            available: true,
            metafields: { custom: {} },
          },
        ],
      },
    },
  });

  assert.equal(countMatches(html, /class="product-card"/g), 1, 'only the product may become a card');
  assert.equal(/Private Label/.test(html), false, 'the page result must not leak into the grid');
});

test('results are paginated rather than silently truncated', async () => {
  const results = Array.from({ length: 15 }, (unused, index) => ({
    object_type: 'product',
    title: `Blend ${index}`,
    url: `/products/blend-${index}`,
    price: 7500,
    price_min: 7500,
    price_max: 7500,
    available: true,
    metafields: { custom: {} },
  }));

  const html = await renderSection('main-search', {
    scope: { search: { performed: true, terms: 'blend', results, results_count: results.length } },
  });

  assert.match(html, /class="pagination"/, '15 results over a page size of 12 must paginate');
});
