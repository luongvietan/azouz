import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

function filledCart() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  addLine('dead-sea-blend-1kg-wb', 1);
  return buildCart();
}

test('renders one row per line', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.equal(countMatches(html, /class="cart-line"/g), 2);
});

test('each line shows the product title, the variant and the line total', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /Wadi Rum Blend/);
  assert.match(html, /250g \/ Whole Bean/);
  assert.match(html, /cart-line__total/);
});

test('each line links to its product', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /href="\/products\/wadi-rum-blend\?variant=/);
});

test('quantity is editable and carries the line key', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /name="updates\[wadi-rum-blend-250-wb\]"/);
});

test('each line has a remove control', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.equal(countMatches(html, /cart-line__remove/g), 2);
  assert.equal(/translation missing/.test(html), false);
});

test('the remove control names the product it removes', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /visually-hidden[^>]*>[^<]*Wadi Rum Blend/);
});

test('an empty cart renders nothing rather than an empty table', async () => {
  resetCart();
  const html = await renderSnippet('cart-line-items', { cart: buildCart() });
  assert.equal(html.trim(), '');
});

test('line images are lazy and have alt text', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /loading="lazy"/);
  assert.match(html, /alt="Wadi Rum Blend"/);
});
