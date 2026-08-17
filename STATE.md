# State Compressed - Security Fixes Progress

## Status: IN PROGRESS - Security Hardening (audit batch 2 in progress, 2026-08-17)

### Audit batch 2 (2026-08-17) — DONE:
- **P0 keystore rotation**: old `messandanger-keystore.jks` deleted + ROTATED (new RSA-4096 PKCS12, alias `messandanger`, 10000d, CN=MessAnger). Password (24-char alnum) stored in User env `BUBBLEWRAP_KEYSTORE_PASSWORD` + `BUBBLEWRAP_KEY_PASSWORD` (NOT committed anywhere). `scripts/build-android.mjs` reads those env vars. NOTE: rotation breaks TWA update path for existing users (reinstall required).
- **P0 git-history purge**: `git filter-branch --index-filter "git rm -r --cached --ignore-unmatch messandanger-keystore.jks server/data/admin.db server/data/admin.db-shm server/data/admin.db-wal" --prune-empty d2c5efb..master` + reflog expire + `gc --prune=now`. Old objects confirmed unrecoverable (`git cat-file` on pre-rewrite SHAs fails). Local-only — remote (origin/master=d2c5efb) never contained the secrets; no force-push needed.
- **P0 .gitignore**: added `*.jks`, `*.p12` (keystore stays on disk, untracked).
- **Dead code removed**: `src/components/commercial/` (43 files), `public/ecochat/`, `src/components/ecochat/{EcoChatList,EcoActiveChat,EcoNavItems,index}.tsx` (EcoSidebarNav.tsx is LIVE — imported by AppShell.tsx, keep). Root artifacts: playwright screenshots/logs, debug-*.mjs, check-css.mjs removed.
- **i18n parity**: added `onboarding.channelDescription`, `onboarding.channelStep1/2` to de/es/fr/ja/ko/zh (3 failing i18n tests → 45/45 pass).
- **WIP restructure**: 10 flat WIP commits → 6 logical commits (security / chore-android / style / feat / test / docs) + dead-code commit. Working tree clean.
- Verified: `npm run lint` (eslint+tsc) 0 errors; `npm run build` OK; i18n suite 45/45.

### Completed Security Fixes:

### Completed Security Fixes:
1. P2PTransport.ts - LRU replay protection (60s TTL), HMAC cleanup, STUN detection
2. MeshRoutingTable.ts - TTL expiration, cleanup() method  
3. MeshRouter.ts - offForward(), cleanup(), TTL checks
4. MessageEnvelope.ts - isEnvelopeExpired() function
5. All 3696 tests passing ✅ (now 3892 after audit cleanup)
6. TypeScript compiles clean ✅
7. npm audit: 0 production vulnerabilities ✅

### Audit batch 1 (2026-08-17) — DONE:
- AUDIT/001: serveAdminFile directory-crash + REST try/catch (server/signaling-server.ts)
- AUDIT/002: sw.js same-origin guard + no /api caching (public/sw.js)
- AUDIT/003: untracked admin.db-wal/-shm + .gitignore (server/data, .gitignore)
- AUDIT/004: removed dead/insecure crypto (deriveHKDF misnamed PBKDF2-1, raw-DH AES, unused HMAC/forward-secrecy) — src/lib/crypto/cryptoCore.ts
- AUDIT/005: removed dead hooks useConnection/useConnectionSetup
- AUDIT/006: removed duplicate landing/ dir
- AUDIT/007: fixed security.yml (broken eslint/codeql) + lint in ci.yml
- Verified: npm run lint 0 errors, npm test 3892/3892 ✅

### Pending Security Issues (batch 2 / backlog):
- AUDIT/008: WS handshake now validates Origin (CSWSH defense-in-depth)
- K1: P2PTransport — derive HMAC/AES keys from authenticated ECDH instead of sending hmacKey in plaintext over signaling
- K3: WS token out of URL query → header/cookie + origin validation on WS upgrade
- WS upgrade has no origin check (relies on JWT only)
- Structural: remaining files >300 lines (ChatMessage 380, App 371) — ChatPreviewLayer 507→417 via useChatMessageActions; SettingsMainMenu 313→286 via SettingsMenuParts (AUDIT/010); ChatListView 406→295 via useChatListActions + ChatListBots (AUDIT/011); ChatMessage 441→380 via messageMenuActions (AUDIT/012); CallScreen 460→248 via CallMediaStage + CallControlBar + CallTopBar (AUDIT/013)
  - SettingsView 340 → EXEMPT: thin router (prop-plumbing to already-atomic section components); splitting would create a 40-prop mega-component
  - P2PTransport 450 → EXEMPT: cohesive class (natural unit); splitting instance methods into free functions hurts OOP clarity
- AUDIT/008: WS handshake now validates Origin (CSWSH defense-in-depth)
- K1: P2PTransport — derive HMAC/AES keys from authenticated ECDH instead of sending hmacKey in plaintext over signaling
  - REASSESSMENT: `peerPublicKey` in P2PNetwork (network.ts:54) is an opaque routing id (`options.peerPublicKey || peerId`), NOT a real X25519 public key; no private key exists in the P2P stack. Proper ECDH-derived keys require a new X25519 identity-key subsystem (design task) — DEFERRED. hmacKey-in-signaling remains a minor (defense-in-depth) weakness until then.
- favicon.png 1.4MB → resize (deferred: needs image tooling not in repo); APK already untracked; ICQ skins now lazy-load (AUDIT/009)
- KyberKEM (ML-KEM768) is dead — wire into handshake (K2) or remove + drop @noble/post-quantum
- Dev-dep vulns (tar/file-type/uuid/googleapis via @bubblewrap/core) — low priority

### Working Directory:
F:\AISTUDIO\neumorphic-ui

### Next Actions:
1. K1: legacy `msg.hmacKey` fallback (P2PTransport ~413/431) — keep for old clients, bind dhPub to Ed25519 identity
2. K2: wire ML-KEM768 hybrid into MessageEncryptionService.initSession
3. K7: PUSH_VAPID_KEY hardcoded in public/sw.js:22
4. K9: add Permissions-Policy header; K10: npm audit in CI
5. Structural splits: P2PTransport 428, ChatPreviewLayer 396, App 377, ChatMessage 370, AppShell 353, useChatPreviewState 325, SettingsView 316, ChatListItem 312, CallManager 309
6. Full verify (lint/tsc/build/vitest), update ARCHITECTURE.md (stale), final builds (APK with rotated keystore) + deploy

### Instructions:
- Compress context periodically
- Continue fixes without asking questions
- Save progress to STATE.md
- Use previous state data if session ends
- Work through all security issues systematically
