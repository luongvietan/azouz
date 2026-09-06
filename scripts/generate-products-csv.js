/**
 * Generate the Shopify product import CSV.
 *
 * This is the file the client edits: titles, prices and stock live here, not in
 * the theme. Import it from Products → Import in the Shopify admin.
 *
 * The catalogue is read from `preview/fixtures.js` so the shop the preview
 * renders and the shop the store imports cannot drift apart. Prices are the
 * placeholders recorded in PRODUCT.md — the client overwrites them here.
 *
 * Two things the theme depends on and a hand-made CSV usually misses:
 *
 *   Metafields. The label block's colour, the roast meter, the tasting notes
 *   and the spec grid all read `product.metafields.custom.*`. Without these
 *   columns the cards render as bare titles. The matching definitions have to
 *   exist in the store first (Settings → Custom data → Products), or Shopify
 *   imports the values but nothing can read them back reliably.
 *
 *   Images. `Image Src` must be a URL Shopify can fetch. Local files cannot be
 *   referenced, so images are left blank unless a base URL is supplied with
 *   --image-base, e.g. after uploading the photography to Content → Files.
 *
 * Run: node scripts/generate-products-csv.js [--image-base https://…/files/]
 *      -> dist/products.csv
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildFixtures } from '../preview/fixtures.js';
import { DIST_DIR } from './theme-paths.js';

/** Columns Shopify reads on import, in the order its own export uses. */
export const COLUMNS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Option2 Name',
  'Option2 Value',
  'Variant SKU',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Status',
  'Metafield: custom.roast_level [number_integer]',
  'Metafield: custom.tasting_notes [list.single_line_text_field]',
  'Metafield: custom.origin [single_line_text_field]',
  'Metafield: custom.process [single_line_text_field]',
  'Metafield: custom.altitude [single_line_text_field]',
  'Metafield: custom.brew_methods [list.single_line_text_field]',
  'Metafield: custom.label_color [color]',
];

/** Shopify stores money in minor units; the CSV wants a decimal string. */
const money = (minor) => (minor / 100).toFixed(3);

/** RFC 4180: quote every field, double any embedded quote. */
const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

/** A metafield list type is imported as a JSON array. */
const list = (values) => JSON.stringify(values ?? []);

/**
 * Turn the fixture catalogue into CSV rows — one row per variant, with the
 * product-level columns filled on the first row only, which is how Shopify
 * groups rows into a product.
 *
 * @param {object} [options]
 * @param {string} [options.imageBase] prefix turning `espresso-arabica-beans.jpg` into a URL
 */
export function buildRows({ imageBase = '' } = {}) {
  const { products } = buildFixtures();
  const rows = [];

  for (const product of products) {
    const custom = product.metafields?.custom ?? {};
    const [optionOne, optionTwo] = product.options_with_values ?? [];

    product.variants.forEach((variant, index) => {
      const first = index === 0;
      const imageFile = `${product.handle}.jpg`;

      rows.push({
        Handle: product.handle,
        Title: first ? product.title : '',
        'Body (HTML)': first ? `<p>${product.description}</p>` : '',
        Vendor: first ? product.vendor : '',
        Type: first ? product.type : '',
        Tags: first ? (product.tags ?? []).join(', ') : '',
        Published: first ? 'TRUE' : '',
        'Option1 Name': first ? (optionOne?.name ?? '') : '',
        'Option1 Value': variant.option1 ?? '',
        'Option2 Name': first ? (optionTwo?.name ?? '') : '',
        'Option2 Value': variant.option2 ?? '',
        'Variant SKU': String(variant.id),
        'Variant Inventory Tracker': 'shopify',
        'Variant Inventory Qty': String(variant.inventory_quantity ?? 0),
        'Variant Inventory Policy': 'deny',
        'Variant Fulfillment Service': 'manual',
        'Variant Price': money(variant.price),
        'Variant Compare At Price': variant.compare_at_price ? money(variant.compare_at_price) : '',
        'Variant Requires Shipping': 'TRUE',
        'Variant Taxable': 'TRUE',
        'Image Src': first && imageBase ? `${imageBase.replace(/\/$/, '')}/${imageFile}` : '',
        'Image Position': first && imageBase ? '1' : '',
        'Image Alt Text': first ? product.title : '',
        Status: first ? 'active' : '',

        'Metafield: custom.roast_level [number_integer]':
          first ? String(custom.roast_level?.value ?? '') : '',
        'Metafield: custom.tasting_notes [list.single_line_text_field]':
          first ? list(custom.tasting_notes?.value) : '',
        'Metafield: custom.origin [single_line_text_field]':
          first ? (custom.origin?.value ?? '') : '',
        'Metafield: custom.process [single_line_text_field]':
          first ? (custom.process?.value ?? '') : '',
        'Metafield: custom.altitude [single_line_text_field]':
          first ? (custom.altitude?.value ?? '') : '',
        'Metafield: custom.brew_methods [list.single_line_text_field]':
          first ? list(custom.brew_methods?.value) : '',
        'Metafield: custom.label_color [color]':
          first ? (custom.label_color?.value ?? '') : '',
      });
    });
  }

  return rows;
}

/** @returns {string} the complete CSV document */
export function buildCsv(options) {
  const rows = buildRows(options);
  const lines = [COLUMNS.map(csvEscape).join(',')];
  for (const row of rows) lines.push(COLUMNS.map((column) => csvEscape(row[column])).join(','));
  return `${lines.join('\r\n')}\r\n`; // Shopify's own exports use CRLF
}

export async function writeProductsCsv(options = {}) {
  const csv = buildCsv(options);
  await mkdir(DIST_DIR, { recursive: true });
  const file = join(DIST_DIR, 'products.csv');
  await writeFile(file, csv, 'utf8');
  return { file, rows: buildRows(options).length, bytes: Buffer.byteLength(csv) };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const flag = process.argv.indexOf('--image-base');
  const imageBase = flag > -1 ? process.argv[flag + 1] : '';
  const { file, rows } = await writeProductsCsv({ imageBase });
  console.log(`Wrote ${rows} variant rows to ${file}${imageBase ? '' : ' (no image URLs — pass --image-base)'}.`);
}
