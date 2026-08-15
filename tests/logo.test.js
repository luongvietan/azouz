import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const VARIANTS = ['logo-primary', 'logo-black', 'logo-white', 'logomark'];

async function svg(name) {
  return readFile(resolveInTheme(`assets/${name}.svg`), 'utf8');
}

test('every logo variant exists and is an svg root element', async () => {
  for (const name of VARIANTS) assert.match(await svg(name), /<svg[\s>]/);
});

test('every logo variant declares a viewBox so it scales cleanly', async () => {
  for (const name of VARIANTS) assert.match(await svg(name), /viewBox="[\d.\s-]+"/);
});

test('no logo variant hard-codes pixel width or height on the root', async () => {
  for (const name of VARIANTS) {
    const root = /<svg[^>]*>/.exec(await svg(name))[0];
    assert.equal(/\swidth="\d/.test(root), false, `${name} pins a width`);
    assert.equal(/\sheight="\d/.test(root), false, `${name} pins a height`);
  }
});

test('the vector content survived extraction', async () => {
  for (const name of VARIANTS) {
    const paths = (await svg(name)).match(/<path/g) ?? [];
    assert.ok(paths.length >= 15, `${name} has only ${paths.length} paths`);
  }
});

test('the primary logo uses the guideline green, not the .ai source green', async () => {
  const source = (await svg('logo-primary')).toLowerCase();
  assert.match(source, /#67985e/);
  assert.equal(source.includes('#67995f'), false, 'the off-by-one .ai green must be normalised');
});

test('the black logo is monochrome jet-black', async () => {
  const fills = new Set((await svg('logo-black')).toLowerCase().match(/#[0-9a-f]{6}/g) ?? []);
  assert.deepEqual([...fills], ['#161617']);
});

test('the white logo is monochrome white', async () => {
  const fills = new Set((await svg('logo-white')).toLowerCase().match(/#[0-9a-f]{6}/g) ?? []);
  assert.deepEqual([...fills], ['#ffffff']);
});

test('the logomark is the wordmark alone — wider aspect than the full lockup', async () => {
  const ratio = async (name) => {
    const [, , w, h] = /viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/
      .exec(await svg(name))
      .slice(1)
      .map(Number);
    return w / h;
  };
  assert.ok(
    (await ratio('logomark')) > (await ratio('logo-black')),
    'the wordmark alone should be proportionally wider than the lockup',
  );
});
