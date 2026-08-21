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
  '/account': { page_type: 'customers/account', template: 'templates/customers/account.json' },
  '/account/login': { page_type: 'customers/login', template: 'templates/customers/login.json' },
  '/account/register': {
    page_type: 'customers/register',
    template: 'templates/customers/register.json',
  },
  '/account/addresses': {
    page_type: 'customers/addresses',
    template: 'templates/customers/addresses.json',
  },
  '/account/recover': {
    page_type: 'customers/reset_password',
    template: 'templates/customers/reset_password.json',
  },
  '/account/activate': {
    page_type: 'customers/activate_account',
    template: 'templates/customers/activate_account.json',
  },
};

const notFound = () => ({ page_type: '404', template: 'templates/404.json', scope: {} });

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
      scope: { collections: Object.values(fixtures.collections) },
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
    return { page_type: 'cart', template: 'templates/cart.json', scope: { cart: buildCart() } };
  }

  if (path === '/search') {
    return {
      page_type: 'search',
      template: 'templates/search.json',
      scope: { search: buildSearchFixture(query.get('q') ?? '') },
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
      scope: { customer, order: found },
    };
  }

  const account = ACCOUNT_ROUTES[path];
  if (account) {
    return { ...account, scope: { customer: buildCustomerFixture() } };
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
