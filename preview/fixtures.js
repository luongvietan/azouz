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
