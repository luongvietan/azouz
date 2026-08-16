import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('product-form is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('product-form'), 'function');
});

test('the add-to-cart request targets the cart add route', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /routes\.cart_add_url|'\/cart\/add'/);
});

test('the component asks for json so the server does not redirect it', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /Accept['"]?\s*:\s*['"]application\/json/);
});

test('a failed request falls back to a native form submission', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(
    source,
    /catch[\s\S]{0,400}\.submit\(\)/,
    'if fetch fails the browser must still be allowed to post the form',
  );
});

test('the component announces a cart update rather than reaching into the drawer', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /cart:updated/);
});

test('add-to-cart asks the drawer to open', async () => {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(source, /openDrawer\s*=\s*true/);
});
