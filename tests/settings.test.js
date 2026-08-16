import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const loadJson = async (path) => JSON.parse(await readFile(resolveInTheme(path), 'utf8'));

test('settings_schema is an array whose first entry is theme_info', async () => {
  const schema = await loadJson('config/settings_schema.json');
  assert.ok(Array.isArray(schema));
  assert.equal(schema[0].name, 'theme_info');
  assert.equal(typeof schema[0].theme_name, 'string');
  assert.equal(typeof schema[0].theme_version, 'string');
});

test('every settings group declares a name and a settings array', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  assert.ok(groups.length > 0);
  for (const group of groups) {
    assert.equal(typeof group.name, 'string');
    assert.ok(Array.isArray(group.settings), `${group.name} needs a settings array`);
  }
});

test('every setting has a unique id', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  const ids = groups.flatMap((group) =>
    group.settings.filter((setting) => setting.id).map((setting) => setting.id),
  );
  assert.deepEqual([...new Set(ids)], ids, 'duplicate setting ids');
});

test('the accent colour defaults to the guideline primary', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  const accent = groups
    .flatMap((group) => group.settings)
    .find((setting) => setting.id === 'color_accent');
  assert.equal(accent.default.toUpperCase(), '#67985E');
});

test('settings_data provides a current preset', async () => {
  const data = await loadJson('config/settings_data.json');
  assert.equal(typeof data.current, 'object');
});

test('every id in settings_data exists in settings_schema', async () => {
  const groups = (await loadJson('config/settings_schema.json')).slice(1);
  const known = new Set(
    groups.flatMap((group) => group.settings.map((setting) => setting.id)).filter(Boolean),
  );
  const data = await loadJson('config/settings_data.json');
  const unknown = Object.keys(data.current).filter((key) => !known.has(key));
  assert.deepEqual(unknown, []);
});

test('theme.js registers the reveal element base.css styles', async () => {
  const js = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(js, /customElements\.define\(\s*'reveal-on-scroll'/);
});

test('theme.js respects prefers-reduced-motion', async () => {
  const js = await readFile(resolveInTheme('assets/theme.js'), 'utf8');
  assert.match(js, /prefers-reduced-motion/);
});

test('the placeholder is an svg using currentColor', async () => {
  const svg = await readFile(resolveInTheme('assets/placeholder.svg'), 'utf8');
  assert.match(svg, /<svg/);
  assert.match(svg, /viewBox=/);
});

test('every declared setting is actually read somewhere in the theme', async () => {
  // A picker in the editor that nothing consumes is a promise the theme does
  // not keep: the merchant changes it and nothing happens.
  const { readFile, readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { THEME_DIR } = await import('../scripts/theme-paths.js');

  const sources = [];
  for (const dir of ['layout', 'sections', 'snippets']) {
    for (const name of await readdir(join(THEME_DIR, dir))) {
      sources.push(await readFile(join(THEME_DIR, dir, name), 'utf8'));
    }
  }
  const haystack = sources.join('\n');

  const schema = JSON.parse(await readFile(join(THEME_DIR, 'config/settings_schema.json'), 'utf8'));
  const ids = schema.flatMap((group) => (group.settings ?? []).map((s) => s.id)).filter(Boolean);

  // `section.settings.logo` must not count as a read of the theme-level
  // `settings.logo`, so the match has to exclude the section-scoped form.
  const unused = ids.filter((id) => !new RegExp(`(?<!section\\.)settings\\.${id}\\b`).test(haystack));
  assert.deepEqual(unused, [], `settings nothing reads: ${unused.join(', ')}`);
});
