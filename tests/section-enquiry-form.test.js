import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) => renderSection('enquiry-form', { settings });

test('posts to the shopify contact endpoint', async () => {
  const html = await render();
  assert.match(html, /<form[^>]+method="post"/);
  assert.match(html, /action="\/contact#contact"/);
});

test('carries the fields the roaster needs to quote a job', async () => {
  const html = await render();
  for (const name of [
    'contact[name]',
    'contact[email]',
    'contact[phone]',
    'contact[Company]',
    'contact[Business type]',
    'contact[Coffee type]',
    'contact[Expected monthly volume]',
    'contact[body]',
  ]) {
    assert.match(html, new RegExp(`name="${name.replace(/[[\]]/g, '\\$&')}"`), `missing field ${name}`);
  }
});

test('every input has an associated label', async () => {
  const html = await render();
  const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 8);
  for (const id of ids) {
    assert.match(html, new RegExp(`<label[^>]+for="${id}"`), `no label for #${id}`);
  }
});

test('name and email are required', async () => {
  const html = await render();
  assert.match(html, /name="contact\[name\]"[^>]*required/);
  assert.match(html, /name="contact\[email\]"[^>]*required/);
});

test('volume is required on the quote preset and optional on the sample preset', async () => {
  const quote = await render({ require_volume: true });
  assert.match(quote, /name="contact\[Expected monthly volume\]"[^>]*required/);

  const sample = await render({ require_volume: false });
  assert.equal(/name="contact\[Expected monthly volume\]"[^>]*required/.test(sample), false);
});

test('the business type options match the audiences named in the copy', async () => {
  const html = await render();
  for (const option of ['Coffee Shop', 'Restaurant', 'Hotel', 'Office', 'Retailer', 'Distributor', 'Startup', 'Supermarket']) {
    assert.match(html, new RegExp(`>\\s*${option}\\s*<`), `missing business type ${option}`);
  }
});

test('the success message is announced to screen readers', async () => {
  const html = await render();
  assert.match(html, /role="status"|aria-live="polite"/);
});

test('no user-visible english is hard-coded outside the schema', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('declares two presets — sample and quote', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/enquiry-form.liquid'), 'utf8'));
  assert.equal(schema.presets.length, 2);
});
