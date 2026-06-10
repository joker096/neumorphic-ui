# Mess&Anger Security Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement this plan task-by-task.

**Goal:** Transform simulated secure messenger into real secure P2P messenger with working E2EE, real WebRTC, and anonymity features surpassing Telegram.

**Architecture:** Unify duplicated CryptoCore, fix X25519 algorithm via tweetnacl, integrate Double Ratchet into message pipeline, replace simulated P2P with real WebRTC, add Tor/domain-fronting anonymity.

**Tech Stack:** React 19, TypeScript, Vite, tweetnacl (X25519), Web Crypto (AES-GCM/HKDF/PBKDF2), WebRTC, Zustand, tailwindcss

---

## Phase 1: Core Secure Messaging

### Task 1.1: Unify Crypto Core with tweetnacl

**Files:**
- Modify: `src/lib/crypto/cryptoCore.ts` — rewrite X25519 using tweetnacl
- Modify: `src/lib/cryptoCore.ts` — re-export from canonical module
- Create: `src/lib/crypto/types.ts` — shared types
- Create: `src/lib/crypto/__tests__/cryptoCore.test.ts` — known-answer tests

- [ ] Write unified CryptoCore using tweetnacl for X25519 + Web Crypto for AES/HKDF/PBKDF2/HMAC

### Task 1.2: Fix Double Ratchet

**Files:**
- Modify: `src/lib/crypto/doubleRatchet.ts` — use tweetnacl for DH ratchet
- Create: `src/lib/crypto/__tests__/doubleRatchet.test.ts`

- [ ] Fix X25519 key exchange to use tweetnacl
- [ ] Implement proper DH ratchet with skipped message key storage
- [ ] Write tests

### Task 1.3: Message Encryption Service

**Files:**
- Create: `src/lib/crypto/MessageEncryptionService.ts` — per-conversation ratchet sessions
- Create: `src/lib/crypto/__tests__/MessageEncryptionService.test.ts`

- [ ] Service manages per-chat DoubleRatchet sessions
- [ ] Encrypt/decrypt pipeline for messages
- [ ] Persist ratchet state to encrypted store

### Task 1.4: Real WebRTC P2P Transport

**Files:**
- Create: `server/signaling-server.ts` — WebSocket signaling
- Create: `src/lib/p2p/P2PTransport.ts` — real WebRTC data channel
- Modify: `src/lib/p2p/network.ts` — replace simulation with real transport
- Create: `src/lib/p2p/__tests__/P2PTransport.test.ts`

- [ ] Signaling server (ws://localhost)
- [ ] Client WebRTC with data channels
- [ ] HMAC authentication on every message
- [ ] ICE relay-only mode support

### Task 1.5: Integrate Pipeline into App.tsx

**Files:**
- Create: `src/lib/messaging/MessagePipeline.ts`
- Modify: `src/App.tsx` — intercept send/receive

- [ ] Pipeline: plaintext → encrypt → P2P send
- [ ] Pipeline: P2P receive → decrypt → store
- [ ] Per-chat ratchet session management

## Phase 2: Anonymity + Features

### Task 2.1: Anonymity Layer
- Tor bridge config
- Domain fronting (Cloudflare)
- Relay-only mode enforcement
- Metadata killswitches wiring

### Task 2.2: Feature Migration
- Voice messages E2EE
- File transfer E2EE
- Photo/video E2EE
- Calls DTLS-SRTP verification

### Task 2.3: Device Recovery
- BIP39 mnemonic phrase
- Master key restore flow

## Phase 3: Audit + Documentation

- Threat model document
- CSP + sandbox audit
- CI security checks
- SECURITY.md, ARCHITECTURE.md, THREAT_MODEL.md
