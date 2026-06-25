import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const TWA_MANIFEST = path.join(ANDROID_DIR, 'twa-manifest.json');
const KEYSTORE = path.join(ROOT, 'messandanger-keystore.jks');
const KEYSTORE_PASS = process.env.BUBBLEWRAP_KEYSTORE_PASSWORD || 'changeme';
const KEY_PASS = process.env.BUBBLEWRAP_KEY_PASSWORD || 'changeme';
const ANDROID_HOME = process.env.ANDROID_HOME || 'C:\\Users\\topse\\AppData\\Local\\Android\\Sdk';
const JAVA_HOME = process.env.JAVA_HOME || 'C:\\Program Files\\Java\\jdk-22';

const require = createRequire(import.meta.url);
const { TwaManifest, TwaGenerator, Config, JdkHelper, KeyTool, ConsoleLog } = require('@bubblewrap/core');

const log = new ConsoleLog('build-android');

let server;

function startStaticServer(dir, port = 0) {
  return new Promise((resolve, reject) => {
    const mimeTypes = { '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
    server = http.createServer((req, res) => {
      const filePath = path.join(dir, req.url === '/' ? '/index.html' : req.url);
      if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => { resolve(`http://localhost:${server.address().port}`); });
    server.on('error', reject);
  });
}

function stopStaticServer() { if (server) { server.close(); server = null; } }

function banner(msg) {
  console.log(`\n${'─'.repeat(msg.length + 4)}\n  ${msg}\n${'─'.repeat(msg.length + 4)}`);
}

function findBuildTools() {
  const btDir = path.join(ANDROID_HOME, 'build-tools');
  if (!fs.existsSync(btDir)) throw new Error('build-tools not found in Android SDK');
  const versions = fs.readdirSync(btDir).filter(v => /^\d/.test(v)).sort();
  if (versions.length === 0) throw new Error('No build-tools versions found');
  return path.join(btDir, versions[versions.length - 1]);
}

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const isBat = typeof cmd === 'string' && cmd.endsWith('.bat');
    const finalCmd = isBat ? process.env.COMSPEC || 'cmd.exe' : cmd;
    const finalArgs = isBat ? ['/c', cmd, ...args] : args;
    const p = spawn(finalCmd, finalArgs, { stdio: 'inherit', ...opts });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)));
    p.on('error', reject);
  });
}

async function ensureConfig() {
  const configDir = path.join(process.env.USERPROFILE || process.env.HOME, '.bubblewrap');
  const configFile = path.join(configDir, 'config.json');
  if (!fs.existsSync(configFile)) {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configFile, JSON.stringify({
      jdkPath: JAVA_HOME,
      androidSdkPath: ANDROID_HOME,
    }, null, 2));
  }
  const cfg = await Config.loadConfig(configFile);
  if (!cfg) throw new Error('Failed to load config');
  return cfg;
}

async function createKeystore(twaManifest, config) {
  if (fs.existsSync(twaManifest.signingKey.path)) return log.info('Keystore exists');
  banner('Generating Keystore');
  const keyTool = new KeyTool(new JdkHelper(process, config), log);
  await keyTool.createSigningKey({
    fullName: 'Mess&Anger', organizationalUnit: 'Development',
    organization: 'Mess&Anger', country: 'US',
    password: KEYSTORE_PASS, keypassword: KEY_PASS,
    alias: twaManifest.signingKey.alias, path: twaManifest.signingKey.path,
  });
  log.info('Keystore created');
}

async function createProject(twaManifest) {
  banner('Generating Android Project');
  const generator = new TwaGenerator();
  await generator.createTwaProject(ANDROID_DIR, twaManifest, log, () => {});
  log.info('Android project generated');
}

async function buildAndroid() {
  banner('Building APK & AAB');
  const buildTools = findBuildTools();
  log.info(`Using build-tools: ${buildTools}`);

  const gradlew = path.join(ANDROID_DIR, 'gradlew.bat');
  if (!fs.existsSync(gradlew)) throw new Error('gradlew.bat not found — generate project first');

  const env = { ...process.env, JAVA_HOME, ANDROID_HOME };

  // assembleRelease
  log.info('→ gradle assembleRelease');
  await runCmd(gradlew, ['assembleRelease'], { cwd: ANDROID_DIR, env });
  const unsignedApk = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');

  // zipalign
  log.info('→ zipalign');
  const alignedApk = path.join(ANDROID_DIR, 'app-release-unsigned-aligned.apk');
  await runCmd(path.join(buildTools, 'zipalign.exe'), ['-v', '-p', '4', unsignedApk, alignedApk], { cwd: ANDROID_DIR, env });

  // apksigner
  log.info('→ apksigner');
  const signedApk = path.join(ROOT, 'app-release-signed.apk');
  await runCmd(path.join(buildTools, 'apksigner.bat'), [
    'sign', '--ks', KEYSTORE, '--ks-pass', `pass:${KEYSTORE_PASS}`,
    '--ks-key-alias', 'messandanger', '--key-pass', `pass:${KEY_PASS}`,
    '--out', signedApk, alignedApk,
  ], { cwd: ANDROID_DIR, env });

  // bundleRelease
  log.info('→ gradle bundleRelease');
  await runCmd(gradlew, ['bundleRelease'], { cwd: ANDROID_DIR, env });
  const unsignedAab = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

  // jarsigner for AAB
  log.info('→ jarsigner');
  const signedAab = path.join(ROOT, 'app-release-bundle.aab');
  await runCmd(path.join(JAVA_HOME, 'bin', 'jarsigner.exe'), [
    '-verbose', '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256',
    '-keystore', KEYSTORE, '-storepass', KEYSTORE_PASS, '-keypass', KEY_PASS,
    unsignedAab, 'messandanger',
  ], { cwd: ANDROID_DIR, env });
  fs.copyFileSync(unsignedAab, signedAab);

  log.info('');
  banner('Android Build Complete');
  for (const f of [signedApk, signedAab]) {
    if (fs.existsSync(f)) {
      const mb = (fs.statSync(f).size / 1024 / 1024).toFixed(2);
      log.info(`${path.basename(f)}: ${mb} MB`);
    }
  }
}

async function main() {
  const skipWeb = process.argv.includes('--skip-web-build');
  const skipBuild = process.argv.includes('--skip-build');

  if (!skipWeb) {
    banner('Building Web PWA first');
    await runCmd('pwsh', ['-NoProfile', '-File', path.join(ROOT, 'scripts', 'build-web.ps1'), '-SkipTests', '-SkipLint'], { cwd: ROOT });
  }

  banner('Checking Prerequisites');
  const config = await ensureConfig();
  log.info('Config loaded, Java: ' + JAVA_HOME);
  log.info('Android SDK: ' + ANDROID_HOME);

  if (!fs.existsSync(ANDROID_DIR)) fs.mkdirSync(ANDROID_DIR, { recursive: true });

  const distDir = path.join(ROOT, 'dist');
  const serverUrl = await startStaticServer(distDir);
  log.info(`Static server at ${serverUrl}`);

  try {
    if (!fs.existsSync(TWA_MANIFEST)) {
      banner('Creating TWA Manifest');
      const twaManifest = new TwaManifest({
        packageId: 'app.messandanger.messenger', host: 'mess.cvr.name',
        name: 'Mess&Anger', launcherName: 'Mess&Anger',
        startUrl: '/', display: 'standalone', orientation: 'portrait',
        themeColor: '#0a0a0a', backgroundColor: '#0a0a0a',
        navigationColor: '#0a0a0a', themeColorDark: '#000000',
        navigationColorDark: '#000000', navigationDividerColor: '#000000',
        navigationDividerColorDark: '#000000',
        iconUrl: `${serverUrl}/icons/pwa-512x512.png`,
        maskableIconUrl: `${serverUrl}/icons/pwa-512x512.png`,
        enableNotifications: true, enableSiteSettingsShortcut: true,
        isChromeOSOnly: false, appVersion: '1.0.0', appVersionCode: 1,
        splashScreenFadeOutDuration: 300, fallbackType: 'customtabs',
        generatorApp: 'bubblewrap-cli',
        signingKey: { path: KEYSTORE, alias: 'messandanger' },
        shortcuts: [], features: {}, additionalTrustedOrigins: [],
        fingerprints: [], retainedBundles: [],
      });
      await twaManifest.saveToFile(TWA_MANIFEST);
      log.info('TWA manifest created');
    }

    await createKeystore(await TwaManifest.fromFile(TWA_MANIFEST), config);
    await createProject(await TwaManifest.fromFile(TWA_MANIFEST));

    if (!skipBuild) await buildAndroid();
  } finally {
    stopStaticServer();
  }
}

main().catch(err => {
  console.error(`\n✖ ${err.message || err}`);
  stopStaticServer();
  process.exit(1);
});
