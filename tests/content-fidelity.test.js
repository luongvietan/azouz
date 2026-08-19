import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

/*
  The client supplied the copy for all four marketing pages. Sections and lists
  were abridged during implementation, so the live site was missing whole blocks
  the client had written and paid for:

    private-label  missing "Your Blend or Ours." and "Who We Work With"
    wholesale      missing "Create Your Own House Blend."
    index          audience list 4 of 6
    our-brands     retail formats 5 of 8

  This test treats the supplied copy as the acceptance criterion. If a list item
  or a named block disappears from a template again, it fails here rather than
  in front of the client.
*/

const render = async (name) =>
  renderTemplate(await createEngine(THEME_DIR), THEME_DIR, `templates/${name}`);

/** Text with entities decoded and whitespace collapsed, so assertions match what a reader sees. */
const readable = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

async function expectAll(template, items) {
  const text = readable(await render(template));
  const missing = items.filter((item) => !text.includes(item));
  assert.deepEqual(missing, [], `${template} is missing copy the client supplied`);
}

test('home lists all six business types the client named', async () => {
  await expectAll('index.json', [
    'Cafés', 'Hotels', 'Restaurants', 'Retailers', 'Distributors', 'Coffee Brands',
  ]);
});

test('private label lists all eight coffee types the client named', async () => {
  await expectAll('page.private-label.json', [
    'Espresso blends', 'Specialty coffee', 'Single-origin coffee', 'Turkish coffee',
    'Arabic coffee', 'Filter coffee', 'Whole bean coffee', 'Ground coffee',
  ]);
});

test('private label keeps the "Your Blend or Ours." choice block', async () => {
  await expectAll('page.private-label.json', [
    'Your Blend or Ours.',
    'Choose One of Our Existing Blends',
    'A faster option if you want to launch quickly.',
    'Create Your Own Blend',
  ]);
});

test('private label keeps the "Who We Work With" audience block', async () => {
  await expectAll('page.private-label.json', [
    'Who We Work With',
    'Coffee Shops', 'Retailers', 'Hotels', 'Restaurants', 'Distributors', 'Startups', 'Supermarkets',
  ]);
});

test('wholesale keeps the "Create Your Own House Blend." section', async () => {
  await expectAll('page.wholesale.json', [
    'Create Your Own House Blend.',
    'Body', 'Sweetness', 'Acidity', 'Roast Level', 'Arabica/Robusta Ratio', 'Flavour Profile',
  ]);
});

test('wholesale lists all six business types the client named', async () => {
  await expectAll('page.wholesale.json', [
    'Coffee Shops', 'Restaurants', 'Hotels', 'Offices', 'Retailers', 'Distributors',
  ]);
});

test('our brands lists all eight retail formats the client named', async () => {
  await expectAll('page.our-brands.json', [
    'Espresso coffee', 'Turkish coffee', 'Specialty coffee', 'Single-origin coffee',
    'Whole bean coffee', 'Ground coffee', 'Retail coffee bags', 'Selected seasonal products',
  ]);
});
