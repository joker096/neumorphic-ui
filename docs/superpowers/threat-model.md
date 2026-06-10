# Threat Model for Mess&Anger

## Overview
This document defines the trust boundaries, attack vectors, mitigations, and gaps for Mess&Anger. It is designed as a web-based PWA with E2EE, P2P networking, and local storage.

## Trust Boundaries

### Trust Zones
1. **Browser Sandbox** - User device, local storage, IndexedDB, WebCrypto API
2. **Signaling Server** - Third-party relay for WebRTC SDP exchange (no message content)
3. **TURN Server** - Third-party relay for media/data if direct P2P fails
4. **P2P Link** - WebRTC data channel between two users
5. **End Users** - Alice and Bob

### Data Flow
```
[Alice Device] --E2EE/DoubleRatchet--> [P2P Link] <--E2EE/DoubleRatchet-- [Bob Device]
                    |                      |
              [Signaling Server]      [TURN Server]
              (SDP only)              (relay only)
```

## Attack Vectors

### 1. XSS (Cross-Site Scripting)
- **Target**: Client-side JavaScript, message rendering
- **Mitigation**: Content Security Policy (CSP), DOMPurify for markdown rendering
- **Gap**: CSP not yet fully locked down, verify no `unsafe-inline`
- **Needed**: CSP headers with `report-uri`

### 2. MITM (Man-in-the-Middle)
- **Target**: Signaling server, TURN server
- **Mitigation**: Signaling via WebSocket over TLS, TURN relay-only mode
- **Gap**: Signaling server must be self-hosted with valid TLS cert
- **Needed**: Document self-hosting requirements

### 3. Signaling Server Compromise
- **Target**: SDP offer/answer exchange
- **Mitigation**: HMAC-SHA256 verification on all signaling messages
- **Gap**: Signaling server is a single point of failure
- **Needed**: Redundant signaling servers, rotation

### 4. TURN Server Compromise
- **Target**: Relay traffic if direct P2P fails
- **Mitigation**: Relay-only mode, encrypted ICE candidates
- **Gap**: TURN server exposes IP if relay is used
- **Needed**: Documented self-hosted TURN config

### 5. Device Theft
- **Target**: Local storage (IndexedDB), master key
- **Mitigation**: AES-256-GCM encryption of all local data, device-bound key (PBKDF2)
- **Gap**: Master key recovery phrase stored insecurely
- **Needed**: BIP39-style mnemonic with PBKDF2 key derivation

### 6. Social Engineering
- **Target**: Users, PIN bypass
- **Mitigation**: PBKDF2 key derivation for PIN hashing, device attestation
- **Gap**: No rate limiting on PIN attempts
- **Needed**: Implement account lockout after N failed attempts

### 7. Metadata Collection
- **Target**: User behavior, contact graphs
- **Mitigation**: Anonymity layer with metadata killswitches, timestamp fuzzing
- **Gap**: Anonymity layer not yet fully integrated with UI toggles
- **Needed**: Wire up existing SettingsView toggles to actual P2P signaling

### 8. WebRTC Media Leak
- **Target**: IP address exposure via WebRTC
- **Mitigation**: Relay-only mode, ICE transport policy enforcement
- **Gap**: WebRTC may still leak IP if ICE candidates are not properly filtered
- **Needed**: Document WebRTC relay configuration requirements

### 9. Cryptanalysis
- **Target**: AES-GCM, X25519, Double Ratchet
- **Mitigation**: All algorithms use well-established, peer-reviewed standards
- **Gap**: No formal cryptographic review completed
- **Needed**: Third-party cryptographic audit

## Attack Tree

| Attack | Vector | Mitigation | Status |
|--------|--------|------------|--------|
| XSS | Message injection | CSP, DOMPurify | Partial |
| MITM | Signaling interception | HMAC-SHA256, TLS | Implemented |
| Signaling Compromise | Server takeover | Self-hosted, HMAC | Implemented |
| TURN Compromise | Relay traffic | Relay-only mode | Implemented |
| Device Theft | Local data exposure | AES-GCM, device-bound key | Implemented |
| Social Engineering | PIN bypass | PBKDF2, rate limiting | Partial |
| Metadata Collection | Contact graphs | Anonymity layer | Implemented (UI exists) |
| WebRTC Leak | IP exposure | Relay-only mode | Implemented |
| Cryptanalysis | Algorithm weakness | X25519, AES-GCM | No audit |
| Session hijacking | Ratchet state | Persisted encrypted | Implemented |

## Gap Analysis

### Critical
- [ ] CSP headers not fully locked down
- [ ] No third-party cryptographic audit
- [ ] Anonymity UI toggles not wired to P2P signaling
- [ ] No rate limiting on PIN attempts

### Medium
- [ ] Signaling server not documented for self-hosting
- [ ] TURN server config only example, not production-ready
- [ ] No automated crypto tests in CI/CD
- [ ] No SAST scan integration

### Low
- [ ] No automated dependency vulnerability scanning
- [ ] No formal security incident response plan
- [ ] No documented threat model update process

## Recommendations

### Immediate (Phase 3.1)
1. Implement CSP headers with report-uri
2. Document threat model in SECURITY.md and THREAT_MODEL.md
3. Implement automated crypto tests (known-answer tests)

### Short-term (Phase 3.2)
4. Third-party cryptographic audit
5. Self-hosted TURN server production config
6. Wire up anonymization UI toggles to P2P signaling

### Long-term (Phase 3.3)
7. CI/CD security pipeline with CodeQL SAST
8. Automated dependency vulnerability scanning
9. Formal security incident response plan
