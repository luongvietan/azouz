import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import {
  assertLogicalPropertiesOnly,
  assertNoColourLiterals,
  assertNoSmallTextOnAccent,
} from './helpers/css-guards.js';

const load = () => readFile(resolveInTheme('assets/sections.css'), 'utf8');

test('sections.css exists', async () => {
  assert.ok((await load()).length > 0);
});

test('sections.css uses no physical directional properties — RTL readiness', async () => {
  assertLogicalPropertiesOnly(await load(), 'sections.css');
});

test('sections.css contains no colour literals — tokens only', async () => {
  assertNoColourLiterals(await load(), 'sections.css');
});

test('sections.css never puts small text on the primary green', async () => {
  assertNoSmallTextOnAccent(await load(), 'sections.css');
});

test('the header menu wraps rather than pushing the page sideways', async () => {
  const css = await load();
  const rule = /\.header__menu\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the header menu rule is missing');
  assert.match(rule[1], /flex-wrap:\s*wrap/);
});

test('the header action labels stay hidden until there is room for them', async () => {
  // They used to appear at 48em. With a five-item menu that overflowed 768px;
  // the labels are worth about 120px and the menu needs it across that band.
  const css = await load();
  const reveal = /@media \(min-width: (\d+)em\) \{\s*\.header__action-label \{\s*position: static/.exec(css);
  assert.ok(reveal, 'the label reveal breakpoint is missing');
  assert.equal(reveal[1], '64');
});

test('every navigation and list link meets the 44px target floor', async () => {
  // PRODUCT.md sets 44px. Measured at 375px before this was enforced: drawer
  // links 33px, nested sub-links 28px, footer links 29px, flavour rows 35px —
  // and the desktop dropdown at 23px, a pixel under even WCAG 2.5.8's 24px.
  const css = await load();
  const required = [
    'header__mobile-link',
    'header__mobile-sublink',
    'header__panel-link',
    'footer__link',
    'flavour-finder__name',
  ];

  /** The body of the first rule whose selector list ends with `.name`. */
  const bodyOf = (name) => {
    const at = css.indexOf(`.${name} {`);
    if (at === -1) return null;
    const open = css.indexOf('{', at);
    const close = css.indexOf('}', open);
    return close === -1 ? null : css.slice(open + 1, close);
  };

  const offenders = [];
  for (const name of required) {
    const selector = `.${name}`;
    const body = bodyOf(name);
    if (body === null) {
      offenders.push(`${selector} (rule missing)`);
      continue;
    }
    const size = /min-block-size:\s*([\d.]+)rem/.exec(body);
    if (!size) {
      offenders.push(`${selector} (no min-block-size)`);
      continue;
    }
    if (Number(size[1]) * 16 < 44) offenders.push(`${selector} (${Number(size[1]) * 16}px)`);
  }

  assert.deepEqual(offenders, [], `targets below the 44px floor: ${offenders.join(', ')}`);
});

test('the focus ring inverts inside the dark footer', async () => {
  // Sage Deep on Onyx is 3.08:1 — over 1.4.11's floor by 0.08, which is exactly
  // the kind of margin tokens.css refuses elsewhere. The footer redefines the
  // token rather than restating the outline, so anything focusable inside it
  // picks the light ring up automatically.
  const css = await load();
  const at = css.indexOf('.footer {');
  assert.ok(at !== -1, '.footer rule is missing');
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at));
  assert.match(body, /--color-focus:\s*var\(--color-bg\)/);
});

test('the footer lockup stays above the brand minimum of 57px', async () => {
  // The guidelines put the floor for the full lockup at 57px tall; under it the
  // Arabic and Latin halves stop resolving. The header enforces this through a
  // setting with a validated minimum, so the footer — where the size is fixed
  // in CSS — is the one that can drift without anyone noticing.
  const css = await load();
  const rule = /\.footer__logo\s*\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the footer logo rule is missing');

  const size = /block-size:\s*([\d.]+)rem/.exec(rule[1]);
  assert.ok(size, '.footer__logo must set block-size in rem so this is checkable');
  assert.ok(Number(size[1]) * 16 >= 57, `the footer lockup renders at ${Number(size[1]) * 16}px`);
});

test('rules drawn as <hr> inside a grid reset the browser auto inline margin', async () => {
  // A UA stylesheet gives <hr> `margin-inline: auto`. An auto inline margin on
  // a grid item makes it size to its content, so the rule renders 0px wide and
  // reads as a missing border. Every hr rule in the theme has to reset it.
  const css = await load();
  const base = await readFile(resolveInTheme('assets/base.css'), 'utf8');

  for (const [name, source, pattern] of [
    ['.footer__rule', css, /\.footer__rule\s*\{([^}]*)\}/],
    ['.rule--ink', base, /\.rule--ink\s*\{([^}]*)\}/],
  ]) {
    const rule = pattern.exec(source);
    assert.ok(rule, `${name} is missing`);
    assert.match(rule[1], /margin-inline:\s*0/, `${name} must reset the UA auto inline margin`);
  }
});

test('the layout links sections.css after base.css', async () => {
  const layout = await readFile(resolveInTheme('layout/theme.liquid'), 'utf8');
  const base = layout.indexOf('base.css');
  const sections = layout.indexOf('sections.css');
  assert.ok(sections > -1, 'sections.css must be linked from the layout');
  assert.ok(sections > base, 'sections.css must come after base.css so it can override');
});
