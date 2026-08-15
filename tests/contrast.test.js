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
  close(contrastRatio('#FFFFFF', '#67985E'), 3.37);
  close(contrastRatio('#303030', '#FFFBF8'), 12.83);
  close(contrastRatio('#C5B7A4', '#FFFBF8'), 1.91);
  close(contrastRatio('#FFFFFF', '#4F7748'), 5.16);
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

test('the brand primary is exactly the guideline value', async () => {
  assert.equal((await tokens()).get('--color-accent').toUpperCase(), '#67985E');
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

test('the primary green clears AA-large against its on-colour', async () => {
  const map = await tokens();
  assert.ok(contrastRatio(map.get('--color-on-accent'), map.get('--color-accent')) >= 3);
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
