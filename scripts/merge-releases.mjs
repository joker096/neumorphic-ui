import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Merge per-OS dist/releases dirs (github actions matrix) into one combined manifest.
// Usage: node scripts/merge-releases.mjs <srcDir> <srcDir> ... <outDir>
//   output: <outDir>/releases.json (merged, present-first) + CHECKSUMS.txt + copied artifacts

function merge() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/merge-releases.mjs <src1> <src2> ... <out>');
    process.exit(1);
  }
  const outDir = path.resolve(ROOT, args.pop());
  const srcDirs = args.map((a) => path.resolve(ROOT, a));

  let base = null;
  const files = [];
  const byKey = new Map();

  for (const src of srcDirs) {
    if (!fs.existsSync(path.join(src, 'releases.json'))) {
      console.log(`  skip (no releases.json): ${src}`);
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(src, 'releases.json'), 'utf8'));
    if (!base) base = manifest;
    for (const f of manifest.files) {
      const key = `${f.platform}:${f.kind}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, f);
        files.push(f);
        continue;
      }
      if (!existing.present && f.present) {
        const i = files.indexOf(existing);
        files[i] = f;
        byKey.set(key, f);
      }
    }
  }

  if (!base) {
    console.error('No releases.json found in any input dir.');
    process.exit(1);
  }

  // Copy present artifacts into the single output dir
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    if (!f.present) continue;
    for (const src of srcDirs) {
      const cand = path.join(src, f.file);
      if (fs.existsSync(cand)) {
        fs.copyFileSync(cand, path.join(outDir, f.file));
        break;
      }
    }
  }

  const merged = { ...base, files, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(outDir, 'releases.json'), JSON.stringify(merged, null, 2));

  const checksums = ['Mess&Anger release checksums (SHA-256)', `version ${merged.version}`, ''];
  for (const f of merged.files.filter((f) => f.present)) checksums.push(`${f.sha256}  ${f.file}`);
  fs.writeFileSync(path.join(outDir, 'CHECKSUMS.txt'), checksums.join('\n') + '\n');

  console.log(`Merged ${srcDirs.length} manifest(s) → ${outDir}`);
  console.log(`  present files: ${merged.files.filter((f) => f.present).length}, pending: ${merged.files.filter((f) => !f.present).length}`);
  console.log(`  releases.json  ${outDir}/releases.json`);
  console.log(`  CHECKSUMS.txt  ${outDir}/CHECKSUMS.txt`);
}

merge();