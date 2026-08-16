/**
 * Local preview server. Renders the real theme files so what is reviewed is
 * what ships. A development aid, not a Shopify emulator — checkout, real form
 * delivery, predictive search and customer authentication do not exist here.
 *
 * Run: npm run preview   ->   http://localhost:4321
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createEngine, renderThemeFile } from './engine.js';
import { renderTemplate } from './template-renderer.js';
import { buildFixtures } from './fixtures.js';
import { resolveRoute, listPreviewPaths } from './route-context.js';
import { addLine, setLine, seedCart, buildCart } from './cart-api.js';
import { extractSchema, defaultSettings, defaultBlocks } from '../scripts/schema-parser.js';
import { THEME_DIR } from '../scripts/theme-paths.js';

export { ROUTES, templateForRoute } from './route-context.js';

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

const json = (response, status, body) =>
  response
    .writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    .end(JSON.stringify(body));

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

/** Read a urlencoded request body into a URLSearchParams. */
async function readForm(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

/**
 * Shopify's Section Rendering API: GET any url with ?sections=a,b and receive
 * `{ a: "<html>", b: "<html>" }`. The theme uses it to refresh the drawer and
 * the header cart count after an add-to-cart.
 */
async function renderSections(names, scope) {
  const engine = await createEngine(THEME_DIR);
  const rendered = {};

  for (const name of names) {
    const file = join(THEME_DIR, 'sections', `${name}.liquid`);
    if (!existsSync(file)) continue;
    const source = readFileSync(file, 'utf8');
    const schema = extractSchema(source, `sections/${name}.liquid`);
    const sectionScope = {
      ...scope,
      section: {
        id: name,
        settings: defaultSettings(schema),
        blocks: defaultBlocks(schema),
        shopify_attributes: '',
      },
    };
    const html = await engine.parseAndRender(source, sectionScope, { globals: sectionScope });
    rendered[name] = `<div id="shopify-section-${name}" class="shopify-section">${html}</div>`;
  }

  return rendered;
}

/** The globals every render gets, with the route's own context merged over. */
function buildScope(route) {
  const fixtures = buildFixtures();
  return {
    ...fixtures,
    cart: buildCart(),
    request: { ...fixtures.request, page_type: route.page_type },
    page: null,
    ...route.scope,
  };
}

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (url.pathname.startsWith('/assets/')) return serveAsset(response, url.pathname);

    if (request.method === 'POST' && path === '/cart/add') {
      const form = await readForm(request);
      addLine(form.get('id'), Number(form.get('quantity') ?? 1));
      if ((request.headers.accept ?? '').includes('application/json')) {
        return json(response, 200, buildCart());
      }
      return response.writeHead(302, { Location: '/cart' }).end();
    }

    // Shopify accepts /cart/change as both a POST and a plain GET link, which
    // is what the remove control in cart-line-items is.
    if (path === '/cart/change') {
      const form = request.method === 'POST' ? await readForm(request) : url.searchParams;
      setLine(form.get('id'), Number(form.get('quantity') ?? 0));
      if ((request.headers.accept ?? '').includes('application/json')) {
        return json(response, 200, buildCart());
      }
      return response.writeHead(302, { Location: '/cart' }).end();
    }

    // Dev convenience: fill the cart so /cart can be reviewed without first
    // exercising the drawer. Not part of the theme.
    if (path === '/cart/seed') {
      seedCart();
      return response.writeHead(302, { Location: '/cart' }).end();
    }

    if (path === '/cart.js') return json(response, 200, buildCart());

    const route = resolveRoute(path, url.searchParams);

    if (url.searchParams.has('sections')) {
      const names = url.searchParams.get('sections').split(',').filter(Boolean);
      return json(response, 200, await renderSections(names, buildScope(route)));
    }

    try {
      const engine = await createEngine(THEME_DIR);
      const scope = buildScope(route);
      const html = await renderThemeFile(engine, THEME_DIR, 'layout/theme.liquid', {
        ...scope,
        content_for_layout: await renderTemplate(engine, THEME_DIR, route.template, scope),
      });
      response
        .writeHead(route.page_type === '404' ? 404 : 200, {
          'Content-Type': 'text/html; charset=utf-8',
        })
        .end(html);
    } catch (error) {
      response
        .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        .end(`Render error on ${path}\n\n${error.stack}`);
    }
  });
}

// Only listen when run directly, so tests can import the factory without opening a port.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  createPreviewServer().listen(PORT, () => {
    console.log(`Azouz preview: http://localhost:${PORT}`);
    for (const path of listPreviewPaths()) console.log(`  http://localhost:${PORT}${path}`);
  });
}
