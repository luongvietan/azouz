import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const step = (id, settings) => ({ id, type: 'step', settings, shopify_attributes: '' });

const FLOW = ['Source', 'Blend', 'Roast', 'Grind', 'Pack'].map((title, i) =>
  step(`s${i}`, { title }),
);

test('renders one step per block, in order', async () => {
  const html = await renderSection('process-steps', { blocks: FLOW });
  assert.equal(countMatches(html, /class="process-step[ "]/g), 5);
  assert.ok(html.indexOf('Source') < html.indexOf('Blend'));
  assert.ok(html.indexOf('Grind') < html.indexOf('Pack'));
});

test('is an ordered list — the sequence carries meaning', async () => {
  const html = await renderSection('process-steps', { blocks: FLOW });
  assert.match(html, /<ol/);
});

test('renders step descriptions when present and omits the element when not', async () => {
  const withBody = await renderSection('process-steps', {
    blocks: [step('s1', { title: 'Roasting', body: 'Your approved coffee is roasted consistently to the agreed profile.' })],
  });
  assert.match(withBody, /roasted consistently to the agreed profile/);

  const withoutBody = await renderSection('process-steps', { blocks: [step('s1', { title: 'Roast' })] });
  assert.equal(/process-step__body/.test(withoutBody), false);
});

test('step numbers are decorative and hidden from assistive tech', async () => {
  const html = await renderSection('process-steps', { settings: { show_numbers: true }, blocks: FLOW });
  assert.match(html, /class="process-step__number"[^>]*aria-hidden="true"/);
});

test('step titles are h3 and the section heading is the only h2', async () => {
  const html = await renderSection('process-steps', { settings: { heading: 'From Bean to Bag.' }, blocks: FLOW });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 5);
});

test('declares a preset with the five production steps', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/process-steps.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 5);
});
