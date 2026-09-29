/**
 * dead-export-audit.mjs — §1.3 dead code: exported symbols with zero consumers.
 *
 * Scans src/ (plus server/, e2e/, scripts/ as consumer surfaces) for exported
 * names and reports those referenced nowhere outside their declaring module.
 * Test files count as consumers only for modules that are themselves
 * test-only (self-tests); app-code usage is tracked separately.
 *
 * Usage: node scripts/dead-export-audit.mjs [--app-only]
 * Exit:  0 = clean, 1 = findings
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const APP_ONLY = process.argv.includes('--app-only');

const SOURCE_ROOTS = ['src', 'server', 'e2e', 'scripts', 'admin/src'].filter((d) => existsSync(join(ROOT, d)));
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (CODE_EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

const files = SOURCE_ROOTS.flatMap((r) => walk(join(ROOT, r)));
const isTest = (f) => /\.test\.[cm]?[jt]sx?$/.test(f) || /\.spec\.[cm]?[jt]sx?$/.test(f);
const isBarrel = (f) => /(^|[\\/])index\.[cm]?[jt]sx?$/.test(f);

/** Strip block/line comments and string bodies that could contain identifiers. */
function stripNoise(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const EXPORT_FN = /export\s+(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_LIST = /export\s*\{([^}]*)\}/g;

const decls = new Map(); // name -> [{file, kind}]
for (const file of files) {
  if (isTest(file)) continue;
  const code = stripNoise(readFileSync(file, 'utf-8'));
  let m;
  EXPORT_FN.lastIndex = 0;
  while ((m = EXPORT_FN.exec(code))) {
    const name = m[1];
    if (!decls.has(name)) decls.set(name, []);
    decls.get(name).push({ file: relative(ROOT, file), kind: m[2] || m[0].split(/\s+/)[1] });
  }
  EXPORT_LIST.lastIndex = 0;
  while ((m = EXPORT_LIST.exec(code))) {
    for (const raw of m[1].split(',')) {
      const part = raw.trim();
      if (!part) continue;
      const name = (part.split(/\s+as\s+/).pop() || '').trim();
      if (!name || name === 'default' || name === 'type') continue;
      if (!decls.has(name)) decls.set(name, []);
      decls.get(name).push({ file: relative(ROOT, file), kind: 're-export' });
    }
  }
}

/** Build a per-file word-usage index: word -> Set(files). */
const usage = new Map(); // word -> Set(relative file paths)
const wordFiles = new Map(); // word -> [{file, count}]
for (const file of files) {
  if (isTest(file)) continue;
  const code = stripNoise(readFileSync(file, 'utf-8'));
  const rel = relative(ROOT, file);
  const seen = new Set();
  const re = /[A-Za-z_$][\w$]*/g;
  let m;
  while ((m = re.exec(code))) {
    const w = m[0];
    if (!decls.has(w)) continue;
    seen.add(w);
  }
  for (const w of seen) {
    if (!usage.has(w)) usage.set(w, new Set());
    usage.get(w).add(rel);
  }
}

const findings = [];
for (const [name, sites] of decls) {
  const usedIn = usage.get(name) || new Set();
  const ownFiles = new Set(sites.map((s) => s.file));
  // External consumers = usages outside every file that declares/re-exports it.
  const external = [...usedIn].filter((f) => !ownFiles.has(f));
  // Self-usage inside own file counts as "internal" not consumer.
  if (external.length === 0) {
    // Barrel-only declaration (re-export) with no other consumer → dead surface.
    findings.push({ name, sites, kind: sites[0].kind });
  } else if (APP_ONLY) {
    const appExternal = external.filter((f) => f.startsWith('src') || f.startsWith('admin'));
    const isTestOnly = appExternal.length === 0;
    if (isTestOnly) findings.push({ name, sites, kind: sites[0].kind, testOnlyConsumers: external });
  }
}

const byFile = new Map();
for (const f of findings) {
  for (const s of f.sites) {
    if (!byFile.has(s.file)) byFile.set(s.file, []);
    byFile.get(s.file).push(f);
  }
}

const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
console.log('\n=== DEAD EXPORT AUDIT ===\n');
console.log(`files scanned: ${files.length} | exported names: ${decls.size} | findings: ${findings.length}\n`);
for (const [file, list] of sorted) {
  console.log(`${file}  (${list.length})`);
  for (const f of list.slice(0, 40)) {
    const extra = f.testOnlyConsumers ? `  [test-only consumers: ${f.testOnlyConsumers.join(', ')}]` : '';
    console.log(`   - ${f.name}  (${f.kind})${extra}`);
  }
  if (list.length > 40) console.log(`   ... +${list.length - 40} more`);
}
console.log(`\n=== SUMMARY ===\n  findings: ${findings.length}\n  RESULT: ${findings.length ? 'FAIL' : 'PASS'}\n`);
process.exit(findings.length ? 1 : 0);
