// One-off: add Batch C keys (company.widgetName / company.quickReplies / company.addQuickReply)
// to all 8 locale files after the `company.greeting` line, preserving formatting/EOL.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const localesDir = join(here, '..', 'src', 'locales');
const files = ['en', 'ru', 'de', 'es', 'fr', 'ja', 'ko', 'zh'];

const KEYS = [
  ['company.widgetName', 'Widget name'],
  ['company.quickReplies', 'Quick replies'],
  ['company.addQuickReply', 'Add quick reply…'],
];

let changed = 0;
for (const lang of files) {
  const file = join(localesDir, `${lang}.json`);
  const raw = readFileSync(file, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(/\r?\n/);
  const idx = lines.findIndex((l) => /"greeting"/.test(l));
  if (idx === -1) {
    console.error(`SKIP ${lang}: no company.greeting line`);
    continue;
  }
  const indent = lines[idx].match(/^\s*/)?.[0] ?? '    ';
  const inCompany = /"greeting"/.test(lines[idx]);
  if (!inCompany) {
    console.error(`SKIP ${lang}: greeting line not inside company block`);
    continue;
  }
  const insert = KEYS.map(([k, fallback]) => `${indent}"${k}": "${fallback.replace(/"/g, '\\"')}",`);
  lines.splice(idx + 1, 0, ...insert);
  writeFileSync(file, lines.join(nl));
  changed += 1;
  console.log(`OK ${lang}: inserted after company.greeting`);
}
console.log(`done, ${changed} files updated`);
