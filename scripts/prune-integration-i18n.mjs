/**
 * prune-integration-i18n.mjs — idempotent maintenance script.
 *
 * Removes the 13 `integrations.*` keys that were only referenced by the deleted
 * unconnected `src/components/integrations/*` prototype panels, keeping the two
 * live keys used by `src/services/index.tsx` (`notConnected`,
 * `notConnectedDesc`).
 *
 * Re-running it on an already-pruned locale is a no-op: the script verifies the
 * invariant (exactly the two live keys survive) and exits 0 instead of failing
 * on keys that are legitimately absent.
 *
 * Line-based surgery that keeps every line's original terminator, so every
 * other byte of the locale file is preserved: formatting and EOL stay untouched
 * and the script behaves the same on LF and CRLF checkouts (Windows autocrlf).
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

/**
 * A locale is pruned when both live keys survive and no stale key is left.
 * Extra live keys are allowed: the block may grow later, and a new key must
 * not turn this script back into a failing one-shot.
 */
const isPruned = (keys) =>
  [...KEEP].every((key) => keys.includes(key)) && !keys.some((key) => DROP.includes(key));

let failed = false;

for (const loc of LOCALES) {
  const file = resolve(ROOT, 'src/locales', `${loc}.json`);
  const before = readFileSync(file, 'utf-8');
  // Keep every line's original terminator, so untouched bytes stay untouched
  // and the surgery behaves the same on LF and CRLF checkouts (Windows autocrlf).
  const parts = before.match(/[^\n]*\n|[^\n]+$/g) || [];
  const text = parts.map((part) => part.replace(/\r?\n$/, ''));

  const start = text.findIndex((l) => l === '  "integrations": {');
  if (start === -1) { console.error(`${loc}: no "integrations" block`); failed = true; continue; }
  let end = -1;
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === '  },') { end = i; break; }
  }
  if (end === -1) { console.error(`${loc}: unterminated "integrations" block`); failed = true; continue; }

  const block = parts.slice(start + 1, end);
  const removed = [];
  const kept = block.filter((part) => {
    const m = /^\s{4}"([^"]+)":/.exec(part.replace(/\r?\n$/, ''));
    if (!m) return true;
    if (KEEP.has(m[1])) return true;
    if (DROP.includes(m[1])) { removed.push(m[1]); return false; }
    return true;
  });

  // The prune is idempotent: a locale that no longer carries the stale keys is
  // already in the desired state, not a failure. The invariant is checked below.
  if (!removed.length) {
    const parsedAlready = JSON.parse(before);
    const keysAlready = Object.keys(parsedAlready.integrations || {});
    if (!isPruned(keysAlready)) { console.error(`${loc}: unexpected surviving keys ${JSON.stringify(keysAlready)}`); failed = true; }
    else console.log(`${loc}: already pruned, kept [${keysAlready.join(', ')}] — no change`);
    continue;
  }

  // The closing `  },` follows directly, so the last surviving entry must not
  // keep its trailing comma.
  if (kept.length && kept[kept.length - 1].replace(/\r?\n$/, '').trimEnd().endsWith(',')) {
    kept[kept.length - 1] = kept[kept.length - 1].replace(/,(\r?\n)$/, '$1');
  }

  const after = [...parts.slice(0, start + 1), ...kept, ...parts.slice(end)].join('');

  // Verify: parses, both live keys remain and no stale key survived.
  const parsed = JSON.parse(after);
  const keys = Object.keys(parsed.integrations || {});
  const ok = isPruned(keys);
  if (!ok) { console.error(`${loc}: unexpected surviving keys ${JSON.stringify(keys)}`); failed = true; continue; }

  if (after !== before) writeFileSync(file, after, 'utf-8');
  console.log(`${loc}: removed ${removed.length} keys, kept [${keys.join(', ')}] (${before.length} -> ${after.length} chars)`);
}

if (failed) { console.error('\nFAILED'); process.exit(1); }
console.log('\nOK');
