import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures, buildSearchFixture, buildCustomerFixture } from '../preview/fixtures.js';

test('every variant exposes the options array the variant picker matches on', () => {
  for (const product of buildFixtures().products) {
    for (const variant of product.variants) {
      assert.ok(Array.isArray(variant.options), `${variant.id} has no options array`);
      assert.equal(variant.options[0], variant.option1);
    }
  }
});

test('every variant has a url carrying its own variant id', () => {
  const product = buildFixtures().products[0];
  for (const variant of product.variants) {
    assert.equal(variant.url, `${product.url}?variant=${variant.id}`);
  }
});

/*
  The catalogue used to carry a sold-out variant and a discounted one so the
  preview could show both states. It cannot any more: dist/products.csv is
  generated from these fixtures and imported into the client's live store, so a
  demo compare-at price would ship as a real "was" price against a real bag, and
  a demo zero would ship the bag out of stock. Both states are still covered,
  against products the tests build themselves: snippet-price.test.js,
  snippet-product-card.test.js, section-main-product.test.js.
*/
test('no bag carries a compare-at price the client did not set', () => {
  const all = buildFixtures().products.flatMap((product) => product.variants);
  assert.ok(all.every((variant) => variant.compare_at_price === null));
});

test('every bag is in stock, which is the state the client imports', () => {
  const all = buildFixtures().products.flatMap((product) => product.variants);
  assert.ok(all.every((variant) => variant.available === true));
});

test('search returns the products whose title or notes match the terms', () => {
  const search = buildSearchFixture('turkish');
  assert.equal(search.performed, true);
  assert.equal(search.terms, 'turkish');
  assert.deepEqual(search.results.map((r) => r.handle), ['turkish-coffee']);
  assert.equal(search.results_count, 1);
});

test('an empty search term performs no search and returns nothing', () => {
  const search = buildSearchFixture('');
  assert.equal(search.performed, false);
  assert.deepEqual(search.results, []);
});

test('a search that matches nothing still reports it was performed', () => {
  const search = buildSearchFixture('zzzz');
  assert.equal(search.performed, true);
  assert.equal(search.results_count, 0);
});

test('the customer fixture carries orders and addresses', () => {
  const customer = buildCustomerFixture();
  assert.equal(typeof customer.name, 'string');
  assert.ok(customer.orders.length > 0);
  assert.ok(customer.addresses.length > 0);
  assert.equal(customer.addresses_count, customer.addresses.length);
  assert.equal(customer.orders_count, customer.orders.length);
});

test('each order has line items and a customer url', () => {
  const order = buildCustomerFixture().orders[0];
  assert.ok(order.line_items.length > 0);
  assert.match(order.customer_url, /^\/account\/orders\//);
  assert.equal(typeof order.total_price, 'number');
});
