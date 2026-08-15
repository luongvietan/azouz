import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findInvalidJson } from '../scripts/validate-json.js';

async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-json-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

test('well-formed JSON anywhere in the theme produces no findings', async () => {
  const dir = await makeTheme({
    'config/settings_schema.json': '[{"name":"theme_info"}]',
    'locales/en.default.json': '{"general":{"skip":"Skip"}}',
    'templates/index.json': '{"sections":{}}',
    'templates/customers/login.json': '{"sections":{}}',
  });
  assert.deepEqual(await findInvalidJson(dir), []);
});

test('a malformed file is reported with its theme-relative POSIX path', async () => {
  const dir = await makeTheme({
    'config/settings_schema.json': '[]',
    'templates/index.json': '{"sections":{},}',
  });
  const findings = await findInvalidJson(dir);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'templates/index.json');
  assert.match(findings[0].message, /JSON/i);
});

test('nested template directories are searched', async () => {
  const dir = await makeTheme({ 'templates/customers/order.json': 'not json at all' });
  const findings = await findInvalidJson(dir);
  assert.equal(findings[0].file, 'templates/customers/order.json');
});

test('non-JSON files are ignored', async () => {
  const dir = await makeTheme({ 'layout/theme.liquid': '{{ this is not json }}' });
  assert.deepEqual(await findInvalidJson(dir), []);
});
