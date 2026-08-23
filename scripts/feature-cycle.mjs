import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = resolve(ROOT, 'scripts', 'l10n-audit.mjs');

const MAX_ITERS = 30;
const REQUIRED_CLEAN_PASSES = 3;

const STEPS = [
  { id: 'lint', label: 'Lint (eslint + tsc)', cmd: 'npm', args: ['run', 'lint'] },
  { id: 'build', label: 'Build (vite build)', cmd: 'npm', args: ['run', 'build'] },
  { id: 'test', label: 'Tests (vitest run)', cmd: 'npm', args: ['run', 'test'] },
  { id: 'l10n', label: 'Localization audit', cmd: 'node', args: [AUDIT, '--fix', '--fix-extras'] },
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
    process.stdout.write(`\n[feature] running: ${step.label} ...\n`);
    const ok = runStep(step);
    if (!ok) {
      failed.push(step.label);
      process.stdout.write(`[feature] FAILED: ${step.label}\n`);
    } else {
      process.stdout.write(`[feature] ok: ${step.label}\n`);
    }
  }
  return failed;
}

console.log('\n=== FEATURE VERIFICATION CYCLE ===\n');
console.log(`Steps per pass: ${STEPS.map((s) => s.label).join(' | ')}`);

let iter = 0;
let cleanStreak = 0;

while (iter < MAX_ITERS) {
  iter++;
  const failed = runPass();

  if (failed.length === 0) {
    cleanStreak++;
    console.log(`\n[feature] pass ${iter}: ALL GREEN (streak ${cleanStreak}/${REQUIRED_CLEAN_PASSES})`);
    if (cleanStreak >= REQUIRED_CLEAN_PASSES) {
      console.log(`\n[feature] DONE — ${REQUIRED_CLEAN_PASSES} consecutive clean passes.`);
      process.exit(0);
    }
    continue;
  }

  cleanStreak = 0;
  console.log(`\n[feature] pass ${iter}: ${failed.length} step(s) failed: ${failed.join(', ')}`);
  console.log('[feature] NON-AUTO-FIXABLE failures. Fix code, then re-run: npm run feature:cycle');
  process.exit(1);
}

console.error(`[feature] ABORTED after ${MAX_ITERS} iterations — did not converge.`);
process.exit(1);
