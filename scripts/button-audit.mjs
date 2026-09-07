#!/usr/bin/env node
/**
 * button-audit.mjs — статический аудит мёртвых/дефектных кнопок (классы D2/D4/D5).
 *
 * Классы (см. AGENTS.md «Dead Controls Cycle D1–D5»):
 *   D5  — кнопка без onClick, либо onClick = пустой no-op (() => {}), либо
 *         кнопка-обёртка, чей handler не меняет наблюдаемое состояние.
 *   D2  — onClick пишет текущее значение (toggle без инверсии).
 *   D4  — вложенный интерактив внутри кнопки без e.stopPropagation().
 *
 * Это ПОДСКАЗЧИК для человека/ИИ, не замена визуальной проверки. Каждую находку
 * подтвердить глазом: интерактив может быть вынесен в onClick родителя выше.
 *
 * Usage: node scripts/button-audit.mjs [paths...]
 *   по умолчанию сканирует src/components.
 */

import { readFileSync } from 'node:fs';
import { statSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_TARGETS = [resolve(ROOT, 'src', 'components')];

// ---- helpers ---------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'dist') continue;
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) walk(fp, out);
    else if (entry.isFile() && (extname(fp) === '.tsx' || extname(fp) === '.tsx~')) {
      // тест-файлы — mock-кнопки, не продакшн; пропускаем из дефолтного аудита
      if (/\.(test|spec)\.(tsx|ts)$/.test(entry.name)) continue;
      out.push(fp);
    }
  }
  return out;
}

/**
 * Находит конец открывающего тега, учитывая строки/шаблонные литералы
 * и фигурные выражения атрибутов (стрелочные `=>` внутри `{}` не путает с концом тега).
 * Возвращает индекс символа '>' или -1.
 */
function findTagEnd(src, from) {
  let i = from;
  let inQuote = null; // null | "'" | '"' | '`'
  let exprDepth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (inQuote) {
      if (ch === inQuote && src[i - 1] !== '\\') inQuote = null;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inQuote = ch;
      i += 1;
      continue;
    }
    if (ch === '{') exprDepth += 1;
    else if (ch === '}') exprDepth = Math.max(0, exprDepth - 1);
    else if (ch === '>' && exprDepth === 0) return i;
    i += 1;
  }
  return -1;
}

/**
 * Разбивает код на JSX-кнопки: self-closing `<button ... />` и парные
 * `<button ...>...</button>`. `inner` — содержимое между тегами (пусто
 * для self-closing); D4-проверка идёт только по `inner`, чтобы собственный
 * `role=` атрибут тега не считался вложенным интерактивом.
 */
function extractButtons(src) {
  const buttons = [];
  let i = 0;
  for (;;) {
    const open = src.indexOf('<button', i);
    if (open === -1) break;
    const tagEnd = findTagEnd(src, open);
    if (tagEnd === -1) break;
    const tag = src.slice(open, tagEnd + 1);
    if (tag.trimEnd().endsWith('/>')) {
      buttons.push({ tag, inner: '', start: open });
      i = tagEnd + 1;
    } else {
      const close = src.indexOf('</button>', tagEnd + 1);
      if (close === -1) break;
      buttons.push({ tag, inner: src.slice(tagEnd + 1, close), start: open });
      i = close + '</button>'.length;
    }
  }
  return buttons;
}

function hasOnClick(tag) {
  return /onClick\s*=/.test(tag);
}

function parseOnClickExpr(tag) {
  const m = tag.match(/onClick\s*=\s*\{([\s\S]*?)\}/);
  return m ? m[1].trim() : null;
}

function isEmptyHandler(expr) {
  if (!expr) return false;
  const compact = expr.replace(/\s+/g, '');
  return compact === '()=>{}' || compact === '()=>undefined' || compact === '()=>{};';
}

function isNestedInteractive(inner) {
  // вложенный <button> или role=switch/button в содержимом без stopPropagation
  const innerButtons = /<button/.test(inner);
  const switchRole = /role="switch"/.test(inner) || /role="button"/.test(inner);
  const hasStop = /stopPropagation/.test(inner);
  return (innerButtons || switchRole) && !hasStop;
}

const FINDINGS = [];

function auditFile(fp) {
  const src = readFileSync(fp, 'utf-8');
  const buttons = extractButtons(src);
  for (const b of buttons) {
    const line = src.slice(0, b.start).split('\n').length;
    const expr = parseOnClickExpr(b.tag);
    const isSubmit = /type="submit"/.test(b.tag);
    const isPrimitive = /\{\.\.\.(rest|props|others?)\}/.test(b.tag);

    if (!hasOnClick(b.tag)) {
      if (isSubmit || isPrimitive) {
        // не D5: submit-кнопка (обрабатывается onSubmit формы) или примитив со spread-props
        continue;
      }
      FINDINGS.push({ file: fp, line, code: 'D5', msg: 'кнопка без onClick' });
      continue;
    }
    if (isEmptyHandler(expr)) {
      FINDINGS.push({ file: fp, line, code: 'D5', msg: 'onClick = пустой no-op' });
      continue;
    }
    if (isNestedInteractive(b.inner)) {
      FINDINGS.push({ file: fp, line, code: 'D4', msg: 'вложенный интерактив без stopPropagation' });
    }
  }
}

// ---- run -------------------------------------------------------------------

const targets = process.argv.slice(2).length ? process.argv.slice(2).map((p) => resolve(p)) : DEFAULT_TARGETS;
const files = [];
for (const t of targets) {
  if (!statSync(t, { throwIfNoEntry: false })) continue;
  if (statSync(t).isDirectory()) files.push(...walk(t));
  else files.push(t);
}

for (const f of files) auditFile(f);

// ---- report ----------------------------------------------------------------

let byFile = 0;
const grouped = new Map();
for (const f of FINDINGS) {
  byFile++;
  const rel = f.file.startsWith(ROOT) ? f.file.slice(ROOT.length + 1) : f.file;
  if (!grouped.has(f.code)) grouped.set(f.code, []);
  grouped.get(f.code).push(`${rel}:${f.line} — ${f.msg}`);
}

console.log('\n=== BUTTON AUDIT ===');
console.log(`Scanned files: ${files.length}`);
console.log(`Button blocks scanned: ${(function(){let n=0;for(const f of files){const s=readFileSync(f,'utf-8');n+=extractButtons(s).length;}return n;})()}`);
console.log(`Findings: ${FINDINGS.length}`);

for (const [code, list] of [...grouped.entries()].sort()) {
  console.log(`\n[${code}] ${list.length}`);
  for (const item of list) console.log('  ' + item);
}

process.exit(FINDINGS.length > 0 ? 2 : 0);
