import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('brand-feature', { settings });

test('renders the brand name as an h2 with its description', async () => {
  const html = await render({
    heading: 'Azouz Coffee',
    body: '<p>Our own coffee brand, developed for modern coffee drinkers.</p>',
  });
  assert.match(html, /<h2[^>]*>[\s\S]*Azouz Coffee/);
  assert.match(html, /modern coffee drinkers/);
});

test('the cta bridges into the shop', async () => {
  const html = await render({ cta_label: 'View Azouz Coffee', cta_link: '/collections/all' });
  assert.match(html, /href="\/collections\/all"[^>]*>[\s\S]*View Azouz Coffee/);
});

test('renders no empty anchor when the cta is half configured', async () => {
  assert.equal(/href=""/.test(await render({ cta_label: 'View', cta_link: '' })), false);
});

test('the image carries alt text and loads lazily — it is below the fold', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'Azouz Coffee retail bags' });
  assert.match(html, /alt="Azouz Coffee retail bags"/);
  assert.match(html, /loading="lazy"/);
});

test('the media order can be flipped without physical css', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'x', media_position: 'start' });
  assert.match(html, /brand-feature__inner--media-start/);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/brand-feature.liquid'), 'utf8'));
  assert.ok(schema.presets?.length > 0);
});
