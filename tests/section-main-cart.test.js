import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';
import { resetCart, addLine, buildCart } from '../preview/cart-api.js';

function filled() {
  resetCart();
  addLine('espresso-arabica-beans-500g', 2);
  return buildCart();
}

const render = (cart) => renderSection('main-cart', { scope: { cart } });

test('the cart heading is the page h1, and the only one', async () => {
  const html = await render(filled());
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders the lines and the subtotal', async () => {
  const html = await render(filled());
  assert.match(html, /cart-line/);
  assert.match(html, /cart__subtotal/);
});

test('the form posts to the cart so quantity edits work without javascript', async () => {
  const html = await render(filled());
  assert.match(html, /action="\/cart"/);
  assert.match(html, /name="update"|type="submit"/);
});

test('the cart page body is marked for js refresh', async () => {
  const html = await render(filled());
  assert.match(html, /<cart-form/);
  assert.match(html, /data-cart-body/);
});

test('there is a checkout button', async () => {
  const html = await render(filled());
  assert.match(html, /name="checkout"/);
});

test('an empty cart shows the empty state and a way back to the shop', async () => {
  resetCart();
  const html = await render(buildCart());
  assert.match(html, /cart__empty/);
  assert.match(html, /href="\/collections\/all"/);
  assert.equal(/cart-line/.test(html), false);
});

test('an empty cart shows no checkout button', async () => {
  resetCart();
  assert.equal(/name="checkout"/.test(await render(buildCart())), false);
});

test('the taxes note is present so the total is not misread', async () => {
  const html = await render(filled());
  assert.match(html, /cart__note/);
  assert.equal(/translation missing/.test(html), false);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-cart.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
