import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSnippet } from './helpers/render-snippet.js';

const fixtures = buildFixtures();
const espresso = fixtures.products[0];
const turkish = fixtures.products[1];
const filterCan = fixtures.products[2];

test('renders the product title inside the label block', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /label-block__title[\s\S]*Espresso Arabica Beans/);
});

test('the whole card links to the product', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /href="\/products\/espresso-arabica-beans"/);
});

test('uses the bag label colour from the metafield', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /--label-bg:\s*#1E2B55/);
});

test('renders the tasting notes as the label subtitle', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /100% Arabica/);
});

test('renders the roast meter', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /roast-meter/);
});

test('labels the roast meter so the dots are not read as a star rating', async () => {
  // The card's spec list supplies the term, so the meter no longer prints its
  // own label beside it — printing both would say "Roast level" twice. What has
  // to survive is that the dots are still named: by the <dt> above them, and by
  // the meter's own aria-label, which is what a screen reader actually reads.
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /<dt class="product-card__spec-term">Roast level<\/dt>/);
  assert.match(html, /aria-label="Roast level 3 of 5"/);
});

test('every spec row on the card is a term and a value', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  const terms = html.match(/product-card__spec-term/g) ?? [];
  const values = html.match(/product-card__spec-value/g) ?? [];
  assert.equal(terms.length, values.length);
  // Origin, process and altitude are blank until the client supplies them, so
  // roast level is the only row the range fills in today. What this guards is
  // that a blank metafield drops the whole row rather than half of one.
  assert.ok(terms.length >= 1, 'expected the bag specs to be listed on the card');
});

test('a product with none of the spec metafields renders no empty spec list', async () => {
  const plain = { ...espresso, metafields: { custom: {} } };
  const html = await renderSnippet('product-card', { product: plain });
  assert.equal(/product-card__specs/.test(html), false);
});

test('shows a from-price when the product spans a price range', async () => {
  // No bag in the range does today: each ships in one size. Built here so the
  // card still has to handle the day a second weight is added.
  const ranged = { ...espresso, price_min: 280, price_max: 750 };
  const html = await renderSnippet('product-card', { product: ranged });
  assert.match(html, /price__from/);
});

test('shows a plain price when every variant costs the same', async () => {
  const html = await renderSnippet('product-card', { product: filterCan });
  assert.equal(/price__from/.test(html), false);
  assert.match(html, /price__current/);
});

test('the image has alt text and is lazy loaded — cards are below the fold', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /alt="Espresso Arabica Beans"/);
  assert.match(html, /loading="lazy"/);
});

test('a product with no label colour still renders', async () => {
  const plain = { ...espresso, metafields: { custom: {} } };
  const html = await renderSnippet('product-card', { product: plain });
  assert.match(html, /label-block/);
  assert.equal(/roast-meter/.test(html), false);
});

test('a sold-out product is marked as such', async () => {
  const soldOut = { ...espresso, available: false };
  const html = await renderSnippet('product-card', { product: soldOut });
  assert.match(html, /product-card__badge/);
  assert.equal(/translation missing/.test(html), false);
});

test('a light label fill auto-picks Jet ink', async () => {
  const html = await renderSnippet('product-card', { product: turkish });
  assert.match(html, /--label-fg:\s*var\(--color-text\)/);
});

test('a dark label fill does not force Jet ink', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.equal(/--label-fg/.test(html), false);
});

test('the product title is the accessible name once — not doubled', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  const heading = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  assert.ok(heading, 'expected a product-card heading');
  assert.equal((heading[1].match(/Espresso Arabica Beans/g) ?? []).length, 1);
  assert.equal(/visually-hidden/.test(heading[1]), false);
});

test('the card heading defaults to h3, for a grid sitting under a section h2', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /<h3[^>]*class="label-block__title"/);
});

test('the heading level can be raised for a grid sitting directly under the h1', async () => {
  // A collection or search page has no section h2 between its h1 and the
  // cards, so an h3 there skips a level.
  const html = await renderSnippet('product-card', { product: espresso, heading_level: 2 });
  assert.match(html, /<h2[^>]*class="label-block__title"/);
  assert.equal(/<h3/.test(html), false);
});
