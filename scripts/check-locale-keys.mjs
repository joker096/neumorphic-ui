import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'locales');

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const files = readdirSync(localesDir).filter(f => f.endsWith('.json')).sort();
const locales = {};

for (const file of files) {
  const content = readFileSync(join(localesDir, file), 'utf-8');
  locales[file] = flattenKeys(JSON.parse(content));
}

const enKeys = new Set(locales['en.json']);

console.log('=== Locale Key Comparison Report ===\n');

for (const [file, keys] of Object.entries(locales)) {
  if (file === 'en.json') continue;
  const localeKeys = new Set(keys);
  const extraKeys = keys.filter(k => !enKeys.has(k));
  const missingKeys = [...enKeys].filter(k => !localeKeys.has(k));
  const total = keys.length;
  const enTotal = enKeys.size;

  console.log(`--- ${file} ---`);
  console.log(`  Total keys: ${total} (en.json: ${enTotal})`);

  if (extraKeys.length > 0) {
    console.log(`  Extra keys (in ${file} but NOT in en.json - should be REMOVED):`);
    extraKeys.forEach(k => console.log(`    - ${k}`));
  } else {
    console.log(`  Extra keys: None`);
  }

  if (missingKeys.length > 0) {
    console.log(`  Missing keys (in en.json but NOT in ${file} - need to be ADDED):`);
    missingKeys.forEach(k => console.log(`    + ${k}`));
  } else {
    console.log(`  Missing keys: None`);
  }
  console.log('');
}

console.log('=== Comparison Complete ===');
