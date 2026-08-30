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

/** The viewBox aspect ratio a logo variant actually has. */
const viewBoxRatio = async (name) => {
  const [, , w, h] = /viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/
    .exec(await svg(name))
    .slice(1)
    .map(Number);
  return w / h;
};

/** Every <img> in a liquid file that points at the given asset. */
const imgTagsFor = (source, asset) =>
  (source.match(/<img[\s\S]*?>/g) ?? []).filter((tag) => tag.includes(asset));

test('the two lockups are the same artwork, so either can be swapped in', async () => {
  // The footer prints the white one on its dark ground and the header the
  // black one. That only works if they are the same drawing in two inks — a
  // white variant on a different canvas would reserve a different box and sit
  // at a different size from the header's mark.
  assert.equal(await viewBoxRatio('logo-white'), await viewBoxRatio('logo-black'));
});

test('every section declares its lockup at the artwork real aspect ratio', async () => {
  // The attributes reserve the box before the SVG loads. Declaring 83x56 for a
  // 59.01x47.78 viewBox reserves the wrong shape and the header shifts.
  const truth = await viewBoxRatio('logo-black');

  for (const file of ['sections/header.liquid', 'sections/footer.liquid', 'sections/main-password.liquid']) {
    const source = await readFile(resolveInTheme(file), 'utf8');
    const tags = [...imgTagsFor(source, 'logo-black.svg'), ...imgTagsFor(source, 'logo-white.svg')];
    assert.ok(tags.length > 0, `${file} should render a lockup`);

    for (const tag of tags) {
      const width = Number(/\bwidth="(\d+)"/.exec(tag)[1]);
      const height = Number(/\bheight="(\d+)"/.exec(tag)[1]);
      const declared = width / height;
      assert.ok(
        Math.abs(declared - truth) / truth < 0.01,
        `${file} declares ${width}x${height} (${declared.toFixed(3)}) for a ${truth.toFixed(3)} logo`,
      );
    }
  }
});

test('a merchant logo is sized from the uploaded image, not a constant', async () => {
  const source = await readFile(resolveInTheme('sections/header.liquid'), 'utf8');
  const custom = imgTagsFor(source, 'logo_source');
  assert.ok(custom.length > 0, 'the custom-logo branch must exist');
  for (const tag of custom) {
    assert.match(tag, /width="\{\{ logo_source\.width \}\}"/);
    assert.match(tag, /height="\{\{ logo_source\.height \}\}"/);
  }
});
