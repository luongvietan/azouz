import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildBlogFixture } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const blog = buildBlogFixture();
const [article] = blog.articles;

const render = (scope = {}, settings = {}) =>
  renderSection('main-article', {
    settings,
    scope: { blog, article, request: { page_type: 'article', query: {} }, ...scope },
  });

test('the post title is the page h1, and the only one', async () => {
  const html = await render();
  assert.match(html, /<h1[^>]*>What private label coffee actually involves<\/h1>/);
  assert.equal(countMatches(html, /<h1/g), 1);
});

test('the publication date is machine-readable', async () => {
  assert.match(await render(), /<time datetime="2026-07-28">[\s\S]*?28 July 2026[\s\S]*?<\/time>/);
});

test('the post body renders as html, not escaped text', async () => {
  const html = await render();
  assert.match(html, /<div class="rte article__content"><p>Private label starts/);
  assert.equal(/&lt;p&gt;/.test(html), false);
});

test('the featured image is eager and high priority — it is the LCP element', async () => {
  const html = await render();
  assert.match(html, /class="article__image"/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /fetchpriority="high"/);
});

test('the featured image does not repeat the h1 as its alt text', async () => {
  // The heading sits directly above it; a duplicated alt makes a screen reader
  // read the same sentence twice.
  const html = await render();
  const alt = /class="article__image"[\s\S]*?alt="([^"]*)"/.exec(html);
  assert.ok(alt, 'the featured image must render');
  assert.equal(alt[1], '');
});

test('there is a way back to the blog, both above and below the post', async () => {
  const html = await render();
  assert.match(html, /<a class="article__breadcrumb-link" href="\/blogs\/journal">Journal<\/a>/);
  assert.match(html, /class="article__back"[\s\S]*?href="\/blogs\/journal"/);
});

test('tags link to the tagged listing, handleized', async () => {
  const html = await render();
  assert.match(html, /href="\/blogs\/journal\/tagged\/private-label">Private label<\/a>/);
  assert.match(html, /href="\/blogs\/journal\/tagged\/process">Process<\/a>/);
});

test('a post with no tags renders no empty tag list', async () => {
  const html = await render({ article: { ...article, tags: [] } });
  assert.equal(/article__tag-list/.test(html), false);
});

test('existing comments are listed with their author and date', async () => {
  const html = await render();
  assert.match(html, /class="comment__author">Layla Haddad</);
  assert.match(html, /<time datetime="2026-07-29">/);
});

test('the comment form posts to /comments with the fields Shopify expects', async () => {
  const html = await render();
  assert.match(html, /<form method="post" action="\/comments"/);
  assert.match(html, /name="comment\[author\]"/);
  assert.match(html, /name="comment\[email\]"/);
  assert.match(html, /name="comment\[body\]"/);
});

test('every comment field has a label bound to it', async () => {
  const html = await render();
  for (const id of ['CommentAuthor', 'CommentEmail', 'CommentBody']) {
    assert.match(html, new RegExp(`<label class="field__label" for="${id}-`), `${id} has no label`);
    assert.match(html, new RegExp(`id="${id}-`), `${id} is never rendered`);
  }
});

test('a blog with comments disabled offers no comment form', async () => {
  // Shopify rejects a post to /comments on such a blog, so rendering the form
  // would offer a control that cannot work.
  const html = await render({
    blog: { ...blog, comments_enabled: false, 'comments_enabled?': false },
  });
  assert.equal(/article__comments/.test(html), false);
  assert.equal(/action="\/comments"/.test(html), false);
});

test('a post with no comments yet says so rather than showing an empty list', async () => {
  const html = await render({ article: { ...article, comments: [], comments_count: 0 } });
  assert.match(html, /article__no-comments/);
  assert.equal(/comment-list/.test(html), false);
  assert.equal(/translation missing/.test(html), false);
});

test('renders no empty href and no missing translation', async () => {
  const html = await render();
  assert.equal(/href=""/.test(html), false);
  assert.equal(/translation missing/.test(html), false);
});

test('has no presets — it is a page template, not a section a merchant adds', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(
    await readFile(resolveInTheme('sections/main-article.liquid'), 'utf8'),
  );
  assert.equal(schema.presets, undefined);
});
