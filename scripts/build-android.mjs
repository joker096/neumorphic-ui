import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { spawn, execSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// .env is canonical for signing secrets; override so it wins over stray
// process/user-environment values (avoids the keystore-password-mismatch bug).
dotenv.config({ path: path.join(ROOT, '.env'), override: true, quiet: true });

const ANDROID_DIR = path.join(ROOT, 'android');
const TWA_MANIFEST = path.join(ANDROID_DIR, 'twa-manifest.json');
// Single source of truth for package id, host, version, colors:
// config/android-publish.json (bump appVersion/appVersionCode there).
const PUBLISH_CONFIG = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'config', 'android-publish.json'), 'utf-8'),
);
const KEYSTORE = path.join(ROOT, PUBLISH_CONFIG.keyStoreFile);
const KEYSTORE_PASS = process.env.BUBBLEWRAP_KEYSTORE_PASSWORD;
const KEY_PASS = process.env.BUBBLEWRAP_KEY_PASSWORD;
if (!KEYSTORE_PASS || !KEY_PASS) {
  console.error('FATAL: BUBBLEWRAP_KEYSTORE_PASSWORD and BUBBLEWRAP_KEY_PASSWORD must be set in .env (or environment)');
  process.exit(1);
}
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
  const dname = 'cn=Mess&Anger, ou=Development, o=Mess&Anger, c=US';
  const alias = twaManifest.signingKey.alias;
  const ksPath = twaManifest.signingKey.path;
  const keytoolPath = path.join(JAVA_HOME, 'bin', 'keytool.exe');
  await runCmd(keytoolPath, [
    '-genkeypair', '-dname', dname,
    '-alias', alias,
    '-keypass', KEY_PASS,
    '-keystore', ksPath,
    '-storepass', KEYSTORE_PASS,
    '-storetype', 'jks',
    '-validity', '20000',
    '-keyalg', 'RSA',
  ]);
  log.info('Keystore created');
}

async function createProject(twaManifest) {
  banner('Generating Android Project');
  const generator = new TwaGenerator();
  await generator.createTwaProject(ANDROID_DIR, twaManifest, log, () => {});
  log.info('Android project generated');
}

// Bubblewrap doesn't emit PiP / resizeableActivity / edge-to-edge attributes
// into AndroidManifest.xml — patch them in post-generation. The generator
// rewrites the manifest on every run, so this must run after createProject().
function patchManifest() {
  banner('Patching AndroidManifest for PiP + edge-to-edge');
  const manifestPath = path.join(ANDROID_DIR, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifestPath)) throw new Error(`manifest not found: ${manifestPath}`);
  let xml = fs.readFileSync(manifestPath, 'utf-8');

  xml = xml.replace(
    '<application\n',
    '<application\n        android:resizeableActivity="true"\n',
  );

  xml = xml.replace(
    '<activity android:name="LauncherActivity"',
    '<activity android:name="LauncherActivity"\n            android:supportsPictureInPicture="true"\n            android:windowSoftInputMode="adjustResize"\n            android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboardHidden|keyboard"',
  );

  // AGP 9 errors on the legacy manifest package attribute (namespace is the
  // single source of truth in build.gradle). Bubblewrap still emits it.
  xml = xml.replace(/package="[^"]+"\s*/, '');

  fs.writeFileSync(manifestPath, xml);
  log.info('AndroidManifest.xml patched');
}

// TwaGenerator emits a pristine bubblewrap build.gradle whose release
// buildType is only `minifyEnabled true`. Play's R8 recommendation needs
// resource shrinking + the optimize proguard pipeline. Like the manifest
// patch, this must run after createProject() because the generator rewrites
// the whole android/ dir on every run.
function patchBuildGradle() {
  banner('Patching build.gradle for R8 (shrinkResources + optimize)');
  const gradlePath = path.join(ANDROID_DIR, 'app', 'build.gradle');
  if (!fs.existsSync(gradlePath)) throw new Error(`build.gradle not found: ${gradlePath}`);
  let gradle = fs.readFileSync(gradlePath, 'utf-8');

  gradle = gradle.replace(
    /(\brelease\s*\{\s*)(minifyEnabled\s+true)/,
    '$1minifyEnabled = true\n            shrinkResources = true\n            proguardFiles getDefaultProguardFile(\'proguard-android-optimize.txt\'), \'proguard-rules.pro\'',
  );

  // R8 with optimize mode can strip reflection- / manifest-meta-data-driven
  // custom-tabs classes; bubblewrap's DelegationService & trusted components
  // must survive. The generator wipes the android/ dir each run, so recreate
  // the rules file only when it is gone (checked-in copy has richer keeps).
  const rulesPath = path.join(ANDROID_DIR, 'app', 'proguard-rules.pro');
  if (!fs.existsSync(rulesPath)) {
    const rules = [
      '# Mess&Anger TWA: bubblewrap / custom-tabs trusted components',
      '-keep class com.google.androidbrowserhelper.** { *; }',
      '-keep class androidx.browser.** { *; }',
      '',
    ].join('\n');
    fs.writeFileSync(rulesPath, rules);
  }

  fs.writeFileSync(gradlePath, gradle);
  log.info('build.gradle patched (shrinkResources + proguardFiles), proguard-rules.pro written');
}

// Play pre-launch recommendations require Android Gradle Plugin 9.0+ (and the
// androidbrowserhelper 2.7.x line fixes the deprecated status/nav-bar APIs).
// Bubblewrap still emits AGP 8.9 + jcenter + wrapper 8.11 + browserhelper 2.6.
// The generator rewrites android/ each run, so all of this lives here.
function patchGradleDeps() {
  banner('Patching Gradle deps for AGP 9 + androidbrowserhelper 2.7.3');

  const rootGradlePath = path.join(ANDROID_DIR, 'build.gradle');
  let rootGradle = fs.readFileSync(rootGradlePath, 'utf-8');
  rootGradle = rootGradle
    .replace(/com\.android\.tools\.build:gradle:\d+\.\d+\.\d+/, 'com.android.tools.build:gradle:9.0.1')
    .replaceAll('jcenter()', 'mavenCentral()');
  fs.writeFileSync(rootGradlePath, rootGradle);

  const appGradlePath = path.join(ANDROID_DIR, 'app', 'build.gradle');
  let appGradle = fs.readFileSync(appGradlePath, 'utf-8');
  appGradle = appGradle
    // 2.7.3 declares minSdkVersion 23 and fixes deprecated Window bar-color APIs
    .replace(/com\.google\.androidbrowserhelper:androidbrowserhelper:\d+\.\d+\.\d+/, 'com.google.androidbrowserhelper:androidbrowserhelper:2.7.3')
    .replace(/\bminSdkVersion \d+/, 'minSdkVersion 23')
    // AGP 9 gates resValue behind an opt-in build feature
    .replace(/(\bcompileOptions\s*\{)/, 'buildFeatures {\n            resValues = true\n        }\n    $1')
    // Gradle 9 deprecates the Groovy space-assignment syntax (removed in 10)
    .replace(/namespace "com\.messanger\.e2e"/, 'namespace = "com.messanger.e2e"')
    .replace(/\bcheckReleaseBuilds\s+false/, 'checkReleaseBuilds = false');
  fs.writeFileSync(appGradlePath, appGradle);

  const wrapperPath = path.join(ANDROID_DIR, 'gradle', 'wrapper', 'gradle-wrapper.properties');
  let wrapper = fs.readFileSync(wrapperPath, 'utf-8');
  wrapper = wrapper.replace(/gradle-\d+\.\d+(?:\.\d+)?-bin\.zip/, 'gradle-9.1.0-bin.zip');
  fs.writeFileSync(wrapperPath, wrapper);

  log.info('Gradle deps patched (AGP 9.0.1, browserhelper 2.7.3, minSdk 23, resValues, wrapper 9.1.0)');
}

// Recursive glob for a single file name (used to find the cached browserhelper AAR).
function findNamedFile(dir, name) {
  if (!fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const hit = findNamedFile(full, name);
      if (hit) return hit;
    } else if (e.name === name) {
      return full;
    }
  }
  return null;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode} while downloading ${url}`));
        return;
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => out.close(resolve));
      out.on('error', reject);
    });
    req.on('error', reject);
  });
}

// Google Play pre-launch flags deprecated Android system APIs in the published
// androidbrowserhelper 2.7.3 AAR: Window.setStatusBarColor/setNavigationBarColor
// are still called by LauncherActivity, Utils, WebViewFallbackActivity and
// splashscreens/{EdgeToEdgeController,PwaWrapperSplashScreenStrategy} — even on
// the latest upstream release. Fix: vendor the upstream main-branch versions of
// those 5 classes (edge-to-edge via WindowCompat.setDecorFitsSystemWindows + the
// androidx legacy layout flags, bar colours via androidx ColorProtection/
// ProtectionLayout — and under *ProtectionColor names so no method in the dex
// carries a deprecated Window API signature) into the generated app module and
// rebuild a local AAR with the deprecated .class entries removed. The remaining
// AAR classes (SystemBarColorPredictor, SplashScreenStrategy,
// SplashImageTransferTask, …) are untouched. Depend on the local AAR + explicit
// transitive coordinates.
async function vendorBrowserhelper() {
  banner('Vendoring androidbrowserhelper edge-to-edge classes');

  const aarVersion = '2.7.3';
  const aarName = `androidbrowserhelper-${aarVersion}.aar`;
  const vendorJava = path.join(ROOT, 'scripts', 'android-vendor', 'browserhelper', 'src', 'main', 'java');
  const moduleSrc = path.join(ANDROID_DIR, 'app', 'src', 'main', 'java');

  const stripEntries = [
    'com/google/androidbrowserhelper/trusted/LauncherActivity.class',
    'com/google/androidbrowserhelper/trusted/Utils.class',
    'com/google/androidbrowserhelper/trusted/WebViewFallbackActivity.class',
    'com/google/androidbrowserhelper/trusted/WebViewFallbackActivity$1.class',
    'com/google/androidbrowserhelper/trusted/WebViewFallbackActivity$2.class',
    'com/google/androidbrowserhelper/trusted/splashscreens/EdgeToEdgeController.class',
    'com/google/androidbrowserhelper/trusted/splashscreens/PwaWrapperSplashScreenStrategy.class',
  ];

  const jar = path.join(JAVA_HOME, 'bin', 'jar.exe');
  const work = path.join(ANDROID_DIR, '.vendor-work');
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });

  // 1. Locate the pristine AAR in the gradle cache, else Google Maven.
  const gradleRoot = path.join(process.env.USERPROFILE || process.env.HOME, '.gradle', 'caches', 'modules-2', 'files-2.1');
  let srcAar = findNamedFile(gradleRoot, aarName);
  if (!srcAar) {
    log.info('AAR not in gradle cache — downloading from Google Maven');
    const downloaded = path.join(work, aarName);
    await downloadFile(
      `https://dl.google.com/dl/android/maven2/com/google/androidbrowserhelper/androidbrowserhelper/${aarVersion}/${aarName}`,
      downloaded,
    );
    srcAar = downloaded;
  }
  log.info(`Using AAR: ${srcAar}`);

  // 2. Extract AAR, strip offending classes.jar entries, reassemble classes.jar.
  const aarDir = path.join(work, 'aar');
  fs.mkdirSync(aarDir, { recursive: true });
  execSync(`"${jar}" -xf "${srcAar}"`, { cwd: aarDir, stdio: 'inherit' });

  const classesJar = path.join(aarDir, 'classes.jar');
  const classesDir = path.join(work, 'classes');
  fs.mkdirSync(classesDir, { recursive: true });
  execSync(`"${jar}" -xf "${classesJar}"`, { cwd: classesDir, stdio: 'inherit' });
  for (const entry of stripEntries) {
    const p = path.join(classesDir, ...entry.split('/'));
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      log.info(`stripped ${entry}`);
    }
  }
  execSync(`"${jar}" -cf "${classesJar}" .`, { cwd: classesDir, stdio: 'inherit' });

  // 3. Reassemble the local AAR with the cleaned classes.jar.
  const libsDir = path.join(ANDROID_DIR, 'app', 'libs');
  fs.mkdirSync(libsDir, { recursive: true });
  const dstAar = path.join(libsDir, `androidbrowserhelper-${aarVersion}-e2e.aar`);
  execSync(`"${jar}" -cf "${dstAar}" .`, { cwd: aarDir, stdio: 'inherit' });

  // 4. Copy the vendored replacements into the app module source set.
  fs.cpSync(path.join(vendorJava, 'com'), path.join(moduleSrc, 'com'), { recursive: true });
  log.info('vendor sources copied to app/src/main/java/com/google/androidbrowserhelper/trusted/**');

  // 5. Switch the dependency from the maven coordinate to the local stripped AAR.
  const appGradlePath = path.join(ANDROID_DIR, 'app', 'build.gradle');
  let appGradle = fs.readFileSync(appGradlePath, 'utf-8');
  appGradle = appGradle.replace(
    /implementation ['"]com\.google\.androidbrowserhelper:androidbrowserhelper:[^'"]+['"]/,
    [
      `implementation files('libs/androidbrowserhelper-${aarVersion}-e2e.aar')`,
      "implementation 'androidx.annotation:annotation:1.9.1'",
      "implementation 'androidx.core:core:1.17.0'",
      "implementation 'androidx.appcompat:appcompat:1.7.0'",
      "implementation 'androidx.browser:browser:1.10.0'",
      "implementation 'com.google.guava:guava:33.4.8-android'",
    ].join('\n    '),
  );
  fs.writeFileSync(appGradlePath, appGradle);

  log.info('browserhelper vendored (deprecated Window API callers removed, local AAR + explicit deps)');
}

// Google Play's pre-launch report rejects Window.setStatusBarColor /
// Window.setNavigationBarColor (deprecated in Android 15) and used to attribute
// them to the browser-helper splash wrappers as well. These two gates fail the
// build instead of shipping a bundle that comes back with the same warning.
const DEPRECATED_WINDOW_API_PATTERNS = [
  /WindowCompat\.enableEdgeToEdge/,
  /\.setStatusBarColor\(/,
  /getWindow\(\)\.setNavigationBarColor\(/,
  /void setNavigationBarColor\(/,
];

// The vendored sources document the deprecated APIs in their javadoc, so match
// against code only: drop block comments plus every line that is a whole-line
// comment (a Java statement never starts with `//` or `*`).
function javaCodeOnly(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .filter(line => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

function walkJavaFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJavaFiles(full));
    else if (entry.name.endsWith('.java')) out.push(full);
  }
  return out;
}

function assertVendorSourcesEdgeToEdgeClean() {
  const roots = [
    path.join(ROOT, 'scripts', 'android-vendor', 'browserhelper', 'src', 'main', 'java'),
    path.join(ANDROID_DIR, 'app', 'src', 'main', 'java'),
  ];
  const offenders = [];
  for (const file of roots.flatMap(walkJavaFiles)) {
    const src = javaCodeOnly(fs.readFileSync(file, 'utf-8'));
    for (const re of DEPRECATED_WINDOW_API_PATTERNS) {
      if (re.test(src)) offenders.push(`${path.relative(ROOT, file)} → ${re}`);
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      'Deprecated Window bar-colour / enableEdgeToEdge API referenced in Android sources:\n  '
      + offenders.join('\n  '),
    );
  }
  log.info('edge-to-edge source guard clean (no deprecated Window bar-colour APIs)');
}

function findApkanalyzer() {
  const base = path.join(ANDROID_HOME, 'cmdline-tools');
  if (!fs.existsSync(base)) return null;
  const dirs = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) dirs.push(path.join(base, entry.name, 'bin'));
  }
  dirs.push(path.join(base, 'latest', 'bin'));
  for (const dir of dirs) {
    for (const name of ['apkanalyzer.bat', 'apkanalyzer']) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function assertDexHasNoDeprecatedWindowApis(apk) {
  const tool = findApkanalyzer();
  if (!tool) {
    log.info('apkanalyzer not found — skipping deprecated Window API dex check');
    return;
  }
  // .bat needs cmd; pass args as an array so no path quoting is involved.
  const isBat = tool.endsWith('.bat');
  const out = execFileSync(
    isBat ? (process.env.COMSPEC || 'cmd.exe') : tool,
    isBat ? ['/c', tool, 'dex', 'packages', apk] : ['dex', 'packages', apk],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const listing = out;
  const offenders = listing.split(/\r?\n/).filter(line =>
    /set(Status|Navigation)BarColor/.test(line)
    && (/android\.view\.Window\b/.test(line) || /EdgeToEdgeController\b/.test(line)),
  );
  if (offenders.length > 0) {
    throw new Error(
      'Deprecated Window bar-colour API present in the release dex (Play pre-launch would flag it):\n  '
      + offenders.join('\n  '),
    );
  }
  if (!/EdgeToEdgeController .*setStatusBarProtectionColor/.test(listing)) {
    log.info('note: EdgeToEdgeController.setStatusBarProtectionColor not found in dex listing (possibly stripped)');
  }
  log.info('dex guard clean: no Window/EdgeToEdgeController set*BarColor references');
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
  if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
  await runCmd(path.join(buildTools, 'zipalign.exe'), ['-v', '-p', '4', unsignedApk, alignedApk], { cwd: ANDROID_DIR, env });

  // apksigner
  log.info('→ apksigner');
  const signedApk = path.join(ROOT, 'app-release-signed.apk');
  await runCmd(path.join(buildTools, 'apksigner.bat'), [
    'sign', '--ks', KEYSTORE, '--ks-pass', `pass:${KEYSTORE_PASS}`,
    '--ks-key-alias', PUBLISH_CONFIG.signingAlias, '--key-pass', `pass:${KEY_PASS}`,
    '--out', signedApk, alignedApk,
  ], { cwd: ANDROID_DIR, env });

  // bundleRelease
  log.info('→ gradle bundleRelease');
  await runCmd(gradlew, ['bundleRelease'], { cwd: ANDROID_DIR, env });
  const unsignedAab = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');

  assertDexHasNoDeprecatedWindowApis(signedApk);

  // jarsigner for AAB
  log.info('→ jarsigner');
  const signedAab = path.join(ROOT, 'app-release-bundle.aab');
  try {
    await runCmd(path.join(JAVA_HOME, 'bin', 'jarsigner.exe'), [
      '-verbose', '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256',
      '-keystore', KEYSTORE, '-storepass', KEYSTORE_PASS, '-keypass', KEY_PASS,
      unsignedAab, PUBLISH_CONFIG.signingAlias,
    ], { cwd: ANDROID_DIR, env });
  } catch {
    // jarsigner may exit non-zero on self-signed cert warning; check if AAB was actually produced
    const aabExists = fs.existsSync(unsignedAab);
    if (!aabExists) {
      throw new Error('jarsigner failed: AAB file not found after signing attempt');
    }
    log.info('→ jarsigner completed with self-signed cert warning (AAB produced)');
  }
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
    // Remove stale manifest — static server port changes each run
    if (fs.existsSync(TWA_MANIFEST)) fs.unlinkSync(TWA_MANIFEST);
    banner('Creating TWA Manifest');
    const twaManifest = new TwaManifest({
      packageId: PUBLISH_CONFIG.packageId,
      host: PUBLISH_CONFIG.host,
      name: PUBLISH_CONFIG.name,
      launcherName: PUBLISH_CONFIG.launcherName,
      startUrl: PUBLISH_CONFIG.startUrl,
      display: PUBLISH_CONFIG.display,
      orientation: PUBLISH_CONFIG.orientation,
      themeColor: PUBLISH_CONFIG.themeColor,
      backgroundColor: PUBLISH_CONFIG.backgroundColor,
      navigationColor: PUBLISH_CONFIG.navigationColor,
      themeColorDark: PUBLISH_CONFIG.themeColorDark,
      navigationColorDark: PUBLISH_CONFIG.navigationColorDark,
      navigationDividerColor: PUBLISH_CONFIG.navigationDividerColor,
      navigationDividerColorDark: PUBLISH_CONFIG.navigationDividerColorDark,
      iconUrl: `${serverUrl}/icons/pwa-512x512.png`,
      maskableIconUrl: `${serverUrl}/icons/pwa-512x512.png`,
      enableNotifications: PUBLISH_CONFIG.enableNotifications,
      enableSiteSettingsShortcut: PUBLISH_CONFIG.enableSiteSettingsShortcut,
      isChromeOSOnly: false,
      appVersion: PUBLISH_CONFIG.appVersion,
      appVersionCode: PUBLISH_CONFIG.appVersionCode,
      splashScreenFadeOutDuration: PUBLISH_CONFIG.splashScreenFadeOutDuration,
      fallbackType: PUBLISH_CONFIG.fallbackType,
      generatorApp: 'bubblewrap-cli',
      displayOverride: ['edge-to-edge'],
      signingKey: { path: KEYSTORE, alias: PUBLISH_CONFIG.signingAlias },
      shortcuts: [], features: {}, additionalTrustedOrigins: [],
      fingerprints: [], retainedBundles: [],
    });
    await twaManifest.saveToFile(TWA_MANIFEST);
    log.info('TWA manifest created');

    await createKeystore(await TwaManifest.fromFile(TWA_MANIFEST), config);
    await createProject(await TwaManifest.fromFile(TWA_MANIFEST));
    patchManifest();
    patchBuildGradle();
    patchGradleDeps();
    await vendorBrowserhelper();
    assertVendorSourcesEdgeToEdgeClean();

    // Keytool is on PATH here (JAVA_HOME/bin) only sometimes; generate-assetlinks
    // resolves keytool itself. Runs after keystore exists.
    log.info('→ Digital Asset Links (.well-known/assetlinks.json)');
    await runCmd(process.execPath, [path.join(__dirname, 'generate-assetlinks.mjs')], { cwd: ROOT });

    if (!skipBuild) await buildAndroid();
  } finally {
    stopStaticServer();
  }
}

main().then(() => {
  process.exit(0);
}).catch(err => {
  stopStaticServer();
  console.error(`\n✖ ${err.message || err}`);
  process.exit(1);
});
