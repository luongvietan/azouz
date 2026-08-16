/**
 * Shopify-specific Liquid filters, approximated closely enough for local preview.
 *
 * These exist so the real theme files render outside Shopify. They are NOT a
 * reimplementation of Shopify's behaviour — money formatting in particular is
 * indicative only; the live store formats via the shop's own money format string.
 */

const PLACEHOLDER = '/assets/placeholder.svg';

/**
 * LiquidJS (10.29.0) delivers each `key: value` filter argument as its own
 * `[key, value]` pair, appended flatly to the args list — e.g. `width: 600,
 * height: 800` arrives as `[["width", 600], ["height", 800]]`, not a single
 * trailing plain object.
 */
function keywordArgs(args) {
  const entries = args.filter((arg) => Array.isArray(arg) && arg.length === 2);
  return Object.fromEntries(entries);
}

export function handleize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Shopify `color_brightness`: W3C perceived brightness, 0–255.
 * Accepts `#RRGGBB`. Unknown input returns 0 so light-ink stays the default.
 */
export function colorBrightness(value) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(String(value ?? '').trim());
  if (!match) return 0;
  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/** Resolve a dotted key against a nested translations object. */
function lookupTranslation(translations, key) {
  return String(key)
    .split('.')
    .reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), translations);
}

export function registerShopifyFilters(engine, options = {}) {
  const {
    assetBase = '/assets/',
    currency = 'JOD',
    locale = 'en',
    translations = {},
  } = options;

  const moneyFormatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  });

  engine.registerFilter('asset_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('asset_img_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('file_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('shopify_asset_url', (value) => `${assetBase}${value}`);

  engine.registerFilter('image_url', (source, ...args) => {
    if (!source) return PLACEHOLDER;
    const { width, height, crop } = keywordArgs(args);
    const params = new URLSearchParams();
    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (crop) params.set('crop', String(crop));
    const query = params.toString();
    return query ? `${source}?${query}` : String(source);
  });

  engine.registerFilter('img_url', (source, size) => {
    if (!source) return PLACEHOLDER;
    return size ? `${source}?size=${size}` : String(source);
  });

  // Shopify stores money in the currency's minor units.
  const formatMoney = (cents) => moneyFormatter.format(Number(cents ?? 0) / 100);
  engine.registerFilter('money', formatMoney);
  engine.registerFilter('money_with_currency', (cents) => `${formatMoney(cents)} ${currency}`);
  engine.registerFilter('money_without_trailing_zeros', formatMoney);
  engine.registerFilter('money_without_currency', (cents) =>
    (Number(cents ?? 0) / 100).toFixed(2),
  );

  engine.registerFilter('handle', handleize);
  engine.registerFilter('handleize', handleize);
  engine.registerFilter('color_brightness', colorBrightness);

  engine.registerFilter('t', (key, ...args) => {
    const found = lookupTranslation(translations, key);
    if (typeof found !== 'string') return `translation missing: ${key}`;
    const values = keywordArgs(args);
    return found.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name) =>
      name in values ? String(values[name]) : whole,
    );
  });

  engine.registerFilter(
    'stylesheet_tag',
    (href) => `<link rel="stylesheet" href="${href}" media="all">`,
  );
  engine.registerFilter('script_tag', (src) => `<script src="${src}" defer="defer"></script>`);

  engine.registerFilter('within', (url, collection) =>
    collection?.handle ? `/collections/${collection.handle}${url}` : String(url),
  );

  engine.registerFilter('weight_with_unit', (grams, unit = 'g') => `${grams} ${unit}`);
  engine.registerFilter('link_to', (text, url) => `<a href="${url}">${text}</a>`);

  engine.registerFilter('default_pagination', (paginate) => {
    const pages = paginate?.pages ?? 1;
    if (pages <= 1) return '';
    return Array.from({ length: pages }, (unused, index) => {
      const page = index + 1;
      return page === paginate.current_page
        ? `<span class="page current">${page}</span>`
        : `<a href="?page=${page}">${page}</a>`;
    }).join(' ');
  });

  engine.registerFilter('payment_type_svg_tag', (type) => `<span class="payment-icon">${type}</span>`);
  engine.registerFilter('format_address', (address) =>
    [address?.address1, address?.city, address?.country].filter(Boolean).join('<br>'),
  );
  engine.registerFilter('font_face', () => '');
  engine.registerFilter('font_url', (value) => `${assetBase}${value}`);
  engine.registerFilter('highlight', (text) => text);
  engine.registerFilter('camelize', (value) =>
    String(value ?? '').replace(/[-_](\w)/g, (whole, char) => char.toUpperCase()),
  );
}
