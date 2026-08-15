import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractSchema, defaultSettings, defaultBlocks } from '../scripts/schema-parser.js';

const SECTION = `
<div class="hero">{{ section.settings.heading }}</div>
{% schema %}
{
  "name": "Hero",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Your Coffee." },
    { "type": "checkbox", "id": "show_image", "label": "Show image", "default": true },
    { "type": "url", "id": "link", "label": "Link" }
  ],
  "blocks": [
    { "type": "step", "name": "Step", "settings": [
      { "type": "text", "id": "title", "label": "Title", "default": "Source" }
    ]}
  ],
  "presets": [
    { "name": "Hero", "blocks": [
      { "type": "step", "settings": { "title": "Roast" } },
      { "type": "step" }
    ]}
  ]
}
{% endschema %}
`;

test('extractSchema returns the parsed JSON body', () => {
  const schema = extractSchema(SECTION);
  assert.equal(schema.name, 'Hero');
  assert.equal(schema.settings.length, 3);
});

test('extractSchema tolerates whitespace-control markers', () => {
  const schema = extractSchema('{%- schema -%}{"name":"X"}{%- endschema -%}');
  assert.equal(schema.name, 'X');
});

test('extractSchema returns null when there is no schema block', () => {
  assert.equal(extractSchema('<div>no schema here</div>'), null);
});

test('extractSchema throws a path-bearing error on malformed JSON', () => {
  assert.throws(
    () => extractSchema('{% schema %}{ "name": }{% endschema %}', 'sections/hero.liquid'),
    /sections\/hero\.liquid/,
  );
});

test('defaultSettings collects declared defaults', () => {
  const settings = defaultSettings(extractSchema(SECTION));
  assert.equal(settings.heading, 'Your Coffee.');
  assert.equal(settings.show_image, true);
});

test('defaultSettings omits settings that declare no default', () => {
  const settings = defaultSettings(extractSchema(SECTION));
  assert.equal('link' in settings, false);
});

test('defaultSettings returns an empty object for a null schema', () => {
  assert.deepEqual(defaultSettings(null), {});
});

test('defaultBlocks expands the first preset, merging block-type defaults', () => {
  const blocks = defaultBlocks(extractSchema(SECTION));
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, 'step');
  assert.equal(blocks[0].settings.title, 'Roast');
  assert.equal(blocks[1].settings.title, 'Source');
});

test('defaultBlocks gives every block a distinct id', () => {
  const blocks = defaultBlocks(extractSchema(SECTION));
  assert.notEqual(blocks[0].id, blocks[1].id);
});

test('defaultBlocks returns an empty array when there are no presets', () => {
  assert.deepEqual(defaultBlocks(extractSchema('{% schema %}{"name":"X"}{% endschema %}')), []);
});
