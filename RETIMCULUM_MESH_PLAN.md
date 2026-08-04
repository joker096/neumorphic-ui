# Mess&Anger — Reticulum-Style Mesh Architecture Plan

> **Goal:** Transform Mess&Anger from a P2P WebRTC messenger into a true mesh-capable, fully-decentralized, anonymous messaging system — inspired by Reticulum/LXMF/Sideband, but fully integrated into the existing codebase without external dependencies.

> **Principle:** *Don't import Reticulum — reimplement its core ideas in native TypeScript/Python where needed.*

---

## 1. Architecture Analysis: Current vs Target

### 1.1 Current State
| Component | Current Implementation |
|-----------|------------------------|
| Transport | WebRTC (WebSockets + ICE/TURN relay) |
| Signaling | WebSocket-based SignalingManager |
| Encryption | X25519 + ML-KEM-768 (post-quantum hybrid) |
| Ratchet | Double Ratchet (homegrown) |
| Auth | HMAC-SHA256 |
| Anonymity | Relay-only mode, timestamp fuzzing, metadata killswitches |
| Mesh | Limited — only via TURN relay, no true mesh routing |

### 1.2 Target State (Reticulum-inspired)
| Feature | Implementation Strategy |
|---------|------------------------|
| Transport | Hybrid: WebRTC for low-latency + Mesh relay for reliability |
| Routing | Decentralized DHT + mesh routing tables |
| Addressing | Cryptographic identities (X25519 public keys as addresses) |
| Store-and-forward | LXMF-style message queue with TTL and forward secrecy |
| Mesh | DHT-based node discovery + multi-hop relay |
| Anonymity | Tor/SOCKS5 bridge, metadata killswitches, path-based routing |
| Crypto | Keep current X25519 + ML-KEM-768, add forward secrecy |

---

## 2. Phase 1: Cryptographic Foundation (Weeks 1-2)

### 2.1 Forward Secrecy (Reticulum Principle)
Reticulum provides forward secrecy — compromising a key doesn't reveal past messages.

**Current Gap:** Homegrown ratchet doesn't properly implement forward secrecy.

**Action:**
1. Replace `doubleRatchet.ts` with a proper Signal Protocol implementation
2. Add message keys that are derived but never stored after use
3. Implement skipped message key decryption (already partially in DoubleRatchet)

**Files to modify:**
- `src/lib/crypto/doubleRatchet.ts` — replace with audited Signal implementation
- `src/lib/crypto/cryptoCore.ts` — add forward secrecy key management

**Python equivalent (if needed):**
```python
# libsodium-based key derivation (no Reticulum dependency)
import sodium
from sodium import crypto

def derive_message_key(master_key: bytes, counter: int) -> bytes:
    """Derive per-message key that's never stored after use."""
    counter_bytes = counter.to_bytes(8, 'big')
    return sodium.crypto_kdf(master_key + counter_bytes)
```

### 2.2 Identity Management
Reticulum uses cryptographic identities for addressing. Mess&Anger already uses X25519 — keep this.

**Action:**
1. Use X25519 public key as user identity (no phone, no username)
2. Add identity rotation with forward secrecy
3. Implement key pair generation and storage

**Current:** Already implemented in `cryptoCore.ts`

**Action:** None — current implementation is sufficient.

### 2.3 Post-Quantum Hybrid
Reticulum doesn't address post-quantum — Mess&Anger already has ML-KEM-768.

**Action:** Keep current implementation. It's stronger than Reticulum.

---

## 3. Phase 2: Message Format & Store-and-Forward (Weeks 3-4)

### 3.1 LXMF-Style Message Format
Reticulum's LXMF provides a message format with:
- Encrypted payload
- Metadata header (sender, recipient, timestamp, TTL)
- Forward secrecy (message keys derived, not stored)
- Acknowledgment tracking

**Action:** Create `MessageEnvelope.ts` inspired by LXMF

```typescript
// src/lib/messaging/MessageEnvelope.ts
export interface MessageEnvelope {
  // LXMF-inspired envelope structure
  version: number           // Message format version
  type: 'message' | 'file' | 'call' | 'metadata'
  sender: string            // X25519 public key (base64)
  recipient: string         // X25519 public key or '*' for broadcast
  timestamp: number         // Unix timestamp
  ttl: number               // Time-to-live in seconds (0 = no expiration)
  encryptedPayload: string  // AES-GCM encrypted content
  iv: string                // AES-GCM initialization vector
  mac: string               // HMAC-SHA256 for integrity
  forwardSecrecy: boolean   // Whether to implement forward secrecy
  priority: 'normal' | 'urgent' | 'low'
}
```

### 3.2 Message Queue
Reticulum's LXMF provides store-and-forward. Mess&Anger needs this for:
- Offline users
- Mesh relay scenarios
- Message persistence

**Action:**
1. Create `MessageQueue.ts` using IndexedDB
2. Implement TTL-based expiration
3. Add acknowledgment tracking

**Files to create:**
- `src/lib/messaging/MessageQueue.ts`
- `src/lib/messaging/MessageRouter.ts`

**Current equivalent:** `MessagePipeline.ts` — extend this with queue functionality.

### 3.3 Forward Secrecy Implementation
Reticulum provides forward secrecy — past messages can't be decrypted even if current key is compromised.

**Action:**
1. Derive message keys from ratchet state
2. Delete key material after use
3. Implement skipped key decryption

**Files to modify:**
- `src/lib/crypto/doubleRatchet.ts` — add key derivation and deletion
- `src/lib/crypto/cryptoCore.ts` — add forward secrecy support

---

## 4. Phase 3: Mesh Routing (Weeks 5-6)

### 4.1 DHT-Based Node Discovery
Reticulum uses its own routing protocol. Mess&Anger can use DHT for node discovery.

**Action:**
1. Extend existing DHT (`src/lib/p2p/dht.ts`) with mesh capabilities
2. Add node discovery via decentralized hash table
3. Implement node routing table management

**Current:** `src/lib/p2p/dht.ts` already exists — extend it.

### 4.2 Mesh Routing Table
Reticulum maintains routing tables for efficient message forwarding.

**Action:**
1. Create `MeshRoutingTable.ts`
2. Implement routing table with TTL-based expiration
3. Add multi-hop routing support

**Files to create:**
- `src/lib/p2p/MeshRoutingTable.ts`

### 4.3 Multi-Hop Relay
Reticulum supports multi-hop routing. Mess&Anger needs this for:
- Anonymity (hide sender/recipient)
- Mesh networking
- Bypassing firewalls/NATs

**Action:**
1. Add multi-hop relay to `P2PTransport.ts`
2. Implement path-based routing
3. Add relay node selection algorithm

**Files to modify:**
- `src/lib/p2p/P2PTransport.ts` — add multi-hop relay support
- `src/lib/p2p/MeshRouter.ts` — extend with routing table

---

## 5. Phase 4: Transport Agnostic Layer (Weeks 7-8)

### 5.1 Transport Switching
Reticulum works over any transport. Mess&Anger should support:
- WebRTC (default, low latency)
- WebSocket (fallback)
- Mesh relay (anonymity)
- Tor/SOCKS5 (maximum anonymity)

**Action:**
1. Create `TransportManager.ts` to handle transport switching
2. Implement automatic fallback based on network conditions
3. Add manual transport selection

**Files to create:**
- `src/lib/network/TransportManager.ts`

### 5.2 Automatic Mode Switching
Reticulum automatically switches between transports. Mess&Anger needs this for:
- Network failures
- Anonymity requirements
- Performance optimization

**Action:**
1. Implement network health monitoring
2. Add automatic transport switching based on:
   - Connection latency
   - Packet loss
   - Network type (WiFi, cellular, etc.)
   - Anonymity requirements

**Files to modify:**
- `src/lib/network/AnonymityLayer.ts` — extend with transport switching
- `src/lib/network/TransportManager.ts` — implement switching logic

### 5.3 Traffic Obfuscation
Reticulum provides traffic obfuscation. Mess&Anger needs this for:
- Evading censorship
- Hiding metadata
- Preventing traffic analysis

**Action:**
1. Extend `TrafficObfuscator.ts` with more obfuscation modes
2. Add traffic pattern randomization
3. Implement padding for constant-size messages

**Files to modify:**
- `src/lib/transport/obfuscator.ts` — add more obfuscation modes

---

## 6. Phase 5: Security Hardening (Weeks 9-10)

### 6.1 Replace Homegrown Crypto
Reticulum uses audited cryptography. Mess&Anger's homegrown ratchet is a vulnerability.

**Action:**
1. Replace `doubleRatchet.ts` with `@privacyresearch/libsignal-protocol-typescript`
2. Audit all cryptographic operations
3. Add cryptographic key rotation

**Files to modify:**
- `src/lib/crypto/doubleRatchet.ts` — replace implementation
- `src/lib/crypto/cryptoCore.ts` — update key management

### 6.2 At-Rest Encryption
Reticulum encrypts everything at rest. Mess&Anger currently stores messages in plaintext.

**Action:**
1. Encrypt all messages in IndexedDB
2. Implement key derivation from user password
3. Add secure key storage

**Files to modify:**
- `src/store/index.ts` — add encryption layer
- `src/lib/crypto/cryptoCore.ts` — add key derivation

### 6.3 Secure Deletion
Reticulum provides secure deletion. Mess&Anger has basic deletion.

**Action:**
1. Extend `cryptoCore.secureWipe()` to wipe all data
2. Add secure key deletion
3. Implement zeroing of sensitive memory

**Files to modify:**
- `src/lib/crypto/cryptoCore.ts` — extend secure wipe

---

## 7. Phase 6: UI/UX Integration (Weeks 11-12)

### 7.1 Connection Status Indicator
Reticulum shows network status. Mess&Anger needs this for:
- Understanding current connection mode
- Troubleshooting connectivity issues
- Showing anonymity level

**Action:**
1. Add connection status indicator to UI
2. Show current transport mode (WebRTC, Mesh, Tor)
3. Display anonymity level

**Files to modify:**
- `src/components/` — add connection status component

### 7.2 Mesh Network Visualization
Reticulum's Sideband shows mesh topology. Mess&Anger needs this for:
- Understanding network structure
- Debugging connectivity issues
- Showing mesh connectivity

**Action:**
1. Add mesh network visualization
2. Show node connections
3. Display routing information

**Files to modify:**
- `src/components/MeshRadar.tsx` — enhance visualization

### 7.3 Message Status
Reticulum shows message delivery status. Mess&Anger needs this for:
- Understanding message delivery path
- Showing delivery confirmation
- Displaying read receipts

**Action:**
1. Add message delivery status to UI
2. Show delivery path (if mesh routing used)
3. Implement read receipts with forward secrecy

**Files to modify:**
- `src/components/ChatView.tsx` — add delivery status
- `src/lib/messaging/MessageQueue.ts` — track delivery status

---

## 8. Python Integration (Backend/Testing)

### 8.1 Backend Services (Optional)
Reticulum is Python-first. Mess&Anger is frontend-only, but backend services might benefit from Python:

**Signaling Server (Python):**
```python
# signaling_server.py
import websockets
import json
import asyncio

class SignalingServer:
    def __init__(self):
        self.clients = {}  # public_key -> websocket
    
    async def handler(self, websocket, path):
        # Handle WebSocket connections
        message = await websocket.recv()
        data = json.loads(message)
        
        if data['type'] == 'register':
            self.clients[data['publicKey']] = websocket
            await websocket.send(json.dumps({'type': 'registered'}))
        
        elif data['type'] == 'offer':
            # Forward SDP offer to target
            target = data['target']
            if target in self.clients:
                await self.clients[target].send(json.dumps(data))
```

**Mesh Routing Server (Python):**
```python
# mesh_router.py
class MeshRouter:
    def __init__(self):
        self.routing_table = {}  # node_id -> {path: [...], ttl: int}
    
    def add_node(self, node_id: str, path: list[str]):
        """Add node to routing table."""
        self.routing_table[node_id] = {
            'path': path,
            'ttl': 3600  # 1 hour
        }
    
    def route_message(self, recipient: str, message: dict) -> list[str]:
        """Find path to recipient using routing table."""
        if recipient in self.routing_table:
            return self.routing_table[recipient]['path']
        return []  # No route found
```

### 8.2 Testing with Python
Use Python for mesh network simulation:

```python
# test_mesh.py
import asyncio
import sodium
from sodium import crypto

class MeshNode:
    def __init__(self, name: str):
        self.name = name
        self.keypair = sodium.crypto_box_keypair()
        self.messages = []
    
    def encrypt_message(self, recipient_key: bytes, message: str) -> dict:
        """Encrypt message for recipient."""
        nonce = sodium.crypto_box_nonce()
        ciphertext = sodium.crypto_box(
            message.encode(), nonce, recipient_key, self.keypair[1]
        )
        return {
            'recipient': recipient_key.hex(),
            'nonce': nonce.hex(),
            'ciphertext': ciphertext.hex()
        }
    
    async def receive_message(self, encrypted_msg: dict):
        """Decrypt and process incoming message."""
        nonce = bytes.fromhex(encrypted_msg['nonce'])
        ciphertext = bytes.fromhex(encrypted_msg['ciphertext'])
        
        message = sodium.crypto_box_open(
            ciphertext, nonce, bytes.fromhex(encrypted_msg['recipient']),
            self.keypair[1]
        )
        self.messages.append(message.decode())
```

---

## 9. File Structure Changes

### 9.1 New Files to Create
```
src/lib/
├── messaging/
│   ├── MessageEnvelope.ts          # LXMF-inspired message format
│   ├── MessageQueue.ts              # Store-and-forward queue
│   ├── MessageRouter.ts             # Message routing logic
│   └── ForwardSecrecy.ts            # Forward secrecy implementation
├── p2p/
│   ├── MeshRoutingTable.ts          # Mesh routing table
│   └── MultiHopRelay.ts             # Multi-hop relay support
├── network/
│   ├── TransportManager.ts          # Transport switching manager
│   └── MeshNetwork.ts              # Mesh network management
└── security/
    └── SecureStorage.ts            # Secure key storage
```

### 9.2 Files to Modify
- `src/lib/crypto/doubleRatchet.ts` — replace with Signal implementation
- `src/lib/crypto/cryptoCore.ts` — add forward secrecy support
- `src/lib/p2p/P2PTransport.ts` — add multi-hop relay
- `src/lib/p2p/dht.ts` — extend for mesh capabilities
- `src/store/index.ts` — add at-rest encryption
- `src/components/` — add mesh/network status UI components

---

## 10. Security Considerations

### 10.1 Threat Model
| Threat | Mitigation |
|--------|------------|
| Network surveillance | Tor/SOCKS5 bridge, traffic obfuscation |
| Message interception | X25519 + ML-KEM-768 (post-quantum) |
| Key compromise | Forward secrecy, key rotation |
| Metadata leakage | Metadata killswitches, TTL-based expiration |
| Node tracking | Multi-hop routing, mesh topology hiding |
| Data at rest | At-rest encryption, secure deletion |

### 10.2 Cryptographic Standards
| Algorithm | Purpose | Standard |
|-----------|---------|------------|
| X25519 | Key exchange | RFC 8446 |
| ML-KEM-768 | Post-quantum key encapsulation | NIST PQC |
| AES-GCM | Message encryption | NIST SP 804 |
| HMAC-SHA256 | Message integrity | RFC 2104 |
| PBKDF2 | Key derivation | RFC 7914 |

---

## 11. Testing Strategy

### 11.1 Unit Tests
- `src/lib/crypto/doubleRatchet.test.ts` — test ratchet implementation
- `src/lib/messaging/MessageEnvelope.test.ts` — test message format
- `src/lib/p2p/MeshRoutingTable.test.ts` — test mesh routing

### 11.2 Integration Tests
- End-to-end message delivery
- Mesh routing simulation
- Forward secrecy verification

### 11.3 Security Tests
- Cryptographic operation validation
- Key management verification
- Forward secrecy testing

---

## 12. Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| 1. Cryptographic Foundation | 2 weeks | Forward secrecy, identity management |
| 2. Message Format & Queue | 2 weeks | LXMF-style envelope, store-and-forward |
| 3. Mesh Routing | 2 weeks | DHT extension, mesh routing table |
| 4. Transport Layer | 2 weeks | Transport switching, obfuscation |
| 5. Security Hardening | 2 weeks | Replaced homegrown crypto, at-rest encryption |
| 6. UI/UX | 2 weeks | Connection status, mesh visualization |
| **Total** | **12 weeks** | **Mesh-capable, fully-secure messenger** |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Homegrown ratchet vulnerabilities | Replace with audited Signal implementation |
| Mesh routing complexity | Start with simple DHT, add complexity later |
| Performance impact of encryption | Benchmark and optimize critical paths |
| Browser limitations (IndexedDB size) | Implement message expiration, clean up old data |
| Mobile browser support | Test on iOS Safari, Chrome Android |

---

## 14. Next Steps (Immediate)

1. **Replace homegrown ratchet** — Priority 1 security fix
2. **Add forward secrecy** — Implement key derivation and deletion
3. **Create MessageEnvelope** — LXMF-inspired message format
4. **Extend DHT** — Add mesh capabilities
5. **Create TransportManager** — Transport switching logic

---

## 15. Conclusion

This plan transforms Mess&Anger from a P2P WebRTC messenger into a true mesh-capable, fully-decentralized, anonymous messaging system. By implementing Reticulum-inspired architecture without external dependencies, we maintain full control over the security model while achieving the anonymity and resilience that Reticulum provides.

**Key wins:**
- True mesh networking without external services
- Forward secrecy for message protection
- Post-quantum resistance (already implemented)
- Full anonymity with metadata killswitches
- No external dependencies — fully self-contained

**Result:** A messenger that's more secure and anonymous than Telegram, Signal, or even Reticulum's Sideband — while remaining fully compatible with modern web browsers.