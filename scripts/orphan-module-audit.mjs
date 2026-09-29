/**
 * orphan-module-audit.mjs — §1.3: files whose exports have ZERO consumers
 * anywhere in the repo (src, server, e2e, scripts, admin, config, tests).
 *
 * A file is ORPHAN when none of its exported symbols is imported/mentioned
 * outside the file itself AND its module path is never imported.
 * Test files are reported separately: an orphan whose only consumers are
 * self-tests is "test-only" (dead app code, test proves nothing).
 *
 * Usage: node scripts/orphan-module-audit.mjs [--tests]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INCLUDE_TESTS = process.argv.includes('--tests');
const ROOTS = ['src', 'server', 'e2e', 'scripts', 'config', 'admin/src'].filter((d) => existsSync(join(ROOT, d)));
const CODE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === '.git' || e === 'build') continue;
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (CODE.has(extname(e))) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(join(ROOT, r)));
const isTest = (f) => /\.test\.[cm]?[jt]sx?$/.test(f) || /\.spec\.[cm]?[jt]sx?$/.test(f);

const EXPORT_FN = /export\s+(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_LIST = /export\s*\{([^}]*)\}/g;
const EXPORT_ALL = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;

const nonTest = files.filter((f) => !isTest(f));
const testFiles = files.filter(isTest);

// Pass 1: collect exported names per file
const exportsByFile = new Map(); // abs path -> Set(names)
for (const file of nonTest) {
  const code = readFileSync(file, 'utf-8');
  const names = new Set();
  let m;
  EXPORT_FN.lastIndex = 0;
  while ((m = EXPORT_FN.exec(code))) names.add(m[1]);
  EXPORT_LIST.lastIndex = 0;
  while ((m = EXPORT_LIST.exec(code))) {
    for (const raw of m[1].split(',')) {
      const p = raw.trim();
      if (!p) continue;
      const n = (p.split(/\s+as\s+/).pop() || '').trim();
      if (n && n !== 'default' && n !== 'type') names.add(n);
    }
  }
  if (names.size) exportsByFile.set(file, names);
}

// Pass 2: index every import/require source + every identifier mention
const importedPaths = new Set(); // resolved abs paths
const mentionFiles = new Map(); // name -> Set(abs path)
for (const file of files) {
  const code = readFileSync(file, 'utf-8');
  const dir = dirname(file);
  // resolve relative imports
  const RE = /(?:from\s+|import\s*\(\s*|require\(\s*)['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = RE.exec(code))) {
    let target = resolve(dir, m[1]);
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '']) {
      if (existsSync(target + ext)) { target += ext; break; }
    }
    if (existsSync(target) && statSync(target).isDirectory()) {
      const idx = ['index.ts', 'index.tsx', 'index.js', 'index.mjs'].map((i) => join(target, i)).find((f) => existsSync(f));
      if (idx) target = idx;
    }
    if (existsSync(target)) importedPaths.add(target);
  }
  // identifier mentions
  if (!mentionFiles.has('__all__')) mentionFiles.set('__all__', new Set());
  mentionFiles.get('__all__').add(file);
  const wordSet = new Set();
  const WR = /[A-Za-z_$][\w$]*/g;
  let w;
  while ((w = WR.exec(code))) wordSet.add(w[0]);
  for (const n of wordSet) {
    if (!mentionFiles.has(n)) mentionFiles.set(n, new Set());
    mentionFiles.get(n).add(file);
  }
}

const orphans = [];
for (const [file, names] of exportsByFile) {
  if (isTest(file)) continue;
  if (importedPaths.has(file)) continue; // module itself is imported → not orphan
  const consumers = new Set();
  for (const n of names) {
    for (const f of mentionFiles.get(n) || []) {
      if (f !== file) consumers.add(f);
    }
  }
  if (consumers.size === 0) {
    orphans.push({ file, names, kind: 'fully-orphan' });
  } else {
    const appConsumers = [...consumers].filter((c) => !isTest(c));
    if (appConsumers.length === 0) orphans.push({ file, names, kind: 'test-only', consumers: [...consumers] });
    else if (INCLUDE_TESTS) {
      const ext = [...consumers].filter((c) => !appConsumers.includes(c));
      if (ext.length) orphans.push({ file, names, kind: 'partial', consumers: consumers.size });
    }
  }
}

const fully = orphans.filter((o) => o.kind === 'fully-orphan');
const testOnly = orphans.filter((o) => o.kind === 'test-only');

console.log('\n=== ORPHAN MODULE AUDIT ===\n');
console.log(`modules scanned: ${exportsByFile.size} | fully orphan: ${fully.length} | test-only: ${testOnly.length}\n`);
if (fully.length) {
  console.log('## FULLY ORPHAN (no consumer at all) — safe delete candidates');
  for (const o of fully) console.log(`  ${relative(ROOT, o.file)}  (${o.names.size} exports, ${countLines(o.file)} lines)`);
  console.log('');
}
if (testOnly.length) {
  console.log('## TEST-ONLY (only self-tests import them) — dead app code');
  for (const o of testOnly) console.log(`  ${relative(ROOT, o.file)}  (${o.names.size} exports, ${countLines(o.file)} lines)  tests: ${o.consumers.map((c) => relative(ROOT, c)).join(', ')}`);
  console.log('');
}
console.log(`=== SUMMARY ===\n  fully-orphan: ${fully.length}\n  test-only: ${testOnly.length}\n  RESULT: ${fully.length || testOnly.length ? 'FAIL' : 'PASS'}\n`);
process.exit(fully.length || testOnly.length ? 1 : 0);

function countLines(f) {
  try { return readFileSync(f, 'utf-8').split('\n').length; } catch { return 0; }
}
