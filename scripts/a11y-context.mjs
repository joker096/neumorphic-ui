/**
 * a11y-context.mjs — print context around each site that needs a hand-picked
 * accessible name, using the correct JSX tag scanner.
 *
 * Usage: node scripts/a11y-context.mjs [radius] [fileFilter]
 */
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify } from './a11y-classify.mjs';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const RADIUS = Number(process.argv[2] || 8);
const ONLY = process.argv[3] || null;
const KIND = process.argv[4] || 'needs-key';

const rows = classify().filter((r) => r.kind === KIND);
for (const r of rows) {
  if (ONLY && !r.file.includes(ONLY)) continue;
  const code = readFileSync(resolve(ROOT, r.file), 'utf-8');
  const lines = code.split('\n');
  const from = Math.max(0, r.line - 1 - RADIUS);
  const to = Math.min(lines.length, r.line + RADIUS);
  console.log(`\n${'='.repeat(76)}\n${r.file}:${r.line}  <${r.tag}>`);
  for (let i = from; i < to; i++) {
    console.log(`${i + 1 === r.line ? '>>' : '  '} ${String(i + 1).padStart(4)} | ${lines[i]}`);
  }
}
