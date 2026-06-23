import sharp from 'sharp';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgBuffer = readFileSync(path.resolve(__dirname, '..', 'public', 'icon.svg'));

const sizes = {
  'pwa-192x192.png': 192,
  'pwa-512x512.png': 512,
  'android-mdpi-48x48.png': 48,
  'android-hdpi-72x72.png': 72,
  'android-xhdpi-96x96.png': 96,
  'android-xxhdpi-144x144.png': 144,
  'android-xxxhdpi-192x192.png': 192,
  'android-playstore-512x512.png': 512,
  'ios-1024x1024.png': 1024,
  'ios-180x180.png': 180,
  'ios-152x152.png': 152,
  'ios-120x120.png': 120,
  'ios-76x76.png': 76,
  'ios-58x58.png': 58,
  'ios-40x40.png': 40,
  'ios-20x20.png': 20,
};

async function generate() {
  for (const [filename, size] of Object.entries(sizes)) {
    let outputDir = 'icons';
    if (filename.startsWith('android-')) outputDir = 'android';
    else if (filename.startsWith('ios-')) outputDir = 'ios';
    
    const outputPath = path.resolve(__dirname, outputDir, filename);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputDir}/${filename} (${size}x${size})`);
  }
  console.log('\nAll icons generated successfully!');
}

generate().catch(err => { console.error(err); process.exit(1); });
