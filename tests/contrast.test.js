import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, relativeLuminance } from '../scripts/contrast.js';
import { readCssTokens } from '../scripts/css-tokens.js';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const close = (actual, expected, tolerance = 0.05) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual.toFixed(3)} to be within ${tolerance} of ${expected}`,
  );

test('relativeLuminance is 0 for black and 1 for white', () => {
  close(relativeLuminance('#000000'), 0, 0.001);
  close(relativeLuminance('#FFFFFF'), 1, 0.001);
});

test('contrastRatio of black on white is 21', () => {
  close(contrastRatio('#000000', '#FFFFFF'), 21, 0.01);
});

test('contrastRatio is symmetric', () => {
  close(contrastRatio('#67985E', '#FFFFFF'), contrastRatio('#FFFFFF', '#67985E'));
});

test('contrastRatio matches the hand-computed brand values', () => {
  close(contrastRatio('#171717', '#F6F3ED'), 16.19);
  close(contrastRatio('#4A3126', '#F6F3ED'), 10.78);
  close(contrastRatio('#FFFFFF', '#687B5D'), 4.59);
  close(contrastRatio('#687B5D', '#F6F3ED'), 4.14);
  close(contrastRatio('#B7B7B3', '#F6F3ED'), 1.82);
});

test('the pale green is a surface and only a surface', async () => {
  const map = await tokens();
  // Both halves matter. Onyx on it is why the green band, the announcement bar
  // and the chips may be painted in it at all; white failing on it is why
  // nothing in the theme may put --color-on-accent over --color-accent, and
  // why the band's own buttons are the page's graphite ones.
  assert.ok(contrastRatio(map.get('--color-text'), map.get('--color-accent')) >= 7);
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-accent')) < 4.5);
});

test('the pale green is far too light to be text', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-accent'), map.get('--color-bg')) < 1.5);
});

test('burnt orange is never a surface for body text — the deepened one is', async () => {
  const map = await tokens();
  assert.ok(
    contrastRatio('#FFFFFF', '#C65B32') < 4.5,
    'if the board orange ever passes, --color-highlight can be simplified away',
  );
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-highlight')) >= 4.5);
  assert.ok(contrastRatio(map.get('--color-highlight'), map.get('--color-bg')) >= 4.5);
});

test('the coffee brown tone is legal in both directions', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-warm'), map.get('--color-bg')) >= 7);
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-warm')) >= 7);
});

test('no two of the light surfaces are the same colour', async () => {
  // The palette once carried a --color-bg-tint of #E2E2DF alongside a pale
  // green of #DFE5D9: 1.01:1 apart, which is to say identical. Three light
  // surfaces is the budget, and each has to be one a reader can tell from the
  // other two — otherwise the page has bands nobody can see the edges of.
  const map = await tokens();
  const surfaces = ['--color-bg', '--color-bg-alt', '--color-accent'];
  for (const a of surfaces) {
    for (const b of surfaces) {
      if (a === b) continue;
      const ratio = contrastRatio(map.get(a), map.get(b));
      assert.ok(ratio >= 1.05, `${a} and ${b} are indistinguishable (${ratio.toFixed(3)}:1)`);
    }
  }
});

test('shorthand hex is expanded', () => {
  close(contrastRatio('#000', '#fff'), 21, 0.01);
});

test('readCssTokens reads a literal hex declaration', () => {
  assert.equal(readCssTokens(':root{--a:#67985E;}').get('--a'), '#67985E');
});

test('readCssTokens follows a var() chain to the underlying hex', () => {
  const css = ':root{--brand:#67985E;--accent:var(--brand);--button:var(--accent);}';
  assert.equal(readCssTokens(css).get('--button'), '#67985E');
});

test('readCssTokens omits declarations that never resolve to a colour', () => {
  const css = ':root{--gap:1rem;--shadow:0 1px 2px rgb(0 0 0 / 5%);--font:sans-serif;}';
  assert.deepEqual([...readCssTokens(css).keys()], []);
});

test('readCssTokens does not hang on a circular reference', () => {
  const tokens = readCssTokens(':root{--a:var(--b);--b:var(--a);}');
  assert.equal(tokens.has('--a'), false);
});

const REQUIRED_TOKENS = [
  '--color-bg',
  '--color-bg-alt',
  '--color-warm',
  '--color-highlight',
  '--color-text',
  '--color-text-muted',
  '--color-accent',
  '--color-accent-deep',
  '--color-on-accent',
  '--color-hairline',
];

async function tokens() {
  return readCssTokens(await readFile(resolveInTheme('assets/tokens.css'), 'utf8'));
}

test('every semantic colour token is defined', async () => {
  const map = await tokens();
  for (const name of REQUIRED_TOKENS) assert.ok(map.has(name), `${name} must be defined`);
});

test('the brand primary is a lifted sage, not the colour-board value', async () => {
  // The board's Sage is still defined below — it simply no longer paints
  // anything. The client asked for a light green that sits level with the
  // greys, so the surface token is the lifted shade.
  const map = await tokens();
  assert.equal(map.get('--color-accent').toUpperCase(), '#DFE5D9');
  assert.notEqual(map.get('--color-accent').toUpperCase(), '#687B5D');
});

test('every colour the board names is present, unaltered', async () => {
  const map = await tokens();
  const BOARD = {
    '--azouz-warm-white': '#F6F3ED',
    '--azouz-silver': '#B7B7B3',
    '--azouz-onyx': '#171717',
    '--azouz-coffee-brown': '#4A3126',
    '--azouz-sage': '#687B5D',
    '--azouz-burnt-orange': '#C65B32',
  };
  for (const [token, hex] of Object.entries(BOARD)) {
    assert.equal(map.get(token)?.toUpperCase(), hex, `${token} must match the colour board`);
  }
});

test('body text on both page grounds reaches AAA', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-text'), map.get('--color-bg')) >= 7);
  assert.ok(contrastRatio(map.get('--color-text'), map.get('--color-bg-alt')) >= 7);
});

test('muted text on both page grounds reaches AA', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-text-muted'), map.get('--color-bg')) >= 4.5);
  assert.ok(contrastRatio(map.get('--color-text-muted'), map.get('--color-bg-alt')) >= 4.5);
});

test('the action ink clears AAA against the page, so buttons and links are safe at any size', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-accent-deep')) >= 7);
  assert.ok(contrastRatio(map.get('--color-accent-deep'), map.get('--color-bg')) >= 7);
});

test('the deep green clears AA-normal against its on-colour', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-accent-deep')) >= 4.5);
});

test('deep green as text clears AA-normal on both page grounds', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-accent-deep'), map.get('--color-bg')) >= 4.5);
  assert.ok(contrastRatio(map.get('--color-accent-deep'), map.get('--color-bg-alt')) >= 4.5);
});

test('the hairline token is documented as non-text — it fails text contrast by design', async () => {
  const map = await tokens();
  assert.ok(
    contrastRatio(map.get('--color-hairline'), map.get('--color-bg')) < 4.5,
    'if this ever passes, update the spec: hairline could then be used for text',
  );
});
