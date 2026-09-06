import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const fixtures = buildFixtures();
const espresso = fixtures.products[0];

const render = (product = espresso, settings = {}) =>
  renderSection('main-product', { settings, scope: { product } });

test('the product title is the page h1, and the only one', async () => {
  const html = await render();
  assert.match(html, /<h1[^>]*>[\s\S]*Espresso Arabica Beans[\s\S]*<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('a visible breadcrumb sits above the product and keeps a single h1', async () => {
  const html = await render();
  const crumb = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(crumb, 'expected a breadcrumb nav');
  assert.match(crumb[1], /Home/);
  assert.match(crumb[1], /Shop/);
  assert.match(crumb[1], /Espresso Arabica Beans/);
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

test('a single-variant bag posts a hidden id instead of a locked picker', async () => {
  // Every bag in the range ships in one size and one grind. Two selects the
  // customer cannot change is not a choice, but the form still has to name a
  // variant, and <variant-picker> is what would otherwise write that field.
  const html = await render();
  assert.equal(/<variant-picker/.test(html), false);
  assert.match(html, /<input type="hidden" name="id" value="espresso-arabica-beans-500g">/);
  assert.match(html, /<quantity-input/);
});

test('a bag with a second weight gets the picker back', async () => {
  const variants = [
    { ...espresso.variants[0] },
    { ...espresso.variants[0], id: 'espresso-arabica-beans-1kg', option1: '1kg', options: ['1kg', 'Whole Bean'] },
  ];
  const ranged = {
    ...espresso,
    variants,
    options_with_values: [
      { name: 'Weight', values: ['500g', '1kg'] },
      { name: 'Grind', values: ['Whole Bean'] },
    ],
  };
  const html = await render(ranged);
  assert.match(html, /<variant-picker/);
  assert.equal(/<input type="hidden" name="id"/.test(html), false);
});

test('the first product image is eager with high priority — it is the LCP element', async () => {
  const html = await render();
  const images = html.match(/<img[\s\S]*?>/g).filter((tag) => tag.includes('main-product__image'));

  assert.match(images[0], /loading="eager"/);
  assert.match(images[0], /fetchpriority="high"/);

  // Everything below the fold stays lazy and unprioritised, or the gallery
  // competes with the LCP image for bandwidth.
  for (const tag of images.slice(1)) {
    assert.match(tag, /loading="lazy"/);
    assert.equal(/fetchpriority/.test(tag), false);
  }
});

test('renders the roast meter and the tasting notes', async () => {
  const html = await render();
  assert.match(html, /roast-meter/);
  assert.match(html, /100% Arabica/);
});

test('the spec grid renders every metafield that has a value', async () => {
  // Origin, process and altitude are blank across the range until the client
  // supplies them, so they are set here: what is under test is that a filled
  // metafield reaches the grid, not that the catalogue happens to fill it.
  const custom = espresso.metafields.custom;
  const specced = {
    ...espresso,
    metafields: {
      custom: {
        ...custom,
        origin: { ...custom.origin, value: 'Brazil, Colombia' },
        process: { ...custom.process, value: 'Washed' },
        altitude: { ...custom.altitude, value: '1,400 masl' },
      },
    },
  };
  const html = await render(specced);
  for (const value of ['Brazil, Colombia', 'Washed', '1,400 masl']) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('a product with no metafields renders no empty spec rows', async () => {
  const bare = { ...espresso, metafields: { custom: {} } };
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
    ...espresso,
    available: false,
    selected_or_first_available_variant: { ...espresso.variants[0], available: false },
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

test('every product image is rendered, not just the featured one', async () => {
  // espresso-arabica-beans has a second packaging shot; dropping it silently loses
  // merchandising the merchant uploaded.
  const html = await render();
  const images = html.match(/class="main-product__image /g) ?? [];
  assert.ok(images.length >= 2, `expected the full gallery, rendered ${images.length}`);
  assert.match(html, /espresso-arabica-beans-alt/);
  // One shot leads the column and the rest are the rail beneath it.
  assert.equal((html.match(/main-product__image--lead/g) ?? []).length, 1);
  assert.match(html, /main-product__image--thumb/);
});

test('a product on sale shows the struck-through was-price', async () => {
  const { products } = buildFixtures();
  const onSale = products.find((product) => product.handle === 'filter-coffee-can');
  const html = await renderSection('main-product', { scope: { product: onSale } });
  assert.match(html, /<s[^>]*class="price__compare"/, 'the compare-at price must be shown');
});

test('a product not on sale keeps the compare-at price hidden', async () => {
  const html = await render();
  assert.match(html, /<s[^>]+data-price-compare[^>]*\shidden/);
});

test('the price is a live region so a variant change is announced', async () => {
  const html = await render();
  const price = /<[^>]*data-product-price[^>]*>/.exec(html);
  assert.ok(price, 'the price element must exist');
  assert.match(price[0], /aria-live="polite"/);
});
