/**
 * Mark every checkbox in an implementation plan as done.
 *
 * The plans were executed but their checkboxes were never ticked, so a reader
 * coming to them later sees 0% against work that shipped. This rewrites
 * `- [ ]` to `- [x]` in place.
 *
 * Only run this against a plan whose Definition of Done has actually been
 * verified — see docs/handover for what was checked and how.
 *
 * Usage: node scripts/tick-plan.js <file>...
 */
import { readFile, writeFile } from 'node:fs/promises';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('usage: node scripts/tick-plan.js <file>...');
  process.exit(1);
}

for (const file of files) {
  const before = await readFile(file, 'utf8');
  const after = before.replace(/^(\s*)- \[ \]/gm, '$1- [x]');

  const ticked = (before.match(/^\s*- \[ \]/gm) ?? []).length;
  const alreadyDone = (before.match(/^\s*- \[[xX]\]/gm) ?? []).length;

  if (after !== before) await writeFile(file, after);
  console.log(`${file}: ticked ${ticked}, already ticked ${alreadyDone}`);
}
