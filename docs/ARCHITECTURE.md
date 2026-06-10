# Mess&Anger Architecture

## System Architecture

### Client Architecture
```
UI Layer (React) -> Message Pipeline -> Crypto Core -> P2P Transport -> Local Storage
```

### Security Layers
1. **UI Layer** - Message pipeline intercepts send/recv, encrypts/decrypts
2. **Crypto Layer** - Double Ratchet + AES-GCM for per-message encryption
3. **Transport Layer** - WebRTC + HMAC-SHA256 for message authentication
4. **Storage Layer** - IndexedDB with AES-GCM encryption at rest

### Trust Boundaries
- **Browser**: Full trust for encryption/decryption, no keys leave device
- **Signaling Server**: Untrusted, only handles SDP exchange, not message content
- **TURN Server**: Untrusted, relay only, no message decryption
- **P2P Link**: Authenticated via HMAC-SHA256

### Data Flow
```
[Alice Device] --encrypt(DoubleRatchet)--> [WebRTC DataChannel] --> [P2P Link] --> [Bob Device]
```

## Key Components
- `src/lib/crypto/cryptoCore.ts` - Core crypto operations
- `src/lib/crypto/doubleRatchet.ts` - Double Ratchet implementation
- `src/lib/crypto/MessageEncryptionService.ts` - Per-session encryption wrapper
- `src/lib/messaging/MessagePipeline.ts` - Central message sending pipeline
- `src/lib/p2p/P2PTransport.ts` - WebRTC data channel transport
- `src/lib/p2p/network.ts` - P2P network management
- `src/lib/p2p/HMACAuth.ts` - HMAC-SHA256 message authentication
- `src/lib/network/AnonymityLayer.ts` - Anonymity layer (Tor, metadata killswitches)
- `src/lib/network/ProxyConfig.ts` - SOCKS5/Tor bridge configuration
- `src/lib/recovery/RecoveryManager.ts` - Mnemonic phrase generation and restoration
- `src/lib/recovery/MnemonicGenerator.ts` - BIP39-style mnemonic generation
- `src/lib/security/` - Rate limiter, sanitizer, spam detector, logger
- `src/lib/` - Device security, device attestation, multi-device sync

## Signaling Server
- Self-hosted Node.js WebSocket server (port 8765)
- Handles SDP offer/answer exchange only
- HMAC-SHA256 verified signaling messages
- Supports multiple clients with public key registration

## TURN Server
- Self-hosted coturn server for relay mode
- Relay-only mode available for anonymity
- All relay traffic encrypted via WebRTC DTLS

## Multi-Device
- Device-bound key generation using PBKDF2
- Device attestation via signed nonces
- Session list with remote termination (dead man's switch)
- BroadcastChannel sync for multi-tab sessions
- BIP39-style mnemonic phrase for recovery
