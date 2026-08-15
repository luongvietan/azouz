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
