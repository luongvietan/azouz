import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadThemeJs } from './helpers/load-theme-js.js';

/**
 * The sandbox resolves `navigator` and `document` at call time, so a stub set
 * after the file has run is what copyText will see.
 */
async function withClipboard({ clipboard, execCommand } = {}) {
  const sandbox = await loadThemeJs();
  const written = [];

  sandbox.navigator = clipboard === false ? {} : {
    clipboard: {
      writeText: async (value) => {
        if (clipboard === 'reject') throw new Error('not focused');
        written.push(value);
      },
    },
  };

  const appended = [];
  sandbox.document.createElement = () => ({
    style: {},
    setAttribute() {},
    select() {},
    remove() {},
  });
  sandbox.document.body = { appendChild: (node) => appended.push(node) };
  sandbox.document.execCommand = () => execCommand ?? true;

  return { copyText: sandbox.AzouzTheme.copyText, written, appended };
}

test('gift-card-actions is registered', async () => {
  const { customElements } = await loadThemeJs();
  assert.equal(typeof customElements.get('gift-card-actions'), 'function');
});

test('copying writes the code through the clipboard api', async () => {
  const { copyText, written } = await withClipboard();
  assert.equal(await copyText('AZOU 1H7G 3K9M 2P'), true);
  assert.deepEqual(written, ['AZOU 1H7G 3K9M 2P']);
});

test('surrounding whitespace is trimmed — the code comes out of textContent', async () => {
  const { copyText, written } = await withClipboard();
  await copyText('\n  AZOU 1H7G  \n');
  assert.deepEqual(written, ['AZOU 1H7G']);
});

test('nothing is copied when there is nothing to copy', async () => {
  const { copyText, written } = await withClipboard();
  assert.equal(await copyText('   '), false);
  assert.equal(await copyText(null), false);
  assert.deepEqual(written, []);
});

test('an insecure origin has no clipboard api and falls back to a selection', async () => {
  // navigator.clipboard is undefined over plain http, which is not a rare case.
  const { copyText, appended } = await withClipboard({ clipboard: false });
  assert.equal(await copyText('AZOU'), true);
  assert.equal(appended.length, 1, 'the fallback field was never used');
});

test('a rejected clipboard write falls back rather than failing silently', async () => {
  // The promise rejects when the document is not focused.
  const { copyText, appended } = await withClipboard({ clipboard: 'reject' });
  assert.equal(await copyText('AZOU'), true);
  assert.equal(appended.length, 1);
});

test('a failed fallback reports failure — the confirmation must not lie', async () => {
  const { copyText } = await withClipboard({ clipboard: false, execCommand: false });
  assert.equal(await copyText('AZOU'), false);
});
