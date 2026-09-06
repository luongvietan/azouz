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

test('the three products the client sells are present', () => {
  const handles = buildFixtures().collections.all.products.map((product) => product.handle);
  assert.deepEqual(handles, ['espresso-arabica-beans', 'turkish-coffee', 'filter-coffee-can']);
});

test('each bag carries the metafields the theme reads', () => {
  for (const product of buildFixtures().collections.all.products) {
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
  assert.equal(byHandle['espresso-arabica-beans'].metafields.custom.label_color.value, '#1E2B55');
  assert.equal(byHandle['turkish-coffee'].metafields.custom.label_color.value, '#A9C8E5');
  assert.equal(byHandle['filter-coffee-can'].metafields.custom.label_color.value, '#F5AF13');
});

test('every bag is one variant, carrying its weight and grind', () => {
  // The client sells one size and one grind of each. main-product drops the
  // picker on a single-variant product, so nothing here may grow a second
  // variant without that branch being looked at again.
  for (const product of buildFixtures().collections.all.products) {
    assert.deepEqual(product.options, ['Weight', 'Grind']);
    assert.equal(product.variants.length, 1);
    assert.equal(product.variants[0].options.length, 2);
    assert.equal(typeof product.variants[0].price, 'number');
    assert.equal(product.variants[0].available, true);
    assert.equal(product.price_min, product.price_max);
  }
});

test('the cart fixture is empty by default', () => {
  const cart = buildFixtures().cart;
  assert.equal(cart.item_count, 0);
  assert.deepEqual(cart.items, []);
});

test('theme settings from settings_data are on the settings drop', () => {
  const { settings } = buildFixtures();
  assert.equal(settings.logo_height, 64);
  assert.equal(settings.color_accent, '#DFE5D9');
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
