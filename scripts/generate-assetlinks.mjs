import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env'), override: true, quiet: true });

const CONFIG = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'config', 'android-publish.json'), 'utf-8'),
);

const KEYSTORE = path.join(ROOT, CONFIG.keyStoreFile);
const KEYSTORE_PASS = process.env.BUBBLEWRAP_KEYSTORE_PASSWORD;
const KEY_PASS = process.env.BUBBLEWRAP_KEY_PASSWORD;
const JAVA_HOME = process.env.JAVA_HOME || 'C:\\Program Files\\Java\\jdk-22';

function fatal(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

if (!KEYSTORE_PASS || !KEY_PASS) {
  fatal(
    'BUBBLEWRAP_KEYSTORE_PASSWORD and BUBBLEWRAP_KEY_PASSWORD must be set in .env (or environment)',
  );
}
if (!fs.existsSync(KEYSTORE)) {
  fatal(
    `Keystore not found: ${KEYSTORE}\n  Run 'npm run build:android' first — it creates the keystore on first run.`,
  );
}

const keytool = path.join(JAVA_HOME, 'bin', 'keytool' + (process.platform === 'win32' ? '.exe' : ''));
const res = spawnSync(
  keytool,
  ['-list', '-v', '-keystore', KEYSTORE, '-storepass', KEYSTORE_PASS],
  { encoding: 'utf-8' },
);
if (res.status !== 0) {
  fatal(
    `keytool failed (keystore password mismatch?):\n${(res.stderr || res.stdout || '').split(/\r?\n/).slice(0, 3).join('\n')}`,
  );
}

const shaLine = res.stdout.split(/\r?\n/).find((l) => l.includes('SHA256:'));
if (!shaLine) fatal('Could not find SHA-256 certificate fingerprint in keystore output.');
const fingerprint = shaLine.split('SHA256:')[1].trim().toUpperCase();

const assetlinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: CONFIG.packageId,
      sha256_cert_fingerprints: [fingerprint],
    },
  },
];

const targets = [
  path.join(ROOT, 'public', '.well-known', 'assetlinks.json'),
  ...(fs.existsSync(path.join(ROOT, 'dist')) ? [path.join(ROOT, 'dist', '.well-known', 'assetlinks.json')] : []),
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(assetlinks, null, 2) + '\n');
  console.log(`  ✓ wrote ${path.relative(ROOT, target)}`);
}

console.log(`\nDigital Asset Links generated.`);
console.log(`  package:     ${CONFIG.packageId}`);
console.log(`  host:        https://${CONFIG.host}`);
console.log(`  fingerprint: ${fingerprint}`);
console.log(`  verify live: https://${CONFIG.host}/.well-known/assetlinks.json`);
console.log('\nDeploy it with: npm run deploy (uploads public/ → dist/ → web root).');