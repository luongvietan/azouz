import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ROUTES, templateForRoute } from '../preview/server.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('every marketing route the client will link to is served', () => {
  for (const path of [
    '/',
    '/pages/private-label',
    '/pages/wholesale',
    '/pages/our-brands',
    '/pages/request-a-sample',
    '/pages/get-a-quote',
  ]) {
    assert.ok(ROUTES[path], `${path} must be a preview route`);
  }
});

test('each route names a page_type Shopify would report', () => {
  const valid = new Set(['index', 'page', 'collection', 'product', 'cart', 'search', '404']);
  for (const [path, route] of Object.entries(ROUTES)) {
    assert.ok(valid.has(route.page_type), `${path} has page_type "${route.page_type}"`);
  }
});

test('templateForRoute falls back to the default page template', () => {
  assert.equal(templateForRoute({ page_type: 'page' }), 'templates/page.json');
});

test('templateForRoute honours an explicit template', () => {
  assert.equal(
    templateForRoute({ page_type: 'page', template: 'templates/page.wholesale.json' }),
    'templates/page.wholesale.json',
  );
});

test('every template a route points at exists in the theme', () => {
  for (const [path, route] of Object.entries(ROUTES)) {
    const template = templateForRoute(route);
    assert.ok(
      existsSync(resolveInTheme(template)),
      `${path} points at ${template}, which does not exist`,
    );
  }
});
