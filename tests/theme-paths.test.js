import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { THEME_DIR, THEME_SUBDIRS, resolveInTheme } from '../scripts/theme-paths.js';

test('THEME_DIR points at an existing directory', () => {
  assert.ok(existsSync(THEME_DIR), `${THEME_DIR} should exist`);
});

test('THEME_SUBDIRS lists exactly the directories Shopify allows at a theme root', () => {
  assert.deepEqual(
    [...THEME_SUBDIRS].sort(),
    ['assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'],
  );
});

test('resolveInTheme joins a POSIX-style relative path onto the theme root', () => {
  const resolved = resolveInTheme('layout/theme.liquid');
  assert.ok(resolved.startsWith(THEME_DIR));
  assert.ok(resolved.endsWith('theme.liquid'));
});
