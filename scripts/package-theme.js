/**
 * Package the theme into a zip Shopify will accept from Online Store →
 * Themes → Import → Upload zip file.
 *
 * The theme root is the repository root, so this cannot archive a directory
 * wholesale — that would sweep in `preview/`, `tests/`, `node_modules/` and a
 * 16MB brand-guidelines PDF, and Shopify rejects a zip containing anything
 * outside the theme structure. Only THEME_SUBDIRS go in, and each entry is
 * added by an explicit walk so nothing can leak in by accident.
 *
 * Run: npm run package   ->   dist/azouz-theme-<version>.zip
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, stat, rm } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { THEME_DIR, DIST_DIR, THEME_SUBDIRS } from './theme-paths.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

// archiver v8 is CommonJS and exports format classes, not the v5 factory
// function — so there is no default export under ESM and no archiver() to call.
// Use ZipArchive, not the Archiver base class: the base has no format module
// attached and blows up inside finalize().
const { ZipArchive } = require('archiver');

/** Every file under `dir`, depth-first, as absolute paths. */
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Collect the theme files to ship, as {absolute, entry} pairs where `entry` is
 * the POSIX path the file takes inside the zip.
 */
export async function collectThemeFiles(themeDir = THEME_DIR) {
  const files = [];

  for (const name of [...THEME_SUBDIRS].sort()) {
    const dir = join(themeDir, name);
    try {
      if (!(await stat(dir)).isDirectory()) continue;
    } catch {
      continue; // an optional directory the theme does not use, e.g. blocks/
    }

    for await (const absolute of walk(dir)) {
      files.push({
        absolute,
        entry: relative(themeDir, absolute).split(sep).join('/'),
      });
    }
  }

  return files.sort((a, b) => a.entry.localeCompare(b.entry));
}

/**
 * Write the zip.
 * @returns {Promise<{file: string, entries: number, bytes: number}>}
 */
export async function packageTheme({ themeDir = THEME_DIR, distDir = DIST_DIR } = {}) {
  const files = await collectThemeFiles(themeDir);
  if (files.length === 0) throw new Error('no theme files found — is THEME_DIR correct?');

  await mkdir(distDir, { recursive: true });
  const file = join(distDir, `azouz-theme-${version}.zip`);
  await rm(file, { force: true });

  const output = createWriteStream(file);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  const done = new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
    archive.on('warning', reject); // a skipped file would ship a broken theme
  });

  archive.pipe(output);
  for (const { absolute, entry } of files) archive.file(absolute, { name: entry });
  await archive.finalize();
  await done;

  return { file, entries: files.length, bytes: archive.pointer() };
}

// Only run when invoked directly, so the functions above stay testable.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { file, entries, bytes } = await packageTheme();
  console.log(`Packaged ${entries} files into ${file} (${(bytes / 1024).toFixed(1)} kB).`);
}
