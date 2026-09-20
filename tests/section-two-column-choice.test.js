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

const CORNER = option('corner', {
  title: 'Azouz Coffee Corner',
  body: 'Add an Azouz Coffee counter inside a business you already operate.',
  list_label: 'Suitable for:',
  list: 'Hotels, Restaurants, Offices,, Retail Spaces ',
  note: 'A simpler way to introduce a premium coffee offer without opening a full standalone café.',
  link_label: 'Enquire About a Coffee Corner',
  link: '/pages/own-an-azouz-coffee#enquire',
});

test('an option can list who it suits, one chip per entry', async () => {
  const html = await renderSection('two-column-choice', { blocks: [CORNER] });
  assert.match(html, /<p class="choice-column__fit-label">Suitable for:<\/p>/);
  const tags = [...html.matchAll(/<li class="choice-column__tag">([^<]*)<\/li>/g)].map((m) => m[1]);
  // Trimmed, and the doubled comma does not become an empty chip.
  assert.deepEqual(tags, ['Hotels', 'Restaurants', 'Offices', 'Retail Spaces']);
});

test('the copy runs description, list, closing line, then the button', async () => {
  const html = await renderSection('two-column-choice', { blocks: [CORNER] });
  const order = [
    'Add an Azouz Coffee counter',
    'choice-column__tags',
    'A simpler way to introduce',
    'Enquire About a Coffee Corner',
  ].map((marker) => html.indexOf(marker));
  assert.ok(order.every((at) => at > -1), 'every part of the option must render');
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test('an option without a list renders no empty list or label', async () => {
  const html = await renderSection('two-column-choice', { blocks: TWO });
  assert.equal(/choice-column__fit/.test(html), false);
  assert.equal(/choice-column__tags/.test(html), false);
});

test('declares a preset with two options', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/two-column-choice.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 2);
});
