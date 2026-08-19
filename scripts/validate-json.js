import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { stripJsonComments } from './theme-json.js';
import { THEME_SUBDIRS } from './theme-paths.js';

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Parse every .json file that ships as part of the theme.
 *
 * Only THEME_SUBDIRS are walked. The theme root is the repository root, so
 * walking it wholesale would descend into node_modules — where tsconfig.json
 * files legitimately carry comments and would be reported as broken theme JSON.
 *
 * @returns {Promise<Array<{file: string, message: string}>>} findings, sorted by path.
 */
export async function findInvalidJson(themeDir) {
  const findings = [];

  const roots = [];
  for (const name of await readdir(themeDir, { withFileTypes: true })) {
    if (name.isDirectory() && THEME_SUBDIRS.has(name.name)) roots.push(join(themeDir, name.name));
  }

  for (const root of roots) {
    for await (const absolute of walk(root)) {
      if (!absolute.endsWith('.json')) continue;
      const contents = await readFile(absolute, 'utf8');
      try {
        JSON.parse(stripJsonComments(contents));
      } catch (error) {
        findings.push({
          file: relative(themeDir, absolute).split(sep).join('/'),
          message: error.message,
        });
      }
    }
  }

  return findings.sort((a, b) => a.file.localeCompare(b.file));
}
