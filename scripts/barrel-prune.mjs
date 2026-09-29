/**
 * barrel-prune.mjs — drop barrel files and re-exports that nothing imports.
 *
 * Method (deliberately literal, no inference):
 *   1. resolve every import specifier in src/, server/, e2e/, scripts/ and the
 *      root config files to a real file
 *   2. a barrel with zero importers is dead outright → the whole file goes
 *   3. a name re-exported by barrel B is live only if some file imports that
 *      name *from B* (named import, `import type`, or a namespace/dynamic
 *      import of B, which disables pruning of B entirely)
 *   4. prune dead specifiers from `export { … } from` lines, then recompute —
 *      removing a line from barrel A can make a re-export in barrel B dead, so
 *      the pass repeats until nothing changes (fixpoint)
 *
 * `export * from` is never touched (its name set is not statically knowable here)
 * and non-barrel exports (declarations, `export const`) are left alone.
 * `tsc --noEmit` is the safety net: a removed-but-used export fails to compile.
 *
 * Usage: node scripts/barrel-prune.mjs [--write]
 */
import { readFileSync, writeFileSync, unlinkSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const SCAN_DIRS = ['src', 'server', 'e2e', 'scripts'];

const codeFiles = (dir, out = []) => {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return out;
  for (const e of readdirSync(full)) {
    if (e === 'node_modules' || e === 'dist' || e === '.git') continue;
    const p = join(full, e);
    if (statSync(p).isDirectory()) codeFiles(relative(ROOT, p), out);
    else if (['.ts', '.tsx'].includes(extname(e))) out.push(p);
  }
  return out;
};

const CANDIDATES = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
const resolveSpec = (fromFile, spec) => {
  if (!spec.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), spec);
  for (const c of CANDIDATES) {
    const p = base + c;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
};

const IMPORT_RE = /(?:^|\n)\s*import\s+(type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g;
const BARE_IMPORT_RE = /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
const DYNAMIC_RE = /(?:^|[^.\w])import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/** barrel key -> (exported name -> importing files) */
const importedFrom = new Map();
/** barrels reached via namespace/dynamic import (name set not enumerable) */
const opaque = new Set();

const nameOf = (f) => relative(ROOT, f).replace(/\\/g, '/');

/** `export { a, b as c } from './x'` / `export type { … } from './x'` */
const EXPORT_RE = /^[ \t]*export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm;
/** `export * from './x'` — name set is not enumerable, but the target may vanish */
const STAR_RE = /^[ \t]*export\s+\*\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm;

const isBarrel = (code) => {
  const body = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));
  if (!body.length) return false;
  return body.every((l) => /^export\s/.test(l));
};

/** root-level config files can import barrels too */
const rootConfigs = () =>
  readdirSync(ROOT)
    .filter((f) => ['.ts', '.tsx'].includes(extname(f)))
    .map((f) => join(ROOT, f));

const scanFiles = () => [...SCAN_DIRS.flatMap((d) => codeFiles(d)), ...rootConfigs()];

const rebuild = () => {
  importedFrom.clear();
  opaque.clear();
  for (const file of scanFiles()) {
    if (!existsSync(file)) continue;
    const code = readFileSync(file, 'utf-8');
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(code))) {
      const barrel = resolveSpec(file, m[3]);
      if (!barrel) continue;
      const k = nameOf(barrel);
      if (!importedFrom.has(k)) importedFrom.set(k, new Map());
      const byName = importedFrom.get(k);
      const braces = /\{([\s\S]*?)\}/.exec(m[2]);
      if (!braces) { opaque.add(k); continue; }
      for (let raw of braces[1].split(',')) {
        const nm = raw.trim().replace(/^type\s+/, '');
        if (!nm) continue;
        if (!byName.has(nm)) byName.set(nm, new Set());
        byName.get(nm).add(nameOf(file));
      }
    }
    BARE_IMPORT_RE.lastIndex = 0;
    while ((m = BARE_IMPORT_RE.exec(code))) {
      const barrel = resolveSpec(file, m[1]);
      if (barrel) opaque.add(nameOf(barrel));
    }
    DYNAMIC_RE.lastIndex = 0;
    while ((m = DYNAMIC_RE.exec(code))) {
      const barrel = resolveSpec(file, m[1]);
      if (barrel) opaque.add(nameOf(barrel));
    }
  }
};

const barrels = () =>
  codeFiles('src')
    .map((f) => ({ path: f, key: nameOf(f), code: readFileSync(f, 'utf-8') }))
    .filter((b) => isBarrel(b.code));

/** drop blank runs left behind by removed statements */
const tidy = (code) =>
  code
    .split('\n')
    .filter((l) => l.trim() !== '')
    .join('\n')
    .trimEnd() + '\n';

const deleted = [];
const rewritten = [];
let round = 0;

for (;;) {
  round++;
  rebuild();
  const changes = [];

  for (const b of barrels()) {
    if (deleted.includes(b.key)) continue;
    const used = importedFrom.get(b.key);
    if (!used) {
      changes.push({ kind: 'delete', b });
      continue;
    }
    if (opaque.has(b.key)) {
      console.log(`  [skip] ${b.key} — namespace/dynamic import, name set not enumerable`);
      continue;
    }
    const droppedNames = [];
    const droppedStars = [];
    let out = b.code.replace(STAR_RE, (line, spec) => {
      // keep the star only while its target still resolves; a target that is
      // gone (deleted this run or earlier) leaves a dangling module reference
      const target = resolveSpec(b.path, spec);
      if (target && !deleted.includes(nameOf(target))) return line;
      droppedStars.push(spec);
      return '';
    });
    out = out.replace(EXPORT_RE, (_line, isType, body, spec) => {
      const kept = [];
      for (let raw of body.split(',')) {
        const t = raw.trim();
        if (!t) continue;
        const exported = t.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
        if (used.has(exported)) kept.push(t);
        else droppedNames.push(exported);
      }
      if (!kept.length) return '';
      const kw = isType ? 'export type ' : 'export ';
      return `${kw}{ ${kept.join(', ')} } from '${spec}';`;
    });
    if (droppedNames.length || droppedStars.length) {
      changes.push({ kind: 'prune', b, out, names: droppedNames, stars: droppedStars });
    }
  }

  if (!changes.length) break;

  for (const c of changes) {
    if (c.kind === 'delete') {
      deleted.push(c.b.key);
      console.log(`  r${round} DELETE ${c.b.key}`);
      if (WRITE) unlinkSync(c.b.path);
    } else {
      if (!rewritten.includes(c.b.key)) rewritten.push(c.b.key);
      const starNote = c.stars.length ? ` + ${c.stars.length} export * → ${c.stars.join(', ')}` : '';
      console.log(`  r${round} PRUNE  ${c.b.key}: -${c.names.length}${starNote} → ${c.names.join(', ')}`);
      if (WRITE) writeFileSync(c.b.path, tidy(c.out));
    }
  }
  if (round > 10) {
    console.log('  ! fixpoint not reached');
    break;
  }
}

console.log(
  `\n${WRITE ? 'WRITTEN' : 'DRY RUN'}: ${deleted.length} barrel file(s) deleted, ` +
    `${rewritten.length} barrel(s) pruned, ${round} round(s).`,
);
