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
  addLine('espresso-arabica-beans-500g', 2);
  const cart = buildCart();
  assert.equal(cart.item_count, 2);
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].price, 750);
  assert.equal(cart.items[0].line_price, 1500);
  assert.equal(cart.items[0].product_title, 'Espresso Arabica Beans');
  assert.equal(cart.items[0].variant_title, '500g / Whole Bean');
});

test('adding the same variant twice merges into one line', () => {
  resetCart();
  addLine('espresso-arabica-beans-500g', 1);
  addLine('espresso-arabica-beans-500g', 3);
  const cart = buildCart();
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].quantity, 4);
});

test('the cart total is the sum of its lines', () => {
  resetCart();
  addLine('espresso-arabica-beans-500g', 2);
  addLine('turkish-coffee-200g', 1);
  const cart = buildCart();
  assert.equal(cart.total_price, 1500 + 280);
  assert.equal(cart.items_subtotal_price, cart.total_price);
});

test('setting a line to zero removes it', () => {
  resetCart();
  addLine('espresso-arabica-beans-500g', 2);
  setLine('espresso-arabica-beans-500g', 0);
  assert.equal(buildCart().items.length, 0);
});

test('adding an unknown variant is ignored rather than throwing', () => {
  resetCart();
  addLine('not-a-variant', 1);
  assert.equal(buildCart().item_count, 0);
});

test('every line carries the url and image the drawer renders', () => {
  resetCart();
  addLine('espresso-arabica-beans-500g', 1);
  const [line] = buildCart().items;
  assert.match(line.url, /^\/products\/espresso-arabica-beans/);
  // An image drop, matching Shopify — the cart line reads width and height off it.
  assert.equal(typeof line.image, 'object');
  assert.match(line.image.src, /espresso-arabica-beans\.jpg$/);
  assert.ok(line.image.width > 0 && line.image.height > 0);
  assert.equal(line.key, 'espresso-arabica-beans-500g');
});

test('seeding fills the cart so the populated state can be reviewed', () => {
  resetCart();
  seedCart();
  assert.ok(buildCart().item_count >= 3);
});
