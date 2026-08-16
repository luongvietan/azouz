import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../preview/engine.js';
import { buildBlogFixture } from '../preview/fixtures.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const [article] = buildBlogFixture().articles;

async function renderCard(scope = {}) {
  const engine = await createEngine(THEME_DIR);
  return engine.parseAndRender(
    "{%- render 'article-card', article: article, heading_level: heading_level -%}",
    { article, heading_level: 3, ...scope },
  );
}

test('the card links to the article by its title', async () => {
  const html = await renderCard();
  assert.match(html, /<a class="article-card__link" href="\/blogs\/journal\/[\w-]+">/);
  assert.match(html, /What private label coffee actually involves/);
});

test('the title is an h3 by default and an h2 under a page h1', async () => {
  assert.match(await renderCard(), /<h3 class="article-card__title">/);
  assert.match(await renderCard({ heading_level: 2 }), /<h2 class="article-card__title">/);
});

test('the date is a machine-readable time element', async () => {
  const html = await renderCard();
  assert.match(html, /<time class="article-card__date" datetime="2026-07-28">/);
  assert.match(html, /28 July 2026/);
});

test('the excerpt is plain text — no markup leaks out of the post body', async () => {
  const html = await renderCard();
  const excerpt = /<p class="article-card__excerpt">([\s\S]*?)<\/p>/.exec(html);
  assert.ok(excerpt, 'the card must render an excerpt');
  assert.equal(/<[a-z]/i.test(excerpt[1]), false, 'the excerpt still carries html');
});

test('the image is decorative — the title is the only link, and it is not doubled', async () => {
  // Two links to the same article give a screen reader the same destination
  // twice, and an image link with an empty alt has no accessible name at all.
  const html = await renderCard();
  assert.equal((html.match(/<a /g) ?? []).length, 1);
  assert.match(html, /class="article-card__image"[\s\S]*?alt=""/);
});

test('an article with no image still renders a complete card', async () => {
  const html = await renderCard({ article: { ...article, image: null } });
  assert.equal(/<img/.test(html), false);
  assert.match(html, /article-card__title/);
  assert.equal(/translation missing/.test(html), false);
});
