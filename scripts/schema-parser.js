const SCHEMA_PATTERN = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/;

/**
 * Pull the JSON body out of a section's {% schema %} block.
 * @param {string} source raw .liquid contents
 * @param {string} [label] path used in error messages
 * @returns {object|null} parsed schema, or null when the file has no schema block
 */
export function extractSchema(source, label = 'section') {
  const match = SCHEMA_PATTERN.exec(source);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid {% schema %} JSON in ${label}: ${error.message}`);
  }
}

/**
 * Build the settings object Shopify would hand a freshly-added section.
 * Settings without a `default` are omitted, matching Shopify's behaviour of
 * leaving them nil rather than empty-string.
 */
export function defaultSettings(schema) {
  const settings = {};
  for (const setting of schema?.settings ?? []) {
    if (setting && 'default' in setting && setting.id) settings[setting.id] = setting.default;
  }
  return settings;
}

/**
 * Expand the first preset into concrete blocks, filling each block's settings
 * from its block-type defaults and then overriding with the preset's values.
 */
export function defaultBlocks(schema) {
  const preset = schema?.presets?.[0];
  if (!preset?.blocks?.length) return [];

  const typeDefaults = new Map(
    (schema.blocks ?? []).map((blockType) => [blockType.type, defaultSettings(blockType)]),
  );

  return preset.blocks.map((block, index) => ({
    id: `${block.type}-${index}`,
    type: block.type,
    settings: { ...(typeDefaults.get(block.type) ?? {}), ...(block.settings ?? {}) },
    shopify_attributes: '',
  }));
}
