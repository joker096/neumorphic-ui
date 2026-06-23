# Mess&Anger — Native App Build Configuration

This guide covers packaging the Mess&Anger PWA into native Android (APK/AAB) and iOS (IPA) apps for distribution on Google Play and the Apple App Store.

---

## Prerequisites

### General
- **Node.js** v18+ (with npm)
- **Git**
- A built production PWA from `F:\AISTUDIO\neumorphic-ui`

### Android
- **Java Development Kit (JDK)** 17+ (Eclipse Temurin or Oracle)
- **Android Studio** (latest) with SDK Manager:
  - Android SDK 34+
  - Android SDK Platform-Tools
  - Android SDK Build-Tools 34+
- **Gradle** (bundled with Android Studio)
- **Google Play Developer** account ($25 one-time fee)
- **Keystore** for app signing

### iOS
- **macOS** (required for iOS build — Xcode only runs on macOS)
- **Xcode** 15+ (from Mac App Store)
- **iOS SDK** 17+
- **CocoaPods** (`sudo gem install cocoapods`) — if using native wrapper
- **Apple Developer Program** membership ($99/year)
- **Apple Distribution Certificate** and **Provisioning Profile**

---

## Option 1: PWABuilder (Recommended — Both Platforms)

PWABuilder by Microsoft generates native wrappers for Android, iOS, and Windows from your PWA URL.

### URL
https://pwabuilder.com

### Steps

1. **Build production PWA:**
   ```bash
   cd F:\AISTUDIO\neumorphic-ui
   npm run build
   ```

2. **Deploy the PWA** to a public HTTPS URL (or use `npx serve dist` for testing).

3. **Go to https://pwabuilder.com** and enter your PWA URL.

4. **Validate** — PWABuilder runs a checklist. Fix any issues (service worker, manifest, etc.).

5. **Package for Android:**
   - Click "Package for Android"
   - Choose "Generate packages"
   - Download the generated `.aab` (Android App Bundle) or `.apk`
   - Or use the **Bubblewrap CLI** option for offline builds (see Option 2)

6. **Package for iOS:**
   - Click "Package for iOS"
   - Download the `.ipa` or the Xcode project
   - Open the generated `.xcodeproj` in Xcode
   - Configure signing team, bundle identifier, and capabilities
   - Archive and export for App Store distribution

7. **Package for Windows** (optional):
   - Download the generated `.msixbundle`

---

## Option 2: Bubblewrap CLI (Android Only)

Bubblewrap is the CLI that powers PWABuilder's Android packaging.

### Installation
```bash
npm install -g @pwabuilder/bubblewrap
```

### Initialize
```bash
bubblewrap init --manifest https://your-pwa-url/manifest.json
```

### Configure
Edit `twa-manifest.json`:
```json
{
  "packageId": "app.messandanger.messenger",
  "host": "messandanger.app",
  "name": "Mess&Anger",
  "launcherName": "Mess&Anger",
  "display": "standalone",
  "themeColor": "#1a1a2e",
  "backgroundColor": "#1a1a2e",
  "enableNotifications": true,
  "startUrl": "/",
  "iconUrl": "https://messandanger.app/icons/icon-512.png",
  "maskableIconUrl": "https://messandanger.app/icons/icon-512-maskable.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "file": "./messandanger-keystore.jks"
  },
  "appVersionName": "1.0.0",
  "appVersionCode": 1
}
```

### Build
```bash
bubblewrap build
```

Output: `app-release.aab` (for Google Play) and `app-release.apk` (for sideloading).

### Update version for new releases
```bash
bubblewrap update
```

---

## Option 3: Manual WKWebView Wrapper (iOS Only)

For more control on iOS, create a minimal native wrapper.

### Create Xcode project
1. Open Xcode → New Project → iOS → App
2. Choose SwiftUI or Storyboard
3. Bundle identifier: `app.messandanger.messenger`
4. Team: Select your Apple Developer team

### Add WKWebView code

Replace `ContentView.swift`:
```swift
import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        WebView(url: URL(string: "https://messandanger.app")!)
            .edgesIgnoringSafeArea(.all)
    }
}

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.applicationNameForUserAgent = "MessAndAnger/1.0"
        config.websiteDataStore = .default()

        // Enable PWA features
        if #available(iOS 16.4, *) {
            config.preferences.isElementFullscreenEnabled = true
        }

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.load(URLRequest(url: url))
        webView.allowsBackForwardNavigationGestures = true
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
```

### Info.plist additions
```xml
<key>NSCameraUsageDescription</key>
<string>Mess&Anger needs camera access for video calls and photo sharing.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Mess&Anger needs photo library access to share images.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Mess&Anger needs microphone access for voice messages and calls.</string>
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>processing</string>
</array>
```

### Push notification entitlement
If you implement push notifications, add the `push` capability in Xcode and configure a remote push server.

---

## Signing & Publishing

### Android — Google Play

#### Generate Keystore (one-time)
```bash
keytool -genkey -v -keystore messandanger-keystore.jks \
  -alias messandanger \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storetype jks
```

#### Sign the AAB
Bubblewrap signs automatically if `signingKey` is configured in `twa-manifest.json`.

#### Upload to Google Play Console
1. Go to https://play.google.com/console
2. Create new app → select "Social" category
3. Fill store listing (use `app-store-metadata.md`)
4. Upload the `.aab` under Production → Production → Create new release
5. Complete content rating questionnaire
6. Set pricing as "Free"
7. Review and publish

#### Key signing best practices
- Store keystore securely (not in repo)
- Keystore password: use a password manager
- **Never lose the keystore** — Google Play cannot re-sign your app
- For app updates: same keystore, increment `appVersionCode` and `appVersionName`

### iOS — Apple App Store

#### Sign the IPA
In Xcode:
1. Open the project
2. Go to Signing & Capabilities
3. Select your team
4. Ensure "Automatically manage signing" is checked
5. Choose a unique bundle identifier

#### Archive & Upload
1. Product → Archive
2. In the Organizer window, click "Distribute App"
3. Select "App Store Connect"
4. Upload → follow prompts
5. Go to https://appstoreconnect.apple.com
6. Create new app → fill metadata (use `app-store-metadata.md`)
7. Submit for review

#### Push notifications (iOS)
1. Add Push Notifications capability in Xcode
2. Create a VoIP Services Certificate in Apple Developer Portal
3. Configure your push server with the certificate

---

## Required Assets Checklist

| Asset | Android | iOS | Format | Min Size |
|-------|---------|-----|--------|----------|
| App icon (adaptive) | 48×48 to 192×192 mdpi-xxxhdpi | — | PNG | 1024×1024 source |
| App icon (iOS) | — | 1024pt | PNG | 1024×1024 |
| Store icon | 512×512 | 1024×1024 | PNG | 512×512 |
| Feature graphic | 1024×500 | — | PNG/JPG | 1024×500 |
| Screenshots (phone) | 1080×1920 | 1242×2688 (6.5") | PNG | FHD |
| Screenshots (tablet) | 1080×1920 | 2048×2732 (12.9") | PNG | — |
| Privacy policy URL | ✓ | ✓ | Web | — |
| Terms of service URL | ✓ | ✓ | Web | — |

### Recommended Icon Generation
Use https://www.pwabuilder.com/imageGenerator or `npx pwa-asset-generator`:
```bash
npm install -g pwa-asset-generator
pwa-asset-generator public/icon-1024.png ./public/icons --background "#1a1a2e" --padding 10%
```

---

## CI/CD Pipeline (Optional)

### GitHub Actions — Android Build
```yaml
name: Build Android
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - run: npm install -g @pwabuilder/bubblewrap
      - run: bubblewrap build
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: app-release.aab
```

### GitHub Actions — iOS Build (macOS runner required)
```yaml
name: Build iOS
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - name: Build with xcodebuild
        run: |
          xcodebuild -project MessAndAnger.xcodeproj \
            -scheme MessAndAnger \
            -configuration Release \
            -archivePath build/MessAndAnger.xcarchive archive
```

---

## Troubleshooting

### PWABuilder — App not installable
- Ensure service worker is registered and working
- Manifest must have `display: standalone` or `fullscreen`
- Manifest must have `icons` array with 192×192 and 512×512
- URL must be served over HTTPS

### Bubblewrap — Build fails
```bash
# Check Java version
java -version

# Clean and retry
bubblewrap build --force

# Update Bubblewrap
npm update -g @pwabuilder/bubblewrap
```

### iOS — App rejected
- Ensure all `NS*UsageDescription` keys are present in Info.plist
- Provide demo account credentials for review team
- No mention of beta/testing in metadata or app UI
- Ensure PWA works fully offline for basic functionality

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | TBD  | Initial release |
