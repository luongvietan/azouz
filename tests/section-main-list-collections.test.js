import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFixtures } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';

const collections = Object.values(buildFixtures().collections);

test('renders a single h1', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections } });
  assert.equal(countMatches(html, /<h1/g), 1);
  assert.equal(/translation missing/.test(html), false);
});

test('renders a card per collection, linking to it', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections } });
  assert.equal(countMatches(html, /class="collection-card"/g), collections.length);
  assert.match(html, /href="\/collections\/all"/);
});

test('states each collection product count', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections } });
  assert.match(html, /collection-card__count/);
});

test('no collections renders an empty state, not an empty grid', async () => {
  const html = await renderSection('main-list-collections', { scope: { collections: [] } });
  assert.equal(/collection-card/.test(html), false);
});
