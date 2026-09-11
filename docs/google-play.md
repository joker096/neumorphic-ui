# Google Play — Mess&Anger

Everything needed to publish **Mess&Anger** (TWA, `app.messandanger.messenger`) to Google Play.
Artifacts, store listing, Data Safety answers, rating guidance, and the upload runbook.

- **Package ID:** `app.messandanger.messenger`
- **Privacy policy (live):** `https://mess.cvr.name/privacy.html` (static page: `public/privacy.html`, deployed via `scripts/deploy-all.ps1`)
- **App host:** `https://mess.cvr.name` (HTTPS, Service Worker active)
- **AAB:** `app-release-bundle.aab` at repo root (build: `node scripts/build-android.mjs`)
- **Config single-source:** `config/android-publish.json` — package id, host, app version/versionCode, colors. Bump `appVersionCode`/`appVersion` there, never in generated files.

## 1. Assets (all generated / in place)

| Asset | File | Spec |
|---|---|---|
| App icon | `public/icons/pwa-512x512.png` | 512×512 PNG, no alpha in corners |
| Feature graphic | `android/feature-graphic.png` (gen: `node scripts/generate-feature-graphic.mjs`) | 1024×500 PNG, < 1 MB |
| Phone screenshots | `android/screenshots/phone-1-chat-list.png`, `phone-2-conversation.png`, `phone-3-contacts.png`, `phone-4-calls.png` (gen: `node scripts/phone-screenshots.mjs`) | 1080×1920 (9:16) PNG, each < 1 MB |
| AAB | `app-release-bundle.aab` | versionCode 1, minSdk 21, targetSdk 36 |

Regenerate screenshots after any UI change: `node scripts/phone-screenshots.mjs`
(vite boots on port 5199 with `VITE_USE_MOCK=true`; no state left behind).

## 2. Store listing (en-US default)

**App name:** `Mess&Anger`

**Category:** Communication

**Short description (≤ 80 chars):**

```
End-to-end encrypted P2P messenger. No accounts, no servers reading your chats.
```
(75 chars)

**Full description (≤ 4000 chars):**

```
Mess&Anger is an end-to-end encrypted, peer-to-peer messenger. No accounts, no
email, no phone number. Your identity is a cryptographic keypair generated on
your device — the relay server only ever sees encrypted blobs.

WHAT YOU CAN DO
- Chat 1:1 and in groups, with full E2E encryption (X25519 ECDH + Ed25519 signatures + HMAC-SHA256).
- Make voice and video calls directly between devices (WebRTC over a P2P relay).
- Send text, images, files and stickers. Attachments stay encrypted in transit.
- Keep your history on-device: chats, contacts and media are stored locally, and
  your recovery phrase is never uploaded.
- Manage privacy: mute, archive, block, and control who can see your status.
- Premium removes in-app ads and unlocks unlimited recording.

PRIVACY BY DESIGN
- No account. No email. No phone number. No third-party analytics or ad SDKs.
- Ads are first-party, in-app only, and never personalized with message data.
- Premium subscriptions are processed by a third-party payment gateway; card
  details never touch our servers.
- Your messages can be read only by the people you send them to.

OFFLINE-FIRST
- Queued messages are delivered when you reconnect.
- Works as an installed PWA / TWA with notifications and offline caching.

Mess&Anger is free to use with first-party in-app ads. Premium is an optional
subscription.
```

**What's new (v1.0.0):**

```
Initial release.
```

**App URL:** `https://mess.cvr.name`
**Privacy policy URL:** `https://mess.cvr.name/privacy.html`
**Contact email:** `privacy@cvr.name` (placeholder — replace with a monitored address before submitting)

## 3. Data Safety form (recommended answers)

Play's form fields change over time; answer from this matrix. The app is a TWA
that wraps the web app, so data collected is the web app's data.

**Question: Do you or do third parties collect data through this app?**
Yes.

| Play data category | Collected? | What it is | Purpose (form answer) |
|---|---|---|---|
| Device or other IDs | Yes | Ed25519 device public key (pseudonymous identity) | App functionality — route connections, store entitlements, measure first-party ads |
| Diagnostics | Yes | IP address, user agent, country, connect/disconnect times | App functionality — operate and secure the connection service |
| Location | Yes (approximate) | Country derived from IP | App functionality |
| Payment info | Yes, third party (paymento.io) | Order ID, amount, currency, status for premium | App functionality — process subscriptions |

**Categories that are NO:** Personal info (name, email, phone), in-app
content (messages, attachments — E2E encrypted, unreadable by us), contacts,
media, health, financial info (full card data), precise location.

**"Do you allow third parties to collect data?"** → Yes, for payment info
via paymento.io (payment processing). No advertising SDKs, no analytics.

**"Does your app include ads?"** → Yes.
- Ad type: **In-app ads** (first-party, self-hosted).
- Ad SDK: **No** (no third-party ad SDK in the app).
- "Ads targeted with personal data": **No** — ads are not personalized with
  message data, contact lists, or personal information.

**Privacy policy link:** `https://mess.cvr.name/privacy.html` — must be
reached/deployed before submission (run `scripts/deploy-all.ps1` first).

## 4. Content rating (IARC)

- In-app ads + in-app purchases (premium) present → minimum IARC level is
  **"Everyone + (buy)"** (US: *Everyone + Buy*).
- Complete the IARC questionnaire honestly; with no violent/sexual/adult
  content and standard messaging features, the questionnaire resolves to
  Everyone + (buy) / 12+ in most countries.
- Target age (min user age): **12+**.

## 5. Ads declaration

- "Does your app display ads?" → **Yes**
- "What types of ads?" → **In-app ads** (no third-party ad networks).
- "Is the ad SDK from a third party?" → **No**
- Ads are created and hosted by us in the admin panel (`server/routes/ads.ts`,
  rate-limited, no tracking beyond per-device impression/click counts).

## 6. Upload runbook

0. **Digital Asset Links** (first release and every keystore rotation) — Google
   Play refuses TWAs without `assetlinks.json` on the web host:
   - Generated automatically by `npm run build:android` (or standalone:
     `npm run assetlinks`) into `public/.well-known/assetlinks.json` using the
     signing keystore's SHA-256 certificate fingerprint. `scripts/deploy-all.ps1`
     deploys it to the web root.
   - Verify live before upload:
     `curl https://mess.cvr.name/.well-known/assetlinks.json` — must list
     `"package_name": "app.messandanger.messenger"` and the SHA-256 fingerprint
     printed by the build. If it 404s or the fingerprint differs, fix before
     continuing.
1. **Deploy the privacy page + assetlinks** (first release only, or whenever `public/privacy.html` changes):
   `pwsh scripts/deploy-all.ps1`
2. **Build the AAB** (signing secrets come from `.env` — `BUBBLEWRAP_KEYSTORE_PASSWORD`
   and `BUBBLEWRAP_KEY_PASSWORD`; keystore `messandanger-keystore.jks`,
   alias per `config/android-publish.json`):
   `node scripts/build-android.mjs` → `app-release-bundle.aab` at repo root.
3. **Verify the bundle** (Android build-tools on PATH or via `$ANDROID_HOME`):
   `& "$env:ANDROID_HOME\build-tools\*\apksigner.exe" verify --print-cert app-release-bundle.aab`
   Cert SHA-256 must match `twa-manifest.json`'s signing key.
4. **Play Console** — `https://play.google.com/console`:
   1. Account + billing (one-time $25 developer fee).
   2. **Create app** → production → language en-US → name `Mess&Anger`.
   3. **Store presence** → fill listing (§2), upload icon, feature graphic,
      4 screenshots.
   4. **App content** → target age 12+, privacy policy URL, contact email.
   5. **Data Safety** → fill per §3.
   6. **Content rating** → IARC questionnaire (§4).
   7. **Ads declaration** → §5.
5. **Release:**
   1. **Create new release** (production track) → upload `app-release-bundle.aab`
      (versionCode 1 — first upload, Play App Signing will re-sign for production;
      keep the upload key, i.e. this keystore, for every future release).
   2. Staged rollout: **10%** for 24 h → promote to **100%**.
   3. Release notes: "Initial release."
   4. **Start release**.
6. **Review:** first review typically 1–3 days (up to 72 h). Watch
   `play.google.com/console` → release status for rejection feedback.

**Future releases:** bump `appVersion`/`appVersionCode` in
`config/android-publish.json`, rebuild, upload to the production track with new
"What's new" notes. Never reuse a versionCode. (`twa-manifest.json` and
`android/app/build.gradle` are regenerated each build — do NOT hand-edit them.)

## 7. Testing before production

- **Targeted testing track** (recommended): upload the AAB to the
  *targeted testing* track, invite 3–5 trusted testers via email, verify:
  install, first chat, call, premium purchase flow, notifications (TWA
  `enableNotifications: true`), offline queue.
- After sign-off, move the same AAB to the production track (or re-upload the
  same versionCode — it is allowed across tracks before the release goes live).

## 8. Known user decisions (flagged)

- `privacy@cvr.name` is a **placeholder** — set up a monitored mailbox and
  update both `public/privacy.html` and the store listing before submitting.
- Payment gateway name in the privacy policy ("paymento.io") — confirm the
  merchant-facing name matches what buyers see on receipts.
- Country-level location disclosure (§3) — conservative choice; remove the row
  only if comfortable not disclosing IP-derived country.
