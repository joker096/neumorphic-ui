import { createHash } from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const OUT_DIR = path.join(ROOT, 'dist', 'releases');

const REPO_BASE_URL = process.env.RELEASE_BASE_URL || 'https://mess.cvr.name/releases/';
const SIGN_KEY = process.env.RELEASE_SIGN_KEY || '';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function findArtifacts() {
  const found = [];
  const push = (platform, kind, file, note) => {
    const p = path.join(ROOT, file);
    if (fs.existsSync(p)) found.push({ platform, kind, abs: p, note });
  };

  // Android (already built and signed)
  push('android', 'apk', 'app-release-signed.apk');
  push('android', 'aab', 'app-release-bundle.aab');

  // Desktop bundles produced by Tauri (scan any `bundle` dir under target, incl. target triple)
  const targetRoot = path.join(ROOT, 'src-tauri', 'target');
  const bundleDirs = [];
  if (fs.existsSync(targetRoot)) {
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const p = path.join(dir, e.name);
        if (e.name === 'bundle') bundleDirs.push(p);
        else walk(p);
      }
    };
    walk(targetRoot);
  }
  for (const bundleRoot of bundleDirs) {
    for (const entry of fs.readdirSync(bundleRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(bundleRoot, entry.name);
      for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        if (!fs.statSync(fp).isFile()) continue;
        const platform =
          entry.name === 'msi' || entry.name === 'nsis'
            ? 'windows'
            : entry.name === 'deb' || entry.name === 'appimage' || entry.name === 'rpm'
              ? 'linux'
              : entry.name === 'dmg' || entry.name === 'app'
                ? 'macos'
                : 'desktop';
        const kind = path.extname(f).replace('.', '') || 'bin';
        found.push({ platform, kind, abs: fp });
      }
    }
  }
  return found;
}

function buildManifest(found) {
  const now = new Date().toISOString();
  const files = [];
  const checksums = [];

  for (const a of found) {
    const buf = fs.readFileSync(a.abs);
    const hash = sha256(buf);
    const size = buf.length;
    const name = path.basename(a.abs);
    const dest = path.join(OUT_DIR, name);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.copyFileSync(a.abs, dest);
    const url = `./releases/${encodeURIComponent(name)}`;
    files.push({
      platform: a.platform,
      kind: a.kind,
      file: name,
      size,
      sha256: hash,
      url,
      present: true,
    });
    checksums.push(`${hash}  ${name}`);
  }

  // Expected-but-missing platform targets (built on their own OS or published to stores)
  const expected = [
    { platform: 'windows', kind: 'msi', note: 'MSI needs WiX UI extension — build with `tauri build` after installing WixToolset.UI.Extension, or ship the NSIS .exe' },
    { platform: 'linux', kind: 'deb', note: 'Build on Linux: npm run build:desktop:linux' },
    { platform: 'linux', kind: 'appimage', note: 'Build on Linux: npm run build:desktop:linux' },
    { platform: 'macos', kind: 'dmg', note: 'Build on macOS: npm run build:desktop:macos (requires Apple Developer signing)' },
    { platform: 'ios', kind: 'app-store', note: 'Publish via Xcode/TestFlight from scripts/build-ios.mjs output' },
    { platform: 'web', kind: 'pwa', note: 'Installable PWA — deploy dist/ to any HTTPS host' },
  ];

  const presentKeys = new Set(files.map((f) => `${f.platform}:${f.kind}`));
  for (const e of expected) {
    if (!presentKeys.has(`${e.platform}:${e.kind}`)) {
      files.push({
        platform: e.platform,
        kind: e.kind,
        file: null,
        size: null,
        sha256: null,
        url: e.platform === 'web' ? REPO_BASE_URL.replace(/\/$/, '') + '/' : '',
        present: false,
        note: e.note,
      });
    }
  }

  return { version: VERSION, generatedAt: now, baseUrl: REPO_BASE_URL, files, checksums };
}

function writeChecksumsTxt(manifest) {
  const lines = ['Mess&Anger release checksums (SHA-256)', `version ${manifest.version}`, ''];
  for (const f of manifest.files.filter((f) => f.present)) {
    lines.push(`${f.sha256}  ${f.file}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'CHECKSUMS.txt'), lines.join('\n') + '\n');
}

function gpgSign() {
  if (!SIGN_KEY) {
    console.log('  ⚠ RELEASE_SIGN_KEY not set — skipping GPG signature. Set it to a key ID to sign releases.json.');
    console.log('    Verify later: gpg --verify releases.json.sig releases.json');
    return;
  }
  try {
    const jsonPath = path.join(OUT_DIR, 'releases.json');
    execSync(`gpg --detach-sign --armor --local-user "${SIGN_KEY}" --output "${path.join(OUT_DIR, 'releases.json.asc')}" "${jsonPath}"`, { stdio: 'inherit' });
    console.log('  ✓ releases.json.asc created (GPG detached signature)');
  } catch {
    console.log('  ⚠ GPG signing failed — ensure gpg is installed and the key exists.');
  }
}

function main() {
  console.log(`\n=== Mess&Anger Release (v${VERSION}) ===`);
  const found = findArtifacts();
  console.log(`  Found ${found.length} local artifact(s).`);
  const manifest = buildManifest(found);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'releases.json'), JSON.stringify(manifest, null, 2));
  writeChecksumsTxt(manifest);
  gpgSign();
  console.log(`\n=== Release manifest written to dist/releases/ ===`);
  console.log(`  releases.json  (${manifest.files.filter((f) => f.present).length} present, ${manifest.files.filter((f) => !f.present).length} pending)`);
  console.log(`  CHECKSUMS.txt  (SHA-256, verify: sha256sum -c CHECKSUMS.txt)`);
  console.log(`  Base URL for published links: ${REPO_BASE_URL}`);
}

main();
