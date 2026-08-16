import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const source = () => readFile(resolveInTheme('assets/theme.js'), 'utf8');

test('cart-form is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('cart-form'), 'function');
});

test('quantity edits refresh through the section rendering api', async () => {
  const js = await source();
  assert.match(js, /sections=main-cart,header,cart-drawer|sections=main-cart,cart-drawer,header/);
  assert.match(js, /data-cart-body/);
});

test('line edits reuse the shared cart change helpers', async () => {
  const js = await source();
  assert.match(js, /handleCartQuantityChange/);
  assert.match(js, /handleCartRemoveClick/);
  assert.match(js, /changeCartLine/);
});

test('it replaces the refreshable body region, not the component itself', async () => {
  const js = await source();
  assert.match(js, /data-cart-body/);
  assert.equal(/this\.innerHTML\s*=/.test(js.slice(js.indexOf('class CartForm'))), false);
});
