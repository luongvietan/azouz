import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('hero-split', { settings });

test('renders the heading as the page h1', async () => {
  const html = await render({ heading: 'Your Coffee. Your Brand. Our Roastery.' });
  assert.match(html, /<h1[^>]*>[\s\S]*Your Coffee\. Your Brand\. Our Roastery\.[\s\S]*<\/h1>/);
});

test('emits exactly one h1', async () => {
  assert.equal(((await render()).match(/<h1/g) ?? []).length, 1);
});

test('renders the eyebrow when set and omits it when empty', async () => {
  assert.match(await render({ eyebrow: 'Private Label' }), /class="eyebrow"/);
  assert.equal(/class="eyebrow"/.test(await render({ eyebrow: '' })), false);
});

test('renders both calls to action with their labels and links', async () => {
  const html = await render({
    cta_primary_label: 'Request a Sample',
    cta_primary_link: '/pages/request-a-sample',
    cta_secondary_label: 'Start Your Private Label',
    cta_secondary_link: '/pages/private-label',
  });
  assert.match(html, /href="\/pages\/request-a-sample"[^>]*>[\s\S]*Request a Sample/);
  assert.match(html, /href="\/pages\/private-label"[^>]*>[\s\S]*Start Your Private Label/);
});

test('a cta with a label but no link is not rendered as an empty anchor', async () => {
  const html = await render({ cta_primary_label: 'Request a Sample', cta_primary_link: '' });
  assert.equal(/href=""/.test(html), false);
});

/*
  Liquid evaluates and/or right to left with no precedence, so a compound
  condition like `a and b or c and d` collapses to `a and (b or (c and d))`.
  With only the SECONDARY button configured that reads false and the whole
  button group vanishes. This test is the one that catches it.
*/
test('a secondary cta renders even when no primary cta is configured', async () => {
  const html = await render({
    cta_primary_label: '',
    cta_primary_link: '',
    cta_secondary_label: 'View Wholesale',
    cta_secondary_link: '/pages/wholesale',
  });
  assert.match(html, /href="\/pages\/wholesale"/);
  assert.match(html, /View Wholesale/);
});

test('the button group is omitted entirely when neither cta is configured', async () => {
  const html = await render({
    cta_primary_label: '', cta_primary_link: '',
    cta_secondary_label: '', cta_secondary_link: '',
  });
  assert.equal(/button-group/.test(html), false);
});

test('the image carries the alt text from its setting', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'Espresso Arabica Beans, 500g bag' });
  assert.match(html, /alt="Espresso Arabica Beans, 500g bag"/);
});

test('the hero image loads eagerly with high priority — it is the LCP element', async () => {
  const html = await render({ image: 'placeholder.svg', image_alt: 'A coffee bag' });
  assert.match(html, /fetchpriority="high"/);
  assert.equal(/loading="lazy"/.test(html), false);
});

test('body copy renders as rich text', async () => {
  const html = await render({ body: '<p>We roast and produce coffee.</p>' });
  assert.match(html, /<p>We roast and produce coffee\.<\/p>/);
});

test('declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/hero-split.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
