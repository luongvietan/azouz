import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';

test('renders the amount as money', async () => {
  const html = await renderSnippet('price', { price: 750 });
  assert.match(html, /7\.5|7,5/, 'the money filter should format 750 minor units');
});

test('labels the price for screen readers', async () => {
  const html = await renderSnippet('price', { price: 750 });
  assert.match(html, /visually-hidden/);
  assert.equal(/translation missing/.test(html), false);
});

test('shows a strike-through compare-at price when the item is on sale', async () => {
  const html = await renderSnippet('price', { price: 750, compare_at: 900 });
  assert.match(html, /<s /);
  assert.match(html, /price--on-sale/);
});

test('ignores a compare-at price that is not actually higher', async () => {
  // The <s> is present but hidden so a variant change can reveal it without
  // building DOM; hidden keeps it out of the accessibility tree either way.
  const html = await renderSnippet('price', { price: 900, compare_at: 900 });
  assert.match(html, /<s[^>]+data-price-compare[^>]*\shidden/);
  assert.equal(/price--on-sale/.test(html), false);
});

test('a hidden compare-at carries no stale amount', async () => {
  const html = await renderSnippet('price', { price: 900, compare_at: 900 });
  assert.match(html, /<span data-price-compare-amount><\/span>/);
});

test('a from-price shows the prefix and no compare-at', async () => {
  const html = await renderSnippet('price', { price: 750, show_from: true });
  assert.match(html, /price__from/);
  assert.equal(/<s /.test(html), false);
});

test('the from-price prefix comes from the locale file', async () => {
  const html = await renderSnippet('price', { price: 750, show_from: true });
  assert.equal(/translation missing/.test(html), false);
});

test('a zero price still renders rather than collapsing to nothing', async () => {
  const html = await renderSnippet('price', { price: 0 });
  assert.match(html, /price__current/);
});

test('the screen-reader label is addressable and both wordings travel with it', async () => {
  // A variant change swaps a sale price for a normal one. Without the labels in
  // the markup, JS can update the number but leaves the label saying
  // "Sale price" for a variant that is not on sale.
  const html = await renderSnippet('price', { price: 750, compare_at: 900 });
  const label = /<span[^>]*data-price-label[^>]*>/.exec(html);
  assert.ok(label, 'the visually-hidden label needs a hook');

  const wrapper = /<span\b[^>]*\bclass="price\b[^>]*>/.exec(html);
  assert.ok(wrapper, 'the outer price element must be findable');
  assert.match(wrapper[0], /data-label-price="[^"]+"/);
  assert.match(wrapper[0], /data-label-sale="[^"]+"/);
});
