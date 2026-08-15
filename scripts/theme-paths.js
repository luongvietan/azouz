import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root — one level above `scripts/`. */
export const ROOT = resolve(here, '..');

/** The Shopify theme source. This directory, and only this, becomes the zip. */
export const THEME_DIR = join(ROOT, 'azouz-theme');

/** Where the packaged zip is written. */
export const DIST_DIR = join(ROOT, 'dist');

/**
 * The only directory names Shopify accepts at a theme root.
 * Anything else present will cause the zip upload to be rejected.
 */
export const THEME_SUBDIRS = new Set([
  'assets',
  'blocks',
  'config',
  'layout',
  'locales',
  'sections',
  'snippets',
  'templates',
]);

/** Resolve a POSIX-style theme-relative path (e.g. 'layout/theme.liquid') to absolute. */
export function resolveInTheme(relativePath) {
  return join(THEME_DIR, ...relativePath.split('/'));
}
