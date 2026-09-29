/**
 * barrel-audit.mjs — §1.3: which barrel re-exports are actually reachable.
 *
 * For every barrel (src/**\/index.ts(x)) and every named export in it:
 *   - REACHABLE  : a consumer imports the name FROM THE BARREL (or the barrel
 *                  re-exports are pulled in by `export *` chains that a
 *                  consumer uses).
 *   - DEAD       : no consumer imports the name from the barrel; the name is
 *                  only "exported" — the underlying module may still be used
 *                  directly, in which case the barrel line is pure overhead.
 *
 * Usage: node scripts/barrel-audit.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'src');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === '.git') continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(e) === '.ts' || extname(e) === '.tsx') out.push(full);
  }
  return out;
}

const all = walk(SRC).filter((f) => !/vite-env\.d\.ts$/.test(f));
const barrels = all.filter((f) => /index\.[jt]sx?$/.test(f));

// parse barrel: collect { names, sources: Map(name -> source) }
function parseBarrel(file) {
  const code = readFileSync(file, 'utf-8');
  const names = new Set();
  const sources = new Map();
  const star = [];
  const EXPORT_BLOCK = /export\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = EXPORT_BLOCK.exec(code))) {
    for (const raw of m[1].split(',')) {
      const p = raw.trim();
      if (!p) continue;
      const n = (p.split(/\s+as\s+/).pop() || '').trim();
      if (!n || n === 'default') continue;
      names.add(n);
      sources.set(n, m[2]);
    }
  }
  const STAR = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  while ((m = STAR.exec(code))) star.push(m[1]);
  // local re-exports without from
  const LOCAL = /^export\s*\{([^}]*)\}\s*;?$/gm;
  while ((m = LOCAL.exec(code))) {
    for (const raw of m[1].split(',')) {
      const p = raw.trim();
      if (!p) continue;
      const n = (p.split(/\s+as\s+/).pop() || '').trim();
      if (n && n !== 'default') names.add(n);
    }
  }
  return { names, sources, star, code };
}

const posix = (p) => p.replace(/\\/g, '/');

/** Resolve a relative module specifier from `file` to an on-disk path (posix). */
function resolveSpec(file, spec) {
  const base = posix(resolve(file.replace(/[^\\/]+$/, ''), spec));
  const candidates = [base, base + '.ts', base + '.tsx', base + '.js', base + '.mjs'];
  for (const idx of ['/index.ts', '/index.tsx', '/index.js', '/index.mjs']) candidates.push(base + idx);
  for (const c of candidates) if (existsSync(c) && statSync(c).isFile()) return posix(c);
  return null;
}

// Which files import from a given barrel
function consumersOf(barrel) {
  const target = posix(barrel);
  const users = [];
  for (const f of all) {
    if (posix(f) === target) continue;
    const code = readFileSync(f, 'utf-8');
    const RE = /(?:from\s+|import\s*\(\s*|require\(\s*)['"]([^'"]+)['"]/g;
    let m;
    while ((m = RE.exec(code))) {
      if (!m[1].startsWith('.')) continue;
      if (resolveSpec(f, m[1]) === target) users.push({ file: f, code });
    }
  }
  return users;
}

const report = [];
for (const barrel of barrels) {
  const { names, sources, star, code } = parseBarrel(barrel);
  if (!names.size && !star.length) continue;
  const users = consumersOf(barrel);
  const usedNames = new Set();
  const userFiles = new Set();
  for (const u of users) {
    userFiles.add(relative(ROOT, u.file));
    for (const n of names) {
      if (new RegExp('(?<![\\w$])' + n.replace(/\$/g, '\\$') + '(?![\\w$])').test(u.code)) usedNames.add(n);
    }
  }
  const deadNames = [...names].filter((n) => !usedNames.has(n));
  if (deadNames.length) {
    report.push({ barrel: relative(ROOT, barrel), users: userFiles.size, total: names.size, dead: deadNames });
  }
}

console.log('\n=== BARREL AUDIT ===\n');
let deadTotal = 0;
for (const r of report.sort((a, b) => b.dead.length - a.dead.length)) {
  deadTotal += r.dead.length;
  console.log(`${r.barrel}  (users: ${r.users}, exports: ${r.total}, DEAD: ${r.dead.length})`);
  console.log(`  ${r.dead.join(', ')}`);
}
console.log(`\n=== SUMMARY ===\n  barrels with dead re-exports: ${report.length}\n  dead re-export names: ${deadTotal}\n`);
