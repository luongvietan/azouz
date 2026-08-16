import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const renderLayout = async (scope = {}) => {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', scope);
};

test('the layout renders a complete html document', async () => {
  const out = await renderLayout();
  assert.match(out, /^<!doctype html>/i);
  assert.match(out, /<\/html>\s*$/i);
});

test('the html element carries lang and dir from the request locale', async () => {
  const out = await renderLayout();
  assert.match(out, /<html[^>]+lang="en"/);
  assert.match(out, /<html[^>]+dir="ltr"/);
});

test('the html element flips to rtl for a right-to-left locale', async () => {
  const out = await renderLayout({ request: { locale: { iso_code: 'ar' }, page_type: 'index' } });
  assert.match(out, /<html[^>]+lang="ar"/);
  assert.match(out, /<html[^>]+dir="rtl"/);
});

test('the layout links the token, font and base stylesheets in that order', async () => {
  const out = await renderLayout();
  const order = ['tokens.css', 'fonts.css', 'base.css'].map((name) => out.indexOf(name));
  assert.ok(order.every((index) => index > -1), 'all three stylesheets must be linked');
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'tokens must load before base');
});

test('the layout preloads the regular-weight latin font', async () => {
  const out = await renderLayout();
  assert.match(out, /<link rel="preload"[^>]+baloo-latin-400\.woff2[^>]+as="font"/);
});

test('the layout renders a skip link before the header', async () => {
  const out = await renderLayout();
  assert.ok(out.indexOf('skip-link') < out.indexOf('<!-- section: header -->') ||
            out.indexOf('skip-link') < out.indexOf('<header'));
});

test('the layout has a main landmark with the skip-link target id', async () => {
  const out = await renderLayout();
  assert.match(out, /<main[^>]+id="MainContent"/);
  assert.match(out, /href="#MainContent"/);
});

test('the layout yields content_for_layout inside main', async () => {
  const out = await renderLayout({ content_for_layout: '<p>PAGE BODY</p>' });
  const main = /<main[\s\S]*?<\/main>/.exec(out)[0];
  assert.match(main, /<p>PAGE BODY<\/p>/);
});

test('the layout renders the meta tags and structured data snippets', async () => {
  const out = await renderLayout();
  assert.match(out, /<title>/);
  assert.match(out, /application\/ld\+json/);
});

test('rendered snippets see Shopify globals — title is the shop name, not a bare middot', async () => {
  const out = await renderLayout();
  assert.match(out, /<title>[^<]*Azouz Coffee[^<]*<\/title>/);
  assert.match(out, /property="og:site_name" content="Azouz Coffee"/);
  assert.match(out, /"name":\s*"Azouz Coffee"/);
});

test('an unconfigured store emits no colour override block at all', async () => {
  const out = await renderLayout({ settings: {} });
  assert.equal(/--color-accent:/.test(out), false, 'the guideline palette in tokens.css must stand alone');
});

test('theme editor colours reach the semantic tokens', async () => {
  const out = await renderLayout({
    settings: {
      color_background: '#FFFFFF',
      color_background_alt: '#EEEEEE',
      color_text: '#111111',
      color_accent: '#67985E',
      color_accent_deep: '#4F7748',
    },
  });

  const style = /<style>([\s\S]*?)<\/style>/.exec(out);
  assert.ok(style, 'a colour override style block must be emitted');

  for (const [token, value] of [
    ['--color-bg', '#FFFFFF'],
    ['--color-bg-alt', '#EEEEEE'],
    ['--color-text', '#111111'],
    ['--color-accent', '#67985E'],
    ['--color-accent-deep', '#4F7748'],
  ]) {
    assert.match(style[1], new RegExp(`${token}:\\s*${value};`), `${token} not wired`);
  }
});

test('the focus ring follows the deep accent so it never loses contrast', async () => {
  const out = await renderLayout({ settings: { color_accent_deep: '#123456' } });
  const style = /<style>([\s\S]*?)<\/style>/.exec(out);
  assert.match(style[1], /--color-focus:\s*#123456;/);
});

test('colour overrides land after tokens.css so they win', async () => {
  const out = await renderLayout({ settings: { color_accent: '#67985E' } });
  assert.ok(out.indexOf('tokens.css') < out.indexOf('<style>'), 'tokens.css must load first');
});

test('theme.js is deferred so it never blocks rendering', async () => {
  const out = await renderLayout();
  assert.match(out, /theme\.js[^>]*defer/);
});

test('a regional rtl locale still flips direction', async () => {
  // `'ar,he,fa,ur' contains 'he-IL'` is false, so a substring test silently
  // left regional right-to-left locales rendering left-to-right.
  for (const locale of ['ar', 'ar-JO', 'he', 'he-IL', 'fa-IR', 'ur-PK']) {
    const out = await renderLayout({ request: { locale: { iso_code: locale }, page_type: 'index' } });
    assert.match(out, /<html[^>]+dir="rtl"/, `${locale} should be rtl`);
  }
});

test('a left-to-right locale that merely shares letters stays ltr', async () => {
  for (const locale of ['en', 'fr', 'hu', 'af', 'es']) {
    const out = await renderLayout({ request: { locale: { iso_code: locale }, page_type: 'index' } });
    assert.match(out, /<html[^>]+dir="ltr"/, `${locale} should be ltr`);
  }
});
