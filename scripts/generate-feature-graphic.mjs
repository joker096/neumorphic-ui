// Generates the Google Play feature graphic (1024x500 PNG) for Mess&Anger.
// Usage: node scripts/generate-feature-graphic.mjs
// Output: android/feature-graphic.png
import Jimp from 'jimp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconPath = path.join(root, 'public/icons/pwa-512x512.png');
const outPath = path.join(root, 'android/feature-graphic.png');

const W = 1024;
const H = 500;
const from = { r: 0x0a, g: 0x0a, b: 0x0a };
const to = { r: 0x14, g: 0x1b, b: 0x26 };

const canvas = new Jimp(W, H);
const buf = canvas.bitmap.data;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = x / (W - 1);
    const i = (y * W + x) * 4;
    buf[i] = Math.round(from.r + (to.r - from.r) * t);
    buf[i + 1] = Math.round(from.g + (to.g - from.g) * t);
    buf[i + 2] = Math.round(from.b + (to.b - from.b) * t);
    buf[i + 3] = 255;
  }
}

// App icon, 320px, left side, vertically centered
const icon = await Jimp.read(iconPath);
icon.resize(320, 320, Jimp.RESIZE_BICUBIC);
canvas.composite(icon, 80, (H - 320) / 2);

// Title + tagline, right side
const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
const subFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

await canvas.print(titleFont, 440, 150, 'Mess&Anger');

const bar = new Jimp(140, 8, '#4b7bec');
canvas.composite(bar, 440, 238);

await canvas.print(subFont, 440, 264, 'End-to-end encrypted');
await canvas.print(subFont, 440, 304, 'P2P messenger');

await canvas.write(outPath);
console.log(`Wrote ${outPath} (${W}x${H})`);
