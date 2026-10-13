import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { renderSnippet } from './helpers/render-snippet.js';

/*
  The product page and cart changes from docs/research-shop-best-practices-
  2026-10-13.md: price per 100g, what a single-variant bag is, delivery cost
  and the refund policy beside the button, WhatsApp as a way to ask, and what
  each coffee is for on its card.
*/

const fixtures = buildFixtures();
const [espresso, turkish] = fixtures.products;
const WHATSAPP = '+962 79-000-0000';

const product = (p = espresso, scope = {}) =>
  renderSection('main-product', { scope: { product: p, ...scope } });

const withSettings = (extra) => ({ settings: { ...fixtures.settings, ...extra } });

// ---------- Unit price ----------

test('unit price reads as a price per 100g', async () => {
  const text = (await renderSnippet('unit-price', { variant: espresso.variants[0] })).trim();
  assert.match(text, /per 100g$/);
  assert.equal(text.includes('—'), false);
});

test('unit price says per kg, not per 1kg, when the reference is a single unit', async () => {
  const variant = {
    ...espresso.variants[0],
    unit_price: 1500,
    unit_price_measurement: { reference_value: 1, reference_unit: 'kg' },
  };
  assert.match((await renderSnippet('unit-price', { variant })).trim(), /per kg$/);
});

test('unit price renders nothing until the variant has a measurement', async () => {
  const variant = { ...espresso.variants[0], unit_price: null, unit_price_measurement: null };
  assert.equal((await renderSnippet('unit-price', { variant })).trim(), '');
});

test('the product page shows the unit price under the price', async () => {
  const html = await product();
  assert.match(html, /<p class="main-product__unit-price" data-unit-price>[^<]*per 100g/);
});

test('the unit price element stays in the markup, hidden, when there is none', async () => {
  const variant = { ...espresso.variants[0], unit_price: null, unit_price_measurement: null };
  const html = await product({ ...espresso, variants: [variant], selected_or_first_available_variant: variant });
  assert.match(html, /data-unit-price hidden/);
});

test('product cards carry the unit price beside the price', async () => {
  const html = await renderSnippet('product-card', { product: turkish });
  assert.match(html, /product-card__unit-price">[^<]*per 100g/);
});

// ---------- What the bag is ----------

test('a single-variant bag states its pack size and grind', async () => {
  const html = await product();
  const options = /<dl class="main-product__options">([\s\S]*?)<\/dl>/.exec(html);
  assert.ok(options, 'expected the option summary');
  assert.match(options[1], /<dt>Weight<\/dt>\s*<dd>500g<\/dd>/);
  assert.match(options[1], /<dt>Grind<\/dt>\s*<dd>Whole Bean<\/dd>/);
});

test("a product with only Shopify's default variant shows no option summary", async () => {
  const html = await product({ ...espresso, has_only_default_variant: true });
  assert.equal(/main-product__options/.test(html), false);
});

test('product cards say what each coffee is for', async () => {
  const html = await renderSnippet('product-card', { product: fixtures.products[2] });
  assert.match(html, /<p class="product-card__brews">Best for Filter Machine, French Press<\/p>/);
});

// ---------- Delivery, returns, help ----------

test('delivery cost and the refund policy sit beside the button', async () => {
  const html = await product();
  const list = /<ul class="main-product__assurance"[^>]*>([\s\S]*?)<\/ul>/.exec(html);
  assert.ok(list, 'expected the assurance list');
  assert.match(list[1], /Delivery in Amman 3 JD/);
  assert.match(list[1], /href="\/policies\/refund-policy"/);
});

test('the delivery note comes from the theme setting, so the merchant can change it', async () => {
  const html = await product(espresso, withSettings({ shipping_note: 'Free delivery over 20 JD.' }));
  assert.match(html, /Free delivery over 20 JD\./);
  assert.equal(/Delivery in Amman/.test(html), false);
});

test('no WhatsApp link is drawn while no number is set', async () => {
  assert.equal(/wa\.me/.test(await product()), false);
});

test('with a number set, WhatsApp asks about this coffee, digits only', async () => {
  const html = await product(espresso, withSettings({ social_whatsapp: WHATSAPP }));
  const href = /href="(https:\/\/wa\.me\/[^"]+)"/.exec(html);
  assert.ok(href, 'expected a wa.me link');
  assert.match(href[1], /^https:\/\/wa\.me\/962790000000\?text=/);
  assert.match(decodeURIComponent(href[1].replace(/\+/g, ' ')), /Espresso Arabica Beans/);
});

test('a store with no note, no refund policy and no WhatsApp renders no empty list', async () => {
  const html = await product(espresso, {
    ...withSettings({ shipping_note: '' }),
    shop: { ...fixtures.shop, refund_policy: null },
  });
  assert.equal(/main-product__assurance/.test(html), false);
});

// ---------- Cart ----------

test('the cart page states the delivery cost under the subtotal', async () => {
  const item = { ...fixtures.cart, item_count: 1, total_price: 750, items: [] };
  const html = await renderSection('main-cart', { scope: { cart: { ...item, items: [{
    key: 'k', id: 1, quantity: 1, final_line_price: 750, final_price: 750, price: 750,
    url: espresso.url, title: espresso.title, product: espresso, variant: espresso.variants[0],
    image: espresso.featured_image, options_with_values: [],
  }] } } });
  assert.match(html, /cart__note--delivery">Delivery in Amman 3 JD/);
});

// ---------- Enquiry ----------

test('the enquiry form offers WhatsApp only when a number is set', async () => {
  assert.equal(/wa\.me/.test(await renderSection('enquiry-form')), false);
  const html = await renderSection('enquiry-form', { scope: withSettings({ social_whatsapp: WHATSAPP }) });
  assert.equal(countMatches(html, /href="https:\/\/wa\.me\/962790000000\?text=/g), 1);
});

// ---------- Preview parity ----------

test('the preview hands the theme its schema defaults, as Shopify does', () => {
  assert.equal(typeof fixtures.settings.shipping_note, 'string');
  assert.ok(fixtures.settings.shipping_note.length > 0);
});
