/**
 * Local preview server. Renders the real theme files so what is reviewed is
 * what ships. A development aid, not a Shopify emulator — checkout, real form
 * delivery, predictive search and the Cart Section API do not exist here.
 *
 * Run: npm run preview   ->   http://localhost:4321
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEngine, renderThemeFile } from './engine.js';
import { renderTemplate } from './template-renderer.js';
import { buildFixtures } from './fixtures.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

const PORT = Number(process.env.PORT ?? 4321);

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * URL path -> what Shopify would render there.
 * `page` supplies the Liquid `page` object; `template` overrides the default.
 */
export const ROUTES = {
  '/': { page_type: 'index', template: 'templates/index.json' },
  '/pages/private-label': {
    page_type: 'page',
    template: 'templates/page.private-label.json',
    page: { title: 'Private Label', handle: 'private-label', content: '' },
  },
  '/pages/wholesale': {
    page_type: 'page',
    template: 'templates/page.wholesale.json',
    page: { title: 'Wholesale', handle: 'wholesale', content: '' },
  },
  '/pages/our-brands': {
    page_type: 'page',
    template: 'templates/page.our-brands.json',
    page: { title: 'Our Brands', handle: 'our-brands', content: '' },
  },
  '/pages/request-a-sample': {
    page_type: 'page',
    template: 'templates/page.enquiry.json',
    page: { title: 'Request a Sample', handle: 'request-a-sample', content: '' },
  },
  '/pages/get-a-quote': {
    page_type: 'page',
    template: 'templates/page.enquiry.json',
    page: { title: 'Get a Quote', handle: 'get-a-quote', content: '' },
  },
};

/** Which JSON template a route renders. */
export function templateForRoute(route) {
  if (route.template) return route.template;
  return route.page_type === 'index' ? 'templates/index.json' : 'templates/page.json';
}

async function serveAsset(response, urlPath) {
  const relative = normalize(urlPath.replace(/^\/assets\//, '')).replace(/^(\.\.[/\\])+/, '');
  const file = join(THEME_DIR, 'assets', relative);
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('asset not found');
  }
}

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const path = url.pathname.replace(/\/$/, '') || '/';

    if (url.pathname.startsWith('/assets/')) return serveAsset(response, url.pathname);

    const route = ROUTES[path];
    if (!route) {
      response
        .writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
        .end(`<h1>No preview route for ${path}</h1><p>Known routes: ${Object.keys(ROUTES).join(', ')}</p>`);
      return;
    }

    try {
      const engine = await createEngine(THEME_DIR);
      const fixtures = buildFixtures();
      const scope = {
        ...fixtures,
        request: { ...fixtures.request, page_type: route.page_type },
        page: route.page ?? null,
      };

      const html = await renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
        ...scope,
        content_for_layout: await renderTemplate(
          engine,
          THEME_DIR,
          templateForRoute(route),
          scope,
        ),
      });

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
    } catch (error) {
      response
        .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end(`Render error on ${path}\n\n${error.stack}`);
    }
  });
}

// Only listen when run directly, so tests can import ROUTES without opening a port.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createPreviewServer().listen(PORT, () => {
    console.log(`Azouz preview: http://localhost:${PORT}`);
    for (const route of Object.keys(ROUTES)) console.log(`  http://localhost:${PORT}${route}`);
  });
}
