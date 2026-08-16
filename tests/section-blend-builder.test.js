import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const attr = (id, settings) => ({ id, type: 'attribute', settings, shopify_attributes: '' });

const SIX = [
  attr('a1', { title: 'Body', low: 'Light', high: 'Full' }),
  attr('a2', { title: 'Sweetness', low: 'Subtle', high: 'Pronounced' }),
  attr('a3', { title: 'Acidity', low: 'Low', high: 'Bright' }),
  attr('a4', { title: 'Roast Level', low: 'Light', high: 'Dark' }),
  attr('a5', { title: 'Arabica/Robusta Ratio', low: '100% Arabica', high: 'Robusta blend' }),
  attr('a6', { title: 'Flavour Profile', low: 'Chocolate', high: 'Fruit' }),
];

test('renders one row per attribute with both pole labels', async () => {
  const html = await renderSection('blend-builder', { blocks: SIX });
  assert.equal(countMatches(html, /class="blend-attr[ "]/g), 6);
  assert.match(html, /100% Arabica/);
  assert.match(html, /Robusta blend/);
});

test('does not render a decorative spectrum bar', async () => {
  const html = await renderSection('blend-builder', { blocks: [SIX[0]] });
  assert.equal(/blend-attr__track/.test(html), false);
  assert.match(html, /class="blend-attr__range"/);
});

test('the meaning survives as plain text poles joined by an arrow', async () => {
  const html = await renderSection('blend-builder', { blocks: [SIX[0]] });
  assert.match(html, />\s*Light\s*<\/span>/);
  assert.match(html, />\s*Full\s*<\/span>/);
  assert.match(html, /class="blend-attr__sep"[^>]*aria-hidden="true"/);
});

test('renders the heading as an h2 and attribute names as h3', async () => {
  const html = await renderSection('blend-builder', { settings: { heading: 'Create Your Own Blend' }, blocks: SIX });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 6);
});

test('declares a preset with all six attributes', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/blend-builder.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 6);
});
