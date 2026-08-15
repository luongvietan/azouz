import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import {
  assertLogicalPropertiesOnly,
  assertNoColourLiterals,
  assertNoSmallTextOnAccent,
} from './helpers/css-guards.js';

const load = () => readFile(resolveInTheme('assets/sections.css'), 'utf8');

test('sections.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('sections.css uses no physical directional properties — RTL readiness', async () => {
  assertLogicalPropertiesOnly(await load(), 'sections.css');
});

test('sections.css contains no colour literals — tokens only', async () => {
  assertNoColourLiterals(await load(), 'sections.css');
});

test('sections.css never puts small text on the primary green', async () => {
  assertNoSmallTextOnAccent(await load(), 'sections.css');
});

test('the layout links sections.css after base.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const base = layout.indexOf('base.css');
  const sections = layout.indexOf('sections.css');
  assert.ok(sections > -1, 'sections.css must be linked from the layout');
  assert.ok(sections > base, 'sections.css must come after base.css so it can override');
});
