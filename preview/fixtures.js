/**
 * Fake Shopify objects for local preview.
 * Product data mirrors the packaging mockups supplied by the client.
 * Prices are placeholders — see dist/products.csv for the values the client edits.
 */

const metafield = (value, type) => ({ value, type });

function makeBlend({ handle, title, roast, notes, labelColor, description }) {
  const variants = [
    { id: `${handle}-250-wb`, title: '250g / Whole Bean', option1: '250g', option2: 'Whole Bean', price: 750, available: true },
    { id: `${handle}-1kg-wb`, title: '1kg / Whole Bean', option1: '1kg', option2: 'Whole Bean', price: 2600, available: true },
    { id: `${handle}-1kg-esp`, title: '1kg / Espresso', option1: '1kg', option2: 'Espresso', price: 2600, available: true },
  ];
  return {
    id: handle,
    handle,
    title,
    description,
    url: `/products/${handle}`,
    available: true,
    price: variants[0].price,
    price_min: 750,
    price_max: 2600,
    compare_at_price: null,
    options: ['Weight', 'Grind'],
    options_with_values: [
      { name: 'Weight', values: ['250g', '1kg'] },
      { name: 'Grind', values: ['Whole Bean', 'Espresso'] },
    ],
    variants,
    selected_or_first_available_variant: variants[0],
    featured_image: `/preview-media/${handle}.jpg`,
    images: [`/preview-media/${handle}.jpg`],
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
    }),
    makeBlend({
      handle: 'dead-sea-blend',
      title: 'Dead Sea Blend',
      roast: 4,
      notes: ['Dark Chocolate', 'Toffee', 'Balanced'],
      labelColor: '#BFDDD3',
      description: 'Balanced and rounded, with dark chocolate and toffee through the cup.',
    }),
    makeBlend({
      handle: 'downtown-blend',
      title: 'Downtown Blend',
      roast: 4,
      notes: ['Chocolate', 'Caramel', 'Smooth'],
      labelColor: '#7C7F44',
      description: 'Smooth and approachable — chocolate and caramel, made for milk drinks.',
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
        { id: 'fcb-box10', title: 'Box of 10 / Filter', option1: 'Box of 10', option2: 'Filter', price: 900, available: true },
      ],
      selected_or_first_available_variant: {
        id: 'fcb-box10', title: 'Box of 10 / Filter', option1: 'Box of 10', option2: 'Filter', price: 900, available: true,
      },
      featured_image: '/preview-media/filtered-coffee-bags.jpg',
      images: ['/preview-media/filtered-coffee-bags.jpg'],
      tags: ['filter'],
      type: 'Coffee',
      vendor: 'Azouz Coffee',
      metafields: {
        custom: {
          roast_level: metafield(5, 'number_integer'),
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
    title: 'Azouz Coffee',
    description: 'Espresso, Turkish, specialty and filter coffee, roasted in Jordan.',
    url: '/collections/all',
    products,
    products_count: products.length,
    all_products_count: products.length,
    image: null,
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
          { title: 'Request a Sample', url: '/pages/request-a-sample', active: false, links: [] },
          { title: 'Get a Quote', url: '/pages/get-a-quote', active: false, links: [] },
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
    request: { locale: { iso_code: 'en', endonym_name: 'English' }, page_type: 'index', design_mode: false },
    canonical_url: 'https://www.azouzcoffee.com/',
    page_title: 'Azouz Coffee',
    page_description: 'Specialty coffee roasters in Jordan.',
    content_for_header: '',
    content_for_layout: '',
    powered_by_link: '',
  };
}
