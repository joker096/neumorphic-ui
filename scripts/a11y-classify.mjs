/**
 * a11y-classify.mjs — classify form controls that have no accessible name,
 * using the correct JSX tag scanner (see jsx-tags.mjs).
 *
 * For each unlabelled <input>/<textarea>/<select> report how a name can be derived:
 *   placeholder  — reuse the same localized expression as `aria-label` (mechanical, no new i18n keys)
 *   visible-text — a real <label> sibling/ancestor holds a `t('…')` string; needs id+htmlFor or aria-label
 *   needs-key    — no placeholder and no usable label text
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findOpeningTags } from './jsx-tags.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

export function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === '.git') continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (extname(e) === '.ts' || extname(e) === '.tsx') out.push(full);
  }
  return out;
}

export function sourceFiles() {
  return walk(join(ROOT, 'src')).filter((f) => !/\.test\.|\.spec\./.test(f));
}

const enclosingLabel = (before) => {
  const tail = before.length > 3000 ? before.slice(-3000) : before;
  const scan = /<(\/?)label\b[^>]*>/g;
  let depth = 0; let s;
  while ((s = scan.exec(tail))) depth += s[1] ? -1 : 1;
  return depth > 0;
};

export function classify() {
  const rows = [];
  for (const file of sourceFiles()) {
    const rel = relative(ROOT, file);
    const code = readFileSync(file, 'utf-8');
    for (const tag of findOpeningTags(code, ['input', 'textarea', 'select'])) {
      const a = tag.attrs;
      if (/type\s*=\s*["']hidden["']/.test(a)) continue;
      if (/\bdisabled\b/.test(a)) continue;
      if (/aria-hidden\s*=\s*\{?["']true/.test(a)) continue;
      if (tag.name === 'input' && /type\s*=\s*["'](submit|button|reset)["']/.test(a)) continue;
      if (/aria-label\s*=|aria-labelledby\s*=/.test(a)) continue;
      // shared UI wrappers pass the name through as a prop instead of hardcoding it
      if (/aria-label=\{ariaLabel\}/.test(a)) continue;
      if (/className\s*=\s*\{?["'][^"']*\bhidden\b/.test(a)) continue;
      if (/type\s*=\s*["']file["']/.test(a)) continue;
      const idM = /\bid\s*=\s*["']([^"']+)["']/.exec(a);
      if (idM && new RegExp('htmlFor\\s*=\\s*\\{?\\s*["\']' + idM[1] + '["\']').test(code)) continue;
      if (enclosingLabel(code.slice(0, tag.start))) continue;

      const base = {
        file: rel,
        line: tag.line,
        tag: tag.name,
        insertAt: tag.start + 1 + tag.name.length,
        multiline: /\n/.test(a),
        indent: (code.slice(0, tag.start).split('\n').pop() || '').match(/^\s*/)[0],
      };
      const phM = /placeholder\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\}|"[^"]*")/.exec(a);
      if (phM) {
        rows.push({ ...base, kind: 'placeholder', label: phM[1] });
        continue;
      }
      const ctx = code.slice(0, tag.start).split('\n').slice(-6).join('\n');
      const labM = /t\(\s*["']([a-z0-9.]+)["']([^)]*)\)/i.exec(ctx);
      if (labM && /label|Label/.test(ctx)) {
        rows.push({ ...base, kind: 'visible-text', label: `t('${labM[1]}'${labM[2]})` });
        continue;
      }
      rows.push({ ...base, kind: 'needs-key', label: '-', attrs: a.replace(/\s+/g, ' ').slice(0, 100) });
    }
  }
  return rows;
}

if (import.meta.url.endsWith('a11y-classify.mjs')) {
  const rows = classify();
  const by = { 'placeholder': [], 'visible-text': [], 'needs-key': [] };
  for (const r of rows) by[r.kind].push(r);
  console.log(`\n=== A11Y LABEL CLASSIFICATION ===  total: ${rows.length}\n`);
  for (const k of Object.keys(by)) {
    console.log(`## ${k} (${by[k].length})`);
    const perFile = new Map();
    for (const r of by[k]) {
      if (!perFile.has(r.file)) perFile.set(r.file, []);
      perFile.get(r.file).push(r);
    }
    for (const [f, list] of [...perFile.entries()].sort()) {
      console.log(`  ${f}  (${list.length})`);
      for (const r of list) console.log(`     L${r.line} <${r.tag}> ${r.label}`.slice(0, 150));
    }
    console.log('');
  }
}
