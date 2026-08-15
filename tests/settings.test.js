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
