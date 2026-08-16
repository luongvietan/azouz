import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ROUTES, templateForRoute, resolveRoute, listPreviewPaths } from '../preview/route-context.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('the marketing routes from Plan B are still served', () => {
  for (const path of ['/', '/pages/private-label', '/pages/wholesale', '/pages/our-brands']) {
    assert.ok(ROUTES[path], `${path} must still be a preview route`);
  }
});

test('templateForRoute falls back to the default page template', () => {
  assert.equal(templateForRoute({ page_type: 'page' }), 'templates/page.json');
});

test('a product url resolves to the product template with that product in scope', () => {
  const route = resolveRoute('/products/wadi-rum-blend');
  assert.equal(route.page_type, 'product');
  assert.equal(route.template, 'templates/product.json');
  assert.equal(route.scope.product.title, 'Wadi Rum Blend');
});

test('a product url with ?variant= selects that variant', () => {
  const route = resolveRoute(
    '/products/wadi-rum-blend',
    new URLSearchParams('variant=wadi-rum-blend-1kg-wb'),
  );
  assert.equal(route.scope.product.selected_or_first_available_variant.id, 'wadi-rum-blend-1kg-wb');
});

test('an unknown product handle resolves to the 404 template', () => {
  const route = resolveRoute('/products/not-a-real-blend');
  assert.equal(route.page_type, '404');
  assert.equal(route.template, 'templates/404.json');
});

test('a collection url resolves to the collection template', () => {
  const route = resolveRoute('/collections/all');
  assert.equal(route.page_type, 'collection');
  assert.equal(route.scope.collection.products.length, 4);
});

test('preview page titles follow the resolved resource', () => {
  assert.equal(resolveRoute('/products/wadi-rum-blend').scope.page_title, 'Wadi Rum Blend');
  assert.equal(resolveRoute('/collections/all').scope.page_title, 'Our Coffee');
  assert.equal(resolveRoute('/pages/private-label').scope.page_title, 'Private Label');
  assert.equal(resolveRoute('/pages/wholesale').scope.page_title, 'Wholesale');
  assert.equal(resolveRoute('/').scope.page_title, 'Your Coffee. Your Brand. Our Roastery.');
});

test('the collection index lists every collection', () => {
  const route = resolveRoute('/collections');
  assert.equal(route.page_type, 'list-collections');
  assert.ok(route.scope.collections.length >= 1);
});

test('the cart route renders the live preview cart', () => {
  const route = resolveRoute('/cart');
  assert.equal(route.page_type, 'cart');
  assert.equal(route.template, 'templates/cart.json');
  assert.ok(Array.isArray(route.scope.cart.items));
});

test('the search route reads its terms from the query string', () => {
  const route = resolveRoute('/search', new URLSearchParams('q=wadi'));
  assert.equal(route.page_type, 'search');
  assert.equal(route.scope.search.terms, 'wadi');
  assert.equal(route.scope.search.results_count, 1);
});

test('every account route resolves with a signed-in customer', () => {
  for (const path of [
    '/account',
    '/account/login',
    '/account/register',
    '/account/addresses',
    '/account/orders/1002',
  ]) {
    const route = resolveRoute(path);
    assert.ok(route, `${path} must resolve`);
    assert.equal(route.scope.customer.name, 'Layla Haddad');
  }
});

test('the order route puts the order itself in scope', () => {
  const route = resolveRoute('/account/orders/1002');
  assert.equal(route.scope.order.name, '#1002');
});

test('an unrecognised path resolves to the 404 template, never null', () => {
  const route = resolveRoute('/nope/nope');
  assert.equal(route.page_type, '404');
});

test('every template any route points at exists in the theme', () => {
  for (const path of listPreviewPaths()) {
    const route = resolveRoute(path);
    assert.ok(
      existsSync(resolveInTheme(route.template)),
      `${path} points at ${route.template}, which does not exist`,
    );
  }
});
