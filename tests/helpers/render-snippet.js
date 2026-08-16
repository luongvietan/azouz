import { createEngine } from '../../preview/engine.js';
import { buildFixtures } from '../../preview/fixtures.js';
import { THEME_DIR } from '../../scripts/theme-paths.js';

/**
 * Render one snippet the way {% render %} does: an isolated local scope built
 * from `args`, plus the global drops Shopify exposes everywhere.
 *
 * @param {string} name snippet filename without extension
 * @param {object} [args] the keyword arguments passed to {% render %}
 * @param {object} [extraScope] extra globals merged over the fixtures
 */
export async function renderSnippet(name, args = {}, extraScope = {}) {
  const engine = await createEngine(THEME_DIR);
  const globals = { ...buildFixtures(), ...extraScope };
  const keys = Object.keys(args);
  const params = keys.map((key) => `${key}: ${key}`).join(', ');
  const source = params ? `{% render '${name}', ${params} %}` : `{% render '${name}' %}`;
  return engine.parseAndRender(source, { ...globals, ...args }, { globals });
}
