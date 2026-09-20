import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings) => renderSection('rich-text', { settings });

test('the heading is an h2, never a second h1', async () => {
  const html = await render({ heading: 'A Coffee Business Without Starting From Zero.' });
  assert.match(html, /<h2 class="rich-text__heading">A Coffee Business Without Starting From Zero\.<\/h2>/);
  assert.equal(/<h1/.test(html), false);
});

test('the body keeps every paragraph it was given', async () => {
  const html = await render({
    heading: 'X',
    body: '<p>Opening a coffee shop involves more than finding a location.</p><p>With Azouz Coffee, the system is already there.</p>',
  });
  const body = /<div class="rich-text__body">([\s\S]*?)<\/div>/.exec(html)[1];
  assert.equal(countMatches(body, /<p>/g), 2);
});

test('a list in the body reaches the page as a list, one point to an item', async () => {
  const html = await render({
    heading: 'Built to Make Opening Simpler.',
    body: "<ul><li>You don't need to develop your own coffee brand.</li><li>You don't need to create a menu from scratch.</li></ul>",
  });
  assert.equal(countMatches(html, /<li>/g), 2);
});

test('the closing line follows the body, and only when there is one', async () => {
  const withClosing = await render({
    heading: 'X',
    body: '<p>First.</p>',
    closing: 'We have already done the coffee work. You build the business around it.',
  });
  assert.match(withClosing, /<p class="rich-text__closing">We have already done the coffee work\. You build the business around it\.<\/p>/);
  assert.ok(withClosing.indexOf('rich-text__body') < withClosing.indexOf('rich-text__closing'));

  const without = await render({ heading: 'X', body: '<p>First.</p>' });
  assert.equal(/rich-text__closing/.test(without), false);
});

test('a blank eyebrow renders no empty label above the heading', async () => {
  const html = await render({ heading: 'X', eyebrow: '' });
  assert.equal(/class="eyebrow"/.test(html), false);
});

test('the alt background draws the ruled band', async () => {
  assert.match(await render({ heading: 'X', background: 'alt' }), /class="section section--alt rich-text"/);
  assert.match(await render({ heading: 'X' }), /class="section rich-text"/);
});

test('declares a preset so it can be added from the theme editor', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/rich-text.liquid'), 'utf8'));
  assert.equal(schema.presets.length, 1);
  assert.match(schema.presets[0].settings.body, /^<p>/, 'a richtext default must open with <p> or <ul>');
});
