import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root — one level above `scripts/`. */
export const ROOT = resolve(here, '..');

/**
 * The Shopify theme source.
 *
 * This is the repository root, because Shopify's GitHub integration only
 * connects a branch whose theme directories sit at the root — it has no way to
 * point at a subdirectory, and ignores every folder that is not part of the
 * theme structure. Those ignored folders are this project's own tooling
 * (`preview/`, `scripts/`, `tests/`, `docs/`), which is why they can live
 * alongside the theme without Shopify caring.
 *
 * Only THEME_SUBDIRS go into the zip — see PROJECT_ENTRIES.
 */
export const THEME_DIR = ROOT;

/** Where the packaged zip is written. */
export const DIST_DIR = join(ROOT, 'dist');

/**
 * The only directory names Shopify accepts at a theme root.
 * Anything else inside the packaged zip will cause the upload to be rejected.
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

/**
 * Repository entries that share the theme root but are not part of the theme.
 *
 * Shopify ignores every one of these — they are the project's own tooling, its
 * source assets and the usual repository furniture. The structure check skips
 * them so it can still fail on a genuinely stray directory (a `styles/`, a
 * mis-cased `Assets/`) rather than drowning in known-good noise.
 *
 * They are excluded from the zip, which must contain THEME_SUBDIRS and nothing else.
 */
export const PROJECT_ENTRIES = new Set([
  '.git',
  '.gitignore',
  '.github',
  '.impeccable',
  '.shopify',
  '.theme-check.yml',
  'DESIGN.md',
  'PRODUCT.md',
  'README.md',
  'dist',
  'docs',
  'node_modules',
  'package-lock.json',
  'package.json',
  'preview',
  'scripts',
  'tests',
]);

/**
 * Source material the client supplied — brand guidelines, logo artwork, product
 * photography. Kept in the repository, never shipped in the theme.
 */
export const isSourceAsset = (name) =>
  /\.(ai|pdf|png|jpe?g|zip|psd|sketch|fig)$/i.test(name) || name === 'logo1';

/** Resolve a POSIX-style theme-relative path (e.g. 'layout/theme.liquid') to absolute. */
export function resolveInTheme(relativePath) {
  return join(THEME_DIR, ...relativePath.split('/'));
}
