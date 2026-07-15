import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  TwaManifest,
  TwaGenerator,
  Config,
  JdkHelper,
  AndroidSdkTools,
  GradleWrapper,
  JarSigner,
  KeyTool,
  ConsoleLog,
} from '@bubblewrap/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const TWA_MANIFEST = path.join(ANDROID_DIR, 'twa-manifest.json');
const KEYSTORE = path.join(ROOT, 'messandanger-keystore.jks');
const KEYSTORE_PASS = (() => {
  if (!process.env.BUBBLEWRAP_KEYSTORE_PASSWORD) throw new Error('BUBBLEWRAP_KEYSTORE_PASSWORD env var required');
  return process.env.BUBBLEWRAP_KEYSTORE_PASSWORD;
})();
const KEY_PASS = (() => {
  if (!process.env.BUBBLEWRAP_KEY_PASSWORD) throw new Error('BUBBLEWRAP_KEY_PASSWORD env var required');
  return process.env.BUBBLEWRAP_KEY_PASSWORD;
})();

const log = new ConsoleLog('build-android');

async function ensureConfig() {
  const configDir = path.join(process.env.USERPROFILE || process.env.HOME, '.bubblewrap');
  const configFile = path.join(configDir, 'config.json');
  if (!fs.existsSync(configFile)) {
    fs.mkdirSync(configDir, { recursive: true });
    const configData = {
      jdkPath: process.env.JAVA_HOME || 'C:\\Program Files\\Java\\jdk-22',
      androidSdkPath: process.env.ANDROID_HOME || 'C:\\Users\\topse\\AppData\\Local\\Android\\Sdk',
    };
    fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
    log.info(`Created config: ${configFile}`);
  }
  return Config.fromFile(configFile);
}

async function generateKeystore(twaManifest) {
  if (fs.existsSync(twaManifest.signingKey.path)) {
    log.info('Keystore already exists, skipping creation');
    return;
  }
  log.info('Generating new keystore...');
  const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.bubblewrap', 'config.json');
  const config = Config.fromFile(configPath);
  const jdkHelper = new JdkHelper(process, config);
  const keyTool = new KeyTool(jdkHelper);
  await keyTool.createSigningKey({
    fullName: 'Mess&Anger',
    organizationalUnit: 'Development',
    organization: 'Mess&Anger',
    country: 'US',
    password: KEYSTORE_PASS,
    keypassword: KEY_PASS,
    alias: twaManifest.signingKey.alias,
    path: twaManifest.signingKey.path,
  });
  log.info('Keystore generated');
}

async function generateProject(twaManifest) {
  const generator = new TwaGenerator();
  await generator.createTwaProject(ANDROID_DIR, twaManifest, log);
  log.info('Android project generated');
}

async function buildAndroid() {
  log.info('=== Mess&Anger Android Build ===');
  log.info(`Output: ${ANDROID_DIR}`);

  const config = await ensureConfig();

  // Create Android project directory
  if (!fs.existsSync(ANDROID_DIR)) {
    fs.mkdirSync(ANDROID_DIR, { recursive: true });
  }

  // Create TWA manifest if it doesn't exist
  let twaManifest;
  if (fs.existsSync(TWA_MANIFEST)) {
    log.info('Loading existing twa-manifest.json');
    twaManifest = TwaManifest.fromFile(TWA_MANIFEST);
  } else {
    log.info('Creating TWA manifest from web manifest...');
    // Serve dist on localhost first, or use a public URL
    twaManifest = await TwaManifest.fromWebManifest('http://localhost:8080/manifest.json');

    // Override with our values
    twaManifest.packageId = 'app.messandanger.messenger';
    twaManifest.host = 'mess.cvr.name';
    twaManifest.name = 'Mess&Anger';
    twaManifest.launcherName = 'Mess&Anger';
    twaManifest.display = 'standalone';
    twaManifest.themeColor = '#0a0a0a';
    twaManifest.backgroundColor = '#0a0a0a';
    twaManifest.navigationColor = '#0a0a0a';
    twaManifest.navigationColorDark = '#000000';
    twaManifest.navigationDividerColor = '#000000';
    twaManifest.navigationDividerColorDark = '#000000';
    twaManifest.themeColorDark = '#000000';
    twaManifest.startUrl = '/';
    twaManifest.iconUrl = 'http://localhost:8080/icon.svg';
    twaManifest.maskableIconUrl = 'http://localhost:8080/icon.svg';
    twaManifest.enableNotifications = true;
    twaManifest.enableSiteSettingsShortcut = true;
    twaManifest.isChromeOSOnly = false;
    twaManifest.appVersion = '1.0.0';
    twaManifest.appVersionCode = 1;
    twaManifest.splashScreenFadeOutDuration = 300;
    twaManifest.fallbackType = 'customtabs';
    twaManifest.signingKey = {
      path: KEYSTORE,
      alias: 'messandanger',
    };
    twaManifest.orientation = 'portrait';
    twaManifest.generatorApp = 'bubblewrap-cli';

    await twaManifest.saveToFile(TWA_MANIFEST);
    log.info('twa-manifest.json created');
  }

  // Create keystore
  await generateKeystore(twaManifest);

  // Generate Android project
  await generateProject(twaManifest);

  // Build with Gradle
  log.info('Building Android project...');
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper, log);

  // Check build tools
  if (!await androidSdkTools.checkBuildTools()) {
    log.info('Installing Android build tools...');
    await androidSdkTools.installBuildTools();
  }

  const gradleWrapper = new GradleWrapper(process, androidSdkTools);

  // Build APK
  log.info('Building APK...');
  await gradleWrapper.assembleRelease();

  // Sign APK
  log.info('Signing APK...');
  await androidSdkTools.apksigner(
    twaManifest.signingKey.path,
    `"${KEYSTORE_PASS}"`,
    twaManifest.signingKey.alias,
    `"${KEY_PASS}"`,
    './app/build/outputs/apk/release/app-release-unsigned.apk',
    path.join(ROOT, 'app-release-signed.apk'),
  );

  // Build App Bundle
  log.info('Building AAB...');
  await gradleWrapper.bundleRelease();

  // Sign AAB
  log.info('Signing AAB...');
  const jarSigner = new JarSigner(jdkHelper);
  await jarSigner.sign(
    twaManifest.signingKey,
    `"${KEYSTORE_PASS}"`,
    `"${KEY_PASS}"`,
    './app/build/outputs/bundle/release/app-release.aab',
    path.join(ROOT, 'app-release-bundle.aab'),
  );

  // Copy outputs to root
  const apkSrc = path.join(ANDROID_DIR, 'app/build/outputs/apk/release/app-release-unsigned.apk');
  const aabSrc = path.join(ANDROID_DIR, 'app/build/outputs/bundle/release/app-release.aab');
  if (fs.existsSync(apkSrc)) {
    fs.cpSync(apkSrc, path.join(ROOT, 'app-release.apk'));
  }
  if (fs.existsSync(aabSrc)) {
    fs.cpSync(aabSrc, path.join(ROOT, 'app-release.aab'));
  }

  log.info('=== Android Build Complete ===');
  log.info(`APK: ${ROOT}/app-release.apk`);
  log.info(`AAB: ${ROOT}/app-release.aab`);
}

buildAndroid().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
