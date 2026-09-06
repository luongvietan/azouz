import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCsv, buildRows, COLUMNS } from '../scripts/generate-products-csv.js';
import { buildFixtures } from '../preview/fixtures.js';

/** The CRLF line ending RFC 4180 asks for, and generate-products-csv writes. */
const SEP = String.fromCharCode(13, 10);

/** Split one CSV line honouring quoted fields. */
function splitCsvLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { fields.push(field); field = ''; }
    else field += char;
  }
  fields.push(field);
  return fields;
}

test('there is one row per variant across the whole catalogue', () => {
  const { products } = buildFixtures();
  const variants = products.reduce((total, product) => total + product.variants.length, 0);
  assert.equal(buildRows().length, variants);
});

test('every row has exactly as many fields as the header', () => {
  const lines = buildCsv().trim().split('\r\n');
  const width = splitCsvLine(lines[0]).length;
  assert.equal(width, COLUMNS.length);
  lines.forEach((line, index) => {
    assert.equal(splitCsvLine(line).length, width, `row ${index} is ragged`);
  });
});

test('product-level columns are filled only on a product\'s first row', () => {
  // Shopify groups consecutive rows by Handle; repeating the title on every
  // row is how people accidentally create four products called "1kg".
  const rows = buildRows();
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.Handle)) {
      assert.equal(row.Title, '', `${row.Handle} repeats its title on a variant row`);
      assert.equal(row['Body (HTML)'], '', `${row.Handle} repeats its description`);
    } else {
      assert.notEqual(row.Title, '', `${row.Handle} has no title on its first row`);
      seen.add(row.Handle);
    }
  }
  assert.equal(seen.size, buildFixtures().products.length);
});

test('prices are decimal strings in the shop currency, not minor units', () => {
  for (const row of buildRows()) {
    assert.match(row['Variant Price'], /^\d+\.\d{3}$/, `bad price ${row['Variant Price']}`);
  }
});

test('the metafields the theme reads are all present', () => {
  // The label colour, roast meter, tasting notes and spec grid all come from
  // these. Import without them and every card renders as a bare title.
  const required = ['roast_level', 'tasting_notes', 'origin', 'process', 'altitude', 'brew_methods', 'label_color'];
  for (const key of required) {
    assert.ok(
      COLUMNS.some((column) => column.startsWith(`Metafield: custom.${key} `)),
      `no column for custom.${key}`,
    );
  }

  const first = buildRows().find((row) => row.Handle === 'espresso-arabica-beans');
  assert.equal(first['Metafield: custom.label_color [color]'], '#1E2B55');
  assert.equal(first['Metafield: custom.roast_level [number_integer]'], '3');
});

test('list metafields are JSON arrays, which is what Shopify parses', () => {
  const row = buildRows().find((entry) => entry.Handle === 'espresso-arabica-beans');
  const notes = JSON.parse(row['Metafield: custom.tasting_notes [list.single_line_text_field]']);
  assert.deepEqual(notes, ['100% Arabica', 'Medium Roast']);
});

test('the export invents neither a discount nor an out-of-stock bag', () => {
  // This file is imported into the client's live store. A compare-at price the
  // client never set would go up as a real "was" price against a real bag, and
  // a zero quantity would take it off sale on import.
  for (const row of buildRows()) {
    assert.equal(row['Variant Compare At Price'], '', `${row['Variant SKU']} carries a was-price`);
    assert.ok(Number(row['Variant Inventory Qty']) > 0, `${row['Variant SKU']} imports out of stock`);
  }
});

test('image columns stay empty unless a reachable base url is given', () => {
  // Shopify fetches Image Src over HTTP; a local path silently imports nothing.
  for (const row of buildRows()) assert.equal(row['Image Src'], '');

  const withImages = buildRows({ imageBase: 'https://cdn.example/files/' });
  const first = withImages.find((row) => row.Handle === 'espresso-arabica-beans');
  assert.equal(first['Image Src'], 'https://cdn.example/files/espresso-arabica-beans.jpg');
  assert.equal(first['Image Position'], '1');
});

test('a field containing a comma or quote round-trips', () => {
  const description = buildRows().find((row) => row.Handle === 'turkish-coffee')['Body (HTML)'];
  assert.match(description, /,/, 'expected a description with a comma in it');

  const line = buildCsv().trim().split(SEP).find((entry) => entry.includes('cardamom'));
  assert.ok(line, 'expected the Turkish coffee row');
  assert.ok(splitCsvLine(line).includes(description));
});
