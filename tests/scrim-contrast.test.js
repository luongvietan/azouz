import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

/*
  The hero and the sample band set white copy over a merchant's photograph.
  tests/contrast.test.js cannot see this: it checks pairs from the token
  palette, and a photograph is not in the palette. So the sections shipped
  claiming a fixed scrim made the copy legible "whatever image a merchant
  uploads", and measured 3.35:1 to 4.48:1 across nine elements — every line of
  the sample band failed.

  This file makes the claim checkable. It reads the scrim strengths straight
  out of sections.css and composites them over the worst backdrop a photograph
  can present: a pure white pixel. If a scrim is weakened, the arithmetic here
  fails before anyone has to notice it on a page.
*/

const load = () => readFile(resolveInTheme('assets/sections.css'), 'utf8');

/** WCAG relative luminance of one sRGB channel value in 0..1. */
const channel = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** WCAG relative luminance of an #rrggbb colour. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const ONYX = luminance('#171717');
const WHITE = 1; // a blown-out highlight: the worst a photograph can do to white text

/** Luminance left after laying `alpha` of Onyx over the brightest possible pixel. */
const behindText = (alpha) => WHITE * (1 - alpha) + ONYX * alpha;

/** The `NN%` a color-mix of Onyx is declared at, for the first rule matching `selector`. */
function scrimAlpha(css, selector, { property = 'background-color' } = {}) {
  const rule = new RegExp(`${selector}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(rule, `${selector} is missing from sections.css`);

  const declaration = new RegExp(`${property}:[^;]*`).exec(rule[1]);
  assert.ok(declaration, `${selector} declares no ${property}`);

  const mix = /var\(--azouz-onyx\)\s+([\d.]+)%/.exec(declaration[0]);
  assert.ok(mix, `${selector} does not mix Onyx into its ${property}`);
  return Number(mix[1]) / 100;
}

test('the sample band scrim carries white body copy over a blown-out photograph', async () => {
  const css = await load();
  const alpha = scrimAlpha(css, '\\.feature-band__scrim');
  const contrast = ratio(WHITE, behindText(alpha));

  assert.ok(
    contrast >= 4.5,
    `the band scrim is ${(alpha * 100).toFixed(0)}%, which leaves white text at ` +
      `${contrast.toFixed(2)}:1 over a white pixel. It shipped at 66% and measured 3.35:1.`,
  );
});

test('the hero backing carries white body copy on its own, without help from the wash', async () => {
  // The wash above it grades with height and cannot be relied on at the top of
  // the copy — that is exactly how the eyebrow ended up at 1.80:1. The backing
  // is the layer that has to hold on its own, so it is tested on its own.
  const css = await load();
  const floor = /--scrim-floor:\s*([\d.]+)%/.exec(css);
  assert.ok(floor, '--scrim-floor is missing; the hero backing has no declared strength');

  const contrast = ratio(WHITE, behindText(Number(floor[1]) / 100));
  assert.ok(
    contrast >= 4.5,
    `--scrim-floor is ${floor[1]}%, leaving white text at ${contrast.toFixed(2)}:1 over a white pixel`,
  );
});

test('the hero backing is as tall as the copy, not as tall as the band', async () => {
  // A gradient sized to the hero cannot know where in the hero the copy sits.
  // The first version graded 82% at the foot of an 800px band down to 10% at
  // the top, and the copy block turned out to be 547px tall: its eyebrow landed
  // at 0.43 alpha. Anchoring the backing to the copy's own box is the fix, and
  // it is the part a later edit is most likely to undo.
  const css = await load();
  const rule = /\.hero-overlay--media \.hero-overlay__content::before\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the hero copy has no backing layer');
  assert.match(rule[1], /--scrim-floor/, 'the backing must use the tested floor');
  assert.match(rule[1], /inset-block:/, 'the backing must be anchored to the copy box');
});

test('the scrim gradient fade sits above the copy, not across it', async () => {
  // The fade and the overshoot have to be the same length, or the soft edge
  // reaches down into the first line of type. Expressed in rem so this is
  // checkable rather than a matter of eyeballing the hero.
  const css = await load();
  const rule = /\.hero-overlay--media \.hero-overlay__content::before\s*\{([^}]*)\}/.exec(css);
  const overshoot = /inset-block:\s*-([\d.]+)rem/.exec(rule[1]);
  const fade = /calc\(100% - ([\d.]+)rem\)/.exec(rule[1]);

  assert.ok(overshoot, 'the backing must overshoot the copy box by a fixed length');
  assert.ok(fade, 'the plateau must end a fixed length below the top');
  assert.equal(
    overshoot[1],
    fade[1],
    'the fade length and the overshoot must match, or the fade falls across the copy',
  );
});
