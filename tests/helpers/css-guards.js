import assert from 'node:assert/strict';

/**
 * Properties that hard-code a physical direction. Every one of these has a
 * logical equivalent that flips automatically under `dir="rtl"`, which the
 * theme must support for Arabic.
 */
const PHYSICAL_PROPERTIES = [
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

/** Strip comments so a rule written inside a note is not read as real CSS. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

export function assertLogicalPropertiesOnly(css, label) {
  const offenders = [];
  for (const pattern of PHYSICAL_PROPERTIES) {
    for (const match of stripComments(css).matchAll(pattern)) offenders.push(match[0]);
  }
  assert.deepEqual(
    offenders,
    [],
    `${label}: use logical properties instead — ${offenders.join(', ')}`,
  );
}

export function assertNoColourLiterals(css, label) {
  const literals = stripComments(css).match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
  assert.deepEqual(literals, [], `${label}: move these into tokens.css — ${literals.join(', ')}`);
}

/**
 * White on --color-accent measures 3.37:1. That passes only for large text.
 * A rule may fill with the primary green, but if it also sets the on-accent
 * text colour it must declare a display-size font.
 */
export function assertNoSmallTextOnAccent(css, label) {
  const offenders = [];
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const [, selector, body] = match;
    if (!/background(-color)?:\s*var\(--color-accent\)/.test(body)) continue;
    if (
      /color:\s*var\(--color-on-accent\)/.test(body) &&
      !/font-size:\s*var\(--text-(2xl|3xl|display)\)/.test(body)
    ) {
      offenders.push(selector.trim());
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `${label}: white on --color-accent is 3.37:1 and legal only above 24px — use --color-accent-deep: ${offenders.join(' | ')}`,
  );
}
