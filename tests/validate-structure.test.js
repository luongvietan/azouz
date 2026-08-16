import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findMissingRequiredFiles,
  findDisallowedTopLevelEntries,
  findDefaultLocale,
} from '../scripts/validate-structure.js';

/** Build a throwaway theme directory. `files` maps POSIX paths to contents. */
async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-theme-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

const VALID = {
  'layout/theme.liquid': '<!doctype html>',
  'config/settings_schema.json': '[]',
  'locales/en.default.json': '{}',
};

test('a valid theme reports no missing required files', async () => {
  const dir = await makeTheme(VALID);
  assert.deepEqual(await findMissingRequiredFiles(dir), []);
});

test('a missing layout is reported', async () => {
  const dir = await makeTheme({
    'config/settings_schema.json': '[]',
    'locales/en.default.json': '{}',
  });
  assert.deepEqual(await findMissingRequiredFiles(dir), ['layout/theme.liquid']);
});

test('a missing settings_schema is reported', async () => {
  const dir = await makeTheme({
    'layout/theme.liquid': '<!doctype html>',
    'locales/en.default.json': '{}',
  });
  assert.deepEqual(await findMissingRequiredFiles(dir), ['config/settings_schema.json']);
});

test('a theme with no default locale is reported', async () => {
  const dir = await makeTheme({
    'layout/theme.liquid': '<!doctype html>',
    'config/settings_schema.json': '[]',
    'locales/en.json': '{}',
  });
  assert.equal(await findDefaultLocale(dir), null);
});

test('a default locale is found by its .default.json suffix', async () => {
  const dir = await makeTheme(VALID);
  assert.equal(await findDefaultLocale(dir), 'en.default.json');
});

test('allowed top-level directories produce no complaints', async () => {
  const dir = await makeTheme(VALID);
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), []);
});

test('a directory that looks like theme code but is not read by Shopify is reported', async () => {
  // This is the failure that still matters now the theme root is the repo
  // root: something a developer meant to ship, silently dropped on deploy.
  const dir = await makeTheme({ ...VALID, 'styles/main.css': '' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['styles']);
});

test('a mis-cased theme directory is reported rather than silently ignored', async () => {
  const dir = await makeTheme({ ...VALID, 'Snippets/card.liquid': '' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['Snippets']);
});

test('a stray liquid file at the root is reported — it belongs in a theme directory', async () => {
  const dir = await makeTheme({ ...VALID, 'theme.liquid': '' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['theme.liquid']);
});

test('the project tooling that shares the theme root is not reported', async () => {
  // Shopify ignores these; flagging them would make the check useless noise.
  const dir = await makeTheme({
    ...VALID,
    'package.json': '{}',
    'tests/x.test.js': '',
    'scripts/x.js': '',
    'preview/x.js': '',
    'docs/x.md': '',
    'node_modules/pkg/index.js': '',
    'README.md': '# hi',
  });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), []);
});

test('client source artwork sharing the root is not reported', async () => {
  const dir = await makeTheme({
    ...VALID,
    'Azouz - Brand Guidelines.pdf': '',
    'azouz-logo.ai': '',
    'photo.jpeg': '',
  });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), []);
});
