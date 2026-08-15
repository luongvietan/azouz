import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection } from './helpers/render-section.js';

test('renders the announcement text', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: 'Roasted in Jordan' } });
  assert.match(html, /Roasted in Jordan/);
});

test('renders nothing at all when the text is empty', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: '' } });
  assert.equal(html.trim(), '');
});

test('renders the optional link only when both label and url are set', async () => {
  const withBoth = await renderSection('announcement-bar', {
    settings: { text: 'Now taking wholesale orders', link_label: 'Enquire', link: '/pages/get-a-quote' },
  });
  assert.match(withBoth, /href="\/pages\/get-a-quote"/);
  assert.match(withBoth, /Enquire/);

  const labelOnly = await renderSection('announcement-bar', {
    settings: { text: 'Now taking wholesale orders', link_label: 'Enquire', link: '' },
  });
  assert.equal(/<a /.test(labelOnly), false, 'a label with no url must not produce an empty link');
});

test('is announced as a region with an accessible name', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: 'Hello' } });
  assert.match(html, /role="region"/);
  assert.match(html, /aria-label="[^"]+"/);
});

test('the accessible name comes from the locale file, not hard-coded English', async () => {
  const html = await renderSection('announcement-bar', { settings: { text: 'Hello' } });
  assert.equal(/translation missing/.test(html), false);
});

test('declares a preset so the client can add it in the theme editor', async () => {
  const { readFile } = await import('node:fs/promises');
  const { resolveInTheme } = await import('../scripts/theme-paths.js');
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(
    await readFile(resolveInTheme('sections/announcement-bar.liquid'), 'utf8'),
  );
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
