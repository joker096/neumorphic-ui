// Generates public/og-image.png (1200x630) static OG card for the landing page.
// jimp here is a mixed 0.22 chain: print() blits pre-baked white font pages, so
// text is printed white then recolored per region (gold rule + gold text, cream text).
import Jimp from 'jimp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(dir, '../public/og-image.png');

const GOLD = { r: 0xc9, g: 0xa9, b: 0x6e };
const CREAM = { r: 0xf0, g: 0xec, b: 0xe4 };

const img = new Jimp(1200, 630, '#070707');

const brand = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
const small = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

img.print(small, 80, 210, 'P2P MESSENGER');
img.print(brand, 80, 300, 'Mess&Anger');
img.print(small, 80, 420, 'Decentralized messenger with post-quantum encryption.');
img.print(small, 80, 460, 'v1.0 | June 2026 | Open Source');

const recolor = (x0, y0, w, h, c) => img.scan(x0, y0, w, h, (x, y, i) => {
  const d = img.bitmap.data;
  if ((d[i] + d[i + 1] + d[i + 2]) / 3 > 32) {
    d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b;
  }
});

img.scan(80, 266, 96, 4, (x, y, i) => {
  const d = img.bitmap.data;
  d[i] = GOLD.r; d[i + 1] = GOLD.g; d[i + 2] = GOLD.b;
});

recolor(80, 205, 300, 30, GOLD);    // eyebrow
recolor(80, 298, 500, 84, CREAM);   // brand
recolor(80, 415, 700, 30, CREAM);   // tagline
recolor(80, 455, 400, 30, GOLD);    // meta

await img.writeAsync(out);
console.log('written:', out);
