import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const render = (settings = {}) =>
  renderSection('marquee', { settings: { text: 'Roasted in Jordan', ...settings } });

test('renders nothing when the merchant leaves the text empty', async () => {
  const html = await render({ text: '' });
  assert.equal(html.trim(), '');
});

test('the running line is announced once, however many times it is drawn', async () => {
  // The phrase is repeated to fill the row and then duplicated again so the
  // loop has no seam. A screen reader must still hear one line, not eight.
  const html = await render({ repeats: 3 });
  const items = html.match(/class="marquee__item"[^>]*/g) ?? [];
  const hidden = items.filter((tag) => tag.includes('aria-hidden'));
  assert.equal(items.length, 6, 'three repeats, drawn twice for a seamless loop');
  assert.equal(hidden.length, 5, 'exactly one copy stays in the accessibility tree');
});

test('the moving text can be stopped', async () => {
  // WCAG 2.2.2, Level A: motion that starts on its own and runs past five
  // seconds needs a mechanism to pause it. prefers-reduced-motion is not that
  // mechanism — it only reaches readers who already changed the setting.
  const html = await render();
  assert.match(html, /<button[^>]+data-marquee-toggle/);
  assert.match(html, /aria-pressed="false"/);
});

test('the pause button names the action it will perform, in both states', async () => {
  const html = await render();
  assert.match(html, /data-label-pause="[^"]+"/);
  assert.match(html, /data-label-resume="[^"]+"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the band is a custom element, so the runtime can own the control', async () => {
  const html = await render();
  assert.match(html, /<marquee-band class="marquee" data-paused="false"/);
});

test('declares a preset so the client can add it in the theme editor', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  const schema = extractSchema(await readFile(resolveInTheme('sections/marquee.liquid'), 'utf8'));
  assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0);
});
