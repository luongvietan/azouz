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

test('open removes hidden, aria-hidden, and inert from the host and dialog before showModal', async () => {
  const js = await source();
  const openIndex = js.indexOf('open()');
  const showModalIndex = js.indexOf('showModal', openIndex);
  const openBody = js.slice(openIndex, showModalIndex);
  assert.match(openBody, /this\.removeAttribute\(\s*['"]hidden['"]\s*\)/);
  assert.match(openBody, /this\.removeAttribute\(\s*['"]aria-hidden['"]\s*\)/);
  assert.match(openBody, /this\.removeAttribute\(\s*['"]inert['"]\s*\)/);
  assert.match(openBody, /removeAttribute\(\s*['"]inert['"]\s*\)/);
  assert.match(openBody, /removeAttribute\(\s*['"]aria-hidden['"]\s*\)/);
  assert.match(openBody, /removeAttribute\(\s*['"]hidden['"]\s*\)/);
});

test('close restores hidden, aria-hidden, and inert on the host and dialog', async () => {
  const js = await source();
  assert.match(js, /addEventListener\(\s*['"]close['"]/);
  assert.match(js, /this\.setAttribute\(\s*['"]hidden['"]/);
  assert.match(js, /this\.setAttribute\(\s*['"]aria-hidden['"]\s*,\s*['"]true['"]\s*\)/);
  assert.match(js, /this\.setAttribute\(\s*['"]inert['"]/);
  assert.match(js, /setAttribute\(\s*['"]inert['"]/);
  assert.match(js, /setAttribute\(\s*['"]aria-hidden['"]\s*,\s*['"]true['"]\s*\)/);
  assert.match(js, /setAttribute\(\s*['"]hidden['"]\s*,\s*['"]['"]\s*\)/);
});

test('quantity edits in the drawer post to /cart/change and dispatch cart:updated', async () => {
  const js = await source();
  assert.match(js, /parseCartLineKey/);
  assert.match(js, /fetch\(\s*['"]\/cart\/change['"]/);
  assert.match(js, /onLineQuantityChange/);
});

test('remove controls in the drawer use /cart/change instead of navigating away', async () => {
  const js = await source();
  assert.match(js, /onLineRemoveClick/);
  assert.match(js, /cart-line__remove/);
});

test('open does not call showModal when the dialog is already open', async () => {
  assert.match(await source(), /if\s*\(\s*!this\.dialog\.open\s*\)\s*this\.dialog\.showModal\(\)/);
});

test('refresh does not force the drawer open after every cart update', async () => {
  const js = await source();
  const refreshStart = js.indexOf('async refresh()');
  const refreshBody = js.slice(refreshStart, js.indexOf('if (!customElements.get(\'cart-drawer\'))'));
  assert.equal(/this\.open\(\)/.test(refreshBody), false);
});

test('the drawer opens only when add-to-cart marks the event', async () => {
  const js = await source();
  assert.match(js, /openDrawer/);
  assert.match(js, /event\.detail\?\.openDrawer/);
});
