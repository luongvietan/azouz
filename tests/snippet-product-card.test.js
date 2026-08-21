import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSnippet } from './helpers/render-snippet.js';

const fixtures = buildFixtures();
const wadiRum = fixtures.products[0];
const deadSea = fixtures.products[1];
const filterBags = fixtures.products[3];

test('renders the product title inside the label block', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /label-block__title[\s\S]*Wadi Rum Blend/);
});

test('the whole card links to the product', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /href="\/products\/wadi-rum-blend"/);
});

test('uses the blend label colour from the metafield', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /--label-bg:\s*#B3522D/);
});

test('renders the tasting notes as the label subtitle', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /Dark Chocolate/);
});

test('renders the roast meter', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /roast-meter/);
});

test('labels the roast meter so the dots are not read as a star rating', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /roast-meter__label/);
});

test('shows a from-price when the product spans a price range', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /price__from/);
});

test('shows a plain price when every variant costs the same', async () => {
  const html = await renderSnippet('product-card', { product: filterBags });
  assert.equal(/price__from/.test(html), false);
  assert.match(html, /price__current/);
});

test('the image has alt text and is lazy loaded — cards are below the fold', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /alt="Wadi Rum Blend"/);
  assert.match(html, /loading="lazy"/);
});

test('a product with no label colour still renders', async () => {
  const plain = { ...wadiRum, metafields: { custom: {} } };
  const html = await renderSnippet('product-card', { product: plain });
  assert.match(html, /label-block/);
  assert.equal(/roast-meter/.test(html), false);
});

test('a sold-out product is marked as such', async () => {
  const soldOut = { ...wadiRum, available: false };
  const html = await renderSnippet('product-card', { product: soldOut });
  assert.match(html, /product-card__badge/);
  assert.equal(/translation missing/.test(html), false);
});

test('a light label fill auto-picks Jet ink', async () => {
  const html = await renderSnippet('product-card', { product: deadSea });
  assert.match(html, /--label-fg:\s*var\(--color-text\)/);
});

test('a dark label fill does not force Jet ink', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.equal(/--label-fg/.test(html), false);
});

test('the product title is the accessible name once — not doubled', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  const heading = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  assert.ok(heading, 'expected a product-card heading');
  assert.equal((heading[1].match(/Wadi Rum Blend/g) ?? []).length, 1);
  assert.equal(/visually-hidden/.test(heading[1]), false);
});

test('the card heading defaults to h3, for a grid sitting under a section h2', async () => {
  const html = await renderSnippet('product-card', { product: wadiRum });
  assert.match(html, /<h3[^>]*class="label-block__title"/);
});

test('the heading level can be raised for a grid sitting directly under the h1', async () => {
  // A collection or search page has no section h2 between its h1 and the
  // cards, so an h3 there skips a level.
  const html = await renderSnippet('product-card', { product: wadiRum, heading_level: 2 });
  assert.match(html, /<h2[^>]*class="label-block__title"/);
  assert.equal(/<h3/.test(html), false);
});
