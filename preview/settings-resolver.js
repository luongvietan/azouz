import { defaultSettings, defaultBlocks } from '../scripts/schema-parser.js';
import { imageDrop } from './media-drops.js';

/**
 * Shopify stores a setting's *reference* (a handle or filename) but hands Liquid
 * the resolved *object*. The preview harness must do the same translation or
 * `section.settings.menu.links` and `section.settings.image | image_url` break.
 *
 * Only the four object-valued types need translating; everything else — text,
 * richtext, url, checkbox, range, select, color, number — is already what
 * Liquid sees.
 */
export function resolveSettings(schema, settings, fixtures) {
  const declaredType = new Map(
    (schema?.settings ?? []).filter((s) => s?.id).map((s) => [s.id, s.type]),
  );

  const resolved = {};

  for (const [id, value] of Object.entries(settings ?? {})) {
    switch (declaredType.get(id)) {
      case 'link_list':
        // A handle names one of the fixture menus; an object is already a
        // resolved menu, which is how a test supplies its own link states.
        resolved[id] =
          value && typeof value === 'object'
            ? value
            : (fixtures.linklists?.[value] ?? { links: [] });
        break;

      case 'image_picker':
        // Shopify hands Liquid an image drop carrying width, height and alt.
        // The theme reads all three to size every <img>, so the preview has to
        // supply them rather than a bare path.
        if (!value) {
          resolved[id] = null;
        } else if (String(value).startsWith('/') || String(value).startsWith('http')) {
          resolved[id] = imageDrop(value);
        } else if (String(value).startsWith('shopify://')) {
          // A merchant who picks an image in the Theme Editor stores a
          // `shopify://shop_images/<file>` reference, and Shopify's GitHub
          // integration commits that back into the template. Only the live
          // store can resolve it, so the preview falls back to the demo file
          // of the same name, then to the placeholder.
          const file = String(value).split('/').pop();
          resolved[id] = imageDrop(`/preview-media/${file}`);
        } else {
          resolved[id] = imageDrop(`/assets/${value}`);
        }
        break;

      case 'collection':
        resolved[id] = fixtures.collections?.[value] ?? null;
        break;

      case 'product':
        resolved[id] = fixtures.products?.find((p) => p.handle === value) ?? null;
        break;

      default:
        resolved[id] = value;
    }
  }

  return resolved;
}

/**
 * The `section` drop Shopify hands a section file: defaults + overrides, with
 * object-valued settings (menus, collections, products, images) already resolved.
 */
export function resolveSection(schema, name, override = {}, fixtures) {
  const rawBlocks = override.blocks ?? defaultBlocks(schema);
  return {
    id: name,
    settings: resolveSettings(
      schema,
      { ...defaultSettings(schema), ...(override.settings ?? {}) },
      fixtures,
    ),
    blocks: rawBlocks.map((block) => {
      const blockSchema = (schema?.blocks ?? []).find((entry) => entry.type === block.type) ?? null;
      return {
        ...block,
        settings: resolveSettings(blockSchema, block.settings, fixtures),
      };
    }),
    shopify_attributes: '',
  };
}
