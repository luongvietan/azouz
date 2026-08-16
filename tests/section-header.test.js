import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('header', { settings: { menu: 'main-menu', ...settings } });

test('is a banner landmark', async () => {
  assert.match(await render(), /<header[^>]+class="header"/);
});

test('the logo links home', async () => {
  assert.match(await render(), /<a[^>]+class="header__logo"[^>]+href="\/"/);
});

test('falls back to the bundled vector logo when no logo is uploaded', async () => {
  const html = await render({ logo: '' });
  assert.match(html, /logo-black\.svg/);
});

test('uses the uploaded logo when one is set', async () => {
  const html = await render({ logo: 'logo-primary.svg' });
  assert.match(html, /logo-primary\.svg/);
});

test('the logo image has non-empty alt text', async () => {
  const img = /<img[^>]+class="header__logo-image"[^>]*>/.exec(await render())[0];
  const alt = /alt="([^"]*)"/.exec(img);
  assert.ok(alt && alt[1].trim().length > 0, 'logo alt must not be empty');
});

test('renders every link from the chosen menu', async () => {
  const html = await render();
  for (const label of ['Private Label', 'Wholesale', 'Our Brands', 'Shop']) {
    assert.match(html, new RegExp(label));
  }
});

test('the navigation has an accessible name', async () => {
  assert.match(await render(), /<nav[^>]+aria-label="[^"]+"/);
});

test('the cart link shows the item count', async () => {
  const html = await render();
  assert.match(html, /href="\/cart"/);
  assert.match(html, /header__cart-count/);
});

test('both cart counts carry a sync hook so ajax cannot desync them', async () => {
  // The visible count is aria-hidden; the count a screen reader actually reads
  // is the visually-hidden one. syncCartCount has to find and update both.
  const html = await render();
  assert.match(html, /data-cart-count\b/, 'the visible count needs its hook');
  assert.match(html, /data-cart-count-label\b/, 'the screen-reader count needs its own hook');
});

test('search and cart actions expose a single action label', async () => {
  const html = await render();
  assert.match(html, /class="header__action-label"[^>]*>Search</);
  assert.match(html, /class="header__action-label"[^>]*>Your cart</);
  assert.equal((html.match(/class="header__action-label"/g) || []).length, 2);
});

test('the mobile menu works without javascript', async () => {
  const html = await render();
  assert.match(html, /<details[^>]*class="header__mobile"/);
  assert.match(html, /<summary/);
});

test('no user-visible english is hard-coded in the markup', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('the logo height setting cannot go below the brand minimum of 57px', async () => {
  const schema = JSON.parse(await readFile(resolveInTheme('config/settings_schema.json'), 'utf8'));
  const height = schema
    .slice(1)
    .flatMap((group) => group.settings)
    .find((setting) => setting.id === 'logo_height');
  assert.equal(height.min, 57, 'brand guidelines: full lockup minimum 57px digital');
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/header.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});

test('the active nav link is marked for assistive tech, not only visually', async () => {
  // `is-active` only styles it; aria-current is what a screen reader announces.
  const html = await renderSection('header', {
    settings: {
      menu: {
        links: [
          { title: 'Wholesale', url: '/pages/wholesale', active: false, links: [] },
          { title: 'Shop', url: '/collections/all', active: true, links: [] },
        ],
      },
    },
  });

  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1, 'exactly one link is current');
  assert.match(html, /href="\/collections\/all"[^>]*aria-current="page"/);
});

test('no link is marked current when none is active', async () => {
  assert.equal(/aria-current/.test(await render()), false);
});
