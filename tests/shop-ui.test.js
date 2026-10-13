import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection } from './helpers/render-section.js';
import { renderSnippet } from './helpers/render-snippet.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

/*
  The shop UI changes from docs/research-shop-ui-2026-10-13.md: the phone
  breadcrumb, the pack on each card, and the added-to-cart drawer.
*/

const fixtures = buildFixtures();
const [espresso] = fixtures.products;
const js = () => readFile(resolveInTheme('assets/theme.js'), 'utf8');
const css = () => readFile(resolveInTheme('assets/commerce.css'), 'utf8');

test('the product breadcrumb carries a back arrow inside the shop link', async () => {
  const html = await renderSection('main-product', { scope: { product: espresso } });
  const parent = /<li class="breadcrumb__item breadcrumb__item--parent">([\s\S]*?)<\/li>/.exec(html);
  assert.ok(parent, 'expected the parent crumb');
  assert.match(parent[1], /<span class="breadcrumb__back" aria-hidden="true">\s*<svg/);
  assert.match(parent[1], /Shop/);
});

test('the full trail is still in the markup for wider screens and crawlers', async () => {
  const html = await renderSection('main-product', { scope: { product: espresso } });
  assert.match(html, /aria-current="page">Espresso Arabica Beans/);
});

test('a single-variant card states its pack', async () => {
  const html = await renderSnippet('product-card', { product: espresso });
  assert.match(html, /<p class="product-card__pack">500g, Whole Bean<\/p>/);
});

test("a card for Shopify's default variant states no pack", async () => {
  const html = await renderSnippet('product-card', { product: { ...espresso, has_only_default_variant: true } });
  assert.equal(/product-card__pack/.test(html), false);
});

test('the drawer heading carries both titles for the script to choose from', async () => {
  const html = await renderSection('cart-drawer');
  assert.match(html, /data-drawer-heading/);
  assert.match(html, /data-title-cart="Your cart"/);
  assert.match(html, /data-title-added="Added to your cart"/);
});

test('the drawer names the way back to shopping, and it closes the drawer', async () => {
  const html = await renderSection('cart-drawer');
  assert.match(html, /<button class="button--quiet cart-drawer__continue" type="button" data-drawer-close>\s*Continue shopping/);
});

test('cart lines carry their key so the drawer can mark the one just added', async () => {
  const item = {
    key: 'espresso-500g:abc', id: 1, quantity: 1, price: 750, final_price: 750,
    final_line_price: 750, url: espresso.url, title: espresso.title, product: espresso,
    variant: espresso.variants[0], image: espresso.featured_image, options_with_values: [],
  };
  const html = await renderSnippet('cart-line-items', { cart: { ...fixtures.cart, item_count: 1, items: [item] } });
  assert.match(html, /<li class="cart-line" data-line-key="espresso-500g:abc" data-variant-id="espresso-arabica-beans-500g">/);
});

test('an add opens the drawer as a confirmation, a header click as the cart', async () => {
  const source = await js();
  assert.match(source, /if \(added\) this\.open\(true\)/);
  assert.match(source, /added \? heading\.dataset\.titleAdded : heading\.dataset\.titleCart/);
  assert.match(source, /if \(added\) this\.markJustAdded\(event\.detail\?\.key, event\.detail\?\.variantId\)/);
  assert.match(source, /detail\.variantId = new FormData\(this\.form\)\.get\('id'\)/);
});

test('the just-added mark uses logical properties, so it flips under rtl', async () => {
  const rule = /\.cart-line\.is-just-added\s*\{([^}]*)\}/.exec(await css());
  assert.ok(rule);
  assert.match(rule[1], /border-inline-start/);
  assert.equal(/border-left|padding-left/.test(rule[1]), false);
});
