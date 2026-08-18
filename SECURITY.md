# Mess&Anger Security Guarantees

## End-to-End Encryption (E2EE)
All messages in Mess&Anger are encrypted end-to-end using X25519 ECDH key agreement, Ed25519 message signatures, and HMAC-SHA256 per-message authentication:
- **Algorithm**: AES-256-GCM for local at-rest encryption
- **Key Exchange**: X25519 (Curve25519) ECDH for per-peer shared secrets
- **Authentication**: HMAC-SHA256 over every transport frame; Ed25519 signature binds the sender identity
- **Password Hashing**: PBKDF2-SHA256 (600,000 iterations)

> **NOTE:** The documented Signal Protocol Double Ratchet and post-quantum (ML-KEM-768)
> layers were **removed as dead code** (no callers in the shipping app). Live transport
> cryptography is X25519 ECDH + HMAC-SHA256 + Ed25519. Post-quantum is roadmap, not shipped.

## Encryption Details
### Per-Message Encryption
Every message is encrypted/authenticated before it leaves your device:
- **Confidentiality**: X25519 ECDH shared secret (mixed with per-frame salt + nonce)
- **Integrity & Authenticity**: HMAC-SHA256; tampered or replayed frames are rejected
- **Sender binding**: Ed25519 signature on the channel/sender
- **Forward Secrecy**: shared secrets are per-peer session and not reused across sessions

### Key Exchange
The initial key exchange uses the X25519 algorithm, which is:
- **Well-vetted**: Based on the X25519 curve, which is widely used and studied
- **Efficient**: Fast key generation and exchange
- **Note**: X25519 is classical (not quantum-resistant); post-quantum migration is roadmap

## Local Storage Encryption
All data stored locally on your device is encrypted using AES-256-GCM:
- IndexedDB is encrypted with AES-256-GCM via Zustand
- The session master key is device-bound using PBKDF2
- Recovery phrase allows cross-device restore

## P2P Network Security
### Signaling Server
- All signaling messages are HMAC-SHA256 authenticated
- The signaling server only handles SDP offer/answer exchange, not message content
- Self-hostable signaling server with WebSocket support

### TURN Server
- Relay-only mode available for anonymity
- ICE transport policy enforces relay-only when anonymity is enabled
- All relay traffic is encrypted via WebRTC DTLS

## Anonymity Features
### Metadata Killswitches
- Typing indicators can be disabled (kills metadata)
- Delivery receipts can be disabled (kills metadata)
- Online status can be disabled (kills metadata)
- Read receipts can be disabled (kills metadata)

### Timestamp Fuzzing
- Message timestamps can be fuzzed with +/-5 minute randomization
- Reduces metadata correlation attacks

### Relay-Only Mode
- WebRTC ICE transport policy can be set to relay-only
- Prevents direct P2P connections when anonymity is preferred
- All traffic flows through a TURN server

## Device Security
### Device Binding
- Device-bound key generation using PBKDF2
- Device attestation via signed nonces
- Session list with remote termination (dead man's switch)

### Recovery
- BIP39-style mnemonic phrase for device recovery
- Recovery phrase can re-derive master key
- Cross-device migration via QR-chain export

## Security Architecture
### Browser Sandbox
- All encryption/decryption happens in the browser
- No server-side key storage
- All local data is encrypted at rest

### P2P Architecture
- Messages are sent directly between devices
- No central message storage
- No server-side message processing

## Channel & Comments Security
### Channel Messages
- Channel messages are authenticated via X25519 signatures using the channel private key
- Channel signing is enforced via `src/lib/crypto/channelSigning.ts`
- Per-channel keypairs are generated during channel creation

### E2EE Comments on Channels
- Per-post key generation for comment thread integrity
- Comments are transmitted through the P2P pipeline with the same HMAC/Ed25519 authentication

## Content Security Policy (CSP)
- CSP headers are enforced via `server/csp.ts`
- `default-src 'none'` blocks all non-whitelisted content
- `connect-src` restricts network connections to allowed domains
- `nonce`-based inline script policy prevents XSS attacks
- CSP report-uri enables attack monitoring

## CI/CD Security
- npm audit with --audit-level=high in CI pipeline
- CodeQL SAST scan on every push
- Known-answer crypto tests for AES-GCM, HKDF, PBKDF2
- eslint-plugin-security integration

## Updates
This document is updated as part of the security roadmap. The latest version is always available in the repository.
