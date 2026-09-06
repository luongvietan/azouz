import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

function filledCart() {
  resetCart();
  addLine('espresso-arabica-beans-500g', 2);
  addLine('turkish-coffee-200g', 1);
  return buildCart();
}

test('renders one row per line', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.equal(countMatches(html, /class="cart-line"/g), 2);
});

test('each line shows the product title, the variant and the line total', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /Espresso Arabica Beans/);
  assert.match(html, /500g \/ Whole Bean/);
  assert.match(html, /cart-line__total/);
});

test('each line links to its product', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /href="\/products\/espresso-arabica-beans\?variant=/);
});

test('quantity is editable and carries the line key', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /name="updates\[espresso-arabica-beans-500g\]"/);
});

test('each line has a remove control', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.equal(countMatches(html, /cart-line__remove/g), 2);
  assert.equal(/translation missing/.test(html), false);
});

test('the remove control names the product it removes', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /visually-hidden[^>]*>[^<]*Espresso Arabica Beans/);
});

test('an empty cart renders nothing rather than an empty table', async () => {
  resetCart();
  const html = await renderSnippet('cart-line-items', { cart: buildCart() });
  assert.equal(html.trim(), '');
});

test('line images are lazy and have alt text', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  assert.match(html, /loading="lazy"/);
  assert.match(html, /alt="Espresso Arabica Beans"/);
});

test('the remove link escapes its ampersand and encodes the line key', async () => {
  const html = await renderSnippet('cart-line-items', { cart: filledCart() });
  const href = /class="cart-line__remove"[\s\S]*?href="([^"]+)"/.exec(html)[1];
  assert.match(href, /&amp;quantity=0$/, `raw & in ${href}`);
});
