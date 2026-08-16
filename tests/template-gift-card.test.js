import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { buildFixtures, buildGiftCardFixture } from '../preview/fixtures.js';
import { resolveRoute, listPreviewPaths } from '../preview/route-context.js';
import { resolveInTheme, THEME_DIR } from '../scripts/theme-paths.js';

const source = () => readFile(resolveInTheme('templates/gift_card.liquid'), 'utf8');

/** Render the template the way the preview server does for a .liquid template. */
async function render(state = '') {
  const engine = await createEngine(THEME_DIR);
  const fixtures = buildFixtures();
  return renderThemeFile(engine, THEME_DIR, 'templates/gift_card.liquid', {
    ...fixtures,
    request: { ...fixtures.request, page_type: 'gift_card', query: {} },
    gift_card: buildGiftCardFixture(state),
  });
}

test('the gift card template is liquid, not json — Shopify does not section this page', async () => {
  // A gift_card.json is rejected on upload. If this ever becomes a JSON
  // template the page stops rendering entirely.
  assert.match(await source(), /\{%\s*layout none\s*%\}/);
});

test('it renders a complete standalone document', async () => {
  const html = await render();
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html[^>]+lang="en"[^>]+dir="ltr"/);
  assert.match(html, /<\/html>\s*$/);
});

test('it carries none of the storefront chrome', async () => {
  // The recipient arrives from an email to read a code. A cart drawer here
  // would also fetch a cart this visitor does not have.
  const html = await render();
  for (const chrome of ['header__inner', 'site-footer', 'cart-drawer', 'announcement']) {
    assert.equal(html.includes(chrome), false, `the gift card page still renders ${chrome}`);
  }
});

test('the url is never indexed — it is a bearer token for the balance', async () => {
  const html = await render();
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
});

test('the code is plain selectable text, grouped for retyping', async () => {
  const html = await render();
  assert.match(html, /<p class="gift-card__code"[^>]*>AZOU 1H7G 3K9M 2P<\/p>/);
  assert.equal(/<img[^>]+code/i.test(html), false, 'the code must not be an image');
});

test('the code is labelled for assistive tech', async () => {
  const html = await render();
  assert.match(html, /id="GiftCardCodeLabel"/);
  assert.match(html, /aria-describedby="GiftCardCodeLabel"/);
});

test('the face value is shown as money in the shop currency', async () => {
  assert.match(await render(), /class="gift-card__value">JOD\s?50\.000</);
});

test('an untouched card shows no remaining balance', async () => {
  // "50 JOD remaining" under "50 JOD" reads as though something was spent.
  const html = await render();
  assert.equal(/gift-card__balance/.test(html), false);
});

test('a part-spent card shows what is left', async () => {
  const html = await render('part-spent');
  assert.match(html, /class="gift-card__balance">JOD\s?17\.500 remaining</);
});

test('each dead state says so, and none of them invites a checkout', async () => {
  for (const [state, message] of [
    ['expired', 'This gift card has expired.'],
    ['disabled', 'This gift card is no longer active.'],
    ['spent', 'This gift card has been spent in full.'],
  ]) {
    const html = await render(state);
    assert.match(html, new RegExp(message.replace('.', '\\.')), `${state} has no notice`);
    assert.match(html, /gift-card__status--warning/, `${state} notice is not emphasised`);
    assert.equal(
      /Enter this code at checkout/.test(html),
      false,
      `${state} still tells the customer to spend it`,
    );
  }
});

test('a live card carries the expiry date and the redeem instruction', async () => {
  const html = await render();
  assert.match(html, /Expires on 17 August 2027/);
  assert.match(html, /Enter this code at checkout/);
  assert.equal(/gift-card__status--warning/.test(html), false);
});

test('the warning state does not rely on colour alone', async () => {
  // Greyscale print and colour-blind readers both have to get the message.
  const css = await readFile(resolveInTheme('assets/gift-card.css'), 'utf8');
  const rule = /\.gift-card__status--warning\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the warning rule is missing');
  assert.match(rule[1], /font-weight/);
  assert.match(rule[1], /border-block-start/);
});

test('both scripted actions are inside the element that upgrades them', async () => {
  const html = await render();
  const element = /<gift-card-actions[\s\S]*?<\/gift-card-actions>/.exec(html);
  assert.ok(element, 'the actions element is missing');
  assert.match(element[0], /data-gift-card-copy/);
  assert.match(element[0], /data-gift-card-print/);
});

test('with scripting off the actions are hidden rather than dead on screen', async () => {
  const css = await readFile(resolveInTheme('assets/gift-card.css'), 'utf8');
  assert.match(css, /\.no-js \.gift-card__actions\s*\{\s*display:\s*none;?\s*\}/);
});

test('the apple wallet pass and a way back to the shop are both offered', async () => {
  const html = await render();
  assert.match(html, /href="\/gift_cards\/1\/azou1h7g3k9m2p\.pkpass"/);
  assert.match(html, /href="https:\/\/www\.azouzcoffee\.com"[^>]*>Start shopping/);
});

test('it loads only the stylesheets this page needs', async () => {
  const html = await render();
  for (const sheet of ['tokens.css', 'fonts.css', 'base.css', 'gift-card.css']) {
    assert.match(html, new RegExp(sheet.replace('.', '\\.')), `${sheet} is not linked`);
  }
  // sections.css and commerce.css style chrome this page does not render.
  assert.equal(/sections\.css/.test(html), false);
  assert.equal(/commerce\.css/.test(html), false);
});

test('no empty href, no unresolved translation, in any state', async () => {
  for (const state of ['', 'part-spent', 'spent', 'expired', 'disabled']) {
    const html = await render(state);
    assert.equal(/href=""/.test(html), false, `${state || 'default'} has an empty link`);
    assert.equal(/translation missing/.test(html), false, `${state || 'default'} is missing a key`);
  }
});

test('the issued-card url resolves to the liquid template', () => {
  const route = resolveRoute('/gift_cards/1/azou1h7g3k9m2p');
  assert.equal(route.page_type, 'gift_card');
  assert.equal(route.template, 'templates/gift_card.liquid');
  assert.equal(route.scope.gift_card.balance, 5000);
});

test('?state= selects a card state so the dead ones can be reviewed', () => {
  const route = resolveRoute('/gift_cards/1/azou1h7g3k9m2p', new URLSearchParams('state=expired'));
  assert.equal(route.scope.gift_card.expired, true);
});

test('a malformed gift card url falls through to the 404 template', () => {
  for (const path of ['/gift_cards', '/gift_cards/1', '/gift_cards/abc/token']) {
    assert.equal(resolveRoute(path).page_type, '404', `${path} should not resolve`);
  }
});

test('the preview advertises the gift card path', () => {
  assert.ok(listPreviewPaths().some((path) => path.startsWith('/gift_cards/')));
});
