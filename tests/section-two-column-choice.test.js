import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const option = (id, settings) => ({ id, type: 'option', settings, shopify_attributes: '' });

const TWO = [
  option('o1', {
    title: 'Choose One of Our Existing Blends',
    body: 'A faster option if you want to launch quickly.',
  }),
  option('o2', {
    title: 'Create Your Own Blend',
    body: 'Work with us to develop a coffee specifically for your brand, market and target price.',
  }),
];

test('renders one column per block', async () => {
  const html = await renderSection('two-column-choice', { blocks: TWO });
  assert.equal(countMatches(html, /class="choice-column[ "]/g), 2);
  assert.match(html, /A faster option if you want to launch quickly\./);
});

test('option titles are h3 under a single h2', async () => {
  const html = await renderSection('two-column-choice', { settings: { heading: 'Your Blend or Ours.' }, blocks: TWO });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 2);
});

test('an optional cta renders only when fully configured', async () => {
  const withLink = await renderSection('two-column-choice', {
    blocks: [option('o1', { title: 'X', link_label: 'Start', link: '/pages/private-label' })],
  });
  assert.match(withLink, /href="\/pages\/private-label"/);

  const halfLink = await renderSection('two-column-choice', {
    blocks: [option('o1', { title: 'X', link_label: 'Start', link: '' })],
  });
  assert.equal(/href=""/.test(halfLink), false);
});

test('declares a preset with two options', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/two-column-choice.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 2);
});
