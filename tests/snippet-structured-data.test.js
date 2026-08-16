import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';
import { buildFixtures } from '../preview/fixtures.js';

const render = async (scope = {}) => {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, 'snippets/structured-data.liquid', scope);
};

/** Every ld+json block on the page, parsed. Parsing is the point: a trailing
 *  comma or an unquoted value makes the block invisible to a crawler. */
const blocks = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match, index) => {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        assert.fail(`ld+json block ${index} is not valid JSON: ${error.message}`);
      }
      return null;
    });

const productScope = () => {
  const { products } = buildFixtures();
  return { request: { page_type: 'product' }, product: products[0] };
};

/** Walk the graph and collect every value under a url-bearing key. */
const urlValues = (node, found = []) => {
  if (Array.isArray(node)) node.forEach((item) => urlValues(item, found));
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (['url', 'item', 'image', 'logo'].includes(key) && typeof value === 'string') found.push(value);
      else urlValues(value, found);
    }
  }
  return found;
};

test('every ld+json block on a plain page is valid JSON', async () => {
  const parsed = blocks(await render());
  assert.ok(parsed.length >= 1);
  assert.equal(parsed[0]['@type'], 'Organization');
});

test('the organization logo is an absolute url', async () => {
  const [organization] = blocks(await render());
  assert.match(organization.logo, /^https?:\/\//, `logo was ${organization.logo}`);
});

test('a product page emits Product and BreadcrumbList', async () => {
  const types = blocks(await render(productScope())).map((entry) => entry['@type']);
  assert.ok(types.includes('Product'));
  assert.ok(types.includes('BreadcrumbList'));
});

test('no url anywhere in the product graph is relative', async () => {
  // schema.org consumers have no page context to resolve "/products/x" against.
  for (const value of urlValues(blocks(await render(productScope())))) {
    assert.match(value, /^https?:\/\//, `relative url in JSON-LD: ${value}`);
  }
});

test('no url anywhere in the collection graph is relative', async () => {
  const { collections } = buildFixtures();
  const html = await render({ request: { page_type: 'collection' }, collection: collections.all });
  for (const value of urlValues(blocks(html))) {
    assert.match(value, /^https?:\/\//, `relative url in JSON-LD: ${value}`);
  }
});
