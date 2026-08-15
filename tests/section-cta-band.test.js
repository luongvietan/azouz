import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('cta-band', { settings });

test('renders the heading as an h2, never an h1', async () => {
  const html = await render({ heading: "Let's Create Your Coffee." });
  assert.match(html, /<h2[^>]*>[\s\S]*Let&#39;s Create Your Coffee\.|<h2[^>]*>[\s\S]*Let's Create Your Coffee\./);
  assert.equal(/<h1/.test(html), false);
});

test('renders both calls to action', async () => {
  const html = await render({
    cta_primary_label: 'Request a Sample',
    cta_primary_link: '/pages/request-a-sample',
    cta_secondary_label: 'Get a Quote',
    cta_secondary_link: '/pages/get-a-quote',
  });
  assert.match(html, /href="\/pages\/request-a-sample"/);
  assert.match(html, /href="\/pages\/get-a-quote"/);
});

test('the green background uses the accent modifier so its text passes contrast', async () => {
  const html = await render({ background: 'accent' });
  assert.match(html, /section--accent/);
});

test('renders no empty anchors when a cta is half configured', async () => {
  const html = await render({ cta_primary_label: 'Go', cta_primary_link: '' });
  assert.equal(/href=""/.test(html), false);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/cta-band.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
