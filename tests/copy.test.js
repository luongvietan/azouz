import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolveInTheme } from '../scripts/theme-paths.js';

/*
  Guards on the strings a customer actually reads: the shipped templates and the
  default locale. Section schema defaults count too — a merchant who adds a
  section gets that text verbatim.

  Not a style opinion. Em dashes are the single most reliable giveaway that copy
  was generated rather than written, and six of them shipped in this theme's
  templates before anyone looked.
*/

const TEMPLATES = 'templates';
const SECTIONS = 'sections';

async function shippedCopy() {
  const files = [];

  for (const dir of [TEMPLATES, SECTIONS]) {
    for (const name of await readdir(resolveInTheme(dir))) {
      if (!/\.(json|liquid)$/.test(name)) continue;
      files.push([`${dir}/${name}`, await readFile(resolveInTheme(`${dir}/${name}`), 'utf8')]);
    }
  }

  files.push(['locales/en.default.json', await readFile(resolveInTheme('locales/en.default.json'), 'utf8')]);
  return files;
}

/** Liquid comments and CSS/JS are not customer copy; strip them before checking. */
const withoutComments = (source) =>
  source
    .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/^\s*#.*$/gm, ' ');

test('no em dash reaches a customer', async () => {
  const offenders = [];
  for (const [name, source] of await shippedCopy()) {
    for (const line of withoutComments(source).split('\n')) {
      if (line.includes('—')) offenders.push(`${name}: ${line.trim().slice(0, 80)}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `use a colon, a semicolon, a comma or a full stop instead:\n  ${offenders.join('\n  ')}`,
  );
});

test('no double hyphen stands in for an em dash', async () => {
  const offenders = [];
  for (const [name, source] of await shippedCopy()) {
    // Skip liquid/HTML comment openers and CLI-style flags.
    for (const line of withoutComments(source).split('\n')) {
      if (/[a-z]\s--\s[a-z]/i.test(line)) offenders.push(`${name}: ${line.trim().slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, [], `the dash is still a dash:\n  ${offenders.join('\n  ')}`);
});

test('the default locale has no unresolved placeholder text', async () => {
  const locale = await readFile(resolveInTheme('locales/en.default.json'), 'utf8');
  // "placeholder" is deliberately not on this list: it is a legitimate key name
  // for input placeholder text, and flagging it would be noise.
  for (const marker of ['Lorem ipsum', 'TODO', 'TBD', 'FIXME']) {
    assert.equal(locale.includes(marker), false, `"${marker}" is still in the default locale`);
  }
});
