import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('theme.js is a classic script — no import or export, ever', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.equal(
    /^\s*(import|export)\s/m.test(source),
    false,
    'theme.js is loaded with a plain <script defer>; module syntax would break the whole runtime',
  );
});

test('theme.js exposes its pure logic on a single global namespace', async () => {
  const { AzouzTheme } = await loadThemeJs();
  assert.equal(typeof AzouzTheme, 'object');
});

test('theme.js registers reveal-on-scroll', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('reveal-on-scroll'), 'function');
});

test('loading theme.js twice does not throw on re-registration', async () => {
  await loadThemeJs();
  await loadThemeJs();
});
