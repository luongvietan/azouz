/**
 * Fake Shopify objects for local preview.
 * Product data mirrors the packaging mockups supplied by the client.
 * Prices are placeholders — see dist/products.csv for the values the client edits.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_DIR } from '../scripts/theme-paths.js';
import { imageDrop } from './media-drops.js';

function themeSettings() {
  try {
    const data = JSON.parse(readFileSync(join(THEME_DIR, 'config/settings_data.json'), 'utf8'));
    return data.current ?? {};
  } catch {
    return {};
  }
}

const metafield = (value, type) => ({ value, type });

function makeBlend({ handle, title, roast, notes, labelColor, description, soldOut, saleOn, extraImages = [] }) {
  const url = `/products/${handle}`;

  const variant = ({ id, weight, grind, price, compareAt = null }) => ({
    id,
    title: `${weight} / ${grind}`,
    option1: weight,
    option2: grind,
    options: [weight, grind],
    price,
    compare_at_price: compareAt,
    available: id !== soldOut,
    url: `${url}?variant=${id}`,
    featured_image: imageDrop(`/preview-media/${handle}.jpg`, title),
    inventory_quantity: id === soldOut ? 0 : 25,
  });

  const variants = [
    variant({
      id: `${handle}-250-wb`,
      weight: '250g',
      grind: 'Whole Bean',
      price: 750,
      compareAt: saleOn === `${handle}-250-wb` ? 900 : null,
    }),
    variant({ id: `${handle}-1kg-wb`, weight: '1kg', grind: 'Whole Bean', price: 2600 }),
    variant({ id: `${handle}-1kg-esp`, weight: '1kg', grind: 'Espresso', price: 2600 }),
  ];

  const available = variants.filter((item) => item.available);

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
    available: available.length > 0,
    price: variants[0].price,
    price_min: 750,
    price_max: 2600,
    compare_at_price: variants[0].compare_at_price,
    options: ['Weight', 'Grind'],
    options_with_values: [
      { name: 'Weight', values: ['250g', '1kg'] },
      { name: 'Grind', values: ['Whole Bean', 'Espresso'] },
    ],
    variants,
    selected_or_first_available_variant: available[0] ?? variants[0],
    featured_image: imageDrop(`/preview-media/${handle}.jpg`, title),
    images: [`/preview-media/${handle}.jpg`, ...extraImages].map((path) => imageDrop(path, title)),
    tags: ['espresso', 'arabica'],
    type: 'Coffee',
    vendor: 'Azouz Coffee',
    metafields: {
      custom: {
        roast_level: metafield(roast, 'number_integer'),
        tasting_notes: metafield(notes, 'list.single_line_text_field'),
        origin: metafield('Blend', 'single_line_text_field'),
        process: metafield('Washed', 'single_line_text_field'),
        altitude: metafield('1,400–1,900 masl', 'single_line_text_field'),
        brew_methods: metafield(['Espresso', 'Moka Pot'], 'list.single_line_text_field'),
        label_color: metafield(labelColor, 'color'),
      },
    },
  };
}

export function buildFixtures() {
  const products = [
    makeBlend({
      handle: 'wadi-rum-blend',
      title: 'Wadi Rum Blend',
      roast: 4,
      notes: ['Dark Chocolate', 'Caramel', 'Spice'],
      labelColor: '#C4562E',
      description: 'An espresso roast built for depth — dark chocolate and caramel with a warm spice finish.',
      extraImages: ['/preview-media/wadi-rum-blend-alt.jpg'],
    }),
    makeBlend({
      handle: 'dead-sea-blend',
      title: 'Dead Sea Blend',
      roast: 4,
      notes: ['Dark Chocolate', 'Toffee', 'Balanced'],
      labelColor: '#BFDDD3',
      description: 'Balanced and rounded, with dark chocolate and toffee through the cup.',
      soldOut: 'dead-sea-blend-1kg-esp',
    }),
    makeBlend({
      handle: 'downtown-blend',
      title: 'Downtown Blend',
      roast: 4,
      notes: ['Chocolate', 'Caramel', 'Smooth'],
      labelColor: '#7C7F44',
      description: 'Smooth and approachable — chocolate and caramel, made for milk drinks.',
      saleOn: 'downtown-blend-250-wb',
    }),
    {
      id: 'filtered-coffee-bags',
      handle: 'filtered-coffee-bags',
      title: 'Filtered Coffee Bags',
      description: 'Single-serve filter bags, 12 g each. Specialty coffee wherever you are.',
      url: '/products/filtered-coffee-bags',
      available: true,
      price: 900,
      price_min: 900,
      price_max: 900,
      compare_at_price: null,
      options: ['Weight', 'Grind'],
      options_with_values: [
        { name: 'Weight', values: ['Box of 10'] },
        { name: 'Grind', values: ['Filter'] },
      ],
      variants: [
        {
          id: 'fcb-box10',
          title: 'Box of 10 / Filter',
          option1: 'Box of 10',
          option2: 'Filter',
          options: ['Box of 10', 'Filter'],
          price: 900,
          compare_at_price: null,
          available: true,
          url: '/products/filtered-coffee-bags?variant=fcb-box10',
          featured_image: imageDrop('/preview-media/filtered-coffee-bags.jpg', 'Filtered Coffee Bags'),
          inventory_quantity: 40,
        },
      ],
      selected_or_first_available_variant: {
        id: 'fcb-box10',
        title: 'Box of 10 / Filter',
        option1: 'Box of 10',
        option2: 'Filter',
        options: ['Box of 10', 'Filter'],
        price: 900,
        compare_at_price: null,
        available: true,
        url: '/products/filtered-coffee-bags?variant=fcb-box10',
        featured_image: imageDrop('/preview-media/filtered-coffee-bags.jpg', 'Filtered Coffee Bags'),
        inventory_quantity: 40,
      },
      featured_image: imageDrop('/preview-media/filtered-coffee-bags.jpg', 'Filtered Coffee Bags'),
      images: [imageDrop('/preview-media/filtered-coffee-bags.jpg', 'Filtered Coffee Bags')],
      tags: ['filter'],
      type: 'Coffee',
      vendor: 'Azouz Coffee',
      metafields: {
        custom: {
          roast_level: metafield(4, 'number_integer'),
          tasting_notes: metafield(['Rich', 'Full Bodied'], 'list.single_line_text_field'),
          origin: metafield('Blend', 'single_line_text_field'),
          process: metafield('Washed', 'single_line_text_field'),
          altitude: metafield('1,400 masl', 'single_line_text_field'),
          brew_methods: metafield(['Pour Over'], 'list.single_line_text_field'),
          label_color: metafield('#303030', 'color'),
        },
      },
    },
  ];

  const allCollection = {
    id: 'all',
    handle: 'all',
    title: 'Our Coffee',
    description: 'Espresso, Turkish, specialty and filter coffee, roasted in Jordan.',
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
          { title: 'Our Brands', url: '/pages/our-brands', active: false, links: [] },
          { title: 'Shop', url: '/collections/all', active: false, links: [] },
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
      image: '/preview-media/wadi-rum-blend-alt.jpg',
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
      image: '/preview-media/dead-sea-blend.jpg',
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
      image: '/preview-media/downtown-blend.jpg',
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
    subtotal_price: 4100,
    total_price: 4400,
    shipping_price: 300,
    customer_url: '/account/orders/1002',
    shipping_address: ADDRESS,
    billing_address: ADDRESS,
    line_items: [
      {
        id: 'line-1',
        title: 'Wadi Rum Blend — 1kg / Whole Bean',
        product: products[0],
        variant: products[0].variants[1],
        quantity: 1,
        price: 2600,
        line_price: 2600,
        image: products[0].featured_image,
        url: products[0].url,
      },
      {
        id: 'line-2',
        title: 'Dead Sea Blend — 250g / Whole Bean',
        product: products[1],
        variant: products[1].variants[0],
        quantity: 2,
        price: 750,
        line_price: 1500,
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
    total_spent: 4400,
    orders: [order],
    default_address: ADDRESS,
    addresses: [ADDRESS],
    addresses_count: 1,
  };
}
