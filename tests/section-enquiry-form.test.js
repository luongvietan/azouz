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

test('groups contact and project fields for lower cognitive load', async () => {
  const html = await render();
  assert.match(html, /<fieldset[^>]*class="enquiry__group"/);
  assert.match(html, /Your details/);
  assert.match(html, /Project details/);
  assert.match(html, /e\.g\. 20 kg per month/);
});

test('the success message is announced to screen readers', async () => {
  const html = await render();
  assert.match(html, /role="status"|aria-live="polite"/);
});

test('no user-visible english is hard-coded outside the schema', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('pre-selects a business type from any position in the list', async () => {
  // `split: ','` leaves the leading space on every entry but the first, so the
  // option value and the comparison must both be stripped or only the first
  // business type could ever be pre-selected.
  const html = await render({
    business_types: 'Coffee Shop, Restaurant, Hotel',
    preselect_business: 'Restaurant',
  });

  assert.match(html, /<option value="Restaurant" selected>/);
  assert.equal(/<option value="Coffee Shop" selected>/.test(html), false);
});

test('pre-selecting the first business type still works', async () => {
  const html = await render({
    business_types: 'Coffee Shop, Restaurant, Hotel',
    preselect_business: 'Coffee Shop',
  });

  assert.match(html, /<option value="Coffee Shop" selected>/);
});

test('no business type is selected when the setting is empty', async () => {
  const html = await render({ business_types: 'Coffee Shop, Restaurant' });
  assert.equal(/<option value="[^"]+" selected>/.test(html), false);
});

test('declares two presets — sample and quote', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/enquiry-form.liquid'), 'utf8'));
  assert.equal(schema.presets.length, 2);
});

/** Render the form as Shopify would after rejecting a post. */
const renderWithErrors = (fields, settings = {}) =>
  renderSection('enquiry-form', {
    settings,
    scope: { request: { query: { contact_errors: fields.join(',') } } },
  });

test('a rejected post names the fields that failed, not just "check the highlighted fields"', async () => {
  const html = await renderWithErrors(['email']);
  assert.match(html, /enquiry__error/);
  assert.match(html, /email/i, 'the failing field must be named');
});

test('a failing field is marked invalid for assistive tech', async () => {
  const html = await renderWithErrors(['email']);
  assert.match(html, /name="contact\[email\]"[^>]*aria-invalid="true"/);
});

test('fields that passed are not marked invalid', async () => {
  const html = await renderWithErrors(['email']);
  const nameField = /<input[^>]*name="contact\[name\]"[^>]*>/.exec(html)[0];
  assert.equal(/aria-invalid="true"/.test(nameField), false);
});

test('the error summary is focusable so the customer lands on it', async () => {
  const html = await renderWithErrors(['email']);
  const summary = /<div[^>]*class="[^"]*enquiry__error[^"]*"[^>]*>/.exec(html);
  assert.ok(summary, 'the error summary must be an element that can hold focus');
  assert.match(summary[0], /tabindex="-1"/);
  assert.match(summary[0], /role="alert"/);
});

test('no error markup at all on a clean render', async () => {
  const html = await render();
  assert.equal(/enquiry__error/.test(html), false);
  assert.equal(/aria-invalid="true"/.test(html), false);
});
