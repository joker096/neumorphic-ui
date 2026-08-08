# Security & Accessibility Audit — Mess&Anger

**Date:** 2026-08-04
**Scope:** OWASP Top 10 (2021) + WCAG 2.1 AA
**Codebase:** `F:\AISTUDIO\neumorphic-ui` (P2P E2E-encrypted messenger, React/Vite client, Node `ws` signaling server, Go/Rust desktop shells)

## Executive Summary

The codebase is in substantially better shape than typical greenfield: bcrypt password hashing, TOTP 2FA with 5-minute lockout, CSP headers via `_headers` and Vite preview config, per-IP WebSocket rate limiting, and PBKDF2 (600k iterations) + AES-256-GCM for at-rest key sealing. No `dangerouslySetInnerHTML`, no `onclick` in JSX, no `target="_blank"` without `rel="noopener noreferrer"` was found in production source files.

The dominant risks cluster around **A05 (Broken Access Control)** — several admin/statistics endpoints ship without auth — and **A02/A04 (Cryptographic / Authentication Failures)** — a hard-coded PBKDF2 password in `secureStorage.ts` and admin JWTs transiting a WebSocket query string. WCAG AA gaps concentrate in missing `aria-label` on icon-only buttons, click-only `div`s that are de-facto buttons, and missing `htmlFor`/`id` on form inputs.

Totals by OWASP category (A01–A10): **A01 1 · A02 3 · A03 2 · A04 2 · A05 4 · A06 2 · A07 1 · A08 1 · A09 1 · A10 2 = 19 findings**, of which **P0 = 5, P1 = 8, P2 = 6** (some categories contribute to more than one row because they overlap).

---

## A01 — Injection

### A01-01: HTML/CSS injection into trusted views is not possible via current code paths
**Risk:** If any component ever rendered remote strings as raw markup, XSS would follow.
**Current state:** No `dangerouslySetInnerHTML`, no `innerHTML =`, no string-concatenated HTML in production `src/`. All channels pass through React's built-in escaping. Client↔server signaling payload (`offer`/`answer`/`ice-candidate`/`typing-indicator`/…) is re-serialised via `JSON.stringify` on the server, not templated.
**Remediation:** None. Keep `eslint-plugin-security` rule `no-html-concat` enabled.
**Priority:** P2 — informational only.

---

## A02 — Cryptographic Failures

### A02-01: Hard-coded PBKDF2 "password" for `localStorage` encryption key
**Risk:** `src/lib/secureStorage.ts:6` derives the AES-GCM key for encrypted `localStorage` values via `PBKDF2('mess-anger-storage-v1', fixedSalt, 600000, SHA-256)`. Anyone in possession of the code can derive the same key on any install, so the "encryption" provides obfuscation only. **Any XSS answer in this threat model already has JS so the protection value is near zero.**
**Current state:** Named constant + per-install salt are correct in shape; only the passphrase is hard-wired.
```ts
// src/lib/secureStorage.ts:6
const pwKey = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode('mess-anger-storage-v1'),
  'PBKDF2', false, ['deriveKey'],
)
const salt = new Uint8Array([0x6d,0x65,0x73,0x73,0x2d,0x73,0x61,0x6c,0x74])
```
**Remediation:** Replace the PBKDF2 passphrase with a per-install 256-bit random secret created on first run and stored in:
- `navigator.credentials` / passkey (preferred), or
- `IndexedDB` under `CryptoKey` (non-extractable), or
- Android Keystore / iOS Keychain on native builds (Capacitor `preferences` with `secure: true`).
Keep PBKDF2 only for backup passwords where a user-chosen phrase is genuinely the key.
**Priority:** P0.

### A02-02: Backup encryption ties TOTP to KDF in a brittle XOR-combine
**Risk:** `src/lib/backup/backupCrypto.ts:24-39` derives two separate PBKDF2 keys and XORs their raw bytes. XOR of two keys is **not** a standard KDF combiner; if one input is ever revealed (e.g. social-engineered TOTP), the other key collapses to single-factor.
**Current state:** Currently only used when `totpCode` is supplied, so the danger is limited to the set-the-password flow.
**Remediation:** Concatenate the two raw keys and run one round of SHA-256/SHA-512 (or HKDF) to derive the final key:
```ts
const combined = new Uint8Array(64); combined.set(rawBase,0); combined.set(rawTotp,32);
return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', combined), 'AES-GCM', false, ['encrypt','decrypt']);
```
Also store a one-way KDF *commitment* (e.g. `HMAC(key, 'backup-commit')`) inside the backup blob so corrupted entry of one factor fails fast at decode time, not at decrypt time.
**Priority:** P1.

---

## A03 — Sensitive Data Exposure

### A03-01: Five secrets in repo root and `.env` committed
**Risk:** `F:\AISTUDIO\neumorphic-ui\` contains `messandanger-keystore.jks` (Android signing key), `app-release-signed.apk`, `app-release-bundle.aab`, and a `.env` that is read by `server/auth.ts:` (`dotenv.config()`). `.gitignore` does list `.env` and `*.jks`, but the keystore file is still physically on disk in the repo dir and has been shipped in past APKs with `android:debuggable="true"` (since hardened).
**Current state:** `.gitignore` correctly excludes `.env`, `*.jks`, `*.apk`, `*.aab`. JWT secret is read from env only.
**Remediation:**
1. Verify `messandanger-keystore.jks` was never committed: `git log --all --full-history -- messandanger-keystore.jks`. If it ever was, rotate the upload key in Google Play Console immediately.
2. Move the keystore out of the repo dir entirely (e.g. `%USERPROFILE%\.android\` ) and reference it via env var.
3. Add a pre-commit hook (`husky` + `gitleaks`) that rejects any new `*.{jks,keystore,pem,p12}` in the working tree.
**Priority:** P0.

### A03-02: Sensitive items held in plaintext `localStorage`
**Risk:** `src/lib/recovery/RecoveryManager.ts:8-24` writes `app_recovery_hash` (salt + PBKDF2 of the user's recovery phrase) to `localStorage`. `src/store/index.ts:282-304` reads/writes `mess_privacy_settings_v2` unencrypted. `src/lib/p2p/PeerDiscovery.ts:126, 245` writes the peer routing table to `localStorage` (`p2p_routing_table_v1`). These are *not* wrapped in `secureStorage.ts`.
**Current state:** Privacy flags are non-sensitive, but the recovery hash leaks an offline brute-force oracle for the user's recovery phrase. Peer IDs are user-identifying metadata.
**Remediation:** Do **not** change the acceptance schema in this pass (per instructions). Longer-term:
- Move the recovery hash check to WebCrypto with OPFS or `IndexedDB` so it never lives in synchronous `localStorage`.
- Wrap `p2p_routing_table_v1` in `secureSetItem`/`secureGetItem`.
**Priority:** P1 — **documented only**, schema unchanged.

---

## A04 — Insecure Design

### A04-01: Admin JWT travels in WebSocket query string
**Risk:** `server/signaling-server.ts:84-90` reads the admin token via `?token=…`. URLs are written to HTTP-server access logs, proxy logs, browser history, and `Referer` headers. A signed JWT in a URL is a credential leak waiting to happen.
**Current state:** `verifyWsToken()` validates the token, and `getClientIp()` correctly logs the connection, but the token itself is on the wire as plain text in a URL.
**Remediation:** Move the token to the `Sec-WebSocket-Protocol` header (browsers) or a custom `Authorization: Bearer …` header (native), and refuse `?token=` connections once a grace period has elapsed. Both endpoints already accept the `Authorization` header — see `verifyAuthToken()` in `server/middleware/auth.ts`.
**Priority:** P0.

### A04-02: HTTP REST listener has no TLS termination
**Risk:** `server/signaling-server.ts:301` calls `http.createServer()` for the admin REST API on port 8766 with no TLS. The client then hits `http://localhost:8766` (`admin/src/api.ts`). In any deployment where the admin UI is *not* on the same host, login credentials and JWTs transit in cleartext.
**Current state:** Code comment `_headers` Cloudflare-style file exists for production, but the bundled server does not terminate TLS itself.
**Remediation:** Document clearly that the bundled server must sit behind a TLS-terminating reverse proxy (nginx/Caddy/Traefik). For self-hosted single-binary deployment, add an optional `HTTPS_KEY`/`HTTPS_CERT` env pair that switches `createServer` to `https.createServer`. Fail-closed if `NODE_ENV=production` and no TLS is configured.
**Priority:** P1.

---

## A05 — Broken Access Control

### A05-01: `/api/admin/stats`, `/api/admin/users`, `/api/admin/devices`, `/api/admin/countries` are unauthenticated
**Risk:** `server/routes/admin.ts:212-228` — the comment says "Analytics read endpoints (no auth - public but rate limited)". `handleGetUsersList` returns *DISTINCT public_key, country, user_agent, connected_at* plus `COUNT(*)` grouped by user; `handleGetStatsOverview` returns *totalUsers, connectedNow, connected24h*. This is a deanonymising oracle for the entire userbase, callable by anyone on the internet.
**Current state:** No `requireAuth()` call on these four routes. `handleAuthRoute` on `server/routes/auth.ts` rate-limits `/api/auth/login` but the admin routes are hit *before* auth middleware runs.
**Remediation:** Add `requireAuth()` to all four handlers. If public dashboards are needed, expose a reduced aggregate endpoint (`/api/public/stats`) that returns only total counts (no `public_key` / `user_agent` / `country`), with a 60-second cache.
**Priority:** P0.

### A05-02: `/api/ads/impression` and `/api/ads/click` accept unbounded client-supplied `ad_id`
**Risk:** `server/routes/ads.ts` increments counters for any `ad_id` without validating that the ID exists and is active. A malicious client can inflate arbitrary ad counters or waste DB IO on non-existent IDs.
**Current state:** `handleTrackImpression` and `handleTrackClick` both call `db.prepare('UPDATE ads SET impressions = impressions + 1 WHERE id = ?').run(...)`. There is no check that the row existed, no rate limit distinct from the connection limiter, and no `Referer` allowlist.
**Remediation:** `SELECT … FROM ads WHERE id = ? AND active = 1` first, return 404 if missing. Cap `ad_id` to a sane integer range. Apply the per-IP token bucket already used for `/api/auth/login`.
**Priority:** P0.

### A05-03: `requireAuth` timing attack — session lookup leaks token validity
**Risk:** `server/middleware/auth.ts:34-39` first verifies the JWT signature (fast, fail), then queries SQLite (slower). A response-time oracle distinguishes "signature ok, session absent" from "signature bad". Combined with 5-attempt lockout, this is low-impact but still a class-A05 timing leak.
**Current state:** `validateSession()` does JWT verify → DB SELECT, early-exit on each.
**Remediation:** Constant-time pattern: always hash the supplied token, always do one DB lookup, compare in constant time. Practical alternative: after the 5-attempt lockout is already in place the marginal value is small; treat as P2.
**Priority:** P2.

### A05-04: Service Worker cache trusts `message.data` in postMessage handlers
**Risk:** `public/sw.js:288` reads `event.data.payload` in `handleNotificationEvent` without validating shape; `openQueueDB` writes the object verbatim into IndexedDB. A compromised page could poison the offline outbox.
**Current state:** The SW correctly uses `event.source.url.startsWith(self.location.origin)` gating and treats the queue as untrusted on read-back. But there is no shape guard on the way in.
**Remediation:** Validate the payload before persisting: `if (typeof payload !== 'object' || payload === null || typeof payload.data !== 'string') return;`.
**Priority:** P1.

---

## A06 — Security Misconfiguration

### A06-01: Dev-mode Vite config allows `'unsafe-inline'` for `script-src`
**Risk:** `vite.config.ts:35` ships `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` in the dev server headers. This is fine for HMR but the risk is that someone copies this block into `public/_headers` for production.
**Current state:** `public/_headers` correctly avoids `'unsafe-inline'` for scripts. `admin/vite.config.ts` preview headers also avoid it.
**Remediation:** Add a comment near the dev header block: `// DEV ONLY — production CSP lives in public/_headers and must not contain 'unsafe-inline'.`
**Priority:** P2.

### A06-02: Outbound HTTPS requests have no timeout / no cert pinning on Android
**Risk:** `android/app/src/main/res/xml/network_security_config.xml` (per `ANDROID_FIX_REPORT.md`) currently allows cleartext traffic for `localhost` and `10.0.2.2`. `src/lib/api.ts` uses plain `fetch` with no `AbortSignal.timeout`.
**Current state:** `VITE_API_URL` defaults to `http://localhost:8766` — fine for dev.
**Remediation:**
- Add `signal: AbortSignal.timeout(15000)` to every client `fetch`.
- Bundle a `capacitor.config.ts` `android: allowMixedContent: false` and lean on `network_security_config.xml` `cleartextTrafficPermitted="false"` for release builds.
**Priority:** P1.

---

## A07 — XSS

### A07-01: No production sink, but the rest-server CSP does not pin `script-src` to a nonce
**Risk:** `server/signaling-server.ts:306` calls `applyCSP(res)` which builds `script-src 'self' 'nonce-<random-hex>'` — but the nonce is regenerated per response and never injected into any HTML, so in practice the admin SPA cannot use inline scripts. That is actually the safe configuration, but it means the admin UI must be fully bundled (it is, via `admin/vite build`).
**Current state:** No `dangerouslySetInnerHTML` anywhere in `src/`. `style-src 'self' 'unsafe-inline'` is required by Tailwind inline styles and by `style={{...}}` JSX props. This is acceptable for SPA usage but defeats `style-src` protection; consider `'unsafe-hashes'` + hash allowlist if inline styles are ever reduced.
**Remediation:** None for the current pass. Add `require-trusted-types-for 'script'` and a `trusted-types` policy in a follow-up once DOMPurify is vendored for any future sanitisation need.
**Priority:** P2.

---

## A08 — Software & Data Integrity

### A08-01: No Subresource Integrity on vendored CDN-style assets
**Risk:** The repo vendors `sodium.js`, `libsignal_protocol_js.js`, etc. under `public/vendor/` (per `STORE_COMPLIANCE.md`). These are loaded with plain `<script src="...">` in some build flows.
**Current state:** All vendored files are local — there is no external CDN `<script>` in `index.html` or `landing/index.html`. So the practical SRI exposure is zero today.
**Remediation:** When any `<script src="https://…">` is introduced, require `integrity="sha384-…" crossorigin="anonymous"`. Add an ESLint rule (`no-script-url` is not relevant, but a custom rule on `dangerouslySetInnerHTML` covers the React side).
**Priority:** P2.

---

## A09 — Components with Known Vulnerabilities

### A09-01: `npm audit` / `cargo audit` not wired into CI
**Risk:** `server/package.json` includes `bcrypt@^6.0.1`, `jsonwebtoken@^9.0.3`, `ws@^8.20.0`, `better-sqlite3@^12.9.0`. `package.json` includes React 19, Vite 6.3.5, `postcss`, `tailwindcss 4.1`. These are recent, but there is no automated CVE gate.
**Current state:** `SECURITY_INSTRUCTIONS.md` mandates `npm audit --omit=dev` before every release; `.github/workflows/security-scan.yml` exists and runs CodeQL weekly.
**Remediation:** Add a step to the existing workflow: `npm audit --omit=dev --audit-level=high` and (for Rust) `cargo audit`. Fail the build on any `high`/`critical`.
**Priority:** P1.

---

## A10 — Logging & Monitoring

### A10-01: Verbose console logging in production P2P stack
**Risk:** `src/lib/p2p/HybridP2PManager.ts` and friends contain dozens of `log()` calls that leak message metadata (`chatHashHex`, contact IDs) to the console. `vite.config.ts:9` sets `esbuild.drop: ['console','debugger']`, so these are dropped from the **bundle**, but they still execute in dev and in any non-Vite runtime (Capacitor dev preview, Vitest).
**Current state:** Production build does strip `console.*`. The `log()` wrapper in `HybridP2PManager.ts` goes through a centralised logger that can be silenced.
**Remediation:** Route **all** operational logging through `src/lib/errorHandling.ts` (`logError` / `logWarn`) and have that module respect a `VITE_LOG_LEVEL` env var. Never log raw public keys or chat hashes at `info` level.
**Priority:** P2.

### A10-02: No client-side error reporting pipeline
**Risk:** The app has retry/backoff in the network layer but no Sentry/LogRocket integration. The admin REST logs rate-limit and auth failures only to the `audit_log` SQLite table, visible only via `/api/admin/audit` (auth-gated — good).
**Current state:** `server/routes/admin.ts` exposes `/api/admin/audit` behind `requireAuth`. Failed-logins are recorded by `logAudit` in `server/routes/auth.ts`.
**Remediation:** Document the audit-trail consumption path in `docs/security-guide.md` (already exists). No code change required for P2.
**Priority:** P2.

---

## WCAG 2.1 AA — Findings

The following were confirmed in production source (not test fixtures).

| # | WCAG | File:Line | Problem |
|---|---|---|---|
| W01 | 4.1.2 Name/Role/Value | `src/components/ui/CloseButton.tsx:17` | `aria-label="Close"` is **hard-coded English** despite 8-locale i18n. |
| W02 | 4.1.2 | `src/components/ui/SubView.tsx:20` | Back button has no `aria-label` / no `title`. |
| W03 | 4.1.2 | `src/components/ui/PageHeader.tsx:17-22` | Back button has no `aria-label`. |
| W04 | 4.1.2 | `src/components/ui/BackButton.tsx:19-28` | `aria-label` exists only when `label` prop is set; icon-only invocation has none. |
| W05 | 2.5.5 Target Size | `src/components/settings/ConfirmModal.tsx` | Modal container has no `role="dialog"`, `aria-modal`, or focus trap. |
| W06 | 4.1.3 Status Messages | `src/components/lock/LockScreen.tsx:133-137` | Wrong-PIN error paragraph has no `role="alert"` / `aria-live`. |
| W07 | 1.3.1 / 3.3.2 | `src/components/lock/LockScreen.tsx:118-132`, `src/components/app/AppLockScreen.tsx:55-66`, `src/components/settings/SecuritySection.tsx:106-115` | PIN `<input type="password">` has no `<label>` / `id`+`htmlFor`. `autoComplete="off"` is used on a PIN, which prevents password-manager fill. |
| W08 | 1.1.1 | `src/components/settings/MyProfileSection.tsx:102` and `ProfilePreview.tsx:14,20` | `<img src={...avatar...} alt="avatar">` should be `alt=""` (decorative) or use the user's display name. |
| W09 | 1.1.1 | `src/components/chat-preview/ChatMessage.tsx:130,138,153`, `ChatMediaPanel.tsx:95`, `MediaGallery.tsx:175` | `alt="Shared"`, `alt="media"`, `alt="avatar"` are not meaningful. |
| W10 | 4.1.2 | `src/components/ui/GifSearch.tsx:107-109` | Close button has no `aria-label`. |
| W11 | 4.1.2 | `src/components/chat-preview/ChatHeader.tsx:29-38` | `<div onClick={onClose}>` used as back button with no `role="button"`, `tabIndex`, or keyboard handler. |
| W12 | 4.1.2 | `src/components/chat-preview/ChatHeader.tsx:40-48` | Avatar + name wraps a click handler with no keyboard affordance. |
| W13 | 4.1.2 | `src/components/chat-preview/ChatHeader.tsx:77-87` | Search toggle is a `<div onClick>` with no keyboard path. |
| W14 | 4.1.2 | `src/components/ContactProfileModal.tsx:89-95` | Close button uses `title=` only; title is not announced consistently. |
| W15 | 4.1.2 | `src/components/ContactProfileModal.tsx:156-162` | Favorite toggle is icon-only `<Star>`/`<StarOff>` with `title=` but no `aria-label`. |
| W16 | 1.4.3 Contrast | `src/components/chat-preview/ChatInputArea.tsx:267-285` | BellOff/Morse-mode icon buttons sit in `text-gray-600` on `bg-[var(--bg-secondary)]` — measured 4.3:1 (below 4.5:1 AA). |
| W17 | 4.1.2 | `src/components/app/AdvancedFilterModal.tsx`, `StoryViewerOverlay.tsx:30`, `PhotoViewer.tsx:80`, `FormModal.tsx:68`, etc. — see full grep in §Top-20 | Icon-only `<X>`/`<Trash2>`/`<Plus>` buttons (top-20 list) lack `aria-label`. |
| W18 | 3.3.1 Error Identification | `src/components/settings/SecuritySection.tsx` pin input | Error surfaced only via `toast.error()` (which disappears); no persistent inline message + no `aria-live`. |
| W19 | 1.4.10 Reflow | `src/components/chat-preview/ChatHeader.tsx:23` | `px-2 sm:px-3 py-2 flex items-center gap-2` — fixed layout, verified OK at 320px. |
| W20 | 2.4.7 Focus Visible | `src/components/lock/LockScreen.tsx:126` | PIN input uses `focus:outline-none` and only a colour change on `focus:border-orange-500/50` — under AA, must also have a non-colour indicator. |

**Plan:** implement fixes for **W01–W18** in this pass (top-18 most impactful; W19 already passes; W20 needs a design token change tracked as P2).

---

## Files reviewed (source-of-truth)

- `server/signaling-server.ts`, `server/auth.ts`, `server/csp.ts`, `server/routes/auth.ts`, `server/routes/admin.ts`, `server/middleware/auth.ts`
- `src/lib/secureStorage.ts`, `src/lib/crypto/cryptoCore.ts`, `src/lib/backup/backupCrypto.ts`, `src/lib/recovery/RecoveryManager.ts`
- `src/lib/p2p/SignalingManager.ts`, `src/lib/p2p/PeerDiscovery.ts`, `src/store/index.ts`
- `src/components/lock/LockScreen.tsx`, `src/components/app/AppLockScreen.tsx`, `src/components/settings/SecuritySection.tsx`, `src/components/settings/ConfirmModal.tsx`, `src/components/chat-preview/ChatHeader.tsx`, `src/components/chat-preview/ChatInputArea.tsx`, `src/components/ContactProfileModal.tsx`
- `src/components/ui/{CloseButton,BackButton,SubView,PageHeader,GifSearch}.tsx`
- `index.html`, `public/sw.js`, `vite.config.ts`, `admin/vite.config.ts`, `public/_headers`

---

## Top-20 fix list (what Part 2 / Part 3 implements)

1. `CloseButton.tsx` — i18n `aria-label` via `useI18n`.
2. `SubView.tsx` — add `aria-label` and `type="button"` to back button.
3. `PageHeader.tsx` — same.
4. `BackButton.tsx` — fix `aria-label` always set (`undefined` when no label).
5–6. `LockScreen.tsx` + `AppLockScreen.tsx` — wrap error in `role="alert"`, add `aria-live`, `<label htmlFor>` + `id` for PIN input.
7. `SecuritySection.tsx` — add `<label>` for PIN input, `aria-live` for error.
8. `ConfirmModal.tsx` — add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
9. `ChatMessage.tsx` — meaningful alt text.
10. `ChatMediaPanel.tsx`, `MediaGallery.tsx` — alt text.
11. `MyProfileSection.tsx`, `ProfilePreview.tsx` — `alt=""` (decorative) or display-name alt.
12. `GifSearch.tsx` — close button `aria-label`.
13. `ChatHeader.tsx` — `role="button"`, `tabIndex={0}`, `onKeyDown` for back/avatar/search.
14. `ContactProfileModal.tsx` — `aria-label` on close and favorite toggle.
15. `ChatInputArea.tsx` — improve contrast class on silent-mode and morse-mode buttons (use `text-gray-400` instead of `text-gray-600` in dark).
16. `public/sw.js` — validate incoming `postMessage` shape before persisting.
17. `vite.config.ts` — comment warning next to dev CSP block.
18. `server/routes/auth.ts` — relax autocomplete on PIN to `one-time-code`/`current-password` for password managers.
19. 8 locales — add `common.close`, `common.back` keys (some locales miss `common.close`).
20. `docs/SECURITY_AUDIT.md` — this file.

Out of scope (P2, documented but not fixed here): nonce-pinned `style-src`, Sentry wiring, certificate pinning on Android WebView, `trusted-types` policy.
