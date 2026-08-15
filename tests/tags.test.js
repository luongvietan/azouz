import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Liquid } from 'liquidjs';
import { registerShopifyTags } from '../preview/shims/tags.js';

function makeEngine() {
  const engine = new Liquid({ extname: '.liquid' });
  registerShopifyTags(engine, { sectionsDir: null });
  return engine;
}

const render = (template, scope = {}) => makeEngine().parseAndRenderSync(template, scope);

test('schema blocks render nothing', () => {
  assert.equal(render(`A{% schema %}{"name":"X"}{% endschema %}B`).trim(), 'AB');
});

test('schema blocks containing liquid-like text still render nothing', () => {
  const out = render(`A{% schema %}{"default":"{{ oops }}"}{% endschema %}B`);
  assert.equal(out.trim(), 'AB');
});

test('whitespace-controlled schema blocks render nothing', () => {
  assert.equal(render(`A{%- schema -%}{}{%- endschema -%}B`).trim(), 'AB');
});

test('style tags wrap their body in a style element and evaluate liquid inside', () => {
  const out = render(`{% style %}.a{color:{{ colour }}}{% endstyle %}`, { colour: '#67985E' });
  assert.equal(out, '<style>.a{color:#67985E}</style>');
});

test('stylesheet tags render nothing inline', () => {
  assert.equal(render(`{% stylesheet %}.a{color:red}{% endstylesheet %}`).trim(), '');
});

test('javascript tags render nothing inline', () => {
  assert.equal(render(`{% javascript %}console.log(1){% endjavascript %}`).trim(), '');
});

test('form tags emit a post form with the Shopify form type as a class', () => {
  const out = render(`{% form 'contact' %}<input name="x">{% endform %}`);
  assert.match(out, /<form[^>]+method="post"/);
  assert.match(out, /action="\/contact#contact"/);
  assert.match(out, /class="[^"]*contact-form/);
  assert.match(out, /<input name="x">/);
  assert.match(out, /<\/form>/);
});

test('form tags expose a form object with no errors by default', () => {
  const out = render(`{% form 'contact' %}{% if form.errors %}BAD{% else %}OK{% endif %}{% endform %}`);
  assert.match(out, /OK/);
});

test('paginate exposes the collection slice and page metadata', () => {
  const items = Array.from({ length: 25 }, (unused, index) => index + 1);
  const out = render(
    `{% paginate items by 10 %}{{ paginate.pages }}|{{ paginate.current_page }}|{{ items | size }}{% endpaginate %}`,
    { items },
  );
  assert.equal(out, '3|1|25');
});

test('paginate renders its body once', () => {
  const out = render(`{% paginate items by 10 %}X{% endpaginate %}`, { items: [1, 2, 3] });
  assert.equal(out, 'X');
});

test('section tags render a comment placeholder when no sections directory is configured', () => {
  assert.match(render(`{% section 'header' %}`), /header/);
});
