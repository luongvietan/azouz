import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';
import { contrastRatio } from '../scripts/contrast.js';
import { readCssTokens } from '../scripts/css-tokens.js';

/*
  The .label-block component reproduces the coloured panel printed on the coffee
  bags. Its subtitle is --text-sm (14px, weight 400), which WCAG treats as normal
  text: it needs 4.5:1, not the 3:1 large-text allowance.

  tests/contrast.test.js only checks the *tokens*. The label fill is chosen at
  runtime by the merchant via a `label_color` setting, so it escaped that guard
  entirely — and three of the shipped colours failed on the live store:
    #67985E on white  3.37:1
    #7C7F44 on white  4.22:1
    #C4562E on white  4.45:1
  This test closes that hole for both the template values and the schema defaults.
*/

const WHITE = '#FFFFFF';
// The dark ink label-ink falls back to is --color-text, which is Onyx.
const ONYX = '#171717';
const REQUIRED = 4.5;

const strip = (source) => source.replace(/^﻿/, '').replace(/\/\*[\s\S]*?\*\//g, '');

/** Every {label_color, label_text} pair a template ships, with where it came from. */
async function labelPairsFromTemplates() {
  const names = (await readdir(resolveInTheme('templates'))).filter((n) => n.endsWith('.json'));
  const pairs = [];

  for (const name of names) {
    const template = JSON.parse(strip(await readFile(resolveInTheme(`templates/${name}`), 'utf8')));
    for (const [sectionId, section] of Object.entries(template.sections ?? {})) {
      for (const [blockId, block] of Object.entries(section.blocks ?? {})) {
        const colour = block.settings?.label_color;
        if (!colour) continue;
        pairs.push({
          where: `templates/${name} → ${sectionId}.${blockId}`,
          colour,
          text: block.settings.label_text === 'dark' ? ONYX : WHITE,
        });
      }
    }
  }
  return pairs;
}

test('every label colour a template ships passes AA against its label text', async () => {
  const pairs = await labelPairsFromTemplates();
  assert.ok(pairs.length > 0, 'expected at least one label_color in the templates');

  const failures = pairs
    .map((pair) => ({ ...pair, ratio: contrastRatio(pair.text, pair.colour) }))
    .filter((pair) => pair.ratio < REQUIRED)
    .map((pair) => `${pair.where}: ${pair.text} on ${pair.colour} = ${pair.ratio.toFixed(2)}:1`);

  assert.deepEqual(failures, [], `label subtitles are 14px regular and need ${REQUIRED}:1`);
});

test('the label_color schema defaults also pass AA', async () => {
  const sections = ['service-cards', 'coffee-range'];
  const failures = [];

  for (const name of sections) {
    const source = await readFile(resolveInTheme(`sections/${name}.liquid`), 'utf8');
    const schema = JSON.parse(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(source)[1]);
    const settings = (schema.blocks ?? []).flatMap((block) => block.settings ?? []);
    const colour = settings.find((setting) => setting.id === 'label_color')?.default;
    assert.ok(colour, `${name} must declare a label_color default`);

    const ratio = contrastRatio(WHITE, colour);
    if (ratio < REQUIRED) failures.push(`sections/${name}.liquid: white on ${colour} = ${ratio.toFixed(2)}:1`);
  }

  assert.deepEqual(failures, [], `a merchant accepting the default must not get a failing label`);
});

test('the primary green is documented as unusable for label fills carrying small text', async () => {
  assert.ok(
    contrastRatio(WHITE, '#67985E') < REQUIRED,
    'if the primary green ever reaches 4.5:1 this guard can be relaxed — update the spec too',
  );
});

test('label colours inside section presets also pass AA', async () => {
  const names = (await readdir(resolveInTheme('sections'))).filter((n) => n.endsWith('.liquid'));
  const failures = [];

  for (const name of names) {
    const source = await readFile(resolveInTheme(`sections/${name}`), 'utf8');
    const match = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(source);
    if (!match) continue;
    const schema = JSON.parse(match[1]);

    for (const preset of schema.presets ?? []) {
      for (const block of preset.blocks ?? []) {
        const colour = block.settings?.label_color;
        if (!colour) continue;
        const text = block.settings.label_text === 'dark' ? ONYX : WHITE;
        const ratio = contrastRatio(text, colour);
        if (ratio < REQUIRED) {
          failures.push(`sections/${name} preset "${preset.name}": ${text} on ${colour} = ${ratio.toFixed(2)}:1`);
        }
      }
    }
  }

  assert.deepEqual(failures, [], 'a merchant adding the section fresh must not get a failing label');
});

test('the label-block CSS fallback fill passes AA for its 14px subtitle', async () => {
  // A product with no label_color metafield falls through to this default.
  // It was --color-accent (3.37:1 on white), which is how "Rich | Full Bodied"
  // on the filter coffee card failed on the live store.
  const css = await readFile(resolveInTheme('assets/base.css'), 'utf8');
  const rule = /\.label-block\s*\{([\s\S]*?)\}/.exec(css)[1];

  const tokens = readCssTokens(await readFile(resolveInTheme('assets/tokens.css'), 'utf8'));
  const fill = tokens.get(/--label-bg:\s*var\((--[a-z0-9-]+)\)/.exec(rule)[1]);
  const ink = tokens.get(/--label-fg:\s*var\((--[a-z0-9-]+)\)/.exec(rule)[1]);

  const ratio = contrastRatio(ink, fill);
  assert.ok(ratio >= REQUIRED, `.label-block default is ${ratio.toFixed(2)}:1, needs ${REQUIRED}:1`);
});
