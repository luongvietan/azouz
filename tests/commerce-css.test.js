import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import {
  assertLogicalPropertiesOnly,
  assertNoColourLiterals,
  assertNoSmallTextOnAccent,
} from './helpers/css-guards.js';

const load = () => readFile(resolveInTheme('assets/commerce.css'), 'utf8');

test('commerce.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('commerce.css uses no physical directional properties — RTL readiness', async () => {
  assertLogicalPropertiesOnly(await load(), 'commerce.css');
});

test('commerce.css contains no colour literals — tokens only', async () => {
  assertNoColourLiterals(await load(), 'commerce.css');
});

test('commerce.css never puts small text on the primary green', async () => {
  assertNoSmallTextOnAccent(await load(), 'commerce.css');
});

test('the layout links commerce.css after sections.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const sections = layout.indexOf('sections.css');
  const commerce = layout.indexOf('commerce.css');
  assert.ok(commerce > -1, 'commerce.css must be linked from the layout');
  assert.ok(commerce > sections, 'commerce.css must come after sections.css so it can override');
});

/**
 * Pull one declaration out of a rule block.
 * @param {string} css
 * @param {string} selector
 * @param {string} property
 */
const declaration = (css, selector, property) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(block, `${selector} must exist in commerce.css`);
  const found = new RegExp(`${property}:\\s*([^;]+);`).exec(block[1]);
  return found ? found[1].trim() : null;
};

test('the cart remove control meets the 44px touch target floor', async () => {
  // PRODUCT.md sets 44px as the floor; WCAG 2.2 SC 2.5.8 sets 24px as the AA
  // minimum. An icon-only control needs the box declared — the icon is 1.125rem.
  const css = await load();
  assert.equal(declaration(css, '.cart-line__remove', 'min-inline-size'), '2.75rem');
  assert.equal(declaration(css, '.cart-line__remove', 'min-block-size'), '2.75rem');
  assert.equal(declaration(css, '.cart-line__remove', 'justify-content'), 'center');
});

test('the quantity stepper buttons meet the 44px touch target floor', async () => {
  const css = await load();
  assert.equal(declaration(css, '.quantity__button', 'min-inline-size'), '2.75rem');
  assert.equal(declaration(css, '.quantity__button', 'min-block-size'), '2.75rem');
});

test('pagination targets meet the 44px touch target floor', async () => {
  const css = await load();
  assert.equal(declaration(css, '.pagination__page', 'min-inline-size'), '2.75rem');
  assert.equal(declaration(css, '.pagination__page', 'min-block-size'), '2.75rem');
});
