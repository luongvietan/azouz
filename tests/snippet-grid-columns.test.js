import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSnippet } from './helpers/render-snippet.js';

const cols = async (count) => Number((await renderSnippet('grid-columns', { count })).trim());

test('five or fewer entries sit on a single row', async () => {
  for (const count of [1, 2, 3, 4, 5]) assert.equal(await cols(count), count);
});

test('never leaves a lone entry on the last row', async () => {
  for (let count = 2; count <= 50; count += 1) {
    const n = await cols(count);
    const last = count % n;
    assert.notEqual(last, 1, `${count} entries in ${n} columns orphans one`);
  }
});

test('eight entries are four and four, six are three and three', async () => {
  assert.equal(await cols(8), 4);
  assert.equal(await cols(6), 3);
});

test('an empty section still yields a valid repeat() count', async () => {
  assert.equal(await cols(0), 1);
});
