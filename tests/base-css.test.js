import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = () => readFile(resolveInTheme('assets/base.css'), 'utf8');

test('no physical directional properties are used — RTL readiness', async () => {
  const css = await load();
  const offenders = [];
  const forbidden = [
    /(?<![-\w])margin-left\s*:/g,
    /(?<![-\w])margin-right\s*:/g,
    /(?<![-\w])padding-left\s*:/g,
    /(?<![-\w])padding-right\s*:/g,
    /(?<![-\w])border-left\s*:/g,
    /(?<![-\w])border-right\s*:/g,
    /text-align\s*:\s*(left|right)/g,
  ];
  for (const pattern of forbidden) {
    for (const match of css.matchAll(pattern)) offenders.push(match[0]);
  }
  assert.deepEqual(offenders, [], `use logical properties instead: ${offenders.join(', ')}`);
});

test('all motion is gated behind prefers-reduced-motion', async () => {
  const css = await load();
  const transitions = (css.match(/transition\s*:/g) ?? []).length;
  const animations = (css.match(/animation\s*:/g) ?? []).length;
  if (transitions + animations > 0) {
    assert.match(css, /@media\s*\(prefers-reduced-motion/);
  }
});

test('focus is never removed without a visible replacement', async () => {
  const css = await load();
  for (const match of css.matchAll(/outline\s*:\s*(none|0)/g)) {
    const after = css.slice(match.index, match.index + 400);
    assert.match(after, /outline|box-shadow/, 'outline removal must be paired with a visible ring');
  }
});

test('colour values come from tokens, not literals', async () => {
  const body = (await load()).replace(/\/\*[\s\S]*?\*\//g, '');
  const literals = body.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  assert.deepEqual(literals, [], `move these into tokens.css: ${literals.join(', ')}`);
});

test('the body font resolves through the token', async () => {
  assert.match(await load(), /font-family:\s*var\(--font-body\)/);
});

test('a skip link is styled', async () => {
  assert.match(await load(), /\.skip-link/);
});
