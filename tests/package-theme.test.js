import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectThemeFiles, packageTheme } from '../scripts/package-theme.js';
import { THEME_SUBDIRS } from '../scripts/theme-paths.js';

test('the zip carries only theme directories', async () => {
  // The theme root is the repository root, so a naive archive of it would
  // sweep in preview/, tests/, node_modules/ and the client's artwork —
  // and Shopify rejects a zip containing anything outside the theme.
  const files = await collectThemeFiles();
  assert.ok(files.length > 50, `expected a full theme, got ${files.length} files`);

  const strays = files
    .map((file) => file.entry.split('/')[0])
    .filter((top) => !THEME_SUBDIRS.has(top));

  assert.deepEqual([...new Set(strays)], [], 'non-theme entries in the zip');
});

test('entries are posix paths — a backslash makes the zip unreadable to Shopify', async () => {
  for (const { entry } of await collectThemeFiles()) {
    assert.equal(entry.includes('\\'), false, `backslash in entry: ${entry}`);
    assert.equal(entry.startsWith('/'), false, `absolute entry: ${entry}`);
  }
});

test('the files Shopify requires are present', async () => {
  const entries = (await collectThemeFiles()).map((file) => file.entry);
  for (const required of [
    'layout/theme.liquid',
    'config/settings_schema.json',
    'templates/index.json',
    'locales/en.default.json',
  ]) {
    assert.ok(entries.includes(required), `missing ${required}`);
  }
});

test('nothing from the project tooling leaks in', async () => {
  const entries = (await collectThemeFiles()).map((file) => file.entry);
  for (const forbidden of ['tests/', 'preview/', 'scripts/', 'docs/', 'node_modules/', 'package.json']) {
    const leaked = entries.filter((entry) => entry.startsWith(forbidden));
    assert.deepEqual(leaked, [], `${forbidden} leaked into the zip`);
  }
});

test('packageTheme writes a non-empty zip', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-package-'));
  try {
    const { file, entries, bytes } = await packageTheme({ distDir: dir });
    assert.equal((await readdir(dir)).length, 1);
    assert.match(file, /\.zip$/);
    assert.ok(entries > 50);
    assert.ok(bytes > 1024, `zip was ${bytes} bytes`);
    assert.ok((await stat(file)).size > 1024);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
