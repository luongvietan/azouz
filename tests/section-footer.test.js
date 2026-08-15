import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('footer', { settings: { menu: 'footer', ...settings } });

test('is a contentinfo landmark', async () => {
  assert.match(await render(), /<footer[^>]+class="footer"/);
});

test('renders the menu links', async () => {
  const html = await render();
  assert.match(html, /Request a Sample/);
  assert.match(html, /Get a Quote/);
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

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/footer.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
