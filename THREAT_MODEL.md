# Mess&Anger — Threat Model

> **Version:** 1.0
> **Date:** 2026-06-10
> **Classification:** Internal
> **Status:** Draft

---

## 1. Overview

This document describes the threat model for Mess&Anger, a P2P end-to-end encrypted messenger built on the Signal Protocol Double Ratchet, WebRTC data channels, and post-quantum cryptography primitives. The model follows the STRIDE methodology (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) adapted for a web-based messenger architecture.

## 2. Architecture Trust Boundaries

```
┌─────────────────────────────────────────────────────────┐
│ Browser Sandbox (Untrusted Host)                         │
│ ┌──────────────┐ ┌───────────────┐ ┌─────────────────┐ │
│ │  UI Layer    │ │ Crypto Core   │ │ IndexedDB        │ │
│ │ React DOM    │ │ tweetnacl,   │ │ AES-GCM          │ │
│ │              │ │ AES-GCM,     │ │ (master key)     │ │
│ └──────┼───────┘ └──────┼────────┘ └────────┼────────┘ │
│        │                  │                     │        │
│ ┌──────┼─────────────────┼───────────────────┼──────┐ │
│ │ Secure Message Pipeline                        │ │
│ │  DoubleRatchet per-conversation sessions        │ │
│ └──────┼─────────────────┼───────────────────┼──────┘ │
│        │                  │                     │        │
│ ┌──────┼─────────────────┼───────────────────┼──────┐ │
│ │ P2P Transport Layer (WebRTC)                   │ │
│ │ DataChannel + HMAC-SHA256                      │ │
│ └──────┼───────────────────────────────────┼────┐ │
│        │                                   │     │
└────────┼───────────────────────────────────┼────┘────────┘
         │              Trust Boundary        │
         │                                    │
┌────────┼───────────────────────────────────┼──────────┐
│ External Services (Partially Trusted)       │          │
└────────┼───────────────────────────────────┼──────────┘
         │
┌────────┼───────────────────────────────────┼──────────┐
│ Signaling Server (WS://)                    │          │
│ TURN Server (ICE relay)                     │          │
│ Tor Bridge (if configured)                  │          │
└─────────────────────────────────────────────────────────┘
```

### Trust Levels

| Component | Trust Level | Rationale |
|-----------|-------------|-----------|
| Browser JavaScript | Untrusted | Runs on user's machine; may be tampered with |
| CryptoCore (tweetnacl, Web Crypto) | Trusted | Standardized, audited primitives |
| IndexedDB (encrypted) | Semi-trusted | At-rest encrypted; key derivation via PBKDF2 |
| Signaling Server | Untrusted | Never sees plaintext messages; only SDP offers |
| TURN Server | Untrusted | May see relayed traffic; mitigated by WebRTC encryption |
| P2P Link (WebRTC) | Semi-trusted | DTLS-SRTP encrypts data channel; HMAC verifies integrity |

## 3. Attack Surface & Mitigations

### 3.1 Spoofing

| Attack | Likelihood | Impact | Mitigation | Status |
|--------|-----------|--------|------------|--------|
| Signaling server impersonation | Low | Medium | SDP offers signed with X25519 public key; peers verify signatures before accepting | Implemented |
| Man-in-the-middle on signaling | Low | High | Peer public keys verified via out-of-band channel; certificate pinning | Partial — needs verification UI |
| Fake peer connection | Medium | Medium | HMAC-SHA256 on every data channel message; rejects unsigned messages | Implemented |
| Recovery phrase replay | Low | High | BIP39 mnemonic has ~2^132 entropy; brute force impractical | Implemented |

### 3.2 Tampering

| Attack | Likelihood | Impact | Mitigation | Mitigation Status |
|--------|-----------|--------|-----------|-------------------|
| Tamper with IndexedDB data | Low | High | AES-256-GCM authenticated encryption; tampered messages fail GCM verification | Implemented |
| Tamper with ratchet state | Low | High | Ratchet state stored as encrypted blob; HMAC verification on read | Implemented |
| Tamper with P2P messages | Low | High | HMAC-SHA256 on every data channel message; rejected if tampered | Implemented |
| Tamper with settings/config | Low | Low | Settings stored in IndexedDB with integrity check | Implemented |

### 3.3 Repudiation

| Attack | Likelihood | Impact | Mitigation | Status |
|--------|-----------|--------|-----------|--------|
| Sender denies sending message | Low | Medium | Double Ratchet provides message authentication via ratchet step; cryptographically binding chain | Implemented |
| Replay attacks | Medium | Medium | Double Ratchet's chain key + message counter prevents replay; each message increments key | Implemented |

### 3.4 Information Disclosure

| Attack | Likelihood | Impact | Mitigation | Status |
|--------|-----------|--------|-----------|--------|
| Signaling server observes message content | Zero | N/A | Messages never sent to signaling server; only SDP offers (no payload) | Implemented |
| TURN server observes message content | Zero | N/A | WebRTC media streams use DTLS-SRTP; data channels use DTLS; payload encrypted with AES-GCM | Implemented |
| Network observer infers peer identity | Low | Medium | Tor bridge + relay-only ICE; peer IPs hidden behind TURN | Implemented with Tor |
| Metadata leakage (typing, online status) | Medium | High | Metadata killswitches in settings; disables all presence signaling | Implemented |
| IndexedDB data exposure (device theft) | Low | High | Master key derived from device fingerprint + PBKDF2 (600k iterations); recovery phrase required | Implemented |
| Timing side-channel (message timing) | Low | Low | Timestamp fuzzing ±5 min randomization | Implemented |

### 3.5 Denial of Service

| Attack | Likelihood | Impact | Mitigation | Status |
|--------|-----------|--------|-----------|--------|
| Signaling server DoS | Low | High | Self-hosted signaling; no central dependency for P2P connectivity | Implemented |
| TURN server DoS | Medium | Medium | Graceful degradation: falls back to direct peer connection | Implemented |
| Flood messages (rate limiting) | Medium | Low | Rate limiter in security module; configurable max messages per window | Implemented |
| Spam detection | Low | Low | Spam detector with configurable thresholds | Implemented |
| Crypto exhaustion | Low | High | Double Ratchet auto-rotates keys; session state limited | Implemented |

### 3.6 Elevation of Privilege

| Attack | Likelihood | Impact | Mitigation | Status |
|--------|-----------|--------|-----------|--------|
| XSS injection | Low | High | CSP headers (script-src 'self', connect-src restricted); React DOM auto-escapes | Implemented |
| Cross-origin data exfiltration | Low | High | connect-src limited to 'self', ws://, wss://, localhost | Implemented |
| iframe injection | Low | Medium | frame-ancestors 'none'; no iframe support | Implemented |
| WebCrypto key extraction | Low | High | Master key never leaves browser; stored in IndexedDB encrypted | Implemented |

## 4. Attack Trees

### 4.1 XSS Attack Tree

```
XSS Vector
├── DOM-based XSS
│   └── Mitigated by: React (auto-escapes JSX), CSP script-src 'self'
│   └── Gap: None if CSP enforced by server (note: index.html uses <meta> CSP which browsers ignore for CSP; need HTTP headers)
├── Prototype pollution via settings
│   └── Mitigated by: TypeScript strict mode; input sanitization via sanitizer.ts
│   └── Gap: No comprehensive prototype pollution checks
└── Clickjacking
    └── Mitigated by: frame-ancestors 'none' in CSP
```

### 4.2 MITM Attack Tree

```
MITM Vector
├── Signaling server compromised
│   ├── SDP offer intercepted
│   │   └── Mitigated: SDP contains no message payload, only ICE candidates
│   ├── SDP offer modified
│   │   └── Mitigated: Peer X25519 verification; modified SDP rejected
│   └── SDP offer replay
│       └── Mitigated: Per-session SDP with session nonce
├── P2P connection hijacked
│   └── Mitigated: HMAC-SHA256 on every message; peer verification
└── Signaling server DNS hijacking
    └── Mitigated: WSS (WebSocket Secure) required; certificate pinning recommended
```

### 4.3 Device Theft Attack Tree

```
Device Theft
├── Attacker has physical device
│   ├── Opens app in browser
│   │   ├── Mitigated: Master key requires device fingerprint + PBKDF2 (600k iterations)
│   │   └── Gap: If device fingerprint matches (same device), app may auto-unlock
│   └── Attempts brute-force recovery phrase
│       └── Mitigated: BIP39 phrase has ~2^132 entropy; PBKDF2 600k iterations makes brute force impractical
└── Attacker clones device
    └── Mitigated: Each device has unique fingerprint; clone fingerprint fails PBKDF2 derivation
```

### 4.4 Network Analysis Attack Tree

```
Network Analysis
├── Passive packet capture
│   ├── Observer sees WebRTC traffic
│   │   └── Mitigated: WebRTC uses DTLS-SRTP; payload encrypted with AES-GCM
│   ├── Observer infers message content
│   │   └── Mitigated: AES-GCM encryption; no plaintext in transit
│   └── Observer infers message timing
│       └── Mitigated: Timestamp fuzzing ±5 min
├── Active network attack
│   ├── Attacker impersonates peer
│   │   └── Mitigated: X25519 key verification; HMAC-SHA256 on every message
│   ├── Attacker performs man-in-the-middle on signaling
│   │   └── Mitigated: WSS required; peer verification
│   └── Attacker performs Tor exit node sniffing
│       └── Mitigated: End-to-end encryption (Double Ratchet); Tor exit only sees encrypted payload
└── IP address exposure
    ├── Direct peer-to-peer
    │   └── Mitigated: Relay-only ICE mode when anonymity enabled
    ├── Via signaling server
    │   └── Mitigated: SDP contains TURN relay candidates, not direct IPs
    └── Via TURN server
        └── Mitigated: TURN server only sees relayed traffic, not payload content
```

### 4.5 Social Engineering Attack Tree

```
Social Engineering
├── Phishing attack targeting recovery phrase
│   └── Mitigated: Recovery phrase is user-held; never requested by app
│   └── Gap: User may be tricked into sharing phrase (out-of-band)
├── Phishing attack targeting master key
│   └── Mitigated: Master key stored in IndexedDB; never exposed to web
│   └── Gap: If user exports master key and shares it, compromise occurs
└── Impersonation attack (fake user)
    └── Mitigated: Each peer verified via X25519 public key
    └── Gap: Key exchange requires out-of-band verification
```

## 5. Cryptographic Analysis

### 5.1 Key Exchange (X25519)

- **Algorithm:** X25519 (Curve25519) via tweetnacl
- **Key length:** 256-bit
- **Security level:** ~128 bits (pre-quantum)
- **Recommendation:** Monitor for post-quantum migration (ML-KEM-768 hybrid already configured)

### 5.2 Symmetric Encryption (AES-256-GCM)

- **Algorithm:** AES-256-GCM
- **Key length:** 256-bit
- **Security level:** ~128 bits
- **IV handling:** Per-message random IV (12 bytes); GCM degrades after 2^32 messages per key
- **Mitigation:** Double Ratchet auto-rotates message keys; each key used for ~1 message
- **Status:** Strong; no known practical attacks

### 5.3 Key Derivation (PBKDF2-SHA256)

- **Algorithm:** PBKDF2 with SHA-256
- **Iterations:** 600,000
- **Salt:** Device fingerprint + static salt
- **Security level:** ~128 bits against brute force
- **Mitigation against offline attacks:** 600k iterations + unique salt per device
- **Status:** Strong; computationally expensive for brute force

### 5.4 Key Derivation (HKDF-SHA256)

- **Algorithm:** HKDF (RFC 5869) with SHA-256
- **Usage:** Derives per-message keys from shared secret
- **Security level:** ~128 bits
- **Status:** Strong

### 5.5 HMAC (HMAC-SHA256)

- **Algorithm:** HMAC-SHA256
- **Usage:** P2P message authentication
- **Security level:** ~128 bits
- **Status:** Strong

## 6. Residual Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Browser vulnerability (zero-day) | Low | High | Keep browser updated; sandbox isolation |
| Web Crypto API regression | Low | Medium | Monitor browser updates; fallback to tweetnacl |
| tweetnacl vulnerability | Low | High | tweetnacl is well-audited; monitor for CVEs |
| Quantum computing (future) | Low (2026) | High (2030+) | ML-KEM-768 hybrid handshake configured; ready for migration |
| Social engineering | Medium | High | Education; never share recovery phrase; out-of-band key verification |

## 7. Recommendations

### High Priority

1. **Deploy CSP via HTTP headers** — Current CSP is in `<meta>` tag which browsers ignore for enforcement. Must be served via HTTP `Content-Security-Policy` header.
2. **Add automated CSP reporting** — Configure `report-uri` and `report-to` for attack monitoring.
3. **Out-of-band key verification UI** — Add fingerprint comparison UI for verifying peer X25519 public keys.

### Medium Priority

4. **Add eslint-plugin-security** — Catch insecure coding patterns in CI.
5. **Add npm audit to CI pipeline** — Catch vulnerable dependencies.
6. **CodeQL SAST scan** — Static analysis for security vulnerabilities.
7. **Certificate pinning for signaling server** — Prevent MITM on WebSocket connections.

### Low Priority

8. **Post-quantum migration plan** — Monitor NIST PQ standards; plan migration when practical.
9. **Third-party security audit** — Engage external auditor for comprehensive review.

## 8. Changelog

| Date | Version | Changes |
|------|---------|----------|
| 2026-06-10 | 1.0 | Initial threat model created |
