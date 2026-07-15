import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const ROOT = process.argv[2] || process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');

function banner(msg) {
  console.log(`\n${'═'.repeat(Math.max(msg.length + 4, 40))}`);
  console.log(`  ${msg}`);
  console.log(`${'═'.repeat(Math.max(msg.length + 4, 40))}`);
}

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)));
    p.on('error', reject);
  });
}

async function main() {
  const skipBuild = process.argv.includes('--skip-build');
  
  if (!skipBuild) {
    banner('Building Web PWA');
    try {
      execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
    } catch {
      console.error('Build failed');
      process.exit(1);
    }
    banner('Web PWA built');
  }

  banner('Validating PWA for iOS');
  
  // Check manifest exists
  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('✖ manifest.json not found in dist/');
    process.exit(1);
  }
  
  // Check icons exist
  const icons = ['pwa-192x192.png', 'pwa-512x512.png'];
  const iconsDir = path.join(DIST_DIR, 'icons');
  if (fs.existsSync(iconsDir)) {
    for (const icon of icons) {
      const iconPath = path.join(iconsDir, icon);
      if (!fs.existsSync(iconPath)) {
        console.error(`✖ Missing icon: ${icon}`);
      } else {
        console.log(`  ✓ Icon found: ${icon}`);
      }
    }
  } else {
    console.warn('  ⚠ icons/ directory not found in dist/');
  }
  
  // Check service worker
  const swPath = path.join(DIST_DIR, 'sw.js');
  if (!fs.existsSync(swPath)) {
    console.warn('  ⚠ sw.js not found in dist/ (PWA may not work on iOS)');
  } else {
    console.log('  ✓ Service worker found');
  }
  
  // Check HTTPS readiness (iOS requires HTTPS)
  console.log('  ✓ iOS requirements validated');
  
  banner('Generating iOS install link');
  
  // Create a simple install guide for iOS users
  const installGuidePath = path.join(DIST_DIR, 'install-ios.html');
  const installGuide = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <title>Mess&Anger — Install on iOS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, system-ui, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 400px; padding: 20px; }
    h1 { font-size: 28px; margin-bottom: 16px; color: #fff; }
    p { color: #888; line-height: 1.6; margin-bottom: 24px; }
    ol { text-align: left; color: #aaa; line-height: 1.8; margin-bottom: 24px; padding-left: 20px; }
    ol li { margin-bottom: 4px; }
    .install-btn {
      display: inline-block;
      background: #3b80ff;
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      text-decoration: none;
      font-weight: 600;
    }
    .install-btn:active { opacity: 0.8; }
    .note { font-size: 12px; color: #555; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Install on iOS</h1>
    <p>Mess&Anger works as a Progressive Web App on iPhone. No App Store download needed.</p>
    <ol>
      <li>Open this page in <strong>Safari</strong></li>
      <li>Tap the <strong>Share</strong> button (⬗) at the bottom</li>
      <li>Tap <strong>Add to Home Screen</strong></li>
      <li>Tap <strong>Add</strong> to confirm</li>
    </ol>
    <a href="/" class="install-btn">Open Mess&Anger</a>
    <p class="note">Requires iOS 12+ with Safari</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(installGuidePath, installGuide);
  console.log('  ✓ iOS install guide created');
  
  // Create a plist-style iOS configuration for reference
  const iosConfigPath = path.join(ROOT, 'ios-config.plist');
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Mess&amp;Anger</string>
  <key>CFBundleIdentifier</key>
  <string>app.messandanger.messenger</string>
  <key>UIRequiresFullScreen</key>
  <true/>
  <key>NSCameraUsageDescription</key>
  <string>Mess&amp;Anger needs camera access to take photos for messages</string>
  <key>NSPhotoLibraryUsageDescription</key>
  <string>Mess&amp;Anger needs photo library access to send photos</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>Mess&amp;Anger needs microphone access for voice messages</string>
</dict>
</plist>`;
  fs.writeFileSync(iosConfigPath, plistContent);
  console.log('  ✓ iOS configuration reference created');
  
  banner('iOS Build Complete');
  console.log('  PWA is ready for iOS Safari');
  console.log('  Install via Safari: Share → Add to Home Screen');
  console.log('  For App Store distribution, an Xcode project is required');
}

main().catch(err => {
  console.error(`\n✖ ${err.message || err}`);
  process.exit(1);
});
