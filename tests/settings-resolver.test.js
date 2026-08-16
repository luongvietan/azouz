import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSettings, resolveSection } from '../preview/settings-resolver.js';
import { buildFixtures } from '../preview/fixtures.js';

const fixtures = buildFixtures();

const schema = {
  settings: [
    { type: 'link_list', id: 'menu' },
    { type: 'image_picker', id: 'image' },
    { type: 'collection', id: 'featured' },
    { type: 'product', id: 'hero_product' },
    { type: 'text', id: 'heading' },
    { type: 'checkbox', id: 'show' },
    { type: 'color', id: 'tint' },
  ],
};

test('a link_list handle becomes a linklist object with links', () => {
  const resolved = resolveSettings(schema, { menu: 'main-menu' }, fixtures);
  assert.ok(Array.isArray(resolved.menu.links));
  assert.equal(resolved.menu.links[0].title, 'Private Label');
});

test('an unknown link_list handle yields an empty linklist, not undefined', () => {
  const resolved = resolveSettings(schema, { menu: 'does-not-exist' }, fixtures);
  assert.deepEqual(resolved.menu.links, []);
});

test('an image_picker filename becomes an asset path', () => {
  const resolved = resolveSettings(schema, { image: 'logo-black.svg' }, fixtures);
  assert.equal(resolved.image, '/assets/logo-black.svg');
});

test('an empty image_picker resolves to null so {% if %} guards work', () => {
  assert.equal(resolveSettings(schema, { image: '' }, fixtures).image, null);
});

test('an image_picker path that is already a URL is left alone', () => {
  const resolved = resolveSettings(
    schema,
    { image: '/preview-media/wadi-rum-blend.jpg' },
    fixtures,
  );
  assert.equal(resolved.image, '/preview-media/wadi-rum-blend.jpg');
});

test('a collection handle becomes the collection object', () => {
  const resolved = resolveSettings(schema, { featured: 'all' }, fixtures);
  assert.equal(resolved.featured.products.length, 4);
});

test('a product handle becomes the product object', () => {
  const resolved = resolveSettings(schema, { hero_product: 'wadi-rum-blend' }, fixtures);
  assert.equal(resolved.hero_product.title, 'Wadi Rum Blend');
});

test('primitive setting types pass through untouched', () => {
  const input = { heading: 'Our Roastery.', show: true, tint: '#67985E' };
  assert.deepEqual(resolveSettings(schema, input, fixtures), input);
});

test('settings with no declared type pass through untouched', () => {
  assert.deepEqual(resolveSettings(schema, { mystery: 'x' }, fixtures), { mystery: 'x' });
});

test('a null schema is tolerated', () => {
  assert.deepEqual(resolveSettings(null, { a: 1 }, fixtures), { a: 1 });
});

test('resolveSection turns a link_list default into a menu object', () => {
  const section = resolveSection(
    { settings: [{ type: 'link_list', id: 'menu', default: 'main-menu' }] },
    'header',
    {},
    fixtures,
  );
  assert.equal(section.settings.menu.links[0].title, 'Private Label');
});
