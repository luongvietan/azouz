import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = () => readFile(resolveInTheme('assets/pattern-kufi.svg'), 'utf8');

test('the pattern is a square tile', async () => {
  const [, , width, height] = /viewBox="([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)"/
    .exec(await load())
    .slice(1)
    .map(Number);
  assert.equal(width, height);
});

test('the pattern uses currentColor so it inherits the surrounding text colour', async () => {
  const svg = await load();
  assert.match(svg, /currentColor/);
  assert.equal(/#[0-9a-fA-F]{6}/.test(svg), false, 'no hard-coded colours');
});

test('the pattern has no fill, only strokes — it must read as a line texture', async () => {
  assert.match(await load(), /fill="none"/);
});

test('the pattern contains enough geometry to read as a motif', async () => {
  const shapes = (await load()).match(/<(path|rect|line)\b/g) ?? [];
  assert.ok(shapes.length >= 8, `only ${shapes.length} shapes`);
});
