import { readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { THEME_SUBDIRS, PROJECT_ENTRIES, isSourceAsset } from './theme-paths.js';

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

/**
 * Top-level entries that are neither part of the theme nor known project files.
 *
 * The theme root is the repository root, so this cannot simply reject anything
 * that is not a Shopify directory — `tests/`, `package.json` and the client's
 * source artwork all live here legitimately, and Shopify ignores them. What it
 * still catches is the case that matters: a directory that looks like it was
 * meant to be part of the theme but is not one Shopify reads, such as `styles/`
 * or a mis-cased `Assets/`, which would be silently dropped on deploy.
 *
 * @returns {Promise<string[]>} unrecognised top-level entries, sorted.
 */
export async function findDisallowedTopLevelEntries(themeDir) {
  const entries = await readdir(themeDir, { withFileTypes: true });
  return entries
    .filter((entry) => !(entry.isDirectory() && THEME_SUBDIRS.has(entry.name)))
    .filter((entry) => !PROJECT_ENTRIES.has(entry.name))
    .filter((entry) => !isSourceAsset(entry.name))
    .map((entry) => entry.name)
    .sort();
}
