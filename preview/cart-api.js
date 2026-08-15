/**
 * In-memory cart for the preview server.
 *
 * This approximates the parts of Shopify's Cart AJAX API the theme actually
 * calls — /cart/add, /cart/change, /cart.js — so the drawer and the add-to-cart
 * flow can be reviewed locally. It is not a Shopify emulator: there is no
 * inventory check, no discount engine, no selling plans, and the cart resets
 * when the server restarts.
 */
import { buildFixtures } from './fixtures.js';

/** variant id -> quantity, in insertion order. */
const quantities = new Map();

/** @returns {{product: object, variant: object}|null} */
function findVariant(variantId) {
  for (const product of buildFixtures().products) {
    const variant = product.variants.find((item) => item.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

export function resetCart() {
  quantities.clear();
}

export function addLine(variantId, quantity = 1) {
  if (!findVariant(variantId)) return;
  const amount = Math.max(0, Number(quantity) || 0);
  if (amount === 0) return;
  quantities.set(variantId, (quantities.get(variantId) ?? 0) + amount);
}

export function setLine(variantId, quantity) {
  const amount = Math.max(0, Number(quantity) || 0);
  if (amount === 0) quantities.delete(variantId);
  else if (findVariant(variantId)) quantities.set(variantId, amount);
}

/** Fill the cart with three lines so the populated state is reviewable. */
export function seedCart() {
  resetCart();
  addLine('wadi-rum-blend-250-wb', 2);
  addLine('dead-sea-blend-1kg-wb', 1);
  addLine('fcb-box10', 3);
}

/** @returns {object} a Liquid `cart` drop. */
export function buildCart() {
  const items = [];

  for (const [variantId, quantity] of quantities) {
    const found = findVariant(variantId);
    if (!found) continue;
    const { product, variant } = found;
    items.push({
      id: variantId,
      key: variantId,
      quantity,
      title: `${product.title} — ${variant.title}`,
      product_title: product.title,
      variant_title: variant.title,
      product,
      variant,
      url: variant.url,
      image: product.featured_image,
      price: variant.price,
      original_price: variant.price,
      line_price: variant.price * quantity,
      original_line_price: variant.price * quantity,
      final_line_price: variant.price * quantity,
      options_with_values: (product.options ?? []).map((name, index) => ({
        name,
        value: variant.options[index],
      })),
      properties: {},
    });
  }

  const total = items.reduce((sum, item) => sum + item.line_price, 0);

  return {
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    items,
    total_price: total,
    items_subtotal_price: total,
    original_total_price: total,
    total_discount: 0,
    currency: 'JOD',
    note: null,
    cart_level_discount_applications: [],
  };
}
