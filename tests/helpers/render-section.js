import { createEngine, renderThemeFile } from '../../preview/engine.js';
import { THEME_DIR } from '../../scripts/theme-paths.js';

/**
 * Render one section with its schema defaults, optionally overridden.
 *
 * @param {string} name section filename without extension, e.g. 'hero-split'
 * @param {object} [options]
 * @param {object} [options.settings] merged over the schema defaults
 * @param {Array}  [options.blocks] replaces the preset blocks entirely
 * @param {object} [options.scope] extra globals (page, product, collection…)
 * @returns {Promise<string>} rendered HTML
 */
export async function renderSection(name, options = {}) {
  const engine = await createEngine(THEME_DIR);
  return renderThemeFile(engine, THEME_DIR, `sections/${name}.liquid`, {
    ...(options.scope ?? {}),
    section: { settings: options.settings ?? {}, blocks: options.blocks },
  });
}

/** Count occurrences of a pattern — handy for asserting block counts. */
export function countMatches(html, pattern) {
  return (html.match(pattern) ?? []).length;
}
