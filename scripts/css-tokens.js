/**
 * Read colour custom properties out of a CSS source.
 *
 * Semantic tokens point at brand tokens (`--color-bg: var(--azouz-off-white)`),
 * so a single level of `var()` indirection is not enough — follow the chain
 * until a literal hex is reached. Declarations that never resolve to a hex
 * (shadows, `color-mix`, font stacks, lengths) are omitted.
 */
export function readCssTokens(css) {
  const declared = new Map();
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;}]+?)\s*(?:;|\})/g;
  for (const match of css.matchAll(pattern)) declared.set(match[1], match[2].trim());

  const resolve = (value, seen = new Set()) => {
    const reference = /^var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)$/.exec(value);
    if (!reference) return value;
    const name = reference[1];
    if (seen.has(name)) return value; // circular — give up rather than loop
    seen.add(name);
    const next = declared.get(name);
    return next === undefined ? value : resolve(next, seen);
  };

  const tokens = new Map();
  for (const [name, raw] of declared) {
    const resolved = resolve(raw);
    if (/^#[0-9a-fA-F]{3,8}$/.test(resolved)) tokens.set(name, resolved);
  }
  return tokens;
}
