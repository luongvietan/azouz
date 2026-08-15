import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const ICONS = ['search', 'cart', 'menu', 'close', 'arrow-right', 'chevron-down'];

async function renderIcon(name) {
  const engine = await createEngine(THEME_DIR);
  return engine.parseAndRender(`{% render 'icon', name: '${name}' %}`, {}, { globals: {} });
}

test('every icon the theme uses renders an svg', async () => {
  for (const name of ICONS) {
    assert.match(await renderIcon(name), /<svg/, `icon "${name}" is missing`);
  }
});

test('icons are decorative — aria-hidden and focusable=false', async () => {
  for (const name of ICONS) {
    const svg = await renderIcon(name);
    assert.match(svg, /aria-hidden="true"/, `${name} must be hidden from assistive tech`);
    assert.match(svg, /focusable="false"/, `${name} must not be a tab stop in IE/Edge legacy`);
  }
});

test('icons inherit colour rather than hard-coding it', async () => {
  for (const name of ICONS) {
    const svg = await renderIcon(name);
    assert.equal(/#[0-9a-fA-F]{3,6}/.test(svg), false, `${name} hard-codes a colour`);
    assert.match(svg, /currentColor/, `${name} must use currentColor`);
  }
});

test('an unknown icon name renders nothing rather than breaking the page', async () => {
  assert.equal((await renderIcon('not-a-real-icon')).trim(), '');
});
