import { readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { THEME_SUBDIRS } from './theme-paths.js';

/**
 * Files Shopify requires before it will accept a theme.
 * A default locale is required too, but its name varies — see findDefaultLocale.
 */
export const REQUIRED_FILES = ['layout/theme.liquid', 'config/settings_schema.json'];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** @returns {Promise<string[]>} required paths that are absent, in REQUIRED_FILES order. */
export async function findMissingRequiredFiles(themeDir) {
  const missing = [];
  for (const relative of REQUIRED_FILES) {
    if (!(await exists(join(themeDir, ...relative.split('/'))))) missing.push(relative);
  }
  return missing;
}

/** @returns {Promise<string|null>} the `*.default.json` filename in locales/, or null. */
export async function findDefaultLocale(themeDir) {
  let entries;
  try {
    entries = await readdir(join(themeDir, 'locales'));
  } catch {
    return null;
  }
  return entries.find((name) => name.endsWith('.default.json')) ?? null;
}

/** @returns {Promise<string[]>} top-level entries Shopify does not permit, sorted. */
export async function findDisallowedTopLevelEntries(themeDir) {
  const entries = await readdir(themeDir, { withFileTypes: true });
  return entries
    .filter((entry) => !(entry.isDirectory() && THEME_SUBDIRS.has(entry.name)))
    .map((entry) => entry.name)
    .sort();
}
