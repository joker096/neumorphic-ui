# State Compressed - Security Fixes Progress

## Status: IN PROGRESS - Security Hardening (audit batch 1 complete 2026-08-17)

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
1. Continue structural splits (ChatMessage/CallScreen/P2PTransport/ChatListView/App/SettingsView/SettingsMainMenu)
2. K1: authenticated key exchange in P2P
3. K3: move WS token out of URL
4. Re-run lint/test, compress context when reaching 120k tokens

### Instructions:
- Compress context periodically
- Continue fixes without asking questions
- Save progress to STATE.md
- Use previous state data if session ends
- Work through all security issues systematically
