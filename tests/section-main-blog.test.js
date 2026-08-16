import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBlogFixture } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const blog = buildBlogFixture();
const render = (scope = {}, settings = {}) =>
  renderSection('main-blog', { settings, scope: { blog, current_tags: [], ...scope } });

test('the blog title is the page h1, and the only one', async () => {
  const html = await render();
  assert.match(html, /<h1[^>]*>[\s\S]*Journal[\s\S]*<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('renders a card per article', async () => {
  const html = await render();
  assert.equal(countMatches(html, /class="article-card"/g), blog.articles.length);
});

test('card titles are h2 — one level below the page h1', async () => {
  assert.equal(countMatches(await render(), /<h2 class="article-card__title">/g), blog.articles.length);
});

test('a blog with no posts shows the empty state, not an empty grid', async () => {
  const html = await render({ blog: { ...blog, articles: [], articles_count: 0 } });
  assert.match(html, /blog__empty/);
  assert.equal(/article-card/.test(html), false);
  assert.equal(/translation missing/.test(html), false);
});

test('a tagged listing says which tag is applied and offers a way back', async () => {
  // /blogs/<blog>/tagged/<tag> renders this same template. Without this the
  // filtered page is indistinguishable from the full list.
  const html = await render({ current_tags: ['Private label'] });
  assert.match(html, /blog__filter/);
  assert.match(html, /Private label/);
  assert.match(html, /<a class="blog__filter-clear" href="\/blogs\/journal">/);
});

test('the unfiltered listing shows no filter notice', async () => {
  assert.equal(/blog__filter/.test(await render()), false);
});

test('renders no empty href and no missing translation', async () => {
  const html = await render();
  assert.equal(/href=""/.test(html), false);
  assert.equal(/translation missing/.test(html), false);
});

test('has no presets — it is a page template, not a section a merchant adds', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/main-blog.liquid'), 'utf8'));
  assert.equal(schema.presets, undefined);
});
