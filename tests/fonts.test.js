import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('woff2 files are present for all three weights', async () => {
  const files = await readdir(resolveInTheme('assets'));
  for (const weight of ['400', '600', '700']) {
    assert.ok(
      files.some((name) => name.startsWith('baloo-') && name.includes(weight) && name.endsWith('.woff2')),
      `expected a baloo-*${weight}*.woff2 asset`,
    );
  }
});

test('each woff2 asset is a real font file, not an error page', async () => {
  const files = (await readdir(resolveInTheme('assets'))).filter((n) => n.endsWith('.woff2'));
  assert.ok(files.length > 0);
  for (const name of files) {
    const info = await stat(resolveInTheme(`assets/${name}`));
    assert.ok(info.size > 2000, `${name} is only ${info.size} bytes`);
    const head = await readFile(resolveInTheme(`assets/${name}`));
    assert.equal(head.subarray(0, 4).toString('latin1'), 'wOF2', `${name} lacks the wOF2 signature`);
  }
});

test('fonts.css declares font-display swap for every face', async () => {
  const css = await readFile(resolveInTheme('assets/fonts.css'), 'utf8');
  const faces = css.match(/@font-face/g) ?? [];
  const swaps = css.match(/font-display:\s*swap/g) ?? [];
  assert.ok(faces.length >= 3);
  assert.equal(faces.length, swaps.length);
});

test('fonts.css references only local asset filenames', async () => {
  const css = await readFile(resolveInTheme('assets/fonts.css'), 'utf8');
  assert.equal(/https?:\/\//.test(css), false, 'no external font URLs may remain');
});

test('the OFL licence ships with the fonts', async () => {
  const licence = await readFile(resolveInTheme('assets/OFL.txt'), 'utf8');
  assert.match(licence, /SIL OPEN FONT LICENSE/i);
});
