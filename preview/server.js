/**
 * Local preview server. Renders the real theme files so what is reviewed is
 * what ships. This is a development aid, not a Shopify emulator — see the
 * spec's "Stated limitations" for what cannot be verified here.
 *
 * Run: npm run preview   ->   http://localhost:4321
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createEngine, renderThemeFile } from './engine.js';
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

/** URL path -> the page_type and extra scope the theme should render with. */
const ROUTES = {
  '/': { page_type: 'index' },
  '/pages/private-label': { page_type: 'page' },
  '/pages/wholesale': { page_type: 'page' },
  '/pages/our-brands': { page_type: 'page' },
  '/pages/request-a-sample': { page_type: 'page' },
  '/pages/get-a-quote': { page_type: 'page' },
  '/collections/all': { page_type: 'collection' },
  '/cart': { page_type: 'cart' },
  '/search': { page_type: 'search' },
};

async function serveAsset(response, urlPath) {
  // Strip the leading /assets/ and refuse anything that escapes the directory.
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

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (path.startsWith('/assets/')) return serveAsset(response, path);

  const route = ROUTES[path.replace(/\/$/, '') || '/'] ?? { page_type: 'page' };

  try {
    const engine = await createEngine(THEME_DIR);
    const fixtures = buildFixtures();
    const html = await renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
      ...fixtures,
      request: { ...fixtures.request, page_type: route.page_type },
      content_for_layout: `<div class="container section"><p class="lead">Preview route <code>${path}</code> — templates arrive in Plan B.</p></div>`,
    });
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
  } catch (error) {
    response
      .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      .end(`Render error on ${path}\n\n${error.stack}`);
  }
});

server.listen(PORT, () => {
  console.log(`Azouz preview: http://localhost:${PORT}`);
  for (const route of Object.keys(ROUTES)) console.log(`  http://localhost:${PORT}${route}`);
});
