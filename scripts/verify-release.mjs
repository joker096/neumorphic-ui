import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const VERSION = pkg.version;
const relPath = path.join(ROOT, 'dist', 'releases', 'releases.json');

// Platforms that the current pipeline is expected to produce.
// Extend this list on the build host that also produces linux/macos/ios.
const REQUIRED = ['android', 'windows'];

if (!fs.existsSync(relPath)) {
  console.error('✖ dist/releases/releases.json missing — run `npm run release` first.');
  process.exit(1);
}

const m = JSON.parse(fs.readFileSync(relPath, 'utf8'));
let ok = true;
const lines = [];

if (m.version !== VERSION) {
  console.error(`✖ VERSION MISMATCH: manifest=${m.version} package=${VERSION}. Rebuild targets and re-run \`npm run release\`.`);
  ok = false;
}
lines.push(`Manifest version: ${m.version} (package.json: ${VERSION}) ${m.version === VERSION ? '✓' : '✗'}`);

for (const f of m.files) {
  if (!f.present) continue;
  const fp = path.join(ROOT, 'dist', 'releases', f.file);
  if (!fs.existsSync(fp)) {
    console.error(`✖ Missing artifact file for ${f.platform}/${f.kind}: ${f.file}`);
    ok = false;
    continue;
  }
  const buf = fs.readFileSync(fp);
  const hash = createHash('sha256').update(buf).digest('hex');
  const sizeOk = buf.length > 0;
  const hashOk = hash === f.sha256;
  if (!sizeOk || !hashOk) {
    console.error(`✖ INTEGRITY FAIL ${f.platform}/${f.kind}: size=${sizeOk} hash=${hashOk}`);
    ok = false;
  } else {
    lines.push(`  ✓ ${f.platform}/${f.kind} (${f.file}) — latest version, integrity OK`);
  }
}

for (const plat of REQUIRED) {
  const has = m.files.some((f) => f.platform === plat && f.present);
  if (!has) {
    console.error(`✖ REQUIRED platform '${plat}' has no present build — cannot ship stale/absent artifact.`);
    ok = false;
  }
}

lines.forEach((l) => console.log(l));
console.log(ok ? 'VERIFY: PASS — all shipped artifacts are the latest version and intact.' : 'VERIFY: FAIL');
process.exit(ok ? 0 : 1);
