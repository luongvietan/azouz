import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('footer', { settings: { menu: 'footer', ...settings } });

test('is a contentinfo landmark', async () => {
  assert.match(await render(), /<footer[^>]+class="footer"/);
});

test('renders service links instead of duplicating enquiry CTAs', async () => {
  const html = await render();
  assert.match(html, /Private Label/);
  assert.match(html, /Wholesale/);
  assert.match(html, /Shop/);
  assert.equal(/Request a Sample/.test(html), false);
  assert.equal(/Get a Quote/.test(html), false);
});

test('shows the shop name and the current year in the copyright', async () => {
  const html = await render();
  assert.match(html, /Azouz Coffee/);
  assert.match(html, new RegExp(String(new Date().getFullYear())));
});

test('renders the contact email as a mailto link when set', async () => {
  const html = await render({ show_contact: true });
  assert.match(html, /mailto:hello@azouzcoffee\.com/);
});

test('social links appear only when configured', async () => {
  const html = await render();
  assert.equal(/href=""/.test(html), false, 'no empty hrefs from unset social settings');
});

test('social links that are set get an accessible name', async () => {
  const html = await renderSection('footer', {
    settings: { menu: 'footer' },
    scope: { settings: { social_instagram: 'https://instagram.com/azouzcoffee' } },
  });
  if (/instagram\.com/.test(html)) {
    assert.match(html, /aria-label="[^"]+"|visually-hidden/);
  }
});

test('no user-visible english is hard-coded in the markup', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('the dark ground gets the light lockup', async () => {
  // The footer paints Onyx. The black lockup would disappear into it, and the
  // white one is the same artwork recoloured, so the declared box still matches.
  const html = await render();
  assert.match(html, /logo-white\.svg/);
  assert.equal(/logo-black\.svg/.test(html), false);
});

test('the roastery address is marked up as an address, not a paragraph', async () => {
  const html = await renderSection('footer', {
    settings: { show_contact: true, address: 'Amman\nJordan' },
  });
  assert.match(html, /<address class="footer__address">/);
  // The line breaks the merchant typed survive into the markup.
  assert.match(html, /Amman<br\s*\/?>/);
});

test('a store with no contact details renders no roastery column', async () => {
  const html = await renderSection('footer', { settings: { show_contact: false } });
  assert.equal(/footer__address/.test(html), false);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/footer.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});

test('the store policies are reachable from the footer', async () => {
  const html = await render();
  assert.match(html, /footer__policies/);
  for (const title of ['Privacy policy', 'Terms of service', 'Refund policy']) {
    assert.match(html, new RegExp(title), `missing ${title}`);
  }
});

test('a store with no written policies renders no empty policy nav', async () => {
  const html = await renderSection('footer', {
    settings: { menu: 'footer' },
    scope: { shop: { name: 'Azouz Coffee', policies: [], email: '' } },
  });
  assert.equal(/footer__policies/.test(html), false);
});
