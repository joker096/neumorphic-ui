# Mess&Anger: Security Roadmap to Surpass Telegram

> **Date:** 2026-06-09
> **Status:** Approved Design
> **Timeline:** 3 months (Phase 1: 1 month, Phase 2: 1 month, Phase 3: 1 month)

## Current State Assessment

The codebase has strong theoretical security architecture but critical implementation gaps:

| Component | Current State | Gap |
|-----------|--------------|-----|
| E2EE | CryptoCore + DoubleRatchet code exists | Never integrated into message pipeline |
| P2P Network | Fully simulated (setTimeout, console.log) | No real WebRTC, no signaling, no peer discovery |
| Crypto files | `src/lib/cryptoCore.ts` (old) + `src/lib/crypto/cryptoCore.ts` (new) | Duplicated, conflicting, algorithm mismatch (X25519 vs ECDH) |
| At-rest encryption | AES-256-GCM IndexedDB via Zustand | Working but session master key fragile |
| Security module | Rate limiter, sanitizer, spam detector, logger | All working |
| Threat model | None | No formal document |

## Target Architecture

```
UI Layer (React)
  HubView / ChatView / SettingsView / ContactsView
       |
Secure Message Pipeline
  Message -> Encrypt(DoubleRatchet) -> P2P TX
  P2P RX -> Decrypt(DoubleRatchet) -> Message
       |
Crypto Core (unified)
  X25519 + ML-KEM-768 hybrid handshake
  Double Ratchet (Signal Protocol)
  AES-256-GCM per-message
  HKDF-SHA256 (RFC 5869)
  PBKDF2-SHA256 (600k iterations)
       |
P2P Transport (WebRTC)
  Signaling Server -> PeerConnection
  ICE (relay-only mode for anonymity)
  HMAC-SHA256 message auth
       |
Local Storage
  Zustand -> encrypted IndexedDB (AES-256-GCM)
  Device-bound key (PBKDF2, fingerprint)
  Recovery phrase for cross-device restore
```

## Phase 1: Core Secure Messaging (Month 1)

**Goal:** Working secure P2P chat with real E2EE and real WebRTC.

### Tasks

#### 1.1 Unify Crypto Core
- Merge `src/lib/cryptoCore.ts` and `src/lib/crypto/cryptoCore.ts` into single canonical module under `src/lib/crypto/CryptoCore.ts`
- Fix algorithm: use `tweetnacl` (already in deps) for X25519 key exchange instead of broken Web Crypto ECDH fallback
- Write unit tests for all core ops: encrypt, decrypt, handshake, ratchet step, HKDF
- Remove or re-export old `cryptoCore.ts` to maintain backward compat during transition

#### 1.2 Integrate Double Ratchet into Message Pipeline
- Create `src/lib/crypto/MessageEncryptionService.ts` that wraps DoubleRatchet per-conversation
- In App.tsx message flow: intercept `handleSendMessage` → encrypt payload → pass encrypted blob to P2P
- On receive: P2P callback → decrypt via per-chat ratchet state → store decrypted message
- Each conversation gets its own ratchet session (chain keys, DH ratchet, skipped message keys)
- Ratchet state persisted in encrypted IndexedDB via Zustand store

#### 1.3 Real WebRTC P2P
- Create signaling server: simple Node.js WebSocket server (`server/signaling.ts`)
- Client: `src/lib/p2p/P2PTransport.ts` — wraps `RTCPeerConnection` + `RTCDataChannel`
- Peer discovery: exchange public keys + SDP offers via signaling server
- HMAC-SHA256 on every data channel message (reject without valid HMAC)
- Replace simulated `P2PNetwork.ts` with real implementation behind same interface
- Self-hosted TURN server config (UI already exists in SettingsView)

#### 1.4 App.tsx Refactoring for Isolation
- Extract message pipeline into `src/lib/messaging/MessagePipeline.ts`
- Message send: `pipeline.send(chatId, plaintext)` → encrypt → P2P → callback on ack
- Message receive: `pipeline.onMessage(chatId, encrypted)` → decrypt → store
- This breaks the dependency on App.tsx monolithic state for security operations

### Deliverables
- [ ] Single CryptoCore module with tests passing
- [ ] Double Ratchet integrated: all messages encrypted before send
- [ ] Real WebRTC data channel working between 2 browser tabs
- [ ] HMAC rejection enforced on all P2P messages
- [ ] Signaling server code
- [ ] TURN server config functional
- [ ] Message pipeline extracted from App.tsx

## Phase 2: Features + Anonymity (Month 2)

**Goal:** Existing features running on secure pipeline + anonymity layer.

### Tasks

#### 2.1 Anonymity Layer
- **SOCKS5/Tor bridge config** in Settings → Network → Proxy
- **Domain fronting**: wrap WebSocket connection with HTTPS CDN fronting (Cloudflare workers or custom)
- **Relay-only mode**: ICE transport policy `relay` enforced when Anonymous Mode toggle is on
- **Timestamp fuzzing**: `±5 min` randomization on message timestamps display
- **Metadata killswitches**: wire up existing UI toggles (typing indicators, delivery receipts, online status) to actual P2P signaling

#### 2.2 Feature Migration
Each feature must be adapted to the E2EE pipeline:
- **Voice messages**: record → AES-GCM encrypt → send via data channel as binary blob
- **Stickers**: emoji string sent as plaintext (no PII), metadata encrypted
- **Files**: encrypted chunks via data channel + content-hash addressing
- **Photos/videos**: E2EE thumbnail + encrypted full-res, sent as binary over data channel
- **Calls**: WebRTC media stream already encrypted via DTLS-SRTP (built-in), ensure no IP leak via relay-only

#### 2.3 Device Recovery
- Generate BIP39-style mnemonic phrase from master key entropy
- Recovery flow: enter phrase → re-derive master key → decrypt store
- QR-chain export for mobile-to-desktop migration

#### 2.4 Multi-Device Foundation
- BroadcastChannel sync (exists)
- Device attestation via signed nonces
- Session list UI (exists) with remote termination via dead man's switch

### Deliverables
- [ ] Tor bridge / SOCKS5 proxy config working
- [ ] Relay-only mode functional
- [ ] All message types (voice, stickers, files, photos) E2EE
- [ ] Metadata killswitches actually kill metadata
- [ ] Device recovery phrase flow
- [ ] Multi-device session tracking

## Phase 3: Surpass Telegram (Month 3)

**Goal:** Formal security, audit, documentation, and Telegram feature parity.

### Tasks

#### 3.1 Threat Model Document
- Define trust boundaries: browser sandbox, signaling server, TURN server, P2P link
- Attack tree: XSS, MITM, signaling server compromise, device theft, social engineering
- For each attack: current mitigation, gap, needed improvement
- File: `docs/superpowers/threat-model.md`

#### 3.2 Channels & Comments over E2EE
- Channels: message signing with channel private key (not E2EE but authenticated)
- Comments: E2EE between author and commenters using per-post key
- Search: local Fuse.js over decrypted messages (already works, verify with encrypted storage)

#### 3.3 Security Audit
- Self-review checklist: OWASP Mobile Top 10 adapted for web/PWA
- CodeQL SAST scan via GitHub Actions
- `eslint-plugin-security` integration
- Third-party audit if budget allows

#### 3.4 CSP & Sandbox
- Audit CSP headers: ensure script-src, style-src, connect-src, frame-src locked down
- Mini-apps in sandboxed iframes with `allow-scripts` only
- CSP report-uri / report-to for attack monitoring

#### 3.5 Continuous Security
- GitHub Actions: test + lint + CodeQL on every push
- `npm audit` / `pnpm audit` in CI
- Automated crypto tests: known-answer tests for AES-GCM, HKDF, PBKDF2

#### 3.6 Documentation
- `SECURITY.md`: user-facing security features and guarantees
- `THREAT_MODEL.md`: developer-facing attack/mitigation matrix
- `ARCHITECTURE.md`: system architecture with security boundaries

### Deliverables
- [ ] Threat model document complete
- [ ] Channel comments over E2EE
- [ ] Security audit report (self or external)
- [ ] CSP + sandbox verified
- [ ] CI pipeline with security checks
- [ ] Documentation published

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Security Score | 8.5/10 | 9.5/10 |
| Anonymity Score | 8.0/10 | 9.5/10 |
| UX Parity with Telegram | ~90% | ~95% |
| TypeScript Errors | 0 | 0 |
| Test Pass Rate | 100% (133 pass) | 100% |
| E2EE Messages | None | All messages encrypted (text, voice, stickers, photos) |
| Real P2P | Simulated | Real WebRTC |
| Threat Model | None | Published |
| External Audit | None | Completed |
| Anonymity | Partial | Full (metadata killswitches, relay-only, timestamp fuzzing) |
| Channels | None | Full (signed messages, E2EE comments, per-post keys) |
| CSP | Partial | Full (CSP headers, sandbox, report-uri) |
| CI Security | Partial | Full (npm audit, CodeQL, known-answer tests) |
