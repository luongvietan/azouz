import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import { readCssTokens } from '../scripts/css-tokens.js';
import { contrastRatio } from '../scripts/contrast.js';

const load = () => readFile(resolveInTheme('assets/base.css'), 'utf8');

const loadTokens = async () =>
  readCssTokens(await readFile(resolveInTheme('assets/tokens.css'), 'utf8'));

/*
  WCAG 2.1 defines "large scale text" as at least 18 point (~24px), or 14 point
  (~18.66px) when BOLD. `.button` is 18px at weight 600, which qualifies as
  neither — so it needs the full 4.5:1, not the 3:1 large-text allowance.
  The primary green only reaches 3.37:1 against white, so buttons must use the
  deep green. This test exists because the original implementation got it wrong.
*/
test('the primary button clears AA for normal text at its actual size', async () => {
  const rule = /\.button\s*\{([\s\S]*?)\}/.exec(await load())[1];

  const fontSize = /font-size:\s*([\d.]+)rem/.exec(rule);
  assert.ok(fontSize, '.button must declare a font-size so this test can reason about it');
  const pixels = Number(fontSize[1]) * 16;
  const isBold = /font-weight:\s*var\(--font-weight-bold\)/.test(rule);
  const qualifiesAsLargeText = pixels >= 24 || (pixels >= 18.66 && isBold);

  const required = qualifiesAsLargeText ? 3 : 4.5;

  const tokens = await loadTokens();
  const background = tokens.get(/--button-bg:\s*var\((--[a-z0-9-]+)\)/.exec(rule)[1]);
  const foreground = tokens.get(/--button-fg:\s*var\((--[a-z0-9-]+)\)/.exec(rule)[1]);
  const ratio = contrastRatio(foreground, background);

  assert.ok(
    ratio >= required,
    `.button is ${pixels}px weight ${isBold ? 700 : 600} → needs ${required}:1, got ${ratio.toFixed(2)}:1`,
  );
});

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

test('grid tracks that hold text can shrink below their content', async () => {
  // `1fr` is `minmax(auto, 1fr)`, and that `auto` floor is min-content. At the
  // browser's 200% text setting the product index refused to shrink and pushed
  // the page 417px sideways — a horizontal scrollbar for exactly the readers
  // who enlarged the text. WCAG 1.4.4 and 1.4.10.
  const css = await load();
  const offenders = [];
  for (const match of css.matchAll(/(\.list-lines--\d|\.story-columns__grid)[^{]*\{([^}]*)\}/g)) {
    const columns = /grid-template-columns:([^;]*)/.exec(match[2]);
    if (!columns) continue;
    // A single-column template has nothing to overflow.
    if (!/repeat\(\s*[2-9]/.test(columns[1])) continue;
    if (!/minmax\(\s*0/.test(columns[1])) offenders.push(`${match[1]}: ${columns[1].trim()}`);
  }
  assert.deepEqual(offenders, [], `use minmax(0, 1fr) so the track can shrink: ${offenders.join(', ')}`);
});

test('the label title can break, so a long blend name cannot widen the page', async () => {
  // `overflow-wrap: break-word` is not enough here: it breaks the rendered line
  // but still reports the longest word as the element's min-content width, so
  // the panel keeps forcing its grid track open. Only `anywhere` shrinks the
  // reported minimum.
  const css = await load();
  const rule = /\.label-block__title\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, '.label-block__title is missing');
  assert.match(rule[1], /overflow-wrap:\s*anywhere/);
});

test('the marquee only animates where the control that stops it can exist', async () => {
  // WCAG 2.2.2 is Level A. The pause button needs the runtime, so the animation
  // waits for the runtime too: with scripting off the band is simply still,
  // rather than moving with an inert button beside it.
  const css = await load();
  assert.match(css, /html:not\(\.no-js\)\s+\.marquee__track\s*\{[^}]*animation:/);
  assert.match(css, /\.marquee\[data-paused='true'\][^{]*\{[^}]*animation-play-state:\s*paused/);
  assert.match(css, /\.no-js \.marquee__toggle\s*\{\s*display:\s*none/);
});

test('every custom element used as a box declares a display', async () => {
  // An undefined custom element is display:inline, and an inline box cannot
  // clip. `.marquee` became a <marquee-band> and its `overflow: hidden` quietly
  // stopped working, so a 12,000px track set the width of the whole document.
  const css = await load();
  const rule = /\.marquee\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, '.marquee is missing');
  assert.match(rule[1], /display:\s*block/, '.marquee is a custom element and must not be inline');
  assert.match(rule[1], /overflow:\s*hidden/);
});

test('a skip link is styled', async () => {
  assert.match(await load(), /\.skip-link/);
});

/*
  A scroll reveal must be a pure enhancement. If it sets opacity:0 in plain CSS
  and relies on JavaScript to undo it, then a failed or blocked theme.js leaves
  the page permanently blank. Gating the hidden state behind
  `reveal-on-scroll:defined` means the content only ever hides after the custom
  element has actually upgraded.
*/
test('scroll reveal never hides content unless its custom element has upgraded', async () => {
  const css = await load();
  const offenders = [];

  for (const match of css.matchAll(/([^{}]*\.reveal[^{}]*)\{([^}]*)\}/g)) {
    const [, selector, body] = match;
    if (!/opacity:\s*0\s*[;}]/.test(body)) continue;
    if (!/reveal-on-scroll:defined/.test(selector)) offenders.push(selector.trim());
  }

  assert.deepEqual(
    offenders,
    [],
    `these selectors hide content without requiring the upgraded element: ${offenders.join(' | ')}`,
  );
});
