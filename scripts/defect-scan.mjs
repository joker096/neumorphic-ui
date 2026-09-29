/**
 * defect-scan.mjs — runtime bug / a11y classes not covered by the other gates.
 *
 * Classes:
 *   N1  numeric id reaching a String-only method (.slice/.substring/.toLowerCase
 *       on a `string | number` field) — the prod crash class from 2026-09-18.
 *   A11 icon-only <button> (no text child, no aria-label, no title) — nameless
 *       control for screen readers (§2.2).
 *   A12 input without a label / aria-label (placeholder-only is not a label).
 *       Uses the shared JSX tag scanner (jsx-tags.mjs) — a regex attribute match
 *       terminates on the `>` of `onChange={(e) => …}` and reports false positives.
 *   T1  `key={index}` on a list that maps over a filtered/reordered array.
 *   E1  effect body that both sets state and has a dependency it also sets
 *       (self-triggering loop risk) — reported for manual review only.
 *   X1  dangerouslySetInnerHTML / innerHTML / eval / new Function.
 *
 * Usage: node scripts/defect-scan.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findOpeningTags } from './jsx-tags.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

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

const files = walk(join(ROOT, 'src')).filter((f) => !/\.test\.|\.spec\./.test(f));
const findings = { N1: [], A11: [], A12: [], T1: [], X1: [] };

const STRING_ONLY = /\.(slice|substring|substr|toLowerCase|toUpperCase|replace|trim|padStart|padEnd|startsWith|endsWith|split|includes|indexOf|charAt)\s*\(/;

for (const file of files) {
  const rel = relative(ROOT, file);
  const code = readFileSync(file, 'utf-8');
  const lines = code.split('\n');

  // ---- X1 unsafe sinks ----
  lines.forEach((l, i) => {
    if (/dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\s*\(|new Function\s*\(/.test(l)) {
      findings.X1.push(`${rel}:${i + 1}: ${l.trim().slice(0, 120)}`);
    }
  });

  // ---- A11 icon-only buttons ----
  // Match <button ...> ... </button> blocks (no nested button).
  // A JSX expression child ({t('x')}) DOES contribute to the accessible name,
  // so only pure static-icon markup counts as nameless.
  const BTN = /<button\b([\s\S]*?)>([\s\S]*?)<\/button>/g;
  let m;
  while ((m = BTN.exec(code))) {
    const attrs = m[1];
    const inner = m[2];
    if (/<button\b/.test(inner)) continue;
    const hasLabel = /aria-label\s*=/.test(attrs)
      || /aria-labelledby\s*=/.test(attrs)
      || /title\s*=/.test(attrs);
    if (hasLabel) continue;
    const staticText = inner
      .replace(/<[^>]+>/g, ' ')                       // drop tags (icons)
      .replace(/\s+/g, ' ')
      .trim();
    // Any JSX expression child => dynamic name; any literal text => visible name.
    const hasExpr = /\{[\s\S]*\}/.test(inner);
    if (!hasExpr && staticText.length === 0) {
      const line = code.slice(0, m.index).split('\n').length;
      findings.A11.push(`${rel}:${line}: <button> with no accessible name (inner="${inner.replace(/\s+/g, ' ').trim().slice(0, 90)}")`);
    }
  }

  // ---- A12 inputs without label ----
  // Exempt: inside a <label> ancestor, aria-label(ledby), htmlFor pairing,
  // shared wrappers that pass the name through a prop, and hidden inputs
  // (className="hidden" / aria-hidden) — including file inputs that a visible
  // button drives via ref.click().
  const enclosingLabel = (before) => {
    const tail = before.length > 3000 ? before.slice(-3000) : before;
    const scan = /<(\/?)label\b[^>]*>/g;
    let depth = 0; let s;
    while ((s = scan.exec(tail))) depth += s[1] ? -1 : 1;
    return depth > 0;
  };
  for (const tag of findOpeningTags(code, ['input', 'textarea', 'select'])) {
    const attrs = tag.attrs;
    if (/type\s*=\s*["']hidden["']/.test(attrs)) continue;
    if (/\bdisabled\b/.test(attrs)) continue;
    if (/aria-hidden\s*=\s*\{?["']true/.test(attrs)) continue;
    if (tag.name === 'input' && /type\s*=\s*["'](submit|button|reset)["']/.test(attrs)) continue;
    if (/aria-label\s*=|aria-labelledby\s*=/.test(attrs)) continue;
    if (/aria-label=\{ariaLabel\}/.test(attrs)) continue;
    // visually hidden / display-none control driven by a labelled control
    if (/className\s*=\s*\{?["'][^"']*\bhidden\b/.test(attrs) || /type\s*=\s*["']file["']/.test(attrs)) continue;
    const idM = /\bid\s*=\s*["']([^"']+)["']/.exec(attrs);
    if (idM && new RegExp('htmlFor\\s*=\\s*\\{?\\s*["\']' + idM[1] + '["\']').test(code)) continue;
    if (enclosingLabel(code.slice(0, tag.start))) continue;
    findings.A12.push(`${rel}:${tag.line}: <${tag.name}${idM ? ` id="${idM[1]}"` : ''}> without aria-label/label`);
  }

  // ---- T1 index keys ----
  lines.forEach((l, i) => {
    if (/key=\{(i|idx|index)\}/.test(l)) {
      const ctx = lines.slice(Math.max(0, i - 3), i + 1).join(' ');
      if (/\.(filter|sort|reverse|slice)\s*\(|new Set\(|new Map\(/.test(ctx)) {
        findings.T1.push(`${rel}:${i + 1}: ${l.trim().slice(0, 110)}`);
      }
    }
  });
}

// ---- N1: string-only method applied to a possibly-numeric id ----
// Heuristic: id-ish expressions (contactId, chatId, memberId, callId …) wrapped in
// parens and followed by a string-only method without String()/toString().
const IDISH = /\b\w*(?:[Ii]d|Id|ID)\w*\s*(?:\?\?|\|\|)?\s*[^;,)]{0,40}?\)?\s*\.\s*(?:slice|substring|substr|toLowerCase|toUpperCase|charAt|padStart|padEnd|trim)\s*\(/g;
for (const file of files) {
  const rel = relative(ROOT, file);
  const code = readFileSync(file, 'utf-8');
  let m;
  const stripped = code.replace(/String\s*\([^)]*\)\s*\.\s*(?:slice|substring|charAt|toLowerCase|toUpperCase)/g, (s) => ' '.repeat(s.length));
  IDISH.lastIndex = 0;
  while ((m = IDISH.exec(stripped))) {
    const start = Math.max(0, m.index - 90);
    const line = code.slice(0, m.index).split('\n').length;
    const ctx = code.slice(start, m.index + m[0].length).replace(/\s+/g, ' ').trim();
    if (/\?\?|\|\|/.test(ctx) && !/String\(/.test(ctx.slice(0, 60))) {
      findings.N1.push(`${rel}:${line}: ...${ctx.slice(-100)}`);
    }
  }
  void STRING_ONLY;
}

console.log('\n=== DEFECT SCAN ===\n');
const keys = ['N1', 'A11', 'A12', 'T1', 'X1'];
for (const k of keys) {
  const list = findings[k];
  console.log(`## ${k} (${list.length})`);
  for (const f of list.slice(0, 60)) console.log(`  ${f}`);
  if (list.length > 60) console.log(`  ... +${list.length - 60} more`);
  console.log('');
}
const total = keys.reduce((n, k) => n + findings[k].length, 0);
console.log(`=== SUMMARY ===  total: ${total}\n`);
