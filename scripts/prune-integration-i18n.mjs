/**
 * prune-integration-i18n.mjs — one-shot maintenance script.
 *
 * Removes the 13 `integrations.*` keys that were only referenced by the deleted
 * unconnected `src/components/integrations/*` prototype panels, keeping the two
 * live keys used by `src/services/index.tsx` (`notConnected`,
 * `notConnectedDesc`).
 *
 * Line-based surgery: every other byte of the locale file is preserved, so
 * formatting/EOL are untouched (the repo locales are LF, no BOM).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const KEEP = new Set(['notConnected', 'notConnectedDesc']);
const DROP = [
  'title', 'conflicts', 'connect', 'health', 'import',
  'runImport', 'logs', 'mappings', 'provider', 'name',
  'baseUrl', 'apiKey', 'entity',
];
const LOCALES = ['en', 'ru', 'de', 'es', 'fr', 'ja', 'ko', 'zh'];

let failed = false;

for (const loc of LOCALES) {
  const file = resolve(ROOT, 'src/locales', `${loc}.json`);
  const before = readFileSync(file, 'utf-8');
  const lines = before.split('\n');

  const start = lines.findIndex((l) => l === '  "integrations": {');
  if (start === -1) { console.error(`${loc}: no "integrations" block`); failed = true; continue; }
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === '  },') { end = i; break; }
  }
  if (end === -1) { console.error(`${loc}: unterminated "integrations" block`); failed = true; continue; }

  const block = lines.slice(start + 1, end);
  const removed = [];
  const kept = block.filter((line) => {
    const m = /^\s{4}"([^"]+)":/.exec(line);
    if (!m) return true;
    if (KEEP.has(m[1])) return true;
    if (DROP.includes(m[1])) { removed.push(m[1]); return false; }
    return true;
  });

  const missing = DROP.filter((k) => !removed.includes(k));
  if (missing.length) { console.error(`${loc}: keys not found: ${missing.join(', ')}`); failed = true; continue; }

  // The closing `  },` follows directly, so the last surviving entry must not
  // keep its trailing comma.
  if (kept.length && kept[kept.length - 1].trimEnd().endsWith(',')) {
    kept[kept.length - 1] = kept[kept.length - 1].replace(/,(\s*)$/, '$1');
  }

  const after = [...lines.slice(0, start + 1), ...kept, ...lines.slice(end)].join('\n');

  // Verify: parses, and exactly the two live keys remain.
  const parsed = JSON.parse(after);
  const keys = Object.keys(parsed.integrations || {});
  const ok = keys.length === 2 && KEEP.has(keys[0]) && KEEP.has(keys[1]);
  if (!ok) { console.error(`${loc}: unexpected surviving keys ${JSON.stringify(keys)}`); failed = true; continue; }

  writeFileSync(file, after, 'utf-8');
  console.log(`${loc}: removed ${removed.length} keys, kept [${keys.join(', ')}] (${before.length} -> ${after.length} chars)`);
}

if (failed) { console.error('\nFAILED'); process.exit(1); }
console.log('\nOK');
