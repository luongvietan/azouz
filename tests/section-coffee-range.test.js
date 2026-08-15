import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const range = (id, settings) => ({ id, type: 'range', settings, shopify_attributes: '' });

const FOUR = [
  range('r1', { title: 'Espresso Blends', body: 'Balanced coffees developed for espresso and milk-based drinks.', label_color: '#C4562E' }),
  range('r2', { title: 'Turkish Coffee', body: 'Traditional profiles available plain or with cardamom.', label_color: '#7C7F44' }),
  range('r3', { title: 'Specialty Coffee', body: 'Single origins and specialty-grade coffees selected for quality and flavour.', label_color: '#BFDDD3' }),
  range('r4', { title: 'Filter Coffee', body: 'Coffee roasted for V60, batch brew and other filter methods.', label_color: '#303030' }),
];

test('renders one card per block with title and body', async () => {
  const html = await renderSection('coffee-range', { blocks: FOUR });
  assert.equal(countMatches(html, /class="range-card[ "]/g), 4);
  assert.match(html, /plain or with cardamom/);
});

test('each card is a packaging label block', async () => {
  const html = await renderSection('coffee-range', { blocks: FOUR });
  assert.equal(countMatches(html, /label-block__title/g), 4);
});

test('the per-range colour drives the label fill', async () => {
  const html = await renderSection('coffee-range', { blocks: [FOUR[0]] });
  assert.match(html, /--label-bg:\s*#C4562E/);
});

test('a light label colour switches the text to jet for contrast', async () => {
  const html = await renderSection('coffee-range', {
    blocks: [range('r1', { title: 'Specialty', label_color: '#BFDDD3', label_text: 'dark' })],
  });
  assert.match(html, /--label-fg:\s*var\(--color-text\)/);
});

test('card titles are h3 under a single h2', async () => {
  const html = await renderSection('coffee-range', { settings: { heading: 'Our Coffee Range' }, blocks: FOUR });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 4);
});

test('declares a preset with four ranges', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/coffee-range.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 4);
});
