# Mess&Anger Security Guarantees

## End-to-End Encryption (E2EE)
All messages in Mess&Anger are encrypted end-to-end using the Signal Protocol Double Ratchet:
- **Algorithm**: AES-256-GCM per-message
- **Key Exchange**: X25519 (Curve25519) for X25519 key exchange
- **Key Agreement**: X25519 Diffie-Hellman (X2DH)
- **Key Derivation**: HKDF-SHA256 (RFC 5869)
- **Password Hashing**: PBKDF2-SHA256 (600,000 iterations)

## Encryption Details
### Per-Message Encryption
Every message sent through the messenger is encrypted before it leaves your device. The encryption uses the Double Ratchet algorithm, which ensures:
- **Forward Secrecy**: Past messages remain secure even if the ratchet state is compromised
- **Future Secrecy**: Future messages remain secure even if the ratchet state is compromised
- **Key Rotation**: Each message uses a unique encryption key derived from the ratchet state

### Key Exchange
The initial key exchange uses the X25519 algorithm, which is:
- **Quantum-resistant**: Based on the Discrete Logarithm Problem
- **Well-vetted**: Based on the X25519 curve, which is widely used and studied
- **Efficient**: Fast key generation and exchange

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
- Per-post key generation for comment encryption
- Double Ratchet used for comment thread encryption
- Comments are encrypted and transmitted through the P2P pipeline

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
