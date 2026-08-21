import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildFixtures } from '../preview/fixtures.js';
import { ROOT } from '../scripts/theme-paths.js';

test('the shop fixture uses Jordanian dinar', () => {
  assert.equal(buildFixtures().shop.currency, 'JOD');
});

test('each product featured image is a real file in preview/media', () => {
  for (const product of buildFixtures().products) {
    for (const src of [product.featured_image, ...(product.images ?? [])]) {
      const name = String(src).replace(/^\/preview-media\//, '');
      assert.ok(existsSync(join(ROOT, 'preview', 'media', name)), name);
    }
  }
});

test('the four packaging products from the client mockups are present', () => {
  const handles = buildFixtures().collections.all.products.map((product) => product.handle);
  assert.deepEqual(handles, [
    'wadi-rum-blend',
    'dead-sea-blend',
    'downtown-blend',
    'filtered-coffee-bags',
  ]);
});

test('each blend carries the metafields the theme reads', () => {
  for (const product of buildFixtures().collections.all.products.slice(0, 3)) {
    const custom = product.metafields.custom;
    assert.equal(typeof custom.roast_level.value, 'number');
    assert.ok(Array.isArray(custom.tasting_notes.value));
    assert.match(custom.label_color.value, /^#[0-9A-Fa-f]{6}$/);
  }
});

test('label colours match the printed packaging', () => {
  const byHandle = Object.fromEntries(
    buildFixtures().collections.all.products.map((p) => [p.handle, p]),
  );
  assert.equal(byHandle['wadi-rum-blend'].metafields.custom.label_color.value, '#C4562E');
  assert.equal(byHandle['dead-sea-blend'].metafields.custom.label_color.value, '#BFDDD3');
  assert.equal(byHandle['downtown-blend'].metafields.custom.label_color.value, '#7C7F44');
});

test('products expose variants with weight and grind options', () => {
  const product = buildFixtures().collections.all.products[0];
  assert.deepEqual(product.options, ['Weight', 'Grind']);
  assert.ok(product.variants.length >= 2);
  assert.equal(typeof product.variants[0].price, 'number');
  assert.equal(product.variants[0].available, true);
});

test('the cart fixture is empty by default', () => {
  const cart = buildFixtures().cart;
  assert.equal(cart.item_count, 0);
  assert.deepEqual(cart.items, []);
});

test('theme settings from settings_data are on the settings drop', () => {
  const { settings } = buildFixtures();
  assert.equal(settings.logo_height, 64);
  assert.equal(settings.color_accent, '#67985E');
});

test('the main menu links to the marketing pages, the shop and the journal', () => {
  const urls = buildFixtures().linklists['main-menu'].links.map((link) => link.url);
  assert.deepEqual(urls, [
    '/pages/private-label',
    '/pages/wholesale',
    '/pages/own-an-azouz-coffee',
    '/pages/our-brands',
    '/collections/all',
    '/blogs/journal',
  ]);
});
