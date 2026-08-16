import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadThemeJs } from './helpers/load-theme-js.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const source = () => readFile(resolveInTheme('assets/theme.js'), 'utf8');

test('cart-drawer is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('cart-drawer'), 'function');
});

test('it listens for the cart:updated event rather than being called directly', async () => {
  assert.match(await source(), /addEventListener\(\s*'cart:updated'/);
});

test('it refreshes through the section rendering api', async () => {
  assert.match(await source(), /\?sections=/);
});

test('it refreshes the header too, so the cart count stays correct', async () => {
  assert.match(await source(), /sections=cart-drawer,header|sections=header,cart-drawer/);
});

test('it replaces the inner content region, never its own element', async () => {
  const js = await source();
  assert.match(js, /data-drawer-content/);
  assert.equal(
    /this\.innerHTML\s*=/.test(js),
    false,
    'replacing the component own innerHTML would destroy its listeners',
  );
});

test('it uses showModal so the platform provides focus trapping', async () => {
  assert.match(await source(), /showModal/);
});
