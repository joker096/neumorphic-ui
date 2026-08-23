import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = resolve(ROOT, 'scripts', 'l10n-audit.mjs');

const MAX_ITERS = 30;
const REQUIRED_CLEAN_PASSES = 3;

function runAudit(fix) {
  const extra = fix ? ['--fix', '--fix-extras'] : [];
  const res = spawnSync('node', [AUDIT, '--json', ...extra], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  if (res.error) {
    console.error('[cycle] failed to spawn audit:', res.error.message);
    process.exit(1);
  }
  let report = null;
  try {
    report = JSON.parse(res.stdout);
  } catch {
    console.error('[cycle] audit produced no JSON. stdout:\n' + res.stdout);
    process.exit(1);
  }
  return report;
}

function classifiable(report) {
  for (const b of report.bundles) {
    if (b.jsonErrors?.length) return false;
    if (b.placeholders?.length) return false;
    if (b.empty?.length) return false;
    if (b.duplicates?.length) return false;
  }
  if (report.crossBundleErrors?.length) return false;
  if (report.usageErrors?.length) return false;
  if (report.hardcoded?.length) return false;
  return true;
}

console.log('\n=== LOCALIZATION CHECK CYCLE ===\n');

let iter = 0;
let cleanStreak = 0;

while (iter < MAX_ITERS) {
  iter++;
  const report = runAudit(false);
  const errors = report.totals.errors;

  if (errors === 0) {
    cleanStreak++;
    console.log(`[cycle] pass ${iter}: CLEAN (streak ${cleanStreak}/${REQUIRED_CLEAN_PASSES})`);
    if (cleanStreak >= REQUIRED_CLEAN_PASSES) {
      console.log(`\n[cycle] DONE — ${REQUIRED_CLEAN_PASSES} consecutive clean passes.`);
      process.exit(0);
    }
    continue;
  }

  cleanStreak = 0;
  console.log(`[cycle] pass ${iter}: ${errors} error(s), ${report.totals.warnings} warning(s)`);

  if (!classifiable(report)) {
    console.log('[cycle] NON-STRUCTURAL errors found (placeholder/empty/usage/json). Human/AI fix required.');
    console.log('[cycle] stopping. Run: node scripts/l10n-audit.mjs for details.');
    process.exit(1);
  }

  console.log('[cycle] only structural parity issues (missing/extra) — auto-seeding from en.json...');
  runAudit(true);
}

console.error(`[cycle] ABORTED after ${MAX_ITERS} iterations — localization not converging.`);
process.exit(1);
