/**
 * Parse a Shopify theme JSON file.
 *
 * Shopify permits `/* ... *\/` comments in JSON templates and section groups,
 * and its GitHub integration writes a generated-file banner into every template
 * it round-trips out of the Theme Editor. Those files are valid to Shopify but
 * not to JSON.parse, so every reader in this repo must go through here.
 *
 * A UTF-8 BOM is also stripped — Shopify sometimes emits one.
 */

/** Remove the BOM and any block comments that sit outside the JSON value. */
export function stripJsonComments(source) {
  return source.replace(/^﻿/, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * @param {string} source raw file contents
 * @param {string} [label] path used in the error message
 */
export function parseThemeJson(source, label = 'theme json') {
  try {
    return JSON.parse(stripJsonComments(source));
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`);
  }
}
