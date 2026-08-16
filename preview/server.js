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
import { extractSchema } from '../scripts/schema-parser.js';
import { resolveSection } from './settings-resolver.js';
import { ROOT, THEME_DIR } from '../scripts/theme-paths.js';

const MEDIA_DIR = join(ROOT, 'preview', 'media');

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

let enginePromise;
function getEngine() {
  enginePromise ??= createEngine(THEME_DIR);
  return enginePromise;
}

/**
 * Read a request body the way the theme actually posts it: urlencoded from a
 * native form submit, multipart FormData from <product-form> fetch, or JSON.
 */
async function readForm(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  const contentType = request.headers['content-type'] ?? '';

  if (contentType.includes('application/json')) {
    const data = JSON.parse(buffer.toString('utf8') || '{}');
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value != null) params.set(key, String(value));
    }
    return params;
  }

  if (contentType.includes('multipart/form-data')) {
    return parseMultipart(buffer, contentType);
  }

  return new URLSearchParams(buffer.toString('utf8'));
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!boundaryMatch) return new URLSearchParams();

  const boundary = boundaryMatch[1] ?? boundaryMatch[2];
  const params = new URLSearchParams();

  for (const part of buffer.toString('utf8').split(`--${boundary}`)) {
    if (!part || part === '--' || part.startsWith('--')) continue;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const name = /name="([^"]+)"/.exec(part.slice(0, headerEnd));
    if (!name) continue;
    params.append(name[1], part.slice(headerEnd + 4).replace(/\r\n$/, ''));
  }

  return params;
}

/** Client packaging shots, served from preview/media — not part of the theme zip. */
async function servePreviewMedia(response, urlPath) {
  const relative = normalize(urlPath.replace(/^\/preview-media\//, '')).replace(/^(\.\.[/\\])+/, '');
  const file = join(MEDIA_DIR, relative);
  try {
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('preview media not found');
  }
}

/**
 * Shopify's Section Rendering API: GET any url with ?sections=a,b and receive
 * `{ a: "<html>", b: "<html>" }`. The theme uses it to refresh the drawer and
 * the header cart count after an add-to-cart.
 */
async function renderSections(names, scope) {
  const engine = await getEngine();
  const rendered = {};

  for (const name of names) {
    const file = join(THEME_DIR, 'sections', `${name}.liquid`);
    if (!existsSync(file)) continue;
    const source = readFileSync(file, 'utf8');
    const schema = extractSchema(source, `sections/${name}.liquid`);
    const sectionScope = {
      ...scope,
      section: resolveSection(schema, name, {}, scope),
    };
    const html = await engine.parseAndRender(source, sectionScope, { globals: sectionScope });
    rendered[name] = `<div id="shopify-section-${name}" class="shopify-section">${html}</div>`;
  }

  return rendered;
}

/** The globals every render gets, with the route's own context merged over. */
function buildScope(route, searchParams = new URLSearchParams()) {
  const fixtures = buildFixtures();
  return {
    ...fixtures,
    cart: buildCart(),
    request: {
      ...fixtures.request,
      page_type: route.page_type,
      query: Object.fromEntries(searchParams),
    },
    page: null,
    ...route.scope,
  };
}

export function createPreviewServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (url.pathname.startsWith('/assets/')) return serveAsset(response, url.pathname);
    if (url.pathname.startsWith('/preview-media/')) return servePreviewMedia(response, url.pathname);

    if (request.method === 'POST' && path === '/contact') {
      await readForm(request);
      const referer = request.headers.referer;
      const back = referer ? new URL(referer).pathname : '/';
      return response.writeHead(302, { Location: `${back}?contact_posted=1` }).end();
    }

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
      return json(response, 200, await renderSections(names, buildScope(route, url.searchParams)));
    }

    try {
      const engine = await getEngine();
      const scope = buildScope(route, url.searchParams);
      const layout =
        route.page_type === 'password' ? 'layout/password.liquid' : 'layout/theme.liquid';
      const html = await renderThemeFile(engine, THEME_DIR, layout, {
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
