import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';

test('renders a real number input so it works with no javascript', async () => {
  const html = await renderSnippet('quantity-input', {});
  assert.match(html, /<input[^>]+type="number"/);
  assert.match(html, /name="quantity"/);
  assert.match(html, /min="1"/);
});

test('the stepper buttons are type=button so they never submit the form', async () => {
  const html = await renderSnippet('quantity-input', {});
  const buttons = html.match(/<button[^>]*>/g) ?? [];
  assert.equal(buttons.length, 2);
  for (const button of buttons) assert.match(button, /type="button"/);
});

test('the input is labelled for screen readers', async () => {
  const html = await renderSnippet('quantity-input', {});
  assert.match(html, /aria-label="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});

test('accepts a custom name, value and form association', async () => {
  const html = await renderSnippet('quantity-input', {
    name: 'updates[abc]',
    value: 3,
    form: 'CartForm',
  });
  assert.match(html, /name="updates\[abc\]"/);
  assert.match(html, /value="3"/);
  assert.match(html, /form="CartForm"/);
});

test('omits the max attribute when no maximum is given', async () => {
  assert.equal(/max="/.test(await renderSnippet('quantity-input', {})), false);
});
