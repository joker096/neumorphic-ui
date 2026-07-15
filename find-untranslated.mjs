import { readFileSync } from 'fs';

const locales = ['ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
const keys = [];

// First get all keys from en.json
const en = JSON.parse(readFileSync('src/locales/en.json', 'utf8'));
function flatten(obj, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      keys.push(fullKey);
    } else if (typeof v === 'object') {
      flatten(v, fullKey);
    }
  }
}
flatten(en);

// Check each locale
const untranslated = {};
for (const loc of locales) {
  const locObj = JSON.parse(readFileSync(`src/locales/${loc}.json`, 'utf8'));
  untranslated[loc] = [];
  for (const key of keys) {
    const parts = key.split('.');
    let o = locObj;
    let found = true;
    for (const p of parts) {
      if (o && typeof o === 'object') o = o[p];
      else { found = false; break; }
    }
    if (found && typeof o === 'string' && o === key) {
      untranslated[loc].push(key);
    }
  }
}

// Output results
for (const [loc, untranslatedKeys] of Object.entries(untranslated)) {
  console.log(`\n=== ${loc}: ${untranslatedKeys.length} untranslated keys ===`);
  for (const key of untranslatedKeys) {
    console.log(key);
  }
}

// Save to file for processing
const output = JSON.stringify(untranslated, null, 2);
const fs = await import('fs');
fs.writeFileSync('untranslated.json', output);
