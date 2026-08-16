import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

test('renders a single h1 with the shop name', async () => {
  const html = await renderSection('main-password');
  assert.equal(countMatches(html, /<h1/g), 1);
  assert.match(html, /Azouz Coffee/);
});

test('renders the storefront password form', async () => {
  const html = await renderSection('main-password');
  assert.match(html, /type="password"/);
  assert.match(html, /<label[^>]+for="Password"/);
  assert.equal(/translation missing/.test(html), false);
});

test('the password layout exists and is a complete document', async () => {
  const layout = await readFile(resolveInTheme('layout/password.liquid'), 'utf8');
  assert.match(layout, /<!doctype html>/i);
  assert.match(layout, /content_for_layout/);
  assert.match(layout, /content_for_header/);
});
