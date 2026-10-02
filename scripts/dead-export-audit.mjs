/**
 * dead-export-audit.mjs — §1.3 dead code: exported symbols with zero consumers.
 *
 * Method (deliberately literal, no inference — the previous word-frequency
 * heuristic was unsound and produced 500 findings on code that is alive):
 *   1. resolve every import specifier in src/, serverand
 *      admin/src/ to a real file
 *   2. a name is LIVE only if some file imports that name *from the file that
 *      exports it* — named import, `import type`, or a bare/`* as`/dynamic
 *      import of that file, which makes its whole name set opaque and therefore
 *      untouchable
 *   3. re-export edges (`export { a } from './x'`) are consumers of x until it
 *      is shown that the re-exporting file's own `a` has no consumer; the pass
 *      repeats until nothing changes (fixpoint)
 *   4. `export * from` is opaque: the name set is not enumerable here
 *   5. self-usage inside the declaring file is NOT a consumer — that is exactly
 *      the dead surface this audit exists to find
 *
 * Why the old version was wrong: it asked only "does this word appear in
 * another file". A namespace member (`idb.saveChat`) is not a word, an
 * `import type` erases into whitespace once comments are stripped, and a
 * regression test was skipped entirely — so all three classes of *live* export
 * read as dead. Deleting exports on that signal breaks working code.
 *
 * Test files count as consumers: a regression test beside a component is a
 * house requirement, not a smell. `--app-only` re-reports those separately.
 *
 * Exit code keys on `dead` (a removable declaration) only. `surface` means the
 * code is live inside its own file but carries a redundant `export` — that is
 * export hygiene, not a defect, and it is reported as INFO so a repo-wide
 * cleanup of 200+ such keywords cannot hold the gate red forever. `--strict`
 * restores the old behaviour of failing on any finding, for use once that
 * cleanup is done.
 *
 * Usage: node scripts/dead-export-audit.mjs [--app-only] [--strict]
 * Exit:  0 = no dead declarations, 1 = dead declarations found
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const APP_ONLY = process.argv.includes('--app-only');

// `tests/` is a real root with its own suites (crypto, hmac, mnemonic) that
// import from src/. Omitting it reported those imports as absent.
const SOURCE_ROOTS = ['src', 'server', 'e2e', 'scripts', 'tests', 'admin/src'].filter((d) =>
  existsSync(join(ROOT, d)),
);
const CODE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (CODE_EXTS.includes(extname(entry))) out.push(full);
  }
  return out;
}

const files = SOURCE_ROOTS.flatMap((r) => walk(join(ROOT, r)));
const isTest = (f) => /\.test\.[cm]?[jt]sx?$/.test(f) || /\.spec\.[cm]?[jt]sx?$/.test(f);
const key = (f) => relative(ROOT, f).replace(/\\/g, '/');

/** Strip comments so commented-out code cannot look like a consumer. */
function stripNoise(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const CANDIDATES = [...CODE_EXTS, ...CODE_EXTS.map((e) => `/index${e}`)];
const resolveSpec = (fromFile, spec) => {
  // `@/x` is the repo-root alias declared in vite.config.ts / tsconfig.json. No
  // file uses it today, but resolving it keeps a future alias import from being
  // reported as a dead export.
  if (spec.startsWith('@/')) {
    const base = resolve(ROOT, spec.slice(2));
    for (const c of CANDIDATES) {
      const p = base + c;
      if (existsSync(p) && statSync(p).isFile()) return p;
    }
    return null;
  }
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  // A specifier that already carries an extension (`./db.js`, `./jsx-tags.mjs`)
  // must be tried verbatim before the extensionless candidates. Node ESM
  // requires the extension, so 120 server/scripts imports are written that way,
  // and probing only `base + ext` never resolves them — every export behind one
  // of those was reported dead.
  if (CODE_EXTS.includes(extname(base)) && existsSync(base) && statSync(base).isFile()) return base;
  // TS sources are imported as `.js` under NodeNext resolution, so a `.js`
  // specifier still points at the `.ts` file on disk.
  if (extname(base) === '.js') {
    const ts = base.slice(0, -3) + '.ts';
    if (existsSync(ts) && statSync(ts).isFile()) return ts;
  }
  for (const c of CANDIDATES) {
    const p = base + c;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
};

// The body deliberately cannot contain a quote, a semicolon or a closing brace.
// Without that bound a lazy `[\s\S]*?` runs past the end of one statement and
// swallows the next import — which showed up as fabricated consumers like
// `name: 'Test User'` and as genuinely live imports being missed.
const IMPORT_RE = /(?:^|\n)[ \t]*import[ \t]+(type[ \t]+)?([^;'"]*?)[ \t]*from[ \t]*['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
const DYNAMIC_RE = /(?:^|[^.\w])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const REEXPORT_RE = /(?:^|\n)\s*export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?/g;
const STAR_RE = /(?:^|\n)\s*export\s+\*\s+from\s*['"]([^'"]+)['"];?/g;

const EXPORT_DECL_RE =
  /export\s+(?:declare\s+)?(?:default\s+)?(async\s+)?(function\*?|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g;
const EXPORT_LIST_RE = /export\s*(?:type\s*)?\{([^}]*)\}\s*(?:;|(?=\n)|$)/g;

/** file key -> Map(exportedName -> kind) */
const declared = new Map();
/** file key -> Map(exportedName -> source file key) for `export { a } from './x'` */
const reExported = new Map();
/** file key -> Set(consumer file keys) that opaque-import it */
const opaque = new Map();
/** file key -> Map(exportedName -> Set(consumer file keys)) named imports */
const namedImports = new Map();
/** file key -> Set(consumer file keys) that reach it via `export *` */
const starConsumers = new Map();

const put = (m, k, v) => {
  if (!m.has(k)) m.set(k, v);
  return m.get(k);
};

const addNamed = (target, name, consumer) => {
  const byName = put(namedImports, target, new Map());
  if (!byName.has(name)) byName.set(name, new Set());
  byName.get(name).add(consumer);
};

for (const file of files) {
  if (isTest(file)) continue; // a test never declares app surface
  const code = stripNoise(readFileSync(file, 'utf-8'));
  const me = key(file);
  const decls = put(declared, me, new Map());
  const reEx = put(reExported, me, new Map());
  let m;

  EXPORT_DECL_RE.lastIndex = 0;
  while ((m = EXPORT_DECL_RE.exec(code))) {
    decls.set(m[3], (m[2] || '').trim());
  }

  // `export { a, b as c }` with no `from` — same file, already declared or a
  // second public name for it. Not a cross-file edge.
  EXPORT_LIST_RE.lastIndex = 0;
  while ((m = EXPORT_LIST_RE.exec(code))) {
    for (let raw of m[1].split(',')) {
      const t = raw.trim();
      if (!t) continue;
      const exported = t.replace(/^type\s+/, '').split(/\s+as\s+/).pop().trim();
      if (!exported || exported === 'default') continue;
      if (!decls.has(exported)) decls.set(exported, 're-export');
    }
  }

  REEXPORT_RE.lastIndex = 0;
  while ((m = REEXPORT_RE.exec(code))) {
    const target = resolveSpec(file, m[3]);
    if (!target) continue;
    for (let raw of m[2].split(',')) {
      const t = raw.trim();
      if (!t) continue;
      const exported = t.replace(/^type\s+/, '').split(/\s+as\s+/).pop().trim();
      if (!exported || exported === 'default') continue;
      reEx.set(exported, key(target));
    }
  }

  STAR_RE.lastIndex = 0;
  while ((m = STAR_RE.exec(code))) {
    const target = resolveSpec(file, m[1]);
    if (target) put(starConsumers, key(target), new Set()).add(me);
  }

  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(code))) {
    const target = resolveSpec(file, m[3]);
    if (!target) continue;
    const braces = /\{([\s\S]*?)\}/.exec(m[2]);
    if (!braces) {
      // `import * as ns` or `import Default` — the name set is not enumerable
      put(opaque, key(target), new Set()).add(me);
      continue;
    }
    for (let raw of braces[1].split(',')) {
      const nm = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      if (nm && nm !== 'default') addNamed(key(target), nm, me);
    }
  }

  BARE_IMPORT_RE.lastIndex = 0;
  while ((m = BARE_IMPORT_RE.exec(code))) {
    const target = resolveSpec(file, m[1]);
    if (target) put(opaque, key(target), new Set()).add(me);
  }

  DYNAMIC_RE.lastIndex = 0;
  while ((m = DYNAMIC_RE.exec(code))) {
    const target = resolveSpec(file, m[1]);
    if (target) put(opaque, key(target), new Set()).add(me);
  }
}

// Tests declare no surface, but they are legitimate consumers.
for (const file of files) {
  if (!isTest(file)) continue;
  const code = stripNoise(readFileSync(file, 'utf-8'));
  const me = key(file);
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(code))) {
    const target = resolveSpec(file, m[3]);
    if (!target) continue;
    const braces = /\{([\s\S]*?)\}/.exec(m[2]);
    if (!braces) {
      put(opaque, key(target), new Set()).add(me);
      continue;
    }
    for (let raw of braces[1].split(',')) {
      const nm = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      if (nm && nm !== 'default') addNamed(key(target), nm, me);
    }
  }
  BARE_IMPORT_RE.lastIndex = 0;
  while ((m = BARE_IMPORT_RE.exec(code))) {
    const target = resolveSpec(file, m[1]);
    if (target) put(opaque, key(target), new Set()).add(me);
  }
  DYNAMIC_RE.lastIndex = 0;
  while ((m = DYNAMIC_RE.exec(code))) {
    const target = resolveSpec(file, m[1]);
    if (target) put(opaque, key(target), new Set()).add(me);
  }
}

// --- fixpoint over re-export edges -----------------------------------------
// A re-exporting file R is a consumer of the name in its source file S, but
// only while something still imports that name *from R*. Drop the edge when
// nobody does, and let that cascade until stable.
const reExportLive = new Map(); // re-exporting file key -> Set(exported names) still reachable
for (const [r, names] of reExported) reExportLive.set(r, new Set(names.keys()));

for (let round = 1; round <= 20; round++) {
  let changed = false;
  for (const [r, names] of reExported) {
    const liveNames = reExportLive.get(r);
    const rOpaque = opaque.has(r);
    const rStarred = starConsumers.has(r);
    const fromR = namedImports.get(r);
    for (const exported of names.keys()) {
      if (!liveNames.has(exported)) continue;
      const consumed = rOpaque || rStarred || (fromR && fromR.has(exported));
      if (!consumed) {
        liveNames.delete(exported);
        changed = true;
      }
    }
  }
  if (!changed) break;
  if (round === 20) console.log('  ! re-export fixpoint not reached');
}

// --- collect ---------------------------------------------------------------
// Two distinct problems share one report and must not be confused:
//   dead    — exported AND referenced nowhere, not even inside its own file.
//             The declaration can go.
//   surface — exported but used internally (or reachable only via a
//             star/opaque edge we chose not to follow). The code is live; only
//             the `export` keyword is noise. Deleting these outright is how a
//             "dead export" sweep breaks working scripts.
const selfUse = new Map(); // file key -> Map(name -> count of internal references)
for (const file of files) {
  if (isTest(file)) continue;
  const code = stripNoise(readFileSync(file, 'utf-8'));
  const decls = declared.get(key(file));
  if (!decls) continue;
  const counts = new Map();
  for (const name of decls.keys()) {
    const re = new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`, 'g');
    const n = (code.match(re) || []).length;
    // one occurrence is the declaration itself
    if (n > 1) counts.set(name, n - 1);
  }
  selfUse.set(key(file), counts);
}

// A live re-export edge makes the barrel a consumer of the name in its source
// file. Without this, anything reached through a barrel (`import { BottomNav }
// from "../navigation"`) looked dead even though the barrel is the only path
// to it — which is the normal shape of this codebase's imports.
const reExportConsumers = new Map(); // source file -> Map(name -> Set(barrel keys))
for (const [r, names] of reExported) {
  for (const [exported, source] of names) {
    if (!reExportLive.get(r)?.has(exported)) continue;
    const byName = reExportConsumers.get(source) || new Map();
    if (!byName.has(exported)) byName.set(exported, new Set());
    byName.get(exported).add(r);
    // Must write the new inner Map back: `get(...) || new Map()` returns a
    // throwaway when the key is absent, and every credit would be lost.
    reExportConsumers.set(source, byName);
  }
}

const findings = [];

for (const [file, decls] of declared) {
  const fileOpaque = opaque.has(file);
  const fileStarred = starConsumers.has(file);
  const imported = namedImports.get(file);
  const viaBarrel = reExportConsumers.get(file);
  const internal = selfUse.get(file) || new Map();
  for (const [name, kind] of decls) {
    if (fileOpaque || fileStarred) continue;
    const direct = imported?.get(name) || new Set();
    const barrels = viaBarrel?.get(name) || new Set();
    const consumers = new Set([...direct, ...barrels]);
    const usedInside = internal.has(name);
    if (consumers.size === 0) {
      findings.push({
        name,
        file,
        kind,
        consumers: [],
        disposition: usedInside ? 'surface' : 'dead',
      });
      continue;
    }
    if (APP_ONLY) {
      const app = [...consumers].filter((c) => c.startsWith('src/') || c.startsWith('admin/'));
      if (app.length === 0) findings.push({ name, file, kind, consumers: [...consumers], testOnly: true });
    }
  }
}

// A re-export whose own name nobody imports is dead surface in the barrel.
for (const [r, names] of reExported) {
  if (opaque.has(r) || starConsumers.has(r)) continue;
  const fromR = namedImports.get(r);
  for (const exported of names.keys()) {
    if (fromR?.has(exported)) continue;
    findings.push({ name: exported, file: r, kind: 're-export', consumers: [], disposition: 'dead' });
  }
}

const tally = findings.reduce(
  (acc, f) => {
    const k = f.testOnly ? 'test-only' : f.disposition;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  },
  {},
);

const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}
const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

console.log('\n=== DEAD EXPORT AUDIT ===\n');
console.log(`files scanned: ${files.length} | modules with exports: ${declared.size} | findings: ${findings.length}\n`);
for (const [file, list] of sorted) {
  console.log(`${file}  (${list.length})`);
  for (const f of list.slice(0, 40)) {
    const extra = f.testOnly
      ? `  [test-only: ${f.consumers.join(', ')}]`
      : `  <${f.disposition}>`;
    console.log(`   - ${f.name}  (${f.kind})${extra}`);
  }
  if (list.length > 40) console.log(`   ... +${list.length - 40} more`);
}
const STRICT = process.argv.includes('--strict');
const deadCount = tally.dead || 0;
const surfaceCount = tally.surface || 0;
const blocking = STRICT ? findings.length : deadCount;
console.log(
  `\n=== SUMMARY ===\n  findings: ${findings.length}` +
    `\n    dead    (declaration removable): ${deadCount}` +
    `\n    surface (live code, redundant 'export' — INFO, not a failure): ${surfaceCount}` +
    (tally['test-only'] ? `\n    test-only consumers: ${tally['test-only']}` : '') +
    `\n  RESULT: ${blocking ? 'FAIL' : 'PASS'}` +
    (surfaceCount && !STRICT
      ? `\n  note: ${surfaceCount} surface item(s) do not fail this gate; pass --strict to require them too`
      : '') +
    `\n`,
);
process.exit(blocking ? 1 : 0);
