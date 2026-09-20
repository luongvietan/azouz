import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { imageDrop } from '../preview/media-drops.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const entry = (id, settings) => ({ id, type: 'link', settings, shopify_attributes: '' });

const PRIVATE_LABEL = {
  title: 'Private Label Coffee',
  body: 'Create coffee under your own brand: custom blends, roasting, grinding and packaging.',
  link_label: 'Start Your Private Label',
  link: '/pages/private-label',
};

const WHOLESALE = {
  title: 'Wholesale Coffee',
  body: 'Reliable coffee for cafés, restaurants, hotels and businesses.',
  link_label: 'View Wholesale',
  link: '/pages/wholesale',
};

const photographed = (settings, file, alt) => ({
  ...settings,
  image: imageDrop(`/preview-media/${file}`),
  image_alt: alt,
});

const render = (blocks) =>
  renderSection('quick-links', { settings: { heading: 'Private label is where we start.' }, blocks });

test('renders one entry per block, titled h3 under the section h2', async () => {
  const html = await render([entry('a', PRIVATE_LABEL), entry('b', WHOLESALE)]);
  assert.equal(countMatches(html, /<li class="quick-links__item[ "]/g), 2);
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 2);
});

/*
  The client's note on the homepage: the services needed pictures next to
  them. An entry with a photograph shows it at the head of the entry, above
  the title it illustrates.
*/
test('an entry with a photograph leads with it, above its title', async () => {
  const html = await render([
    entry('a', photographed(PRIVATE_LABEL, 'espresso-arabica-beans.jpg', 'Coffee bags carrying three different brands')),
  ]);

  const item = /<li class="quick-links__item[ "][\s\S]*?<\/li>/.exec(html)[0];
  assert.match(item, /<img[^>]+class="quick-links__image"[^>]+src="[^"]+"/);
  assert.match(item, /alt="Coffee bags carrying three different brands"/);
  assert.ok(
    item.indexOf('quick-links__image') < item.indexOf('<h3'),
    'the photograph must come before the title',
  );
});

test('only an entry that has a photograph takes the photograph layout', async () => {
  // On a phone the photographed entry is a two-column grid with the picture
  // at the inline end. An entry without one must stay the plain column, or it
  // would hold an empty track where the picture would have been.
  const html = await render([
    entry('a', photographed(PRIVATE_LABEL, 'espresso-arabica-beans.jpg', 'x')),
    entry('b', WHOLESALE),
  ]);
  assert.equal(countMatches(html, /class="quick-links__item quick-links__item--media"/g), 1);
  assert.equal(countMatches(html, /class="quick-links__item"/g), 1);
});

test('the phone rendition is asked for at the size it is drawn', async () => {
  // Beside the copy on a phone the picture is 8rem wide. Asking for 92vw
  // there would send a phone a rendition five times the size it can show.
  const html = await render([entry('a', photographed(PRIVATE_LABEL, 'espresso-arabica-beans.jpg', 'x'))]);
  assert.match(html, /sizes="\(min-width: 64em\) 23vw, \(min-width: 40em\) 46vw, 8rem"/);
});

test('the photograph reserves its own box, so the page does not jump as it loads', async () => {
  const html = await render([entry('a', photographed(PRIVATE_LABEL, 'espresso-arabica-beans.jpg', 'x'))]);
  const img = /<img[^>]+class="quick-links__image"[^>]*>/.exec(html)[0];
  assert.match(img, /width="1122"/);
  assert.match(img, /height="1402"/);
  assert.match(img, /loading="lazy"/);
});

test('an entry without a photograph starts at its title rather than an empty box', async () => {
  const html = await render([entry('a', PRIVATE_LABEL)]);
  assert.equal(/quick-links__media/.test(html), false);
  assert.equal(/<img/.test(html), false);
});

test('the photograph is not a second link to the same place', async () => {
  // One anchor per entry: a screen reader that lists links would otherwise
  // read each destination twice, once under a photograph's alt text.
  const html = await render([
    entry('a', photographed(PRIVATE_LABEL, 'espresso-arabica-beans.jpg', 'x')),
    entry('b', photographed(WHOLESALE, 'filter-coffee-can.jpg', 'y')),
  ]);
  const list = /<ul class="list-lines[\s\S]*?<\/ul>/.exec(html)[0];
  assert.equal(countMatches(list, /<a /g), 2);
  assert.equal(countMatches(list, /href="\/pages\/private-label"/g), 1);
});

test('each entry offers the theme editor a photograph and its description', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/quick-links.liquid'), 'utf8'));
  const settings = schema.blocks.find((block) => block.type === 'link').settings;
  assert.equal(settings.find((setting) => setting.id === 'image')?.type, 'image_picker');
  assert.equal(settings.find((setting) => setting.id === 'image_alt')?.type, 'text');
});
