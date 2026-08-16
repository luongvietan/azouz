import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSearchFixture } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (terms) =>
  renderSection('main-search', { scope: { search: buildSearchFixture(terms) } });

test('the search heading is the page h1, and the only one', async () => {
  const html = await render('wadi');
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders a get form so a search is a shareable url', async () => {
  const html = await render('');
  assert.match(html, /<form[^>]+method="get"/);
  assert.match(html, /action="\/search"/);
  assert.match(html, /name="q"/);
});

test('the search field is labelled', async () => {
  const html = await render('');
  assert.match(html, /<label[^>]+for="SearchInput"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the field keeps the terms that were searched for', async () => {
  const html = await render('wadi');
  assert.match(html, /value="wadi"/);
});

test('renders a card per result', async () => {
  const html = await render('blend');
  assert.equal(countMatches(html, /class="product-card"/g), 3);
});

test('states how many results were found', async () => {
  const html = await render('wadi');
  assert.match(html, /search__count/);
});

test('a search with no matches shows the no-results message, not an empty grid', async () => {
  const html = await render('zzzz');
  assert.match(html, /search__empty/);
  assert.equal(/product-card/.test(html), false);
});

test('before any search there is no results message at all', async () => {
  const html = await render('');
  assert.equal(/search__empty/.test(html), false);
  assert.equal(/search__count/.test(html), false);
});

test('has no presets', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-search.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
