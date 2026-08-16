import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('renders a single h1 explaining what happened', async () => {
  const html = await renderSection('main-404');
  assert.equal(countMatches(html, /<h1/g), 1);
  assert.equal(/translation missing/.test(html), false);
});

test('offers a way back to the shop and to the homepage', async () => {
  const html = await renderSection('main-404');
  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/collections\/all"/);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-404.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
