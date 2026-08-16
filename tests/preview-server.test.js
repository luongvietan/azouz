import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewServer } from '../preview/server.js';
import { resetCart } from '../preview/cart-api.js';

let server;
let origin;

before(async () => {
  server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, resolve));
  origin = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('the homepage renders a full document', async () => {
  const response = await fetch(`${origin}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Your Coffee\. Your Brand\. Our Roastery\./);
});

test('a product page renders that product', async () => {
  const html = await (await fetch(`${origin}/products/wadi-rum-blend`)).text();
  assert.match(html, /Wadi Rum Blend/);
});

test('an unknown url renders the theme 404, not a server error', async () => {
  const response = await fetch(`${origin}/nope`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /<!doctype html>/i);
});

test('the remove link works — GET /cart/change with quantity 0 drops the line', async () => {
  resetCart();
  await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ id: 'wadi-rum-blend-250-wb', quantity: '1' }),
  });

  const response = await fetch(
    `${origin}/cart/change?id=wadi-rum-blend-250-wb&quantity=0`,
    { redirect: 'manual' },
  );
  assert.equal(response.status, 302);

  const cart = await (await fetch(`${origin}/cart.js`)).json();
  assert.equal(cart.item_count, 0);
});

test('cart.js returns the live cart as json', async () => {
  resetCart();
  const cart = await (await fetch(`${origin}/cart.js`)).json();
  assert.equal(cart.item_count, 0);
});

test('posting to /cart/add adds a line and returns json for fetch callers', async () => {
  resetCart();
  const response = await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ id: 'wadi-rum-blend-250-wb', quantity: '2' }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.item_count, 2);
});

test('posting to /cart/add without an ajax Accept header redirects to the cart page', async () => {
  resetCart();
  const response = await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id: 'wadi-rum-blend-250-wb', quantity: '1' }),
    redirect: 'manual',
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/cart');
});

test('the section rendering endpoint returns rendered html per section', async () => {
  resetCart();
  const response = await fetch(`${origin}/?sections=cart-drawer,header`);
  assert.equal(response.status, 200);
  const sections = await response.json();
  assert.match(sections['cart-drawer'], /shopify-section-cart-drawer/);
  assert.match(sections.header, /shopify-section-header/);
});

test('an asset is served with the right content type', async () => {
  const response = await fetch(`${origin}/assets/commerce.css`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
});

test('the header navigation renders the main menu — link_list settings must resolve', async () => {
  const html = await (await fetch(`${origin}/`)).text();
  assert.match(html, /class="header__link"[^>]*href="\/pages\/private-label"/);
  assert.match(html, /class="header__link"[^>]*href="\/pages\/wholesale"/);
  assert.match(html, /class="header__link"[^>]*href="\/pages\/our-brands"/);
});

test('posting the contact form redirects back instead of 404', async () => {
  const response = await fetch(`${origin}/contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: `${origin}/pages/get-a-quote`,
    },
    body: new URLSearchParams({ 'contact[email]': 'hello@example.com' }),
    redirect: 'manual',
  });
  assert.equal(response.status, 302);
  assert.match(response.headers.get('location') ?? '', /get-a-quote/);
});

test('the enquiry page shows the success banner after contact_posted=1', async () => {
  const html = await (await fetch(`${origin}/pages/get-a-quote?contact_posted=1`)).text();
  assert.match(html, /enquiry__success|Thanks — we have your enquiry/);
});

test('the enquiry page does not show the success banner without the query', async () => {
  const html = await (await fetch(`${origin}/pages/get-a-quote`)).text();
  assert.equal(/enquiry__success/.test(html), false);
  assert.equal(/Thanks — we have your enquiry/.test(html), false);
});

test('posting multipart form data to /cart/add works — that is what product-form fetch sends', async () => {
  resetCart();
  const body = new FormData();
  body.set('id', 'wadi-rum-blend-250-wb');
  body.set('quantity', '1');
  const response = await fetch(`${origin}/cart/add`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).item_count, 1);
});

test('product images under /preview-media/ are the client packaging shots', async () => {
  for (const handle of ['wadi-rum-blend', 'dead-sea-blend', 'downtown-blend', 'filtered-coffee-bags']) {
    const response = await fetch(`${origin}/preview-media/${handle}.jpg`);
    assert.equal(response.status, 200, handle);
    assert.match(response.headers.get('content-type') ?? '', /image\/jpeg/);
  }
});

test('the password page uses the password layout — no store header or cart drawer', async () => {
  const html = await (await fetch(`${origin}/password`)).text();
  assert.match(html, /template-password/);
  assert.equal(/class="header"/.test(html), false);
  assert.equal(/cart-drawer/.test(html), false);
});
