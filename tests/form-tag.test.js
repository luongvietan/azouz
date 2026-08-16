import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEngine } from '../preview/engine.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const render = async (source, scope = {}) => {
  const engine = await createEngine(THEME_DIR);
  return engine.parseAndRender(source, scope, { globals: scope });
};

test('a contact form posts to the contact endpoint', async () => {
  const html = await render(`{% form 'contact' %}x{% endform %}`);
  assert.match(html, /action="\/contact#contact"/);
  assert.match(html, /name="form_type" value="contact"/);
});

test('a product form posts to cart add, not to a form-type url', async () => {
  const html = await render(`{% form 'product', product %}x{% endform %}`, {
    product: { id: 'p1' },
  });
  assert.match(html, /action="\/cart\/add"/);
  assert.equal(/action="\/product/.test(html), false);
});

test('a cart form posts to the cart', async () => {
  const html = await render(`{% form 'cart', cart %}x{% endform %}`, { cart: { items: [] } });
  assert.match(html, /action="\/cart"/);
});

test('every customer form posts to its real endpoint', async () => {
  const cases = {
    customer_login: '/account/login',
    create_customer: '/account',
    recover_customer_password: '/account/recover',
    activate_customer_password: '/account/activate',
    customer_address: '/account/addresses',
  };
  for (const [type, action] of Object.entries(cases)) {
    const html = await render(`{% form '${type}' %}x{% endform %}`, { customer: {} });
    assert.match(html, new RegExp(`action="${action.replace(/\//g, '\\/')}"`), `${type}`);
  }
});

test('an id keyword argument becomes the form id so inputs can target it', async () => {
  const html = await render(`{% form 'product', product, id: 'AddToCart' %}x{% endform %}`, {
    product: { id: 'p1' },
  });
  assert.match(html, /id="AddToCart"/);
});

test('a class keyword argument is applied', async () => {
  const html = await render(`{% form 'product', product, class: 'product-form__form' %}x{% endform %}`, {
    product: { id: 'p1' },
  });
  assert.match(html, /class="product-form__form"/);
});

test('the form body still renders and the form object is in scope', async () => {
  const html = await render(
    `{% form 'contact' %}{% if form.posted_successfully? %}yes{% else %}no{% endif %}{% endform %}`,
  );
  assert.match(html, />no</);
});

test('an unknown form type falls back to a form-type url rather than throwing', async () => {
  const html = await render(`{% form 'mystery' %}x{% endform %}`);
  assert.match(html, /action="\/mystery"/);
});
