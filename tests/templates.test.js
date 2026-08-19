import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';
import { resolveInTheme, THEME_DIR } from '../scripts/theme-paths.js';
import { parseThemeJson } from '../scripts/theme-json.js';

const MARKETING = [
  'index.json',
  'page.private-label.json',
  'page.wholesale.json',
  'page.our-brands.json',
  'page.enquiry.json',
  'page.get-a-quote.json',
];

const load = async (name) =>
  parseThemeJson(await readFile(resolveInTheme(`templates/${name}`), 'utf8'), `templates/${name}`);

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
  assert.match(html, /How private label works/);
  assert.match(html, /class="button--quiet"[^>]*href="\/pages\/private-label"/);
});

test('the homepage hero uses a packaging photo and a short packaging-line eyebrow', async () => {
  const html = await renderAll('index.json');
  assert.match(html, /<img[^>]+class="hero__image"[^>]+src="[^"]+"/);
  assert.match(html, /alt="Hand holding an azouz coffee branded takeaway cup"/);
  assert.match(html, /Specialty coffee roasters/);
  assert.equal(/What We Do/i.test(html), false);
  assert.equal(/How it works/i.test(html), false);
});

test('the homepage audience strip lists every business type the client named', async () => {
  const html = await renderAll('index.json');
  assert.match(html, /Cafés/);
  assert.match(html, /Hotels/);
  assert.match(html, /Retailers/);
  assert.match(html, /Coffee Brands/);
});

test('the private label page carries its headline and coffee types', async () => {
  const html = await renderAll('page.private-label.json');
  assert.match(html, /Build Your Own Coffee Brand\./);
  assert.match(html, /preview-media\/wadi-rum-blend-alt\.jpg/);
  for (const type of ['Espresso blends', 'Turkish coffee', 'Filter coffee']) {
    assert.match(html, new RegExp(type));
  }
});

test('the homepage features private label in the service cards grid', async () => {
  const html = await renderAll('index.json');
  assert.match(html, /Private label is where we start\./);
  assert.match(html, /service-card--featured/);
  assert.match(html, /Start Your Private Label/);
});

test('the wholesale page carries its headline and all four ranges', async () => {
  const html = await renderAll('page.wholesale.json');
  assert.match(html, /Wholesale Coffee for Your Business\./);
  assert.match(html, /preview-media\/dead-sea-blend\.jpg/);
  for (const range of ['Espresso Blends', 'Turkish Coffee', 'Specialty Coffee', 'Filter Coffee']) {
    assert.match(html, new RegExp(range));
  }
});

test('the private label closing band leads with a quote, not a repeated sample CTA', async () => {
  const html = await renderAll('page.private-label.json');
  assert.match(html, /Get a Private Label Quote/);
  assert.match(html, /Try a sample first/);
});

test('the wholesale closing band leads with pricing, not a repeated sample CTA', async () => {
  const html = await renderAll('page.wholesale.json');
  assert.match(html, /Get Wholesale Pricing/);
  assert.match(html, /Try a sample first/);
});

test('the our brands page bridges into the shop with packaging photography', async () => {
  const html = await renderAll('page.our-brands.json');
  assert.match(html, /Our Brands\./);
  assert.match(html, /preview-media\/downtown-blend\.jpg/);
  assert.match(html, /preview-media\/wadi-rum-blend\.jpg/);
  assert.match(html, /href="\/collections\/all"/);
  assert.match(html, /href="\/pages\/wholesale"[^>]*>[\s\S]*View Wholesale/);
});

test('the sample enquiry page uses a sample-specific headline and hero bag', async () => {
  const html = await renderAll('page.enquiry.json');
  assert.match(html, /Request a Sample\./);
  assert.match(html, /preview-media\/wadi-rum-blend\.jpg/);
  assert.match(html, /action="\/contact#contact"/);
});

test('the quote enquiry page requires expected volume', async () => {
  const html = await renderAll('page.get-a-quote.json');
  assert.match(html, /Get a Quote for Your Project\./);
  assert.match(html, /name="contact\[Expected monthly volume\]"[^>]*required/);
});

/**
 * Walk every settings object in a template, including block settings.
 * @param {object} template
 */
function* everySetting(template) {
  for (const [sectionId, section] of Object.entries(template.sections ?? {})) {
    yield [sectionId, section.settings ?? {}];
    for (const [blockId, block] of Object.entries(section.blocks ?? {})) {
      yield [`${sectionId}.${blockId}`, block.settings ?? {}];
    }
  }
}

test('no shipped template hard-codes a file path in an image setting', async () => {
  // Shopify validates image_picker settings against the store's media library.
  // A path fails with "Setting 'image' does not point to an applicable
  // resource" and Shopify discards the ENTIRE template — which is how six
  // templates, the homepage among them, never reached the live theme and every
  // route that needed one returned 404.
  //
  // Demo imagery for the preview lives in preview/demo-media.js instead.
  const names = (await readdir(resolveInTheme('templates'))).filter((n) => n.endsWith('.json'));
  assert.ok(names.length > 0);

  const offenders = [];
  for (const name of names) {
    const template = parseThemeJson(await readFile(resolveInTheme(`templates/${name}`), 'utf8'), name);
    for (const [where, settings] of everySetting(template)) {
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value !== 'string') continue;
        const looksLikeImage = /image|logo|photo|picture/i.test(key) && !/_alt$|_url$/i.test(key);
        if (looksLikeImage && (value.startsWith('/') || value.startsWith('http'))) {
          offenders.push(`${name} → ${where}.${key} = ${value}`);
        }
      }
    }
  }

  assert.deepEqual(offenders, [], `image settings must not be paths:\n  ${offenders.join('\n  ')}`);
});

test('the marketing templates still render their hero imagery in the preview', async () => {
  // Removing the paths from the templates must not blank the preview — the
  // demo imagery moved to preview/demo-media.js and is injected at render.
  for (const name of MARKETING) {
    const html = await renderAll(name);
    assert.match(html, /class="hero__image"/, `${name} lost its hero image`);
    assert.match(html, /<img[^>]+src="[^"]+"/, `${name} hero image has no source`);
  }
});
