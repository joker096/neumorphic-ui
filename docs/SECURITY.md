# Mess&Anger — Security

> **Version:** 1.0
> **Last Updated:** 2026-06-10

---

## End-to-End Encryption

All messages in Mess&Anger are end-to-end encrypted (E2EE) using the Signal Protocol Double Ratchet. Neither the app developers, the signaling server, nor any third party can read your messages.

### How It Works

- **Key Exchange:** X25519 (Curve25519) public keys are exchanged between peers
- **Session Keys:** Per-conversation key ratchet using the Double Ratchet algorithm (chain key + DH ratchet)
- **Message Encryption:** AES-256-GCM with per-message keys that rotate after every message
- **Authentication:** HMAC-SHA256 on every P2P message; rejected if tampered

### Cryptographic Summary

| Operation | Algorithm | Security Level |
|-----------|-----------|----------------|
| Key Exchange | X25519 | ~128 bits (pre-quantum) |
| Message Encryption | AES-256-GCM | ~128 bits |
| Key Derivation | PBKDF2-SHA256 (600k iter) | ~128 bits |
| Key Derivation (session) | HKDF-SHA256 (RFC 5869) | ~128 bits |
| Message Authentication | HMAC-SHA256 | ~128 bits |

## At-Rest Encryption

Your messages and settings stored on your device are encrypted with AES-256-GCM using a master key derived from your device fingerprint via PBKDF2 (600,000 iterations).

### Recovery Phrase

- **Generation:** BIP39-style 1024-word mnemonic phrase
- **Entropy:** ~132 bits
- **Use:** Restore your encrypted store on a new device
- **Warning:** Never share your recovery phrase. Anyone with it can read your messages.

## Anonymity Features

### Anonymous Mode

Enable in **Settings → Network → Anonymity** to:

- Route connections through Tor bridge (SOCKS5)
- Enforce relay-only ICE mode (hats IP address)
- Disable all metadata leakage (typing indicators, online status, delivery receipts)
- Fuzz message timestamps (±5 minutes)

### Metadata Killswitches

Toggle in **Settings** to disable:
- Typing indicators
- Delivery receipts
- Online status
- Read receipts

## CSP & Sandbox

Mess&Anger enforces a strict Content Security Policy (CSP):

- **script-src:** `'self'` only — no external scripts
- **connect-src:** `'self'`, `ws://`, `wss://`, `localhost` — no arbitrary network access
- **frame-ancestors:** `'none'` — no iframe embedding (prevents clickjacking)
- **upgrade-insecure-requests:** enforced — all connections upgraded to HTTPS/WSS

## Security Recommendations

1. **Keep your browser updated** — Patches zero-day vulnerabilities
2. **Never share your recovery phrase** — Anyone with it can access your store
3. **Enable Anonymous Mode** — Hides your IP address and metadata
4. **Use a strong recovery phrase** — Do not use easily guessable words
5. **Verify peer fingerprints** — Compare X25519 public keys out-of-band for critical contacts

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not create a public issue.

---

*This document covers user-facing security features. For technical threat model, see `docs/superpowers/threat-model/threat-model.md`.*
