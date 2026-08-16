import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

const render = (cart) => renderSection('cart-drawer', { scope: { cart } });

function filled() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 1);
  return buildCart();
}

test('is a dialog so focus trapping and escape come from the platform', async () => {
  const html = await render(filled());
  assert.match(html, /<dialog/);
});

test('the dialog is closed in the markup — it must never block a no-js page', async () => {
  const html = await render(filled());
  assert.equal(/<dialog[^>]+\sopen/.test(html), false);
});

test('the closed drawer is inert and hidden from the accessibility tree', async () => {
  const html = await render(filled());
  assert.match(html, /<cart-drawer[^>]*\bhidden\b[^>]*\binert\b[^>]*aria-hidden="true"/);
  assert.match(html, /<dialog[^>]*\binert\b[^>]*>/);
  assert.match(html, /<dialog[^>]*aria-hidden="true"[^>]*>/);
  assert.match(html, /<dialog[^>]*\bhidden\b[^>]*>/);
});

test('the refreshable region is marked so a refresh does not destroy the element', async () => {
  const html = await render(filled());
  assert.match(html, /data-drawer-content/);
});

test('renders the cart lines', async () => {
  const html = await render(filled());
  assert.match(html, /cart-line/);
  assert.match(html, /Wadi Rum Blend/);
});

test('renders the empty state when the cart is empty', async () => {
  resetCart();
  const html = await render(buildCart());
  assert.match(html, /cart-drawer__empty/);
  assert.equal(/cart-line/.test(html), false);
});

test('has a close control with an accessible name', async () => {
  const html = await render(filled());
  assert.match(html, /data-drawer-close/);
  assert.equal(/translation missing/.test(html), false);
});

test('links to the full cart page, which is the no-javascript path', async () => {
  const html = await render(filled());
  assert.match(html, /href="\/cart"/);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/cart-drawer.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
