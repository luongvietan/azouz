import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEngine, renderThemeFile } from '../preview/engine.js';

async function makeTheme(files) {
  const dir = await mkdtemp(join(tmpdir(), 'azouz-engine-test-'));
  for (const [path, contents] of Object.entries(files)) {
    const segments = path.split('/');
    const name = segments.pop();
    if (segments.length) await mkdir(join(dir, ...segments), { recursive: true });
    await writeFile(join(dir, ...segments, name), contents, 'utf8');
  }
  return dir;
}

test('render resolves {% render %} against the snippets directory', async () => {
  const dir = await makeTheme({
    'snippets/badge.liquid': '<span>{{ label }}</span>',
    'sections/demo.liquid': `{% render 'badge', label: 'Espresso' %}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/demo.liquid');
  assert.equal(out.trim(), '<span>Espresso</span>');
});

test('render exposes section settings from the schema defaults', async () => {
  const dir = await makeTheme({
    'sections/hero.liquid': `<h1>{{ section.settings.heading }}</h1>
{% schema %}{"name":"Hero","settings":[{"type":"text","id":"heading","default":"Our Roastery."}]}{% endschema %}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/hero.liquid');
  assert.match(out, /<h1>Our Roastery\.<\/h1>/);
});

test('render exposes the fixture globals', async () => {
  const dir = await makeTheme({ 'sections/shopname.liquid': '{{ shop.name }}' });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/shopname.liquid');
  assert.equal(out.trim(), 'Azouz Coffee');
});

test('render resolves translations from the theme locale file', async () => {
  const dir = await makeTheme({
    'locales/en.default.json': '{"general":{"skip":"Skip to content"}}',
    'sections/skip.liquid': `{{ 'general.skip' | t }}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'sections/skip.liquid');
  assert.equal(out.trim(), 'Skip to content');
});

test('{% section %} renders the referenced section file', async () => {
  const dir = await makeTheme({
    'sections/header.liquid': '<header>AZOUZ</header>',
    'layout/theme.liquid': `{% section 'header' %}`,
  });
  const engine = await createEngine(dir);
  const out = await renderThemeFile(engine, dir, 'layout/theme.liquid');
  assert.match(out, /<header>AZOUZ<\/header>/);
});
