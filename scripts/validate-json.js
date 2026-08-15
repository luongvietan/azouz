import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

/**
 * Parse every .json file under themeDir.
 * @returns {Promise<Array<{file: string, message: string}>>} findings, sorted by path.
 */
export async function findInvalidJson(themeDir) {
  const findings = [];
  for await (const absolute of walk(themeDir)) {
    if (!absolute.endsWith('.json')) continue;
    const contents = await readFile(absolute, 'utf8');
    try {
      JSON.parse(contents);
    } catch (error) {
      findings.push({
        file: relative(themeDir, absolute).split(sep).join('/'),
        message: error.message,
      });
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file));
}
