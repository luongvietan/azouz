import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import {
  assertLogicalPropertiesOnly,
  assertNoColourLiterals,
  assertNoSmallTextOnAccent,
} from './helpers/css-guards.js';

const load = () => readFile(resolveInTheme('assets/gift-card.css'), 'utf8');

test('gift-card.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('gift-card.css uses no physical directional properties — RTL readiness', async () => {
  assertLogicalPropertiesOnly(await load(), 'gift-card.css');
});

test('gift-card.css contains no colour literals — tokens only', async () => {
  assertNoColourLiterals(await load(), 'gift-card.css');
});

test('gift-card.css never puts small text on the primary green', async () => {
  assertNoSmallTextOnAccent(await load(), 'gift-card.css');
});

test('printing keeps the voucher and drops what cannot be used on paper', async () => {
  const css = await load();
  const print = /@media print\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(print, 'there is no print stylesheet');
  assert.match(print[1], /\.gift-card__actions/);
  assert.match(print[1], /\.gift-card__links/);
  assert.equal(
    /\.gift-card__code[^-_]/.test(print[1]),
    false,
    'the code itself must survive printing',
  );
});

test('only the gift card template loads it — it is not linked from the layouts', async () => {
  for (const layout of ['layout/theme.liquid', 'layout/password.liquid']) {
    const source = await readFile(resolveInTheme(layout), 'utf8');
    assert.equal(/gift-card\.css/.test(source), false, `${layout} loads gift-card.css`);
  }
});
