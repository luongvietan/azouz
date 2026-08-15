import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEngine } from '../preview/engine.js';
import { renderTemplate } from '../preview/template-renderer.js';

async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-tpl-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

const HERO = `<h1>{{ section.settings.heading }}</h1>
{% schema %}{"name":"Hero","settings":[{"type":"text","id":"heading","default":"Default heading"}]}{% endschema %}`;

const BAND = `<p>{{ section.settings.body }}</p>
{% schema %}{"name":"Band","settings":[{"type":"text","id":"body","default":"Default body"}]}{% endschema %}`;

const STEPS = `<ul>{% for block in section.blocks %}<li>{{ block.settings.title }}</li>{% endfor %}</ul>
{% schema %}{"name":"Steps","blocks":[{"type":"step","name":"Step","settings":[{"type":"text","id":"title","default":"Untitled"}]}]}{% endschema %}`;

test('sections render in the order the template declares', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'sections/band.liquid': BAND,
    'templates/index.json': JSON.stringify({
      sections: { a: { type: 'band' }, b: { type: 'hero' } },
      order: ['b', 'a'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.ok(html.indexOf('<h1>') < html.indexOf('<p>'), 'hero must come before band');
});

test('template settings override the schema defaults', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({
      sections: { hero: { type: 'hero', settings: { heading: 'Our Roastery.' } } },
      order: ['hero'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<h1>Our Roastery\.<\/h1>/);
});

test('schema defaults apply when the template omits a setting', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({ sections: { hero: { type: 'hero' } }, order: ['hero'] }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<h1>Default heading<\/h1>/);
});

test('blocks render in block_order, merging block-type defaults', async () => {
  const dir = await makeTheme({
    'sections/steps.liquid': STEPS,
    'templates/index.json': JSON.stringify({
      sections: {
        steps: {
          type: 'steps',
          blocks: {
            one: { type: 'step', settings: { title: 'Source' } },
            two: { type: 'step', settings: { title: 'Roast' } },
            three: { type: 'step' },
          },
          block_order: ['two', 'three', 'one'],
        },
      },
      order: ['steps'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.deepEqual([...html.matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]), [
    'Roast',
    'Untitled',
    'Source',
  ]);
});

test('a section id listed in order but missing from sections is skipped, not fatal', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({
      sections: { hero: { type: 'hero' } },
      order: ['hero', 'ghost'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<h1>/);
});

test('a missing section file produces a visible comment rather than throwing', async () => {
  const dir = await makeTheme({
    'templates/index.json': JSON.stringify({
      sections: { nope: { type: 'does-not-exist' } },
      order: ['nope'],
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /does-not-exist/);
});

test('when order is absent, sections render in object key order', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'sections/band.liquid': BAND,
    'templates/index.json': JSON.stringify({
      sections: { hero: { type: 'hero' }, band: { type: 'band' } },
    }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.ok(html.indexOf('<h1>') < html.indexOf('<p>'));
});

test('each rendered section is wrapped in a shopify-section element', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': HERO,
    'templates/index.json': JSON.stringify({ sections: { hero: { type: 'hero' } }, order: ['hero'] }),
  });
  const html = await renderTemplate(await createEngine(dir), dir, 'templates/index.json');
  assert.match(html, /<div id="shopify-section-hero" class="shopify-section">/);
});
