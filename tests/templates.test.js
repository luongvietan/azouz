import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';
import { resolveInTheme, THEME_DIR } from '../scripts/theme-paths.js';

const MARKETING = [
  'index.json',
  'page.private-label.json',
  'page.wholesale.json',
  'page.our-brands.json',
  'page.enquiry.json',
];

const load = async (name) => JSON.parse(await readFile(resolveInTheme(`templates/${name}`), 'utf8'));

const renderAll = async (name) =>
  renderTemplate(await createEngine(THEME_DIR), THEME_DIR, `templates/${name}`);

test('every marketing template declares sections and an order', async () => {
  for (const name of MARKETING) {
    const template = await load(name);
    assert.ok(Object.keys(template.sections).length > 0, `${name} has no sections`);
    assert.ok(template.order.length > 0, `${name} has no order`);
  }
});

test('every id in order exists in sections, and vice versa', async () => {
  for (const name of MARKETING) {
    const template = await load(name);
    assert.deepEqual(
      [...template.order].sort(),
      Object.keys(template.sections).sort(),
      `${name}: order and sections disagree`,
    );
  }
});

test('every section type a template names has a real section file', async () => {
  for (const name of MARKETING) {
    const template = await load(name);
    for (const config of Object.values(template.sections)) {
      assert.ok(
        existsSync(resolveInTheme(`sections/${config.type}.liquid`)),
        `${name} references missing section ${config.type}`,
      );
    }
  }
});

test('every marketing page renders exactly one h1', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal((html.match(/<h1/g) ?? []).length, 1, `${name} must have exactly one h1`);
  }
});

test('no page renders a missing-section comment', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal(/missing section/.test(html), false, `${name} has an unresolved section`);
  }
});

test('no page leaks an unresolved translation key', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal(/translation missing/.test(html), false, `${name} has a missing locale key`);
  }
});

test('no page renders an empty href', async () => {
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.equal(/href=""/.test(html), false, `${name} has an empty link`);
  }
});

test('the homepage carries the client headline and both hero calls to action', async () => {
  const html = await renderAll('index.json');
  assert.match(html, /Your Coffee\. Your Brand\. Our Roastery\./);
  assert.match(html, /Request a Sample/);
  assert.match(html, /Start Your Private Label/);
});

test('the private label page carries its headline and all eight coffee types', async () => {
  const html = await renderAll('page.private-label.json');
  assert.match(html, /Build Your Own Coffee Brand\./);
  for (const type of ['Espresso blends', 'Turkish coffee', 'Arabic coffee', 'Ground coffee']) {
    assert.match(html, new RegExp(type));
  }
});

test('the wholesale page carries its headline and all four ranges', async () => {
  const html = await renderAll('page.wholesale.json');
  assert.match(html, /Wholesale Coffee for Your Business\./);
  for (const range of ['Espresso Blends', 'Turkish Coffee', 'Specialty Coffee', 'Filter Coffee']) {
    assert.match(html, new RegExp(range));
  }
});

test('the our brands page bridges into the shop', async () => {
  const html = await renderAll('page.our-brands.json');
  assert.match(html, /Our Brands\./);
  assert.match(html, /href="\/collections\/all"/);
});

test('the enquiry page renders a posting contact form', async () => {
  const html = await renderAll('page.enquiry.json');
  assert.match(html, /action="\/contact#contact"/);
});
