import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectFindings } from '../scripts/validate-all.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

test('the real theme directory has no structural or JSON findings', async () => {
  const findings = await collectFindings(THEME_DIR);
  assert.deepEqual(findings, [], findings.map((f) => `${f.kind}: ${f.detail}`).join('\n'));
});
