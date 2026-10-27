/**
 * CSP-safe story imagery.
 *
 * The app ships a strict policy (`img-src 'self' data: blob:` — `index.html`,
 * `public/_headers`, `server/csp.ts`), so remote demo hosts (picsum, unsplash…)
 * are blocked and leave broken tiles. Demo media is therefore generated in-page
 * as a `data:` SVG: deterministic gradient per seed plus initials.
 */

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

/** First letters of the first two words (Cyrillic and Latin both fine). */
function initialsOf(label: string): string {
  return label
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export interface StoryImageOptions {
  width?: number;
  height?: number;
  /** Text drawn in the middle; omitted for non-avatar cover art. */
  label?: string;
}

/** Build a `data:image/svg+xml` placeholder accepted by the app CSP. */
export function storyImage(seed: string, options: StoryImageOptions = {}): string {
  const { width = 540, height = 960, label } = options;
  const hue = hashSeed(seed);
  const hues = `${hue} 72% 44%`;
  const huee = `${(hue + 42) % 360} 68% 30%`;
  const glow = `${(hue + 60) % 360} 85% 62%`;
  const initials = label ? initialsOf(label) : '';
  const fontSize = Math.round(width * 0.2);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="hsl(${hues})"/><stop offset="100%" stop-color="hsl(${huee})"/>` +
    `</linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#g)"/>` +
    `<circle cx="${Math.round(width * 0.8)}" cy="${Math.round(height * 0.2)}" r="${Math.round(width * 0.34)}" fill="hsl(${glow})" opacity="0.22"/>` +
    `<circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.82)}" r="${Math.round(width * 0.28)}" fill="hsl(${glow})" opacity="0.16"/>` +
    (initials
      ? `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="rgba(255,255,255,0.9)">${initials}</text>`
      : '') +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
