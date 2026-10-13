import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection } from './helpers/render-section.js';

test('the heading renders as the section h2', async () => {
  const html = await renderSection('section-heading', { settings: { heading: 'Our Story' } });
  assert.match(html, /<h2 class="section-head__heading">Our Story<\/h2>/);
});

test('an intro renders under the heading when one is set', async () => {
  const html = await renderSection('section-heading', {
    settings: { heading: 'Our Story', body: 'Small-batch roasting, and a big, bold flavour.' },
  });
  assert.match(html, /<\/h2>[\s\S]*<p class="section-head__intro lead">Small-batch roasting, and a big, bold flavour\.<\/p>/);
});

test('no empty intro paragraph is left behind without one', async () => {
  const html = await renderSection('section-heading', { settings: { heading: 'Our Story', body: '' } });
  assert.equal(/section-head__intro/.test(html), false);
});
