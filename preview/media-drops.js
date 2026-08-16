/**
 * Turn a `/preview-media/…` path into something shaped like a Shopify image
 * drop, with the real pixel dimensions read off the file.
 *
 * The theme derives every <img> width/height and srcset from `image.width` and
 * `image.height`. If the preview handed it bare strings those would be blank
 * and the preview would stop telling the truth about layout shift — which is
 * the whole reason the preview renders the real theme files.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../scripts/theme-paths.js';

const MEDIA_DIR = join(ROOT, 'preview', 'media');

/**
 * Width and height from a JPEG's first Start-Of-Frame marker.
 * @param {Buffer} buffer
 * @returns {{width: number, height: number}|null}
 */
function jpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    // SOF0..SOF15 carry the frame header. DHT, JPGA and DAC share the range.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }

    offset += 2 + buffer.readUInt16BE(offset + 2);
  }

  return null;
}

/** Width and height from an SVG viewBox. */
function svgSize(source) {
  const box = /viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/.exec(source);
  if (!box) return null;
  return { width: Math.round(Number(box[1])), height: Math.round(Number(box[2])) };
}

const cache = new Map();

/**
 * @param {string} path e.g. '/preview-media/wadi-rum-blend.jpg'
 * @returns {{width: number, height: number}} falls back to a 4:5 bag crop
 */
function measure(path) {
  if (cache.has(path)) return cache.get(path);

  const file = join(MEDIA_DIR, path.replace(/^\/preview-media\//, ''));
  let size = null;

  if (existsSync(file)) {
    const buffer = readFileSync(file);
    size = /\.svg$/i.test(file) ? svgSize(buffer.toString('utf8')) : jpegSize(buffer);
  }

  size ??= { width: 1122, height: 1402 };
  cache.set(path, size);
  return size;
}

/**
 * Wrap a media path in an image drop. Anything that is not a `/preview-media/`
 * path — null, an already-wrapped drop — is returned untouched.
 *
 * @param {string|object|null} source
 * @param {string} [alt]
 */
export function imageDrop(source, alt = '') {
  if (!source || typeof source === 'object') return source;
  if (typeof source !== 'string' || !source.startsWith('/preview-media/')) return source;

  const { width, height } = measure(source);

  return {
    src: source,
    width,
    height,
    aspect_ratio: width / height,
    alt,
    // Liquid renders a drop by its `src` wherever the theme interpolates it
    // directly, which is what Shopify's image drop does too.
    toString: () => source,
  };
}
