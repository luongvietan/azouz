/**
 * Maps a preview URL to what Shopify would render there: a page_type, a JSON
 * template, and the context object that template's sections read.
 *
 * Anything unrecognised resolves to the 404 template rather than null, so the
 * preview always renders the theme rather than a bare server error page.
 */
import {
  buildFixtures,
  buildSearchFixture,
  buildCustomerFixture,
  buildBlogFixture,
  buildGiftCardFixture,
} from './fixtures.js';
import { buildCart } from './cart-api.js';
import { handleize } from './shims/filters.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_DIR } from '../scripts/theme-paths.js';

/**
 * Shopify populates `page_title` on every storefront template. This preview
 * only set it where a fixture happened to carry a title, so the cart, search,
 * the account pages, the collection index and 404 all rendered with the shop
 * name alone in <title> — nine routes indistinguishable in a tab, a history
 * list or a screen reader's page announcement. Worse, an audit of the preview
 * reported that as the theme's behaviour, which it is not.
 *
 * The value used is each page's own <h1>, read from the same translation the
 * template renders, so the preview mirrors the page rather than inventing
 * copy. Shopify's exact wording for these is Shopify's own; what the harness
 * has to be faithful about is that a title is there at all.
 *
 * The password page is deliberately not in this list. Shopify leaves
 * page_title unset there, meta-tags.liquid carries a comment about that exact
 * fallback, and forcing a title here would hide the case the comment exists
 * for.
 */
const translations = JSON.parse(
  readFileSync(join(THEME_DIR, 'locales', 'en.default.json'), 'utf8'),
);

/** One translation by dotted key, with {{ name }} placeholders filled. */
function t(key, replacements = {}) {
  const value = key.split('.').reduce((node, part) => node?.[part], translations);
  if (typeof value !== 'string') return undefined;
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
    name in replacements ? String(replacements[name]) : match,
  );
}

/** Static marketing routes. `page` supplies the Liquid `page` object. */
export const ROUTES = {
  '/': {
    page_type: 'index',
    template: 'templates/index.json',
    page_title: 'Your Coffee. Your Brand. Our Roastery.',
  },
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
  '/pages/own-an-azouz-coffee': {
    page_type: 'page',
    template: 'templates/page.own-an-azouz-coffee.json',
    page: { title: 'Own an Azouz Coffee', handle: 'own-an-azouz-coffee', content: '' },
  },
  '/pages/request-a-sample': {
    page_type: 'page',
    template: 'templates/page.enquiry.json',
    page: { title: 'Request a Sample', handle: 'request-a-sample', content: '' },
  },
  '/pages/get-a-quote': {
    page_type: 'page',
    template: 'templates/page.get-a-quote.json',
    page: { title: 'Get a Quote', handle: 'get-a-quote', content: '' },
  },
};

/** Which JSON template a static route renders. */
export function templateForRoute(route) {
  if (route.template) return route.template;
  return route.page_type === 'index' ? 'templates/index.json' : 'templates/page.json';
}

const ACCOUNT_ROUTES = {
  '/account': {
    page_type: 'customers/account',
    template: 'templates/customers/account.json',
    title_key: 'customer.account.title',
  },
  '/account/login': {
    page_type: 'customers/login',
    template: 'templates/customers/login.json',
    title_key: 'customer.login.title',
  },
  '/account/register': {
    page_type: 'customers/register',
    template: 'templates/customers/register.json',
    title_key: 'customer.register.title',
  },
  '/account/addresses': {
    page_type: 'customers/addresses',
    template: 'templates/customers/addresses.json',
    title_key: 'customer.addresses.title',
  },
  '/account/recover': {
    page_type: 'customers/reset_password',
    template: 'templates/customers/reset_password.json',
    title_key: 'customer.recover_password.title',
  },
  '/account/activate': {
    page_type: 'customers/activate_account',
    template: 'templates/customers/activate_account.json',
    title_key: 'customer.activate_account.title',
  },
};

const notFound = () => ({
  page_type: '404',
  template: 'templates/404.json',
  scope: { page_title: t('general.404.title') },
});

/**
 * @param {string} pathname
 * @param {URLSearchParams} [query]
 * @returns {{page_type: string, template: string, scope: object}}
 */
export function resolveRoute(pathname, query = new URLSearchParams()) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const fixtures = buildFixtures();

  const marketing = ROUTES[path];
  if (marketing) {
    return {
      page_type: marketing.page_type,
      template: templateForRoute(marketing),
      scope: {
        page: marketing.page ?? null,
        ...(marketing.page_title || marketing.page?.title
          ? { page_title: marketing.page_title || marketing.page.title }
          : {}),
      },
    };
  }

  const product = /^\/products\/([\w-]+)$/.exec(path);
  if (product) {
    const found = fixtures.products.find((item) => item.handle === product[1]);
    if (!found) return notFound();
    const variantId = query.get('variant');
    const selected = variantId
      ? found.variants.find((variant) => String(variant.id) === variantId)
      : null;
    return {
      page_type: 'product',
      template: 'templates/product.json',
      scope: {
        product: selected
          ? { ...found, selected_or_first_available_variant: selected }
          : found,
        collection: fixtures.collections.all,
        page_title: found.title,
      },
    };
  }

  const collection = /^\/collections\/([\w-]+)$/.exec(path);
  if (collection) {
    const found = fixtures.collections[collection[1]];
    if (!found) return notFound();
    return {
      page_type: 'collection',
      template: 'templates/collection.json',
      scope: { collection: found, page_title: found.title },
    };
  }

  if (path === '/collections') {
    return {
      page_type: 'list-collections',
      template: 'templates/list-collections.json',
      scope: {
        collections: Object.values(fixtures.collections),
        page_title: t('collections.general.title'),
      },
    };
  }

  // /blogs/<blog>/tagged/<tag> renders the blog template with current_tags set,
  // which is the only thing that distinguishes it from the unfiltered listing.
  const taggedBlog = /^\/blogs\/([\w-]+)\/tagged\/([\w-]+)$/.exec(path);
  if (taggedBlog) {
    const blog = buildBlogFixture();
    if (taggedBlog[1] !== blog.handle) return notFound();
    const tag = blog.all_tags.find((name) => handleize(name) === taggedBlog[2]);
    if (!tag) return notFound();
    const articles = blog.articles.filter((item) => item.tags.includes(tag));
    return {
      page_type: 'blog',
      template: 'templates/blog.json',
      scope: {
        blog: { ...blog, articles, articles_count: articles.length },
        current_tags: [tag],
        page_title: `${blog.title} — ${tag}`,
      },
    };
  }

  const articlePath = /^\/blogs\/([\w-]+)\/([\w-]+)$/.exec(path);
  if (articlePath) {
    const blog = buildBlogFixture();
    if (articlePath[1] !== blog.handle) return notFound();
    const found = blog.articles.find((item) => item.handle === articlePath[2]);
    if (!found) return notFound();
    return {
      page_type: 'article',
      template: 'templates/article.json',
      scope: { blog, article: found, page_title: found.title },
    };
  }

  const blogPath = /^\/blogs\/([\w-]+)$/.exec(path);
  if (blogPath) {
    const blog = buildBlogFixture();
    if (blogPath[1] !== blog.handle) return notFound();
    return {
      page_type: 'blog',
      template: 'templates/blog.json',
      scope: { blog, current_tags: [], page_title: blog.title },
    };
  }

  if (path === '/cart') {
    return {
      page_type: 'cart',
      template: 'templates/cart.json',
      scope: { cart: buildCart(), page_title: t('cart.general.title') },
    };
  }

  if (path === '/search') {
    return {
      page_type: 'search',
      template: 'templates/search.json',
      scope: {
        search: buildSearchFixture(query.get('q') ?? ''),
        page_title: t('general.search.title'),
      },
    };
  }

  // Shopify's issued-card url is /gift_cards/<shop id>/<token>. The template
  // is a standalone .liquid document — it declares {% layout none %} and the
  // server renders it without the storefront layout.
  const giftCard = /^\/gift_cards\/\d+\/([\w-]+)$/.exec(path);
  if (giftCard) {
    return {
      page_type: 'gift_card',
      template: 'templates/gift_card.liquid',
      scope: { gift_card: buildGiftCardFixture(query.get('state') ?? '') },
    };
  }

  if (path === '/password') {
    return { page_type: 'password', template: 'templates/password.json', scope: {} };
  }

  const order = /^\/account\/orders\/(\d+)$/.exec(path);
  if (order) {
    const customer = buildCustomerFixture();
    const found = customer.orders.find((item) => String(item.order_number) === order[1]);
    if (!found) return notFound();
    return {
      page_type: 'customers/order',
      template: 'templates/customers/order.json',
      scope: {
        customer,
        order: found,
        page_title: t('customer.order.title', { name: found.name }),
      },
    };
  }

  const account = ACCOUNT_ROUTES[path];
  if (account) {
    const { title_key: titleKey, ...route } = account;
    return {
      ...route,
      scope: { customer: buildCustomerFixture(), page_title: t(titleKey) },
    };
  }

  return notFound();
}

/** Every path the preview advertises on startup and the route test walks. */
export function listPreviewPaths() {
  return [
    ...Object.keys(ROUTES),
    '/collections',
    '/collections/all',
    '/products/wadi-rum-blend',
    '/blogs/journal',
    '/blogs/journal/what-private-label-coffee-actually-involves',
    '/blogs/journal/tagged/private-label',
    '/cart',
    '/search',
    '/password',
    '/gift_cards/1/azou1h7g3k9m2p',
    ...Object.keys(ACCOUNT_ROUTES),
    '/account/orders/1002',
    '/404',
  ];
}
