import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const fixtures = buildFixtures();
const wadiRum = fixtures.products[0];

const render = (product = wadiRum, settings = {}) =>
  renderSection('main-product', { settings, scope: { product } });

test('the product title is the page h1, and the only one', async () => {
  const html = await render();
  assert.match(html, /<h1[^>]*>[\s\S]*Wadi Rum Blend[\s\S]*<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('a visible breadcrumb sits above the product and keeps a single h1', async () => {
  const html = await render();
  const crumb = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(crumb, 'expected a breadcrumb nav');
  assert.match(crumb[1], /Home/);
  assert.match(crumb[1], /Shop/);
  assert.match(crumb[1], /Wadi Rum Blend/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders the add-to-cart form posting to cart add', async () => {
  const html = await render();
  assert.match(html, /action="\/cart\/add"/);
  assert.match(html, /data-add-to-cart/);
});

test('the add-to-cart form works without javascript — it is a real form', async () => {
  const html = await render();
  assert.match(html, /<form[^>]+method="post"/);
  assert.match(html, /type="submit"/);
});

test('renders the variant picker and the quantity input', async () => {
  const html = await render();
  assert.match(html, /<variant-picker/);
  assert.match(html, /<quantity-input/);
});

test('the product image is eager with high priority — it is the LCP element', async () => {
  const html = await render();
  assert.match(html, /fetchpriority="high"/);
  assert.equal(/loading="lazy"/.test(html), false);
});

test('renders the roast meter and the tasting notes', async () => {
  const html = await render();
  assert.match(html, /roast-meter/);
  assert.match(html, /Dark Chocolate/);
});

test('the spec grid renders every metafield that has a value', async () => {
  const html = await render();
  for (const value of ['Blend', 'Washed', '1,400–1,900 masl']) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('a product with no metafields renders no empty spec rows', async () => {
  const bare = { ...wadiRum, metafields: { custom: {} } };
  const html = await render(bare);
  assert.equal(/roast-meter/.test(html), false);
  assert.equal(/label-block__specs/.test(html), false);
});

test('the spec panels are native details elements — no javascript needed', async () => {
  const html = await render();
  assert.match(html, /<details/);
  assert.match(html, /<summary/);
});

test('a sold-out product disables the button and says so', async () => {
  const soldOut = {
    ...wadiRum,
    available: false,
    selected_or_first_available_variant: { ...wadiRum.variants[0], available: false },
  };
  const html = await render(soldOut);
  assert.match(html, /disabled/);
  assert.equal(/translation missing/.test(html), false);
});

test('no user-visible english is hard-coded', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('has no presets — it only makes sense on the product template', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-product.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
