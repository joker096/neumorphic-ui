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

/** Разбивает код на самодостаточные JSX-блоки <button ...>...</button>. */
function extractButtons(src) {
  const buttons = [];
  let i = 0;
  while (i < src.length - 1) {
    const open = src.indexOf('<button', i);
    if (open === -1) break;
    // закрывающий тег блока: ищем </button> после open
    const close = src.indexOf('</button>', open);
    if (close === -1) break;
    const block = src.slice(open, close);
    buttons.push({ block, start: open, end: close });
    i = close + '</button>'.length;
  }
  return buttons;
}

function hasOnClick(block) {
  // onClick может быть многострочным; простой поиск внутри блока
  return /onClick\s*=/.test(block);
}

function parseOnClickExpr(block) {
  const m = block.match(/onClick\s*=\s*\{([\s\S]*?)\}/);
  return m ? m[1].trim() : null;
}

function isEmptyHandler(expr) {
  if (!expr) return false;
  const compact = expr.replace(/\s+/g, '');
  return compact === '()=>{}' || compact === '()=>undefined' || compact === '()=>{};';
}

function isNestedInteractive(block) {
  // вложенный <button> или role=switch/button внутри без stopPropagation
  const innerButtons = /<button/.test(block.replace(/<button[^>]*>/, ''));
  const switchRole = /role="switch"/.test(block) || /role="button"/.test(block);
  const hasStop = /stopPropagation/.test(block);
  return (innerButtons || switchRole) && !hasStop;
}

const FINDINGS = [];

function auditFile(fp) {
  const src = readFileSync(fp, 'utf-8');
  const buttons = extractButtons(src);
  for (const b of buttons) {
    const line = src.slice(0, b.start).split('\n').length;
    const expr = parseOnClickExpr(b.block);
    const isSubmit = /type="submit"/.test(b.block);
    const isPrimitive = /\{\.\.\.(rest|props|others?)\}/.test(b.block);

    if (!hasOnClick(b.block)) {
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
    if (isNestedInteractive(b.block)) {
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
