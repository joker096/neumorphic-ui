/**
 * component-audit.mjs — §1.2 (size) + §1.3 (unused props) + React hook smells.
 *
 * Usage: node scripts/component-audit.mjs [--max-lines N]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const argMax = process.argv.indexOf('--max-lines');
const MAX_LINES = argMax > 0 ? Number(process.argv[argMax + 1]) : 300;

/**
 * Files whose object URL is minted here but revoked by someone else.
 *
 * The rule below is file-local, so it cannot see an owner in another module —
 * and for these the owner is deliberate: the URL is handed to a consumer that
 * outlives the producing component (a chat bubble outliving the recorder that
 * captured it), so revoking at unmount would break playback. Keep this list
 * short: every entry needs a stated owner, and a file that starts revoking
 * itself must be removed.
 */
const EXTERNAL_URL_OWNERS = new Map([
  [
    'src\\components\\LiveVideoRecorder.tsx',
    'ChatInputArea.tsx revokes the preview URL it receives on cleanup',
  ],
  [
    'src\\components\\LiveVoiceRecorder.tsx',
    'the URL is stored on the message as audioUrl; releaseMessageMedia revokes it when the message is deleted or self-destructs',
  ],
  [
    'src\\lib\\p2p\\inbound\\inboundVoice.ts',
    'same inbound voice path: audioUrl is owned by the message, released by releaseMessageMedia',
  ],
]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === '.git') continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(e) === '.tsx' || extname(e) === '.ts') out.push(full);
  }
  return out;
}

const files = walk(join(ROOT, 'src')).filter((f) => !/\.test\.|\.spec\./.test(f) && !/vite-env\.d\.ts$/.test(f));

const size = [];
const unusedProps = [];
const hookSmells = [];

// props interfaces: name -> { fields:Set, endIndex }
const IFACE = /(?:interface|type)\s+([A-Za-z_$][\w$]*Props)\b[^={]*=?[^=]*\{([^}]*)\}/g;

function countMatches(code, re) {
  re.lastIndex = 0;
  let n = 0;
  while (re.exec(code)) n++;
  return n;
}

for (const file of files) {
  const rel = relative(ROOT, file);
  const code = readFileSync(file, 'utf-8');
  const lines = code.split('\n');
  if (lines.length > MAX_LINES) size.push({ rel, n: lines.length });

  // ---- B. unused props (single pass, no re-scan) ----
  IFACE.lastIndex = 0;
  let m;
  const masked = code.split('\n');
  while ((m = IFACE.exec(code))) {
    const typeName = m[1];
    const fields = m[2]
      .split(/[;\n]/)
      .map((s) => s.trim().split(/[?:]/)[0].trim())
      .filter((s) => /^[A-Za-z_$][\w$]*$/.test(s));
    if (!fields.length) continue;
    const bodyStartLine = code.slice(0, m.index).split('\n').length;
    // body = file text after the interface closing brace
    const body = masked.slice(bodyStartLine).join('\n');
    if (!body.includes(typeName)) continue; // never used as a props type
    // destructured list, if any
    const destr = new RegExp('\\{([^{}]*)\\}\\s*:\\s*' + typeName + '\\b').exec(body);
    const listed = destr
      ? destr[1].split(',').map((s) => s.trim().split(/[=:}]/)[0].replace(/^\.\.\./, '').trim()).filter(Boolean)
      : null;
    for (const f of fields) {
      if (listed && !listed.includes(f)) continue;
      const re = new RegExp('\\b' + f.replace(/\$/g, '\\$') + '\\b');
      if (!re.test(body)) unusedProps.push({ rel, typeName, field: f, mode: listed ? 'destructured-unused' : 'declared-unused' });
    }
  }

  // ---- C. hook smells ----
  const add = countMatches(code, /addEventListener\s*\(/g);
  const rem = countMatches(code, /removeEventListener\s*\(/g);
  if (add > 0 && rem === 0 && code.includes('useEffect')) hookSmells.push({ rel, kind: 'addEventListener-no-remove', n: add });
  const si = countMatches(code, /setInterval\s*\(/g);
  const ci = countMatches(code, /clearInterval\s*\(/g);
  if (si > 0 && ci === 0) hookSmells.push({ rel, kind: 'setInterval-no-clear', n: si });
  const st = countMatches(code, /setTimeout\s*\(/g);
  const ct = countMatches(code, /clearTimeout\s*\(/g);
  if (st > 2 && ct === 0) hookSmells.push({ rel, kind: 'setTimeout-no-clear', n: st });
  if (/new (MutationObserver|ResizeObserver|IntersectionObserver)\s*\(/.test(code) && !/\.disconnect\s*\(/.test(code)) {
    hookSmells.push({ rel, kind: 'observer-no-disconnect', n: countMatches(code, /new (MutationObserver|ResizeObserver|IntersectionObserver)\s*\(/g) });
  }
  // an object URL is only a leak if one is actually created — constructing an
  // Audio/Image/AudioContext has nothing to do with URL.revokeObjectURL
  const co = countMatches(code, /URL\.createObjectURL/g);
  const cr = countMatches(code, /URL\.revokeObjectURL/g);
  if (co > 0 && cr === 0 && !EXTERNAL_URL_OWNERS.has(rel)) hookSmells.push({ rel, kind: 'object-url-no-revoke', n: co });
  // an AudioContext that is never closed keeps the audio hardware awake
  const ac = countMatches(code, /new (webkit)?AudioContext\s*\(/g);
  if (ac > 0 && !/\.close\s*\(/.test(code)) hookSmells.push({ rel, kind: 'audiocontext-no-close', n: ac });
}

console.log('\n=== COMPONENT AUDIT ===\n');
console.log(`## A. files over ${MAX_LINES} lines (${size.length})`);
for (const s of size.sort((a, b) => b.n - a.n)) console.log(`  ${String(s.n).padStart(5)}  ${s.rel}`);

console.log(`\n## B. declared-but-unused props (${unusedProps.length})`);
const seen = new Set();
for (const p of unusedProps) {
  const k = p.rel + ':' + p.typeName + '.' + p.field;
  if (seen.has(k)) continue;
  seen.add(k);
  console.log(`  ${p.rel}  ${p.typeName}.${p.field}  (${p.mode})`);
}

console.log(`\n## C. hook smells (${hookSmells.length})`);
const byKind = new Map();
for (const h of hookSmells) {
  if (!byKind.has(h.kind)) byKind.set(h.kind, []);
  byKind.get(h.kind).push(h);
}
for (const [kind, list] of byKind) {
  console.log(`  [${kind}] x${list.length}`);
  for (const h of list) console.log(`    ${h.rel} (x${h.n})`);
}

console.log(`\n=== SUMMARY ===\n  oversize: ${size.length}\n  unusedProps: ${seen.size}\n  hookSmells: ${hookSmells.length}\n`);
