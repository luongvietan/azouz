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

test('renders one option group per product option', async () => {
  const html = await render();
  assert.equal(countMatches(html, /data-option-index=/g), 2);
});

test('each option group is a fieldset named by a visible legend', async () => {
  const html = await render();
  assert.equal(countMatches(html, /<fieldset[^>]+data-option-index=/g), 2);
  assert.match(html, /<legend[^>]*>\s*Weight/);
  assert.match(html, /<legend[^>]*>\s*Grind/);
});

test('every value is a button on show, not folded into a drop-down', async () => {
  // Baymard: size options hidden in a drop-down are a product page pitfall.
  const html = await render();
  const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/, '');
  assert.equal(/<select/.test(withoutNoscript), false);
  assert.equal(countMatches(withoutNoscript, /type="radio"/g), 4);
});

test('each radio is wrapped by its own visible label', async () => {
  const html = await render();
  assert.match(html, /<label class="variant-picker__value">\s*<input[^>]+value="1kg"[\s\S]*?>\s*<span[^>]*>1kg<\/span>/);
});

test('the currently selected variant is preselected in each option', async () => {
  const html = await render();
  assert.match(html, /value="250g"\s*checked/);
  assert.match(html, /value="Whole Bean"\s*checked/);
  assert.equal(/value="1kg"\s*checked/.test(html), false);
});

test('the json carries each variant unit price for the picker to swap', async () => {
  const withUnit = variants.map((v) => ({
    ...v,
    unit_price: Math.round(v.price / 2.5),
    unit_price_measurement: { reference_value: 100, reference_unit: 'g' },
  }));
  const html = await render({ ...ranged, variants: withUnit, selected_or_first_available_variant: withUnit[0] });
  const json = /<script type="application\/json" data-variant-data>([\s\S]*?)<\/script>/.exec(html);
  const parsed = JSON.parse(json[1]);
  assert.match(parsed[0].unit_price, /per 100g/);
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

test('option field ids and radio names are namespaced so two pickers can coexist', async () => {
  // A bare "Option-1" collides the moment the product section renders twice,
  // a quick view beside the main product, and two radio groups sharing a name
  // would become one group across both products.
  const html = await renderSnippet('variant-picker', { product: ranged, form_id: 'AddToCart' });
  const radios = [...html.matchAll(/<input[^>]+type="radio"[^>]*>/g)].map((m) => m[0]);
  assert.ok(radios.length >= 2, `expected the option radios, got ${radios.length}`);
  for (const radio of radios) {
    const id = /\sid="([^"]+)"/.exec(radio)[1];
    const name = /\sname="([^"]+)"/.exec(radio)[1];
    assert.match(id, /^Option-.+-\d+-\d+$/, `${id} does not carry option and value positions`);
    assert.equal(/^Option-\d+-\d+$/.test(id), false, `${id} is not namespaced to the product`);
    assert.equal(/^Option-\d+$/.test(name), false, `${name} is not namespaced to the product`);
  }
});
