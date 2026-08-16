import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolveRoute, listPreviewPaths } from '../preview/route-context.js';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';
import { buildFixtures } from '../preview/fixtures.js';
import { resolveInTheme, THEME_DIR } from '../scripts/theme-paths.js';

const BLOG = '/blogs/journal';
const POST = `${BLOG}/what-private-label-coffee-actually-involves`;

/** Render a preview path through the layout, the way the server does. */
async function renderPath(path) {
  const route = resolveRoute(path, new URLSearchParams());
  const engine = await createEngine(THEME_DIR);
  const fixtures = buildFixtures();
  const scope = {
    ...fixtures,
    request: { ...fixtures.request, page_type: route.page_type, query: {} },
    page: null,
    ...route.scope,
  };
  return renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
    ...scope,
    content_for_layout: await renderTemplate(engine, THEME_DIR, route.template, scope),
  });
}

test('the blog templates exist and name real sections', async () => {
  for (const [name, type] of [
    ['blog.json', 'main-blog'],
    ['article.json', 'main-article'],
  ]) {
    const template = JSON.parse(await readFile(resolveInTheme(`templates/${name}`), 'utf8'));
    assert.deepEqual([...template.order].sort(), Object.keys(template.sections).sort());
    assert.equal(template.sections.main.type, type);
    assert.ok(existsSync(resolveInTheme(`sections/${type}.liquid`)), `${type} is missing`);
  }
});

test('a blog url resolves to the blog template', () => {
  const route = resolveRoute(BLOG);
  assert.equal(route.page_type, 'blog');
  assert.equal(route.template, 'templates/blog.json');
  assert.equal(route.scope.blog.title, 'Journal');
});

test('an article url resolves to the article template with its blog in scope', () => {
  const route = resolveRoute(POST);
  assert.equal(route.page_type, 'article');
  assert.equal(route.template, 'templates/article.json');
  assert.equal(route.scope.article.handle, 'what-private-label-coffee-actually-involves');
  assert.equal(route.scope.blog.handle, 'journal');
});

test('a tagged url filters the listing to that tag', () => {
  const route = resolveRoute(`${BLOG}/tagged/private-label`);
  assert.equal(route.page_type, 'blog');
  assert.deepEqual(route.scope.current_tags, ['Private label']);
  assert.equal(route.scope.blog.articles.length, 1);
});

test('an unknown blog, article or tag resolves to the 404 template', () => {
  for (const path of ['/blogs/nope', `${BLOG}/not-a-post`, `${BLOG}/tagged/not-a-tag`]) {
    assert.equal(resolveRoute(path).page_type, '404', `${path} should not resolve`);
  }
});

test('the preview advertises the blog paths', () => {
  const paths = listPreviewPaths();
  for (const path of [BLOG, POST]) assert.ok(paths.includes(path), `${path} is not advertised`);
});

test('both blog pages render one h1, no empty href, no missing translation', async () => {
  for (const path of [BLOG, POST, `${BLOG}/tagged/private-label`]) {
    const html = await renderPath(path);
    assert.equal((html.match(/<h1/g) ?? []).length, 1, `${path} must have exactly one h1`);
    assert.equal(/href=""/.test(html), false, `${path} has an empty link`);
    assert.equal(/translation missing/.test(html), false, `${path} has a missing locale key`);
    assert.equal(/missing section/.test(html), false, `${path} has an unresolved section`);
  }
});

test('an article page emits valid BlogPosting and BreadcrumbList JSON-LD', async () => {
  const html = await renderPath(POST);
  const types = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    types.push(JSON.parse(match[1])['@type']);
  }
  assert.ok(types.includes('BlogPosting'), `no BlogPosting — got ${types.join(', ')}`);
  assert.ok(types.includes('BreadcrumbList'), `no BreadcrumbList — got ${types.join(', ')}`);
});

test('article JSON-LD carries absolute urls — a crawler has no page context', async () => {
  const html = await renderPath(POST);
  const blogPosting = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .find((node) => node['@type'] === 'BlogPosting');
  assert.match(blogPosting.url, /^https:\/\//);
  assert.match(blogPosting.image, /^https:\/\//);
});

test('an article page declares og:type article', async () => {
  assert.match(await renderPath(POST), /property="og:type" content="article"/);
});

test('the blog listing does not declare og:type article', async () => {
  assert.match(await renderPath(BLOG), /property="og:type" content="website"/);
});
