import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}, scope = {}) => renderSection('location-enquiry', { settings, scope });

const field = (name) => new RegExp(`name="${name.replace(/[[\]]/g, '\\$&')}"`);

test('posts to the shopify contact endpoint', async () => {
  const html = await render();
  assert.match(html, /<form[^>]+method="post"/);
  assert.match(html, /action="\/contact#contact"/);
});

/*
  The client's close: "Tell us your City · Location · Space Size · Business
  Type and we'll explain which Azouz Coffee format could work for you." Those
  four are the form. Without them the roastery cannot answer the one question
  the page asks a reader to put to it.
*/
test('asks for the four details the client named', async () => {
  const html = await render();
  for (const name of ['contact[City]', 'contact[Location]', 'contact[Space size]', 'contact[Business type]']) {
    assert.match(html, field(name), `missing field ${name}`);
  }
});

test('opens with the same contact details every enquiry form asks for', async () => {
  const html = await render();
  for (const name of ['contact[name]', 'contact[email]', 'contact[phone]', 'contact[Company]', 'contact[body]']) {
    assert.match(html, field(name), `missing field ${name}`);
  }
});

test('every field has an associated label', async () => {
  const html = await render();
  const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(ids.length >= 9);
  for (const id of ids) {
    assert.match(html, new RegExp(`<label[^>]+for="${id}"`), `no label for #${id}`);
  }
});

test('only name and email are required, so a reader without a site yet can still ask', async () => {
  const html = await render();
  const required = [...html.matchAll(/<(?:input|select|textarea)[^>]*\sname="([^"]+)"[^>]*\srequired/g)].map(
    (m) => m[1],
  );
  assert.deepEqual(required.sort(), ['contact[email]', 'contact[name]']);
});

test('the business types come from the setting, trimmed, behind a prompt', async () => {
  const html = await render({ business_types: 'New coffee shop, Hotel , University,' });
  assert.match(html, /<option value="">Select a business type<\/option>/);
  for (const option of ['New coffee shop', 'Hotel', 'University']) {
    assert.match(html, new RegExp(`<option value="${option}">${option}</option>`));
  }
  // The trailing comma must not become an empty option.
  assert.equal(countMatches(html, /<option value="">/g), 1);
});

/*
  The client's close has two actions, "Start My Azouz Coffee" and "Request More
  Information", and both need the same details. They are the form's two submit
  buttons: the one pressed posts its own label, so the email says which of the
  two the reader asked for, and it works with no script at all.
*/
test('both closing actions submit the form and name themselves in the enquiry', async () => {
  const html = await render({ submit_label: 'Start My Azouz Coffee', secondary_label: 'Request More Information' });
  const buttons = [...html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)];
  assert.equal(buttons.length, 2);

  const [primary, secondary] = buttons;
  assert.match(primary[1], /class="button"/);
  assert.match(primary[1], /type="submit"/);
  assert.match(primary[1], /name="contact\[Enquiry\]"/);
  assert.match(primary[1], /value="Start My Azouz Coffee"/);
  assert.equal(primary[2].trim(), 'Start My Azouz Coffee');

  assert.match(secondary[1], /class="button button--secondary"/);
  assert.match(secondary[1], /value="Request More Information"/);
  assert.equal(secondary[2].trim(), 'Request More Information');
});

test('the second button is dropped when its label is cleared', async () => {
  const html = await render({ secondary_label: '' });
  assert.equal(countMatches(html, /<button/g), 1);
});

test('a cleared button label falls back to the theme wording rather than an empty button', async () => {
  const html = await render({ submit_label: '' });
  assert.match(html, /<button[^>]*value="Send enquiry"[^>]*>Send enquiry<\/button>/);
});

test('a button label is escaped where it becomes an attribute', async () => {
  // Shopify's escape writes &quot; and the preview's writes &#34;. Either is
  // correct; a bare quote would end the attribute and drop the rest.
  const html = await render({ submit_label: 'Start "now"' });
  assert.match(html, /value="Start (&quot;|&#34;)now(&quot;|&#34;)"/);
});

test('carries the anchor the page links to', async () => {
  assert.match(await render(), /<section[^>]+id="enquire"/);
});

test('a rejected post names the failing field and marks it invalid', async () => {
  const html = await render({}, { request: { query: { contact_errors: 'email' } } });
  assert.match(html, /class="enquiry__error" role="alert" tabindex="-1"/);
  assert.match(html, /name="contact\[email\]"[^>]*aria-invalid="true"/);
});

test('a successful post is announced', async () => {
  const html = await render({}, { request: { query: { contact_posted: '1' } } });
  assert.match(html, /<p class="enquiry__success" role="status">/);
});

test('carries the same honeypot as the other enquiry forms', async () => {
  const html = await render();
  assert.match(html, /<div class="enquiry__honeypot" aria-hidden="true">/);
  assert.match(html, /name="contact\[Website\]"[\s\S]{0,120}tabindex="-1"/);
});

test('no user-visible english is missing from the locale', async () => {
  assert.equal(/translation missing/.test(await render()), false);
});

test('declares a preset so the form can be placed from the theme editor', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/location-enquiry.liquid'), 'utf8'));
  assert.equal(schema.presets.length, 1);
});
