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

test('open removes hidden and aria-hidden from the host and dialog before showModal', async () => {
  const js = await source();
  const openIndex = js.indexOf('open()');
  const showModalIndex = js.indexOf('showModal', openIndex);
  const openBody = js.slice(openIndex, showModalIndex);
  assert.match(openBody, /this\.removeAttribute\(\s*['"]hidden['"]\s*\)/);
  assert.match(openBody, /this\.removeAttribute\(\s*['"]aria-hidden['"]\s*\)/);
  assert.match(openBody, /removeAttribute\(\s*['"]inert['"]\s*\)/);
  assert.match(openBody, /removeAttribute\(\s*['"]aria-hidden['"]\s*\)/);
  assert.match(openBody, /removeAttribute\(\s*['"]hidden['"]\s*\)/);
});

test('close restores hidden and aria-hidden on the host and dialog', async () => {
  const js = await source();
  assert.match(js, /addEventListener\(\s*['"]close['"]/);
  assert.match(js, /this\.setAttribute\(\s*['"]hidden['"]/);
  assert.match(js, /this\.setAttribute\(\s*['"]aria-hidden['"]\s*,\s*['"]true['"]\s*\)/);
  assert.match(js, /setAttribute\(\s*['"]inert['"]/);
  assert.match(js, /setAttribute\(\s*['"]aria-hidden['"]\s*,\s*['"]true['"]\s*\)/);
  assert.match(js, /setAttribute\(\s*['"]hidden['"]\s*,\s*['"]['"]\s*\)/);
});
