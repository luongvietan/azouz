import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCustomerFixture } from '../preview/fixtures.js';
import { renderSection, countMatches } from './helpers/render-section.js';
import { resolveInTheme } from '../scripts/theme-paths.js';

const customer = buildCustomerFixture();
const order = customer.orders[0];

const SECTIONS = [
  'main-login',
  'main-register',
  'main-account',
  'main-order',
  'main-addresses',
  'main-reset-password',
  'main-activate-account',
];

const scope = { customer, order };

test('every account section renders exactly one h1', async () => {
  for (const name of SECTIONS) {
    const html = await renderSection(name, { scope });
    assert.equal(countMatches(html, /<h1/g), 1, `${name} must have exactly one h1`);
  }
});

test('no account section hard-codes english', async () => {
  for (const name of SECTIONS) {
    const html = await renderSection(name, { scope });
    assert.equal(/translation missing/.test(html), false, `${name} has a missing locale key`);
  }
});

test('no account section declares a preset', async () => {
  const { extractSchema } = await import('../scripts/schema-parser.js');
  for (const name of SECTIONS) {
    const schema = extractSchema(await readFile(resolveInTheme(`sections/${name}.liquid`), 'utf8'));
    assert.equal(schema.presets, undefined, `${name} must not be addable in the theme editor`);
  }
});

test('every input in every account form has a label', async () => {
  for (const name of SECTIONS) {
    const html = await renderSection(name, { scope });
    for (const input of html.match(/<input[^>]*>/g) ?? []) {
      if (/type="(hidden|submit)"/.test(input)) continue;
      const id = /id="([^"]+)"/.exec(input);
      assert.ok(id, `${name}: an input has no id, so it cannot be labelled — ${input}`);
      assert.match(html, new RegExp(`for="${id[1]}"`), `${name}: ${id[1]} has no label`);
    }
  }
});

test('login posts to the customer login endpoint', async () => {
  const html = await renderSection('main-login', { scope });
  assert.match(html, /action="\/account\/login"/);
  assert.match(html, /type="password"/);
});

test('login links to registration and to password recovery', async () => {
  const html = await renderSection('main-login', { scope });
  assert.match(html, /href="\/account\/register"/);
  assert.match(html, /href="\/account\/recover"/);
});

test('registration posts to the create customer endpoint', async () => {
  const html = await renderSection('main-register', { scope });
  assert.match(html, /action="\/account"/);
});

test('the account page lists the customer orders with links', async () => {
  const html = await renderSection('main-account', { scope });
  assert.match(html, /#1002/);
  assert.match(html, /href="\/account\/orders\/1002"/);
});

test('an account with no orders shows an empty state', async () => {
  const html = await renderSection('main-account', {
    scope: { customer: { ...customer, orders: [], orders_count: 0 } },
  });
  assert.match(html, /account__empty/);
  assert.equal(/#1002/.test(html), false);
});

test('the order page lists its line items and the total', async () => {
  const html = await renderSection('main-order', { scope });
  assert.match(html, /Espresso Arabica Beans/);
  assert.match(html, /order__total/);
});

test('the addresses page renders the saved address and a form to add one', async () => {
  const html = await renderSection('main-addresses', { scope });
  assert.match(html, /Rainbow Street/);
  assert.match(html, /action="\/account\/addresses"/);
});

test('password recovery posts to the recover endpoint', async () => {
  const html = await renderSection('main-reset-password', { scope });
  assert.match(html, /action="\/account\/recover"/);
});

test('account activation posts to the activate endpoint', async () => {
  const html = await renderSection('main-activate-account', { scope });
  assert.match(html, /action="\/account\/activate"/);
});
