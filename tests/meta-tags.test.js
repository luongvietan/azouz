import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const renderSnippet = async (name, scope) => {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, `snippets/${name}.liquid`, scope);
};

test('meta-tags renders a title element', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /<title>/);
});

test('meta-tags falls back to the shop name when there is no page title', async () => {
  const out = await renderSnippet('meta-tags', { page_title: null });
  assert.match(out, /Azouz Coffee/);
});

test('meta-tags emits a canonical link', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /<link rel="canonical" href="https:\/\/www\.azouzcoffee\.com\/">/);
});

test('meta-tags emits Open Graph and Twitter card tags', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /property="og:title"/);
  assert.match(out, /property="og:type"/);
  assert.match(out, /name="twitter:card"/);
});

test('meta-tags sets the viewport', async () => {
  const out = await renderSnippet('meta-tags', {});
  assert.match(out, /name="viewport"[^>]*width=device-width/);
});

test('structured-data emits valid Organization JSON-LD', async () => {
  const out = await renderSnippet('structured-data', {});
  const json = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(out)[1]);
  assert.equal(json['@type'], 'Organization');
  assert.equal(json.name, 'Azouz Coffee');
  assert.equal(json.url, 'https://www.azouzcoffee.com');
});

test('structured-data emits Product JSON-LD on a product page', async () => {
  const fixtureProduct = {
    title: 'Wadi Rum Blend',
    description: 'An espresso roast.',
    url: '/products/wadi-rum-blend',
    featured_image: '/preview-media/wadi-rum-blend.jpg',
    vendor: 'Azouz Coffee',
    price: 750,
    available: true,
  };
  const out = await renderSnippet('structured-data', {
    request: { page_type: 'product' },
    product: fixtureProduct,
  });
  const blocks = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = blocks.map((block) => JSON.parse(block[1])['@type']);
  assert.ok(types.includes('Product'), `got ${types.join(', ')}`);
});

test('structured-data emits BreadcrumbList on a product page', async () => {
  const out = await renderSnippet('structured-data', {
    request: { page_type: 'product' },
    product: {
      title: 'Wadi Rum Blend',
      description: 'An espresso roast.',
      url: '/products/wadi-rum-blend',
      featured_image: '/preview-media/wadi-rum-blend.jpg',
      vendor: 'Azouz Coffee',
      price: 750,
      available: true,
    },
  });
  const blocks = [...out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const types = blocks.map((block) => JSON.parse(block[1])['@type']);
  assert.ok(types.includes('Product'));
  assert.ok(types.includes('BreadcrumbList'));
  assert.equal(/translation missing/.test(out), false);
  assert.equal(/\bHome\b/.test(out.replace(/<script[\s\S]*?<\/script>/g, '')), false);
});

test('structured-data collection breadcrumbs are not hard-coded English', async () => {
  const out = await renderSnippet('structured-data', {
    request: { page_type: 'collection' },
    collection: { title: 'Azouz Coffee', url: '/collections/all' },
  });
  assert.match(out, /BreadcrumbList/);
  assert.equal(/translation missing/.test(out), false);
});
