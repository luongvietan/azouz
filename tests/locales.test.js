import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = async (name) => JSON.parse(await readFile(resolveInTheme(`locales/${name}`), 'utf8'));

const REQUIRED_KEYS = [
  'general.accessibility.skip_to_content',
  'general.accessibility.close',
  'general.accessibility.menu',
  'general.search.title',
  'general.meta.tags',
  'products.product.add_to_cart',
  'products.product.sold_out',
  'products.product.roast_level',
  'products.product.tasting_notes',
  'cart.general.title',
  'cart.general.empty',
  'cart.general.checkout',
  'contact.form.name',
  'contact.form.email',
  'contact.form.send',
  'contact.form.success',
];

function lookup(object, dottedKey) {
  return dottedKey.split('.').reduce((node, part) => (node ? node[part] : undefined), object);
}

test('every key the theme relies on is present', async () => {
  const locale = await load('en.default.json');
  const missing = REQUIRED_KEYS.filter((key) => typeof lookup(locale, key) !== 'string');
  assert.deepEqual(missing, []);
});

test('no translation value is left blank', async () => {
  const locale = await load('en.default.json');
  const blanks = [];
  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      const next = path ? `${path}.${key}` : key;
      if (typeof value === 'string') {
        if (value.trim() === '') blanks.push(next);
      } else if (value && typeof value === 'object') {
        walk(value, next);
      }
    }
  };
  walk(locale, '');
  assert.deepEqual(blanks, []);
});

test('the schema locale carries theme editor labels', async () => {
  const schema = await load('en.default.schema.json');
  assert.equal(typeof schema.settings_schema, 'object');
});
