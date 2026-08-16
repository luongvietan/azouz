import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolveInTheme } from '../../scripts/theme-paths.js';

/**
 * Evaluate the real `assets/theme.js` in a sandbox that provides just enough of
 * a browser for the file to parse and register its custom elements.
 *
 * Element *behaviour* needs a real DOM and is verified in the browser during
 * final review; what is unit-tested here is the pure logic on `AzouzTheme`,
 * which is where the bugs that matter live.
 *
 * @returns {Promise<object>} the sandbox's global object
 */
export async function loadThemeJs() {
  const source = await readFile(resolveInTheme('assets/theme.js'), 'utf8');

  const registry = new Map();

  const sandbox = {
    HTMLElement: class {},
    customElements: {
      define: (name, constructor) => registry.set(name, constructor),
      get: (name) => registry.get(name),
    },
    matchMedia: () => ({ matches: false }),
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
    },
    fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '' }),
    console,
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'theme.js' });

  return sandbox;
}
