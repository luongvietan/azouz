import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';
import { countMatches } from './helpers/render-section.js';

const paginate = (overrides = {}) => ({
  pages: 3,
  current_page: 2,
  items: 30,
  page_size: 12,
  previous: { url: '?page=1', title: '1', is_link: true },
  next: { url: '?page=3', title: '3', is_link: true },
  ...overrides,
});

test('renders nothing when there is only one page', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate({ pages: 1 }) });
  assert.equal(html.trim(), '');
});

test('renders a link per page', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.equal(countMatches(html, /class="pagination__page/g), 3);
});

test('marks the current page as current for screen readers', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.match(html, /aria-current="page"/);
  assert.equal(countMatches(html, /aria-current="page"/g), 1);
});

test('the current page is not a link', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  const current = /<[^>]+aria-current="page"[^>]*>/.exec(html)[0];
  assert.equal(current.startsWith('<a'), false);
});

test('renders previous and next when they exist', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.match(html, /href="\?page=1"/);
  assert.match(html, /href="\?page=3"/);
});

test('omits previous on the first page', async () => {
  const html = await renderSnippet('pagination', {
    paginate: paginate({ current_page: 1, previous: null }),
  });
  assert.equal(/pagination__previous/.test(html), false);
  assert.match(html, /pagination__next/);
});

test('is a navigation landmark with an accessible name', async () => {
  const html = await renderSnippet('pagination', { paginate: paginate() });
  assert.match(html, /<nav[^>]+aria-label="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});
