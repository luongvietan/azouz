import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadThemeJs } from './helpers/load-theme-js.js';

const VARIANTS = [
  { id: 'a', options: ['250g', 'Whole Bean'], available: true, price: '7.500 JOD', url: '/p?variant=a' },
  { id: 'b', options: ['1kg', 'Whole Bean'], available: true, price: '26.000 JOD', url: '/p?variant=b' },
  { id: 'c', options: ['1kg', 'Espresso'], available: false, price: '26.000 JOD', url: '/p?variant=c' },
];

const match = async (selected) => {
  const { AzouzTheme } = await loadThemeJs();
  return AzouzTheme.findMatchingVariant(VARIANTS, selected);
};

test('finds the variant whose options match exactly', async () => {
  assert.equal((await match(['1kg', 'Whole Bean'])).id, 'b');
});

test('finds an unavailable variant too — the caller decides what to do', async () => {
  const found = await match(['1kg', 'Espresso']);
  assert.equal(found.id, 'c');
  assert.equal(found.available, false);
});

test('returns null when no combination matches', async () => {
  assert.equal(await match(['500g', 'Turkish']), null);
});

test('a partial selection does not match a longer variant', async () => {
  assert.equal(await match(['1kg']), null);
});

test('an empty selection matches nothing rather than the first variant', async () => {
  assert.equal(await match([]), null);
});

test('matching is order sensitive — option one is weight, option two is grind', async () => {
  assert.equal(await match(['Whole Bean', '1kg']), null);
});

test('a single-option product matches on one value', async () => {
  const { AzouzTheme } = await loadThemeJs();
  const single = [{ id: 'x', options: ['Box of 10'], available: true }];
  assert.equal(AzouzTheme.findMatchingVariant(single, ['Box of 10']).id, 'x');
});

test('an empty variant list returns null rather than throwing', async () => {
  const { AzouzTheme } = await loadThemeJs();
  assert.equal(AzouzTheme.findMatchingVariant([], ['250g']), null);
});

test('variant-picker is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('variant-picker'), 'function');
});
