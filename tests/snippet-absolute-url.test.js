import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const render = async (url) => {
  const engine = await createEngine(THEME_DIR);
  const out = await renderThemeFile(engine, THEME_DIR, 'snippets/absolute-url.liquid', { url });
  return out.trim();
};

test('a protocol-relative cdn url gains https', async () => {
  assert.equal(await render('//cdn.shopify.com/s/files/1/logo.svg'), 'https://cdn.shopify.com/s/files/1/logo.svg');
});

test('a site-relative path gains the shop origin', async () => {
  const out = await render('/products/wadi-rum-blend');
  assert.match(out, /^https?:\/\/[^/]+\/products\/wadi-rum-blend$/, `got ${out}`);
});

test('an already absolute url is passed through untouched', async () => {
  assert.equal(await render('https://azouz.example/pages/wholesale'), 'https://azouz.example/pages/wholesale');
});

test('the two-slash check wins over the one-slash check', async () => {
  // Every protocol-relative url also starts with a single slash, so ordering
  // the branches the other way would produce https://shop.example//cdn...
  const out = await render('//cdn.shopify.com/x.jpg');
  assert.equal(out.includes('//cdn.shopify.com'), true);
  assert.equal(/\/\/[^/]+\/\/cdn/.test(out), false, 'the shop origin must not be prepended');
});
