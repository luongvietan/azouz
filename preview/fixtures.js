/**
 * Fake Shopify objects for local preview.
 * Product data mirrors the packaging mockups supplied by the client.
 * Prices are placeholders — see dist/products.csv for the values the client edits.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_DIR } from '../scripts/theme-paths.js';
import { parseThemeJson } from '../scripts/theme-json.js';
import { imageDrop } from './media-drops.js';

function themeSettings() {
  try {
    const source = readFileSync(join(THEME_DIR, 'config/settings_data.json'), 'utf8');
    const data = parseThemeJson(source, 'config/settings_data.json');
    return data.current ?? {};
  } catch {
    return {};
  }
}

const metafield = (value, type) => ({ value, type });

/**
 * One bag from the Azouz retail range.
 *
 * Every product the client sells ships in a single size and a single grind, so
 * a bag is one variant. The Weight and Grind options stay on the product all
 * the same: they are what the store is set up with, and a 1kg espresso later
 * has to arrive as another variant row rather than as a new option.
 */
function makeBag({
  handle,
  title,
  weight,
  grind,
  price,
  roast,
  notes,
  labelColor,
  tags,
  description,
  brewMethods,
  extraImages = [],
}) {
  const url = `/products/${handle}`;
  const image = imageDrop(`/preview-media/${handle}.jpg`, title);
  const variantId = `${handle}-${weight}`;

  const variant = {
    id: variantId,
    title: `${weight} / ${grind}`,
    option1: weight,
    option2: grind,
    options: [weight, grind],
    price,
    compare_at_price: null,
    available: true,
    url: `${url}?variant=${variantId}`,
    featured_image: image,
    inventory_quantity: 25,
  };

  return {
    id: handle,
    handle,
    title,
    // Shopify stamps object_type on every drop that can appear in search
    // results. main-search relies on it to keep pages and articles out of the
    // product grid, so the fixture has to carry it too.
    object_type: 'product',
    description,
    url,
    available: true,
    price,
    price_min: price,
    price_max: price,
    compare_at_price: null,
    options: ['Weight', 'Grind'],
    options_with_values: [
      { name: 'Weight', values: [weight] },
      { name: 'Grind', values: [grind] },
    ],
    variants: [variant],
    selected_or_first_available_variant: variant,
    featured_image: image,
    images: [`/preview-media/${handle}.jpg`, ...extraImages].map((path) => imageDrop(path, title)),
    tags,
    type: 'Coffee',
    vendor: 'Azouz Coffee',
    metafields: {
      custom: {
        roast_level: metafield(roast, 'number_integer'),
        tasting_notes: metafield(notes, 'list.single_line_text_field'),
        // Origin, process and altitude are printed on none of the three bags
        // and the client has not supplied them. Every read of them is guarded,
        // so blank shortens the spec list rather than leaving an empty row —
        // and dist/products.csv still carries the columns to fill in.
        origin: metafield('', 'single_line_text_field'),
        process: metafield('', 'single_line_text_field'),
        altitude: metafield('', 'single_line_text_field'),
        brew_methods: metafield(brewMethods, 'list.single_line_text_field'),
        label_color: metafield(labelColor, 'color'),
      },
    },
  };
}

export function buildFixtures() {
  /*
    The three products the client actually sells, with the prices and pack
    sizes supplied on 2026-09-07. Label colours are sampled off the packaging
    photography in preview/media: navy for the espresso bag, the pale blue of
    the Turkish sachet, the yellow of the filter can. label-ink picks the ink
    from the fill's brightness, so the two pale ones take Onyx type.
  */
  const products = [
    makeBag({
      handle: 'espresso-arabica-beans',
      title: 'Espresso Arabica Beans',
      weight: '500g',
      grind: 'Whole Bean',
      price: 750,
      roast: 3,
      notes: ['100% Arabica', 'Medium Roast'],
      labelColor: '#1E2B55',
      tags: ['espresso', 'whole bean'],
      description: 'Medium roast Arabica beans for espresso, in a 500g valve bag.',
      brewMethods: ['Espresso'],
      extraImages: ['/preview-media/espresso-arabica-beans-alt.jpg'],
    }),
    makeBag({
      handle: 'turkish-coffee',
      title: 'Turkish Coffee',
      weight: '200g',
      grind: 'Ground',
      price: 280,
      roast: 3,
      notes: ['100% Arabica', 'Cardamom'],
      labelColor: '#A9C8E5',
      tags: ['turkish', 'ground'],
      description:
        'Medium roast 100% Arabica, ground with cardamom. Add 3 tsp to 125ml of water, and store the sachet somewhere cool and dry, away from strong odours.',
      brewMethods: ['Turkish Pot'],
      extraImages: ['/preview-media/turkish-coffee-alt.jpg'],
    }),
    makeBag({
      handle: 'filter-coffee-can',
      title: 'Filter Coffee Can',
      weight: '400g',
      grind: 'Ground',
      price: 725,
      roast: 3,
      notes: ['Medium Roast', 'Filter Grind'],
      labelColor: '#F5AF13',
      tags: ['filter', 'ground'],
      description: 'Medium roast ground coffee in a 400g resealable can, for filter machines and the French press.',
      brewMethods: ['Filter Machine', 'French Press'],
    }),
  ];

  const allCollection = {
    id: 'all',
    handle: 'all',
    title: 'Our Coffee',
    description: 'Espresso beans, Turkish coffee and filter coffee, roasted in Jordan.',
    url: '/collections/all',
    products,
    products_count: products.length,
    all_products_count: products.length,
    image: null,
    // Shopify supplies the option list and the currently applied sort; the
    // theme renders whatever the merchant enabled rather than a fixed list.
    sort_options: [
      { name: 'Featured', value: 'manual' },
      { name: 'Price, low to high', value: 'price-ascending' },
      { name: 'Price, high to low', value: 'price-descending' },
      { name: 'Alphabetically, A-Z', value: 'title-ascending' },
      { name: 'Date, new to old', value: 'created-descending' },
    ],
    default_sort_by: 'manual',
    sort_by: null,
  };

  return {
    shop: {
      name: 'Azouz Coffee',
      description: 'Specialty coffee roasters. Private label, wholesale and retail coffee, roasted in Jordan.',
      url: 'https://www.azouzcoffee.com',
      domain: 'www.azouzcoffee.com',
      currency: 'JOD',
      money_format: '{{ amount }} JOD',
      email: 'hello@azouzcoffee.com',
      phone: '',
      address: { city: 'Amman', country: 'Jordan' },
      // Shopify exposes only the policies the merchant has actually written;
      // an unset policy is nil, which is why the footer guards each one.
      policies: [
        { title: 'Privacy policy', url: '/policies/privacy-policy' },
        { title: 'Terms of service', url: '/policies/terms-of-service' },
        { title: 'Refund policy', url: '/policies/refund-policy' },
      ],
    },
    cart: { item_count: 0, items: [], total_price: 0, currency: 'JOD', note: null },
    collections: { all: allCollection },
    products,
    linklists: {
      'main-menu': {
        links: [
          { title: 'Private Label', url: '/pages/private-label', active: false, links: [] },
          { title: 'Wholesale', url: '/pages/wholesale', active: false, links: [] },
          { title: 'Own an Azouz Coffee', url: '/pages/own-an-azouz-coffee', active: false, links: [] },
          { title: 'Our Brands', url: '/pages/our-brands', active: false, links: [] },
          {
            title: 'Shop',
            url: '/collections/all',
            active: false,
            // One nested menu, so the header's no-script disclosure is exercised
            // by the preview and by tests rather than only on a live store.
            links: [
              { title: 'All coffee', url: '/collections/all', active: false, links: [] },
              { title: 'Espresso blends', url: '/collections/all', active: false, links: [] },
              { title: 'Filter coffee', url: '/collections/all', active: false, links: [] },
            ],
          },
          { title: 'Journal', url: '/blogs/journal', active: false, links: [] },
        ],
      },
      footer: {
        links: [
          { title: 'Private Label', url: '/pages/private-label', active: false, links: [] },
          { title: 'Wholesale', url: '/pages/wholesale', active: false, links: [] },
          { title: 'Shop', url: '/collections/all', active: false, links: [] },
        ],
      },
    },
    routes: {
      root_url: '/',
      cart_url: '/cart',
      cart_add_url: '/cart/add',
      cart_change_url: '/cart/change',
      search_url: '/search',
      predictive_search_url: '/search/suggest',
      all_products_collection_url: '/collections/all',
      account_url: '/account',
      account_login_url: '/account/login',
    },
    settings: themeSettings(),
    request: { locale: { iso_code: 'en', endonym_name: 'English' }, page_type: 'index', design_mode: false },
    canonical_url: 'https://www.azouzcoffee.com/',
    page_title: 'Azouz Coffee',
    page_description: 'Specialty coffee roasters in Jordan.',
    content_for_header: '',
    content_for_layout: '',
    powered_by_link: '',
  };
}

/**
 * A Shopify `search` drop. Matching is a plain substring test over the title
 * and the tasting notes — enough to review the results, empty and no-results
 * states. Predictive search is a server-side Shopify API with no local
 * equivalent and is out of scope.
 *
 * @param {string} terms
 */
export function buildSearchFixture(terms = '') {
  const query = String(terms).trim().toLowerCase();
  if (query === '') {
    return { performed: false, terms: '', results: [], results_count: 0, types: ['product'] };
  }

  const { products } = buildFixtures();
  const results = products.filter((product) => {
    const notes = (product.metafields.custom.tasting_notes.value ?? []).join(' ');
    return `${product.title} ${notes}`.toLowerCase().includes(query);
  });

  return {
    performed: true,
    terms: String(terms),
    results,
    results_count: results.length,
    types: ['product'],
  };
}

/**
 * A Shopify `blog` drop with its articles.
 *
 * The blog handle is the merchant's to choose in the admin; `journal` is the
 * one the preview navigation links to. Real posts are the client's to write —
 * these exist so the templates can be reviewed with prose in them.
 *
 * `comments_enabled?` and `moderated?` carry the trailing question mark
 * Shopify uses, and the plain names too, so a condition written either way
 * resolves in preview exactly as it does live.
 */
export function buildBlogFixture() {
  const article = ({ handle, title, published, author, image, excerpt, content, tags, comments = [] }) => ({
    id: handle,
    handle,
    title,
    url: `/blogs/journal/${handle}`,
    published_at: published,
    created_at: published,
    author,
    // No alt on the drop: a merchant who has not written alt text is the
    // common case, and the section must render correctly for it. The article
    // title is deliberately not reused — the h1 above the image already says it.
    image: image ? imageDrop(image, '') : null,
    excerpt,
    excerpt_or_content: excerpt || content,
    content,
    tags,
    comments,
    comments_count: comments.length,
    comment_post_url: '/comments',
  });

  const articles = [
    article({
      handle: 'what-private-label-coffee-actually-involves',
      title: 'What private label coffee actually involves',
      published: '2026-07-28T09:00:00Z',
      author: 'Azouz Coffee',
      image: '/preview-media/espresso-arabica-beans-alt.jpg',
      excerpt: 'From the first cupping to a pallet of your own bags — the steps, and what we need from you at each one.',
      content:
        '<p>Private label starts with a conversation about what you pour today and what you want it to taste like.</p>' +
        '<h2>Cupping and profile</h2><p>We roast two or three profiles against your brief and taste them together.</p>' +
        '<h2>Packaging</h2><p>Your artwork on our bags, or your own bags shipped to the roastery.</p>',
      tags: ['Private label', 'Process'],
      comments: [
        {
          id: 'comment-1',
          author: 'Layla Haddad',
          created_at: '2026-07-29T11:20:00Z',
          content: '<p>Useful breakdown — the packaging lead time is the part we always underestimate.</p>',
        },
      ],
    }),
    article({
      handle: 'choosing-a-house-espresso',
      title: 'Choosing a house espresso',
      published: '2026-07-14T09:00:00Z',
      author: 'Azouz Coffee',
      image: '/preview-media/filter-coffee-can.jpg',
      excerpt: 'A house espresso has to hold up in milk, survive a busy bar, and still taste like a decision rather than a default.',
      content:
        '<p>Most cafés taste espresso black and then serve nine drinks in ten with milk.</p>' +
        '<h2>Taste it the way you sell it</h2><p>Pull the shot, then pull it again into the drink your customers actually order.</p>',
      tags: ['Wholesale', 'Espresso'],
    }),
    article({
      handle: 'roasting-notes-turkish-coffee',
      title: 'Roasting notes: Turkish coffee',
      published: '2026-06-30T09:00:00Z',
      author: 'Azouz Coffee',
      image: '/preview-media/turkish-coffee.jpg',
      excerpt: 'Ground finer than anything else we make, and roasted for a cup that is boiled rather than brewed.',
      content: '<p>Turkish coffee is unforgiving of a roast that was built for a filter cone.</p>',
      tags: ['Turkish coffee'],
    }),
  ];

  return {
    id: 'journal',
    handle: 'journal',
    title: 'Journal',
    url: '/blogs/journal',
    articles,
    articles_count: articles.length,
    all_tags: ['Private label', 'Process', 'Wholesale', 'Espresso', 'Turkish coffee'],
    tags: [],
    comments_enabled: true,
    'comments_enabled?': true,
    moderated: false,
    'moderated?': false,
  };
}

/**
 * A Shopify `gift_card` drop as the issued-card template sees it.
 *
 * Shopify only ever serves this page with a real card behind it, so the states
 * that matter — part spent, expired, disabled — are otherwise unreviewable.
 * `?state=` on the preview url selects one, the same trick `?contact_errors=`
 * uses for the enquiry form.
 *
 * @param {string} [state] one of 'part-spent', 'spent', 'expired', 'disabled'
 */
export function buildGiftCardFixture(state = '') {
  const card = {
    code: 'azou1h7g3k9m2p',
    initial_value: 5000,
    balance: 5000,
    currency: 'JOD',
    enabled: true,
    expired: false,
    expires_on: '2027-08-17',
    url: '/gift_cards/1/azou1h7g3k9m2p',
    pass_url: '/gift_cards/1/azou1h7g3k9m2p.pkpass',
    qr_identifier: 'azou1h7g3k9m2p',
    customer: { first_name: 'Layla', last_name: 'Haddad' },
  };

  switch (state) {
    case 'part-spent':
      return { ...card, balance: 1750 };
    case 'spent':
      return { ...card, balance: 0 };
    case 'expired':
      return { ...card, expired: true, expires_on: '2026-06-30' };
    case 'disabled':
      return { ...card, enabled: false };
    default:
      return card;
  }
}

const ADDRESS = {
  id: 'addr-1',
  first_name: 'Layla',
  last_name: 'Haddad',
  company: 'Rainbow Street Coffee',
  address1: '12 Rainbow Street',
  address2: '',
  city: 'Amman',
  province: '',
  zip: '11181',
  country: 'Jordan',
  phone: '+962 7 9000 0000',
};

/**
 * A logged-in customer with one past order, for previewing the account pages.
 * There is no authentication in preview — the account routes always render as
 * though this customer is signed in.
 */
export function buildCustomerFixture() {
  const { products } = buildFixtures();

  const order = {
    id: 1002,
    name: '#1002',
    order_number: 1002,
    created_at: '2026-07-28T09:15:00Z',
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    subtotal_price: 1310,
    total_price: 1610,
    shipping_price: 300,
    customer_url: '/account/orders/1002',
    shipping_address: ADDRESS,
    billing_address: ADDRESS,
    line_items: [
      {
        id: 'line-1',
        title: 'Espresso Arabica Beans — 500g / Whole Bean',
        product: products[0],
        variant: products[0].variants[0],
        quantity: 1,
        price: 750,
        line_price: 750,
        image: products[0].featured_image,
        url: products[0].url,
      },
      {
        id: 'line-2',
        title: 'Turkish Coffee — 200g / Ground',
        product: products[1],
        variant: products[1].variants[0],
        quantity: 2,
        price: 280,
        line_price: 560,
        image: products[1].featured_image,
        url: products[1].url,
      },
    ],
  };

  return {
    id: 'cust-1',
    first_name: 'Layla',
    last_name: 'Haddad',
    name: 'Layla Haddad',
    email: 'layla@example.com',
    phone: ADDRESS.phone,
    accepts_marketing: false,
    orders_count: 1,
    total_spent: 1610,
    orders: [order],
    default_address: ADDRESS,
    addresses: [ADDRESS],
    addresses_count: 1,
  };
}
