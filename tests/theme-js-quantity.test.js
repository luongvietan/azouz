import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadThemeJs } from './helpers/load-theme-js.js';

const clamp = async (...args) => {
  const { AzouzTheme } = await loadThemeJs();
  return AzouzTheme.clampQuantity(...args);
};

test('clamps below the minimum', async () => {
  assert.equal(await clamp(0, 1, 10), 1);
  assert.equal(await clamp(-5, 1, 10), 1);
});

test('clamps above the maximum', async () => {
  assert.equal(await clamp(99, 1, 10), 10);
});

test('leaves an in-range value alone', async () => {
  assert.equal(await clamp(4, 1, 10), 4);
});

test('treats a non-numeric value as the minimum rather than NaN', async () => {
  assert.equal(await clamp('abc', 1, 10), 1);
  assert.equal(await clamp('', 1, 10), 1);
});

test('rounds a fractional value down to a whole unit', async () => {
  assert.equal(await clamp(2.7, 1, 10), 2);
});

test('an absent maximum means unbounded', async () => {
  assert.equal(await clamp(500, 1), 500);
});

test('quantity-input is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('quantity-input'), 'function');
});

test('parseCartLineKey reads the line key from a cart quantity input name', async () => {
  const { AzouzTheme } = await loadThemeJs();
  assert.equal(AzouzTheme.parseCartLineKey('updates[espresso-arabica-beans-500g]'), 'espresso-arabica-beans-500g');
  assert.equal(AzouzTheme.parseCartLineKey('quantity'), null);
  assert.equal(AzouzTheme.parseCartLineKey(''), null);
});
