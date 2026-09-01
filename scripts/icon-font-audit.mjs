#!/usr/bin/env node
/**
 * icon-font-audit.mjs — статический аудит размеров иконок и шрифтов (проверки I1/F1/F2).
 *
 * Шкалы (см. src/styles/tokens.css):
 *   Иконки (lucide `size` prop): 12 14 16 18 20 24 28 32 + hero/empty-state 40 44 48.
 *   Шрифты (px): 11 12 13 14 16 18 20 24 28 32 40.
 *
 * Проверки:
 *   I1  icon-off-scale  — `size={N}`, где N < 100 и N не в icon-шкале.
 *   F2  font-below-min  — шрифт N < 11px (не читаемо).
 *   F1  font-off-ramp   — шрифт N < 40px и N не в font-рамп (N >= 40 = display, вне проверки).
 *
 * Относительные размеры (`text-[0.9em]`) не проверяются: они масштабируются вместе
 * с родителем и не ломают рампу.
 *
 * Это ПОДСКАЗЧИК: каждую находку подтвердить глазом (класс может быть в комментарии
 * или строке, не являющейся классом).
 *
 * Usage: node scripts/icon-font-audit.mjs [--json] [paths...]
 *   по умолчанию сканирует src. Exit code 2 при findings.
 */

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_TARGETS = [resolve(ROOT, 'src')];

// ---- scales -----------------------------------------------------------------

export const ICON_SCALE = [12, 14, 16, 18, 20, 24, 28, 32];
export const ICON_HERO_SIZES = [40, 44, 48];
export const ICON_FLAG_CAP = 100;
export const FONT_RAMP = [11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 40];
export const MIN_FONT_PX = 11;
export const FONT_FLAG_CAP = 40;

/** Tailwind named sizes в px (учитывая override в tokens.css: 2xs = 11px). */
export const NAMED_FONT_PX = {
  '2xs': 11,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
};

// ---- pure checks --------------------------------------------------------------

const SIZE_PROP_RE = /(?<![-\w])size\s*=\s*(?:\{\s*(\d+(?:\.\d+)?)\s*\}|["'](\d+(?:\.\d+)?)["'])/g;
const ARB_FONT_RE = /text-\[(\d+(?:\.\d+)?)(px|rem)\]/g;
const NAMED_FONT_RE = /text-(2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(?![\w-])/g;

export function nearestRampValue(px) {
  let best = FONT_RAMP[0];
  for (const r of FONT_RAMP) {
    if (Math.abs(r - px) <= Math.abs(best - px)) best = r;
  }
  return best;
}

export function evaluateIconSize(n) {
  if (n >= ICON_FLAG_CAP) return null;
  if (ICON_SCALE.includes(n) || ICON_HERO_SIZES.includes(n)) return null;
  return `size={${n}} вне icon-шкалы (${ICON_SCALE.join('/')} + ${ICON_HERO_SIZES.join('/')})`;
}

export function evaluateFontSize(px, raw) {
  if (px < MIN_FONT_PX) {
    return `код F2: шрифт ${px}px < ${MIN_FONT_PX}px (минимум) — ${raw}`;
  }
  if (px < FONT_FLAG_CAP && !FONT_RAMP.includes(px)) {
    return `код F1: шрифт ${px}px вне font-рампы (${FONT_RAMP.join(' ')}) — ${raw}`;
  }
  return null;
}

/**
 * Сканирует исходный текст файла. Возвращает findings {file, line, code, severity, msg, fix?}.
 */
export function auditSource(src, relPath = '<source>') {
  const findings = [];
  const lines = src.split('\n');

  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    for (const m of lineText.matchAll(SIZE_PROP_RE)) {
      const n = parseFloat(m[1] ?? m[2]);
      const problem = evaluateIconSize(n);
      if (problem) {
        findings.push({ file: relPath, line: idx + 1, code: 'I1', severity: 'error', msg: problem });
      }
    }

    for (const m of lineText.matchAll(ARB_FONT_RE)) {
      const px = m[2] === 'rem' ? parseFloat(m[1]) * 16 : parseFloat(m[1]);
      const problem = evaluateFontSize(px, `text-[${m[1]}${m[2]}]`);
      if (problem) {
        const fix = px < MIN_FONT_PX ? `text-[${MIN_FONT_PX}px]` : `text-[${nearestRampValue(px)}px]`;
        findings.push({ file: relPath, line: idx + 1, code: px < MIN_FONT_PX ? 'F2' : 'F1', severity: 'error', msg: problem, fix });
      }
    }

    for (const m of lineText.matchAll(NAMED_FONT_RE)) {
      const px = NAMED_FONT_PX[m[1]];
      const problem = evaluateFontSize(px, `text-${m[1]}`);
      if (problem) {
        const fix = px < MIN_FONT_PX ? `text-[${MIN_FONT_PX}px]` : `text-[${nearestRampValue(px)}px]`;
        findings.push({ file: relPath, line: idx + 1, code: px < MIN_FONT_PX ? 'F2' : 'F1', severity: 'error', msg: problem, fix });
      }
    }
  });

  return findings;
}

// ---- file walk -----------------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === 'dist') continue;
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) walk(fp, out);
    else if (entry.isFile() && (extname(fp) === '.tsx' || extname(fp) === '.ts')) {
      if (/\.(test|spec)\.(tsx|ts)$/.test(entry.name)) continue;
      out.push(fp);
    }
  }
  return out;
}

// ---- CLI -----------------------------------------------------------------------

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  const args = process.argv.slice(2);
  const asJson = args.includes('--json');
  const paths = args.filter((a) => a !== '--json');
  const targets = paths.length ? paths.map((p) => resolve(p)) : DEFAULT_TARGETS;

  const files = [];
  for (const t of targets) {
    if (!statSync(t, { throwIfNoEntry: false })) continue;
    if (statSync(t).isDirectory()) files.push(...walk(t));
    else files.push(t);
  }

  const findings = [];
  for (const f of files) {
    const rel = f.startsWith(ROOT) ? f.slice(ROOT.length + 1) : f;
    findings.push(...auditSource(readFileSync(f, 'utf-8'), rel));
  }

  if (asJson) {
    console.log(JSON.stringify({ scannedFiles: files.length, findings }, null, 2));
  } else {
    const byFile = new Map();
    for (const f of findings) {
      if (!byFile.has(f.code)) byFile.set(f.code, []);
      byFile.get(f.code).push(`${f.file}:${f.line} — ${f.msg}${f.fix ? ` (фикс: ${f.fix})` : ''}`);
    }
    console.log('\n=== ICON-FONT AUDIT ===');
    console.log(`Scanned files: ${files.length}`);
    console.log(`Findings: ${findings.length}`);
    for (const [code, list] of [...byFile.entries()].sort()) {
      console.log(`\n[${code}] ${list.length}`);
      for (const item of list) console.log('  ' + item);
    }
  }

  process.exit(findings.length > 0 ? 2 : 0);
}
