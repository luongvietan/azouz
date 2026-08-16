import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Liquid } from 'liquidjs';
import { registerShopifyFilters } from '../preview/shims/filters.js';

function makeEngine() {
  const engine = new Liquid({ extname: '.liquid' });
  registerShopifyFilters(engine, {
    assetBase: '/assets/',
    currency: 'JOD',
    locale: 'en',
    translations: { general: { search: { title: 'Search' } }, greeting: 'Hello, {{ name }}' },
  });
  return engine;
}

const render = (template, scope = {}) => makeEngine().parseAndRenderSync(template, scope);

test('asset_url prefixes the asset base', () => {
  assert.equal(render(`{{ 'base.css' | asset_url }}`), '/assets/base.css');
});

test('image_url applies the width argument as a query parameter', () => {
  const out = render(`{{ src | image_url: width: 600 }}`, { src: '/img/bag.jpg' });
  assert.equal(out, '/img/bag.jpg?width=600');
});

test('image_url returns a placeholder when the source is nil', () => {
  assert.match(render(`{{ nothing | image_url: width: 200 }}`), /placeholder/);
});

test('money formats minor units using the shop currency', () => {
  assert.match(render(`{{ 1250 | money }}`), /12\.50/);
});

test('money renders zero rather than blank for a nil amount', () => {
  assert.match(render(`{{ nothing | money }}`), /0\.00/);
});

test('handleize lowercases and hyphenates', () => {
  assert.equal(render(`{{ 'Wadi Rum Blend' | handleize }}`), 'wadi-rum-blend');
});

test('handleize strips punctuation and collapses separators', () => {
  assert.equal(render(`{{ '  Espresso — 250g / 1kg!  ' | handle }}`), 'espresso-250g-1kg');
});

test('t looks a translation up by dotted key', () => {
  assert.equal(render(`{{ 'general.search.title' | t }}`), 'Search');
});

test('t interpolates named arguments', () => {
  assert.equal(render(`{{ 'greeting' | t: name: 'Anwar' }}`), 'Hello, Anwar');
});

test('t echoes the key when the translation is missing', () => {
  assert.equal(render(`{{ 'nope.missing' | t }}`), 'translation missing: nope.missing');
});

test('stylesheet_tag emits a link element', () => {
  assert.equal(
    render(`{{ 'base.css' | asset_url | stylesheet_tag }}`),
    '<link rel="stylesheet" href="/assets/base.css" media="all">',
  );
});

test('script_tag emits a script element', () => {
  assert.equal(
    render(`{{ 'theme.js' | asset_url | script_tag }}`),
    '<script src="/assets/theme.js" defer="defer"></script>',
  );
});

test('within builds a collection-scoped product URL', () => {
  const out = render(`{{ product.url | within: collection }}`, {
    product: { url: '/products/wadi-rum' },
    collection: { handle: 'espresso' },
  });
  assert.equal(out, '/collections/espresso/products/wadi-rum');
});

test('weight_with_unit appends the unit to a gram weight', () => {
  assert.equal(render(`{{ 250 | weight_with_unit: 'g' }}`), '250 g');
});

test('link_to wraps text in an anchor', () => {
  assert.equal(render(`{{ 'Shop' | link_to: '/collections/all' }}`), '<a href="/collections/all">Shop</a>');
});

test('color_brightness of Dead Sea mint is above the dark-ink threshold', () => {
  assert.ok(Number(render(`{{ '#BFDDD3' | color_brightness }}`)) > 160);
});

test('color_brightness of Wadi Rum rust is below the dark-ink threshold', () => {
  assert.ok(Number(render(`{{ '#C4562E' | color_brightness }}`)) < 160);
});

test('color_brightness of Jet is below the dark-ink threshold', () => {
  assert.ok(Number(render(`{{ '#303030' | color_brightness }}`)) < 160);
});
