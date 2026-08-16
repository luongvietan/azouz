import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';

test('renders five dots, four of them filled, for a roast level of 4', async () => {
  const html = await renderSnippet('roast-meter', { level: 4 });
  assert.equal(countMatches(html, /roast-meter__dot[ "]/g), 5);
  assert.equal(countMatches(html, /roast-meter__dot--filled/g), 4);
});

test('renders nothing when the metafield is missing', async () => {
  assert.equal((await renderSnippet('roast-meter', { level: null })).trim(), '');
});

test('renders nothing when the metafield is zero', async () => {
  assert.equal((await renderSnippet('roast-meter', { level: 0 })).trim(), '');
});

test('clamps a value above five rather than rendering extra dots', async () => {
  const html = await renderSnippet('roast-meter', { level: 9 });
  assert.equal(countMatches(html, /roast-meter__dot[ "]/g), 5);
  assert.equal(countMatches(html, /roast-meter__dot--filled/g), 5);
});

test('is announced as an image with a text alternative, not as five empty spans', async () => {
  const html = await renderSnippet('roast-meter', { level: 3 });
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the accessible label states both the level and the maximum', async () => {
  const html = await renderSnippet('roast-meter', { level: 3 });
  assert.match(html, /aria-label="[^"]*3[^"]*5[^"]*"/);
});

test('does not show a visible Roast level label by default', async () => {
  const html = await renderSnippet('roast-meter', { level: 3 });
  assert.equal(/roast-meter__label/.test(html), false);
  const withoutAria = html.replace(/aria-label="[^"]*"/g, '');
  assert.equal(/Roast level/.test(withoutAria), false);
});

test('shows a visible Roast level label when show_label is true', async () => {
  const html = await renderSnippet('roast-meter', { level: 3, show_label: true });
  assert.match(html, /roast-meter__label/);
  assert.match(html, /aria-hidden="true"/);
  const withoutAria = html.replace(/aria-label="[^"]*"/g, '');
  assert.match(withoutAria, /Roast level/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="[^"]*3[^"]*5[^"]*"/);
});
