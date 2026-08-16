/**
 * Demo imagery for the local preview.
 *
 * These used to live in the shipped `templates/*.json` as `"image":
 * "/preview-media/…"`. Shopify rejected every template that carried one:
 *
 *   Error: templates/index.json, Validation failed:
 *          Setting 'image' does not point to an applicable resource
 *
 * An `image_picker` setting has to hold a reference to a file in the store's
 * own media library, not a path — so a path fails validation and Shopify drops
 * the whole template. Six templates never reached the live theme, and every
 * route that needed one returned 404, the homepage included.
 *
 * A theme cannot ship a working default here: the merchant's images do not
 * exist until they upload them. So the shipped templates leave `image` unset,
 * the sections already guard on it, and the demo imagery lives here where only
 * the preview can see it.
 *
 * Keyed by template path, then by the section id used inside that template.
 */
export const DEMO_MEDIA = {
  'templates/index.json': {
    hero: '/preview-media/hero-azouz-coffee-cup.jpg',
  },
  'templates/page.private-label.json': {
    hero: '/preview-media/wadi-rum-blend-alt.jpg',
  },
  'templates/page.wholesale.json': {
    hero: '/preview-media/dead-sea-blend.jpg',
  },
  'templates/page.our-brands.json': {
    hero: '/preview-media/downtown-blend.jpg',
    azouz: '/preview-media/wadi-rum-blend.jpg',
  },
  'templates/page.enquiry.json': {
    hero: '/preview-media/wadi-rum-blend.jpg',
  },
  'templates/page.get-a-quote.json': {
    hero: '/preview-media/dead-sea-blend.jpg',
  },
};

/**
 * The demo image for one section of one template, if there is one.
 *
 * @param {string} templatePath e.g. 'templates/index.json'
 * @param {string} sectionId    the key under the template's `sections`
 * @returns {string|null}
 */
export function demoImageFor(templatePath, sectionId) {
  return DEMO_MEDIA[templatePath]?.[sectionId] ?? null;
}
