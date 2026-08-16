import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';

test('renders the amount as money', async () => {
  const html = await renderSnippet('price', { price: 750 });
  assert.match(html, /7\.5|7,5/, 'the money filter should format 750 minor units');
});

test('labels the price for screen readers', async () => {
  const html = await renderSnippet('price', { price: 750 });
  assert.match(html, /visually-hidden/);
  assert.equal(/translation missing/.test(html), false);
});

test('shows a strike-through compare-at price when the item is on sale', async () => {
  const html = await renderSnippet('price', { price: 750, compare_at: 900 });
  assert.match(html, /<s /);
  assert.match(html, /price--on-sale/);
});

test('ignores a compare-at price that is not actually higher', async () => {
  const html = await renderSnippet('price', { price: 900, compare_at: 900 });
  assert.equal(/<s /.test(html), false);
  assert.equal(/price--on-sale/.test(html), false);
});

test('a from-price shows the prefix and no compare-at', async () => {
  const html = await renderSnippet('price', { price: 750, show_from: true });
  assert.match(html, /price__from/);
  assert.equal(/<s /.test(html), false);
});

test('the from-price prefix comes from the locale file', async () => {
  const html = await renderSnippet('price', { price: 750, show_from: true });
  assert.equal(/translation missing/.test(html), false);
});

test('a zero price still renders rather than collapsing to nothing', async () => {
  const html = await renderSnippet('price', { price: 0 });
  assert.match(html, /price__current/);
});
