/**
 * Generate snippets/icon.liquid from Hugeicons Stroke Rounded.
 *
 * Source: https://hugeicons.com/icons/stroke-rounded
 * Package: @hugeicons/core-free-icons
 *
 * Run: npm run icons
 */
import { writeFile } from 'node:fs/promises';
import {
  Search01Icon,
  ShoppingCart01Icon,
  Menu01Icon,
  Cancel01Icon,
  ArrowRight02Icon,
  ArrowDown01Icon,
  PlusSignIcon,
  MinusSignIcon,
  Delete02Icon,
  Leaf01Icon,
  BlendIcon,
  Fire02Icon,
  CoffeeBeansIcon,
  Package01Icon,
} from '@hugeicons/core-free-icons';
import { resolveInTheme } from './theme-paths.js';

/** Theme icon name → Hugeicons export. */
const ICON_MAP = {
  search: Search01Icon,
  cart: ShoppingCart01Icon,
  menu: Menu01Icon,
  close: Cancel01Icon,
  'arrow-right': ArrowRight02Icon,
  'chevron-down': ArrowDown01Icon,
  plus: PlusSignIcon,
  minus: MinusSignIcon,
  remove: Delete02Icon,
  source: Leaf01Icon,
  blend: BlendIcon,
  roast: Fire02Icon,
  grind: CoffeeBeansIcon,
  pack: Package01Icon,
};

const SKIP_ATTRS = new Set(['key']);

function toKebab(name) {
  return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function renderNode([tag, attrs]) {
  const parts = Object.entries(attrs)
    .filter(([name]) => !SKIP_ATTRS.has(name))
    .map(([name, value]) => `${toKebab(name)}="${value}"`);
  return `<${tag} ${parts.join(' ')}/>`;
}

function renderIcon(name, nodes) {
  const body = nodes.map(renderNode).join('');
  return [
    `  {%- when '${name}' -%}`,
    `    <svg class="icon icon--${name}" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">${body}</svg>`,
  ].join('\n');
}

const cases = Object.entries(ICON_MAP)
  .map(([name, nodes]) => renderIcon(name, nodes))
  .join('\n\n');

const liquid = `{%- comment -%}
  Inline SVG icons from Hugeicons Stroke Rounded.
  https://hugeicons.com/icons/stroke-rounded

  Usage: {% render 'icon', name: 'cart' %}

  Regenerate after changing the icon map: npm run icons

  All icons are decorative — they are always accompanied by a text label or a
  visually-hidden one, so they are hidden from assistive technology. They use
  currentColor so they take the colour of whatever they sit inside.
{%- endcomment -%}

{%- case name -%}
${cases}
{%- endcase -%}
`;

const outPath = resolveInTheme('snippets/icon.liquid');
await writeFile(outPath, liquid, 'utf8');
console.log(`Wrote ${outPath}`);
