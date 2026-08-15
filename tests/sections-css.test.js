import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

const load = () => readFile(resolveInTheme('assets/sections.css'), 'utf8');

test('sections.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('sections.css uses no physical directional properties — RTL readiness', async () => {
  const css = await load();
  const offenders = [];
  const forbidden = [
    /(?<![-\w])margin-left\s*:/g,
    /(?<![-\w])margin-right\s*:/g,
    /(?<![-\w])padding-left\s*:/g,
    /(?<![-\w])padding-right\s*:/g,
    /(?<![-\w])border-left\s*:/g,
    /(?<![-\w])border-right\s*:/g,
    /(?<![-\w])left\s*:/g,
    /(?<![-\w])right\s*:/g,
    /text-align\s*:\s*(left|right)/g,
  ];
  for (const pattern of forbidden) {
    for (const match of css.matchAll(pattern)) offenders.push(match[0]);
  }
  assert.deepEqual(offenders, [], `use logical properties instead: ${offenders.join(', ')}`);
});

test('sections.css contains no colour literals — tokens only', async () => {
  const body = (await load()).replace(/\/\*[\s\S]*?\*\//g, '');
  const literals = body.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  assert.deepEqual(literals, [], `move these into tokens.css: ${literals.join(', ')}`);
});

test('sections.css never puts small text on the primary green', async () => {
  const css = await load();
  const offenders = [];
  for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const [, selector, body] = match;
    if (!/background(-color)?:\s*var\(--color-accent\)/.test(body)) continue;
    // A rule may fill with the primary green only if it sets no text colour,
    // or explicitly opts into a large-text context.
    if (/color:\s*var\(--color-on-accent\)/.test(body) && !/font-size:\s*var\(--text-(2xl|3xl|display)\)/.test(body)) {
      offenders.push(selector.trim());
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `white on --color-accent is 3.37:1 and only legal for text >=24px; use --color-accent-deep: ${offenders.join(' | ')}`,
  );
});

test('the layout links sections.css after base.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const base = layout.indexOf('base.css');
  const sections = layout.indexOf('sections.css');
  assert.ok(sections > -1, 'sections.css must be linked from the layout');
  assert.ok(sections > base, 'sections.css must come after base.css so it can override');
});
