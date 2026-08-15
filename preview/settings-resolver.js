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
        resolved[id] = value ? `/assets/${value}` : null;
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
