import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, renderThemeFile } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';
import { imageDrop } from '../preview/media-drops.js';

const render = async (scope) => {
  const engine = await createEngine(THEME_DIR);
  const out = await renderThemeFile(engine, THEME_DIR, 'snippets/responsive-image.liquid', scope);
  return out.trim();
};

const bag = () => imageDrop('/preview-media/espresso-arabica-beans.jpg', 'Espresso Arabica Beans');
const hero = () => imageDrop('/preview-media/hero-azouz-coffee-cup.jpg', 'A cup of Azouz coffee');

/** Parse "url 400w, url 600w" into the numeric widths. */
const srcsetWidths = (html) =>
  [...(/srcset="([\s\S]*?)"/.exec(html)?.[1] ?? '').matchAll(/(\d+)w/g)].map((m) => Number(m[1]));

test('width and height come from the image, not a constant', async () => {
  const html = await render({ image: bag(), alt: 'Espresso Arabica Beans' });
  assert.match(html, /width="1122"/);
  assert.match(html, /height="1402"/);
});

test('a differently shaped image reports its own ratio', async () => {
  // The homepage hero is 2:3. Declaring the 4:5 bag crop for it reserved a box
  // ~127px too short and the LCP element jumped on every cold load.
  const html = await render({ image: hero(), alt: 'A cup of Azouz coffee' });
  assert.match(html, /width="1024"/);
  assert.match(html, /height="1536"/);
});

test('a srcset is always emitted', async () => {
  const widths = srcsetWidths(await render({ image: bag(), alt: 'x' }));
  assert.ok(widths.length > 1, `expected several candidates, got ${widths}`);
});

test('no candidate asks Shopify to upscale past the source', async () => {
  const image = bag();
  for (const width of srcsetWidths(await render({ image, alt: 'x' }))) {
    assert.ok(width <= image.width, `${width}w exceeds the ${image.width}px source`);
  }
});

test('the source width itself is always a candidate', async () => {
  const image = bag();
  assert.ok(srcsetWidths(await render({ image, alt: 'x' })).includes(image.width));
});

test('sizes defaults to the full viewport and can be overridden', async () => {
  assert.match(await render({ image: bag(), alt: 'x' }), /sizes="100vw"/);
  assert.match(
    await render({ image: bag(), alt: 'x', sizes: '(min-width: 48em) 33vw, 100vw' }),
    /sizes="\(min-width: 48em\) 33vw, 100vw"/,
  );
});

test('images lazy-load unless told otherwise', async () => {
  assert.match(await render({ image: bag(), alt: 'x' }), /loading="lazy"/);
  assert.match(await render({ image: bag(), alt: 'x', loading: 'eager' }), /loading="eager"/);
});

test('fetchpriority is opt-in, for the LCP image only', async () => {
  assert.equal(/fetchpriority/.test(await render({ image: bag(), alt: 'x' })), false);
  assert.match(await render({ image: bag(), alt: 'x', fetchpriority: 'high' }), /fetchpriority="high"/);
});

test('alt is escaped and empty alt is allowed for decorative art', async () => {
  // Assert the property, not the entity: LiquidJS writes &#34; where Shopify
  // writes &quot;, and both keep the quote from closing the attribute early.
  const html = await render({ image: bag(), alt: 'Bag "A" & B' });
  const alt = /alt="([^"]*)"/.exec(html);
  assert.ok(alt, `alt attribute was broken by an unescaped quote: ${html.slice(0, 200)}`);
  assert.equal(alt[1].includes('&'), true, 'the ampersand must be escaped');
  assert.equal(/alt="[^"]*"A"/.test(html), false, 'a raw quote must never reach the attribute');

  assert.match(await render({ image: bag(), alt: '' }), /alt=""/);
});

test('the rendered src never exceeds the source width', async () => {
  const html = await render({ image: bag(), alt: 'x', width: 4000 });
  assert.match(html, /src="[^"]*width=1122"/, 'the request must be clamped to the source');
});
