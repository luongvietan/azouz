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

test('an unexpected top-level directory is reported', async () => {
  const dir = await makeTheme({ ...VALID, 'node_modules/pkg/index.js': '' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['node_modules']);
});

test('a stray top-level file is reported', async () => {
  const dir = await makeTheme({ ...VALID, 'README.md': '# hi' });
  assert.deepEqual(await findDisallowedTopLevelEntries(dir), ['README.md']);
});
