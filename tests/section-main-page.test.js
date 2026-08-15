import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection } from './helpers/render-section.js';

const page = { title: 'Shipping Policy', content: '<p>We ship across Jordan.</p>', handle: 'shipping' };

test('renders the page title as the h1', async () => {
  const html = await renderSection('main-page', { scope: { page } });
  assert.match(html, /<h1[^>]*>[\s\S]*Shipping Policy[\s\S]*<\/h1>/);
});

test('renders the page body as rich text', async () => {
  const html = await renderSection('main-page', { scope: { page } });
  assert.match(html, /<p>We ship across Jordan\.<\/p>/);
});

test('the title can be hidden for pages that supply their own heading', async () => {
  const html = await renderSection('main-page', { settings: { show_title: false }, scope: { page } });
  assert.equal(/<h1/.test(html), false);
});

test('an empty page body does not produce an empty wrapper', async () => {
  const html = await renderSection('main-page', { scope: { page: { title: 'X', content: '' } } });
  assert.equal(/rte/.test(html), false);
});
