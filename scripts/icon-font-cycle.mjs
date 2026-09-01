import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = resolve(ROOT, 'scripts', 'icon-font-audit.mjs');

const MAX_ITERS = 30;
const REQUIRED_CLEAN_PASSES = 3;

const STEPS = [
  { id: 'lint', label: 'Lint (eslint + tsc)', cmd: 'npm', args: ['run', 'lint'] },
  { id: 'test', label: 'Tests (vitest run)', cmd: 'npm', args: ['run', 'test'] },
  { id: 'icon-font', label: 'Icon/font audit', cmd: 'node', args: [AUDIT] },
  { id: 'icon-font-e2e', label: 'Icon/font e2e audit', cmd: 'npm', args: ['run', 'test:icon-font'] },
];

function runStep(step) {
  const res = spawnSync(step.cmd, step.args, { cwd: ROOT, encoding: 'utf-8', shell: true });
  const ok = res.status === 0;
  if (!ok && res.stdout) process.stdout.write(res.stdout);
  if (!ok && res.stderr) process.stderr.write(res.stderr);
  return ok;
}

function runPass() {
  const failed = [];
  for (const step of STEPS) {
    process.stdout.write(`\n[icon-font] running: ${step.label} ...\n`);
    const ok = runStep(step);
    if (!ok) {
      failed.push(step.label);
      process.stdout.write(`[icon-font] FAILED: ${step.label}\n`);
    } else {
      process.stdout.write(`[icon-font] ok: ${step.label}\n`);
    }
  }
  return failed;
}

console.log('\n=== ICON-FONT VERIFICATION CYCLE ===\n');
console.log(`Steps per pass: ${STEPS.map((s) => s.label).join(' | ')}`);

let iter = 0;
let cleanStreak = 0;

while (iter < MAX_ITERS) {
  iter++;
  const failed = runPass();

  if (failed.length === 0) {
    cleanStreak++;
    console.log(`\n[icon-font] pass ${iter}: ALL GREEN (streak ${cleanStreak}/${REQUIRED_CLEAN_PASSES})`);
    if (cleanStreak >= REQUIRED_CLEAN_PASSES) {
      console.log(`\n[icon-font] DONE — ${REQUIRED_CLEAN_PASSES} consecutive clean passes.`);
      process.exit(0);
    }
    continue;
  }

  cleanStreak = 0;
  console.log(`\n[icon-font] pass ${iter}: ${failed.length} step(s) failed: ${failed.join(', ')}`);
  console.log('[icon-font] NON-AUTO-FIXABLE failures. Fix code, then re-run: npm run icon-font:cycle');
  process.exit(1);
}

console.error(`[icon-font] ABORTED after ${MAX_ITERS} iterations — did not converge.`);
process.exit(1);
