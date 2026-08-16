import { defaultSettings, defaultBlocks } from '../scripts/schema-parser.js';

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
        resolved[id] = fixtures.linklists?.[value] ?? { links: [] };
        break;

      case 'image_picker':
        if (!value) {
          resolved[id] = null;
        } else if (String(value).startsWith('/') || String(value).startsWith('http')) {
          resolved[id] = value;
        } else {
          resolved[id] = `/assets/${value}`;
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
