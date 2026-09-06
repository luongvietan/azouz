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
  const route = resolveRoute('/products/espresso-arabica-beans');
  assert.equal(route.page_type, 'product');
  assert.equal(route.template, 'templates/product.json');
  assert.equal(route.scope.product.title, 'Espresso Arabica Beans');
});

test('a product url with ?variant= selects that variant', () => {
  const route = resolveRoute(
    '/products/espresso-arabica-beans',
    new URLSearchParams('variant=espresso-arabica-beans-500g'),
  );
  assert.equal(route.scope.product.selected_or_first_available_variant.id, 'espresso-arabica-beans-500g');
});

test('an unknown product handle resolves to the 404 template', () => {
  const route = resolveRoute('/products/not-a-real-blend');
  assert.equal(route.page_type, '404');
  assert.equal(route.template, 'templates/404.json');
});

test('a collection url resolves to the collection template', () => {
  const route = resolveRoute('/collections/all');
  assert.equal(route.page_type, 'collection');
  assert.equal(route.scope.collection.products.length, 3);
});

test('preview page titles follow the resolved resource', () => {
  assert.equal(resolveRoute('/products/espresso-arabica-beans').scope.page_title, 'Espresso Arabica Beans');
  assert.equal(resolveRoute('/collections/all').scope.page_title, 'Our Coffee');
  assert.equal(resolveRoute('/pages/private-label').scope.page_title, 'Private Label');
  assert.equal(resolveRoute('/pages/wholesale').scope.page_title, 'Wholesale');
  assert.equal(resolveRoute('/').scope.page_title, 'Your Coffee. Your Brand. Our Roastery.');
});

test('the routes with no resource of their own still carry their own title', () => {
  assert.equal(resolveRoute('/cart').scope.page_title, 'Your cart');
  assert.equal(resolveRoute('/search').scope.page_title, 'Search');
  assert.equal(resolveRoute('/collections').scope.page_title, 'Collections');
  assert.equal(resolveRoute('/account/login').scope.page_title, 'Sign in');
  assert.equal(resolveRoute('/nothing-here').scope.page_title, 'Page not found');
});

test('an order title fills the name placeholder rather than printing it', () => {
  const title = resolveRoute('/account/orders/1002').scope.page_title;
  assert.equal(title, 'Order #1002');
  assert.doesNotMatch(title, /\{\{/, 'the {{ name }} placeholder must be substituted');
});

/*
  The regression this guards: page_title was set only where a fixture happened
  to carry a title, so nine routes rendered <title> as the bare shop name and
  an audit of the preview reported that as the theme's behaviour. The password
  page is the one deliberate exception — Shopify leaves page_title unset there
  and meta-tags.liquid documents the fallback, so forcing one here would hide
  the case that comment exists for.
*/
test('every preview route but the password page resolves with a page title', () => {
  const untitled = listPreviewPaths()
    .filter((path) => path !== '/password' && !path.startsWith('/gift_cards/'))
    .filter((path) => {
      const url = new URL(path, 'http://localhost');
      return !resolveRoute(url.pathname, url.searchParams).scope.page_title;
    });

  assert.deepEqual(untitled, [], 'these routes would render <title> as the shop name alone');
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
  const route = resolveRoute('/search', new URLSearchParams('q=turkish'));
  assert.equal(route.page_type, 'search');
  assert.equal(route.scope.search.terms, 'turkish');
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
