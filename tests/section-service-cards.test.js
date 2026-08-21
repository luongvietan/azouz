import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const card = (id, settings) => ({ id, type: 'service', settings, shopify_attributes: '' });

const THREE = [
  card('s1', {
    title: 'Private Label Coffee',
    body: 'Create coffee under your own brand.',
    detail: 'Custom blends, roasting, grinding and packaging.',
    link_label: 'Learn More',
    link: '/pages/private-label',
  }),
  card('s2', {
    title: 'Wholesale Coffee',
    body: 'Reliable coffee for cafés, restaurants, hotels and businesses.',
    detail: 'Espresso · Turkish · Filter · Specialty',
    link_label: 'View Wholesale',
    link: '/pages/wholesale',
  }),
  card('s3', {
    title: 'Specialty Coffee',
    body: 'Single origins and specialty coffees selected for quality and flavour.',
    link_label: 'Discover Our Coffee',
    link: '/collections/all',
  }),
];

test('renders one card per block with its title and body', async () => {
  const html = await renderSection('service-cards', { blocks: THREE });
  assert.equal(countMatches(html, /class="service-card[ "]/g), 3);
  assert.match(html, /Private Label Coffee/);
  assert.match(html, /Espresso · Turkish · Filter · Specialty/);
});

test('each card uses the packaging label block component', async () => {
  const html = await renderSection('service-cards', { blocks: THREE });
  assert.equal(countMatches(html, /label-block__title/g), 3);
});

test('card titles are h3 — the section heading is the h2', async () => {
  const html = await renderSection('service-cards', { settings: { heading: 'What We Do' }, blocks: THREE });
  assert.equal(countMatches(html, /<h2/g), 1);
  assert.equal(countMatches(html, /<h3/g), 3);
  assert.equal(/<h1/.test(html), false);
});

test('a card link renders only when both label and url are set', async () => {
  const html = await renderSection('service-cards', {
    blocks: [card('s1', { title: 'X', link_label: 'Learn More', link: '' })],
  });
  assert.equal(/href=""/.test(html), false);
});

test('the label colour setting drives the card fill via a custom property', async () => {
  const html = await renderSection('service-cards', {
    blocks: [card('s1', { title: 'X', label_color: '#C4562E' })],
  });
  assert.match(html, /--label-bg:\s*#C4562E/);
});

test('a light service-card label fill auto-picks Jet ink', async () => {
  const html = await renderSection('service-cards', {
    blocks: [card('s1', { title: 'X', label_color: '#BFDDD3' })],
  });
  assert.match(html, /--label-fg:\s*var\(--color-text\)/);
});

test('a featured card uses the lead layout and a primary button', async () => {
  const html = await renderSection('service-cards', {
    blocks: [
      card('s1', { ...THREE[0].settings, featured: true }),
      THREE[1],
      THREE[2],
    ],
  });
  assert.match(html, /service-cards__grid--lead/);
  assert.match(html, /service-card--featured/);
  assert.match(html, /class="button service-card__cta"/);
});

test('support cards demote visually when one card is featured', async () => {
  const html = await renderSection('service-cards', {
    blocks: [
      card('s1', { ...THREE[0].settings, featured: true }),
      THREE[1],
      THREE[2],
    ],
  });
  assert.match(html, /service-card--support/);
  assert.equal(countMatches(html, /service-card--support/g), 2);
});

const PHOTO = card('s1', {
  title: 'Own an Azouz Coffee',
  body: 'Bring Azouz Coffee to your neighbourhood.',
  detail: 'Coffee · Equipment · Branding',
  image: 'placeholder.svg',
  image_alt: 'An Azouz Coffee counter with the espresso machine and grinder',
  link_label: 'Explore Opportunities',
  link: '/pages/own-an-azouz-coffee',
});

test('a card with a photograph leads with it instead of a coloured panel', async () => {
  const html = await renderSection('service-cards', { blocks: [PHOTO] });
  assert.match(html, /service-card--media/);
  assert.match(html, /class="service-card__image"/);
  assert.equal(/service-card__label/.test(html), false);
});

test('a photo-led card keeps the title an h3 and the detail line above it', async () => {
  const html = await renderSection('service-cards', { blocks: [PHOTO] });
  assert.match(html, /service-card__detail">Coffee · Equipment · Branding<\/span>/);
  assert.match(html, /<h3 class="service-card__title">Own an Azouz Coffee<\/h3>/);
});

test('a photo-led card ends in a button — the client asked for photo, heading, sentence, button', async () => {
  const html = await renderSection('service-cards', { blocks: [PHOTO] });
  assert.match(html, /class="button service-card__cta"/);
  assert.equal(/service-card__link/.test(html), false);
});

test('photographs widen the grid so they are shown large', async () => {
  const withPhoto = await renderSection('service-cards', { blocks: [PHOTO, THREE[1]] });
  assert.match(withPhoto, /service-cards__grid service-cards__grid--media/);

  const withoutPhoto = await renderSection('service-cards', { blocks: THREE });
  assert.match(withoutPhoto, /service-cards__grid grid grid--3/);
});

test('a fourth label block gets a fourth column rather than a row of its own', async () => {
  const html = await renderSection('service-cards', {
    blocks: [...THREE, card('s4', { title: 'Own an Azouz Coffee' })],
  });
  assert.match(html, /service-cards__grid grid grid--4/);
});

test('a card still waiting on photography falls back to the label block', async () => {
  const html = await renderSection('service-cards', { blocks: [PHOTO, THREE[1]] });
  assert.equal(countMatches(html, /service-card__image/g), 1);
  assert.equal(countMatches(html, /label-block__title/g), 1);
});

test('declares a preset with three cards', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/service-cards.liquid'), 'utf8'));
  assert.equal(schema.presets[0].blocks.length, 3);
});
