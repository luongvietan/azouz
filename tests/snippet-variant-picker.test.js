import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';

const fixtures = buildFixtures();

/*
  Every bag the client sells ships in one size and one grind, and main-product
  renders a hidden id field instead of a picker for those. The picker is what a
  product with a second weight gets, so the product it is exercised against is
  built here rather than taken from the catalogue.
*/
const variant = (weight, grind, price, available = true) => ({
  id: `espresso-${weight}-${grind}`,
  title: `${weight} / ${grind}`,
  option1: weight,
  option2: grind,
  options: [weight, grind],
  price,
  compare_at_price: null,
  available,
  url: `/products/espresso-arabica-beans?variant=espresso-${weight}-${grind}`,
});

const variants = [
  variant('250g', 'Whole Bean', 450),
  variant('1kg', 'Whole Bean', 1400),
  variant('1kg', 'Espresso', 1400, false),
];

const ranged = {
  ...fixtures.products[0],
  options_with_values: [
    { name: 'Weight', values: ['250g', '1kg'] },
    { name: 'Grind', values: ['Whole Bean', 'Espresso'] },
  ],
  variants,
  selected_or_first_available_variant: variants[0],
};

const render = (product = ranged) =>
  renderSnippet('variant-picker', { product, form_id: 'AddToCart' });

test('renders one select per product option', async () => {
  const html = await render();
  assert.equal(countMatches(html, /data-option-index=/g), 2);
});

test('each option select has a visible label', async () => {
  const html = await render();
  assert.match(html, /<label[^>]+for="Option-[^"]+-1"[^>]*>\s*Weight/);
  assert.match(html, /<label[^>]+for="Option-[^"]+-2"[^>]*>\s*Grind/);
});

test('the currently selected variant is preselected in each option', async () => {
  const html = await render();
  assert.match(html, /<option value="250g" selected/);
  assert.match(html, /<option value="Whole Bean" selected/);
});

test('the variant data is emitted as parseable json', async () => {
  const html = await render();
  const json = /<script type="application\/json" data-variant-data>([\s\S]*?)<\/script>/.exec(html);
  assert.ok(json, 'the variant json script must be present');
  const variants = JSON.parse(json[1]);
  assert.equal(variants.length, 3);
  assert.deepEqual(variants[0].options, ['250g', 'Whole Bean']);
  assert.equal(typeof variants[0].price, 'string', 'prices are pre-formatted by Liquid');
});

test('the json marks unavailable variants so the picker can disable them', async () => {
  const html = await render();
  const json = /<script type="application\/json" data-variant-data>([\s\S]*?)<\/script>/.exec(html);
  const variants = JSON.parse(json[1]);
  assert.ok(variants.some((variant) => variant.available === false));
});

test('a noscript fallback select posts a real variant id', async () => {
  const html = await render();
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(html);
  assert.ok(noscript, 'there must be a noscript fallback');
  assert.match(noscript[1], /name="id"/);
  assert.match(noscript[1], /form="AddToCart"/);
});

test('only the noscript select is named id — the option selects never are', async () => {
  const html = await render();
  const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/, '');
  assert.equal(
    /name="id"/.test(withoutNoscript),
    false,
    'a second name="id" outside noscript would post two conflicting variant ids',
  );
});

test('the fallback marks sold-out variants disabled', async () => {
  const html = await render();
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(html)[1];
  assert.match(noscript, /disabled/);
});

test('no user-visible english is hard-coded', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('option field ids are namespaced so two pickers can coexist', async () => {
  // A bare "Option-1" collides the moment the product section renders twice —
  // a quick view beside the main product — and the label points at the wrong
  // select.
  const html = await renderSnippet('variant-picker', { product: ranged, form_id: 'AddToCart' });
  const ids = [...html.matchAll(/<select[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 2, `expected the option selects, got ${ids}`);
  for (const id of ids) {
    assert.equal(/^Option-\d+$/.test(id), false, `${id} is not namespaced`);
    assert.match(html, new RegExp(`<label[^>]+for="${id}"`), `no label for #${id}`);
  }
});
