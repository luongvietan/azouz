import { pathToFileURL } from 'node:url';
import {
  findMissingRequiredFiles,
  findDisallowedTopLevelEntries,
  findDefaultLocale,
} from './validate-structure.js';
import { findInvalidJson } from './validate-json.js';
import { THEME_DIR } from './theme-paths.js';

/** @returns {Promise<Array<{kind: string, detail: string}>>} */
export async function collectFindings(themeDir) {
  const findings = [];

  for (const file of await findMissingRequiredFiles(themeDir)) {
    findings.push({ kind: 'missing-required-file', detail: file });
  }

  if (!(await findDefaultLocale(themeDir))) {
    findings.push({ kind: 'missing-default-locale', detail: 'locales/*.default.json' });
  }

  for (const entry of await findDisallowedTopLevelEntries(themeDir)) {
    findings.push({ kind: 'disallowed-top-level-entry', detail: entry });
  }

  for (const finding of await findInvalidJson(themeDir)) {
    findings.push({ kind: 'invalid-json', detail: `${finding.file}: ${finding.message}` });
  }

  return findings;
}

// CLI entry point: `npm run validate`
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = await collectFindings(THEME_DIR);
  if (findings.length === 0) {
    console.log('Theme validation passed.');
  } else {
    for (const finding of findings) console.error(`[${finding.kind}] ${finding.detail}`);
    process.exitCode = 1;
  }
}
