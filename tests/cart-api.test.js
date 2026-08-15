import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addLine, setLine, buildCart, resetCart, seedCart } from '../preview/cart-api.js';

test('a fresh cart is empty', () => {
  resetCart();
  const cart = buildCart();
  assert.equal(cart.item_count, 0);
  assert.deepEqual(cart.items, []);
  assert.equal(cart.total_price, 0);
});

test('adding a variant creates a line with the right price and title', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  const cart = buildCart();
  assert.equal(cart.item_count, 2);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].price, 750);
  assert.equal(cart.items[0].line_price, 1500);
  assert.equal(cart.items[0].product_title, 'Wadi Rum Blend');
  assert.equal(cart.items[0].variant_title, '250g / Whole Bean');
});

test('adding the same variant twice merges into one line', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 1);
  addLine('wadi-rum-blend-250-wb', 3);
  const cart = buildCart();
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 4);
});

test('the cart total is the sum of its lines', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  addLine('dead-sea-blend-1kg-wb', 1);
  const cart = buildCart();
  assert.equal(cart.total_price, 1500 + 2600);
  assert.equal(cart.items_subtotal_price, cart.total_price);
});

test('setting a line to zero removes it', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  setLine('wadi-rum-blend-250-wb', 0);
  assert.equal(buildCart().items.length, 0);
});

test('adding an unknown variant is ignored rather than throwing', () => {
  resetCart();
  addLine('not-a-variant', 1);
  assert.equal(buildCart().item_count, 0);
});

test('every line carries the url and image the drawer renders', () => {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 1);
  const [line] = buildCart().items;
  assert.match(line.url, /^\/products\/wadi-rum-blend/);
  assert.equal(typeof line.image, 'string');
  assert.equal(line.key, 'wadi-rum-blend-250-wb');
});

test('seeding fills the cart so the populated state can be reviewed', () => {
  resetCart();
  seedCart();
  assert.ok(buildCart().item_count >= 3);
});
