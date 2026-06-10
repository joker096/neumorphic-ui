# Security Self-Audit Checklist - Mess&Anger

## OWASP Mobile Top 10 (adapted for web/PWA)

### M1: Weak Backend Configuration
- [x] TLS/SSL for signaling server (configurable)
- [x] CSP headers implemented via `server/csp.ts`
- [x] No unsafe inline scripts
- [ ] Third-party dependencies audit - run `npm audit`

### M2: Inadequate Transport Layer Security
- [x] WebRTC DTLS-SRTP for media encryption
- [x] HMAC-SHA256 on all P2P messages
- [x] TURN relay-only mode supported
- [x] ICE candidates validated before use

### M3: Inadequate Local Storage
- [x] IndexedDB encrypted with AES-256-GCM
- [x] Master key derived via PBKDF2 (600k iterations)
- [x] Secure wipe capability
- [x] Recovery phrase for cross-device restore

### M4: Insecure Messaging
- [x] Double Ratchet (Signal Protocol) for message encryption
- [x] X25519 key exchange for session establishment
- [x] Per-message key rotation via ratchet step
- [x] Message authentication via HMAC-SHA256

### M5: Weak Authentication & Session Management
- [x] X25519-based identity keys
- [x] Device attestation via signed nonces
- [x] Session list with remote termination
- [ ] Rate limiting on authentication attempts

### M6: Insecure Code & Data Leakage
- [x] No debug logging in production
- [x] Sensitive data wiped on secure wipe
- [ ] Code obfuscation for production builds
- [ ] Memory zeroing after crypto operations

### M7: Client-side Weaknesses
- [x] No eval() usage
- [x] Input sanitization via sanitizer module
- [x] XSS prevention via CSP headers
- [x] No direct DOM manipulation of user content

### M8: Insufficient Server-Side Mitigations
- [x] HMAC verification on all incoming messages
- [x] Rate limiting on signaling server
- [ ] Request logging for security events
- [x] TURN server config for relay mode

### M9: Platform Abuse
- [ ] Permissions manifest (PWA)
- [ ] No unnecessary browser APIs
- [x] Service Worker registration handled securely

### M10: Insecure Updates
- [x] Auto-update mechanism in place
- [ ] Update signing verification
- [ ] Update channel security

## Cryptographic Analysis

### Key Generation
- [x] X25519 key pairs use tweetnacl (well-audited library)
- [x] Double Ratchet uses Web Crypto API for AES-GCM
- [x] HKDF (RFC 5869) for key derivation
- [x] PBKDF2 with 600k iterations for password-based key derivation

### Encryption
- [x] AES-256-GCM for message encryption (authenticated encryption)
- [x] Per-message IV (nonce) via CSPRNG
- [x] X25519 Diffie-Hellman for key exchange

### Signing
- [x] X25519 signatures for channel messages (tweetnacl)
- [x] HMAC-SHA256 for message authentication (Web Crypto API)
- [x] Channel message signing via `channelSigning.ts`

### Key Management
- [x] Double Ratchet state persisted in encrypted IndexedDB
- [x] Recovery phrase for key backup
- [x] Secure wipe clears all keys and data

## Threat Model Alignment

| Attack Vector | Mitigation | Status |
|--------------|------------|--------|
| XSS | CSP headers, no eval(), sanitized input | Implemented |
| MITM | X25519 key exchange, HMAC verification | Implemented |
| Signaling Server Compromise | No message payload visible, only SDP/ICE | Partial |
| TURN Server Compromise | Encrypted media (DTLS-SRTP) | Implemented |
| Device Theft | PBKDF2-protected master key, secure wipe | Implemented |
| Social Engineering | Recovery phrase protects against loss | Implemented |
| Metadata Leakage | AnonymityLayer with killswitches | Implemented |
| IP Leak | TURN relay-only mode, fuzzing | Implemented |

## CI/CD Security

- [x] npm audit in CI pipeline
- [x] ESLint with security rules
- [x] Known-answer crypto tests
- [x] CodeQL SAST scan
- [x] Test coverage check

## Recommendations

1. Run `npm audit` before each release
2. Consider adding `eslint-plugin-security` to CI
3. Add integration tests for E2EE message flow
4. Consider third-party cryptographic audit for production
5. Add rate limiting on signaling server authentication
6. Implement request logging for security events on signaling server
