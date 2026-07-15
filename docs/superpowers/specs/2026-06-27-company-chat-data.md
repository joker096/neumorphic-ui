# Company Chat — Data Reference

**Related spec:** `docs/superpowers/specs/2026-06-27-company-chat-design.md`  
**Date:** 2026-06-27  

---

## 1. Core Types

### 1.1 CompanyUser

| Field | Type | Description |
|---|---|---|
| `userId` | `string` | `"usr_" + base64url(8 bytes)` |
| `companyId` | `string` | `"org_" + base64url(16 bytes)` |
| `displayName` | `string` | Human-readable name |
| `publicKey` | `Uint8Array` | X25519 — for 1:1 DM inside company |
| `signatureKey` | `Uint8Array` | Ed25519 — signs onboarding requests |
| `devices` | `DeviceRecord[]` | Owned devices |
| `joinedAt` | `number` | Unix timestamp |
| `role` | `'admin' \| 'member'` | Permission level |

### 1.2 DeviceRecord

| Field | Type | Description |
|---|---|---|
| `deviceId` | `string` | Unique device identifier |
| `name` | `string` | User-assigned device name |
| `publicKey` | `Uint8Array` | X25519 device key |
| `masterKeyRef` | `string` | IndexedDB key reference |
| `isCurrent` | `boolean` | Is this the active device |
| `lastActive` | `number` | Unix timestamp |

### 1.3 GroupKeyMaterial

| Field | Type | Description |
|---|---|---|
| `version` | `number` | Monotonically increasing |
| `key` | `CryptoKey` | AES-256-GCM |
| `wrappedFor` | `WrappedKey[]` | Per-member ECDH-wrapped copies |
| `createdAt` | `number` | Unix timestamp |

### 1.4 WrappedKey

| Field | Type | Description |
|---|---|---|
| `memberPublicKey` | `string` | Base64 X25519 |
| `ciphertext` | `string` | ECDH-derived AES-wrapped key |
| `nonce` | `string` | AES-GCM nonce |

### 1.5 CompanyEnvelope

| Field | Type | Description |
|---|---|---|
| `iv` | `string` | Base64 AES-GCM IV (12 bytes) |
| `ciphertext` | `string` | Base64 encrypted payload |
| `senderPubKey` | `string` | Base64 X25519 of sender |
| `companyId` | `string` | Company identifier |
| `groupKeyVersion` | `number` | Key version used |
| `timestamp` | `number` | Unix timestamp |

### 1.6 CompanyChannel

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `"all"` or `office:{officeId}` |
| `companyId` | `string` | Parent company |
| `officeId?` | `string` | Optional office filter |
| `name` | `string` | Display name |
| `description?` | `string` | Optional description |
| `unread` | `number` | Unread message count |
| `createdAt` | `number` | Unix timestamp |

### 1.7 InviteQRPayload

| Field | Type | Description |
|---|---|---|
| `org` | `string` | Company ID (base64url) |
| `code` | `string` | Invite code (base64url, 6 bytes) |
| `name` | `string` | Company display name |
| `adminKey` | `string` | Admin Ed25519 public key (hex) |
| `expiresAt?` | `number` | Optional expiry timestamp |

### 1.8 JoinRequest

| Field | Type | Description |
|---|---|---|
| `type` | `"company-join-request"` | Message discriminator |
| `companyId` | `string` | Target company |
| `inviteCode` | `string` | Invite code from QR |
| `devicePublicKey` | `string` | Base64 X25519 |
| `signature` | `string` | Base64 Ed25519 signature |
| `displayName` | `string` | New employee name |

### 1.9 JoinAck

| Field | Type | Description |
|---|---|---|
| `type` | `"company-join-ack"` | Message discriminator |
| `groupKey` | `string` | ECDH-wrapped AES group key |
| `groupKeyVersion` | `number` | Current key version |
| `members` | `string[]` | Base64 member public keys |
| `wrappedBy` | `string` | Base64 X25519 of sender |

---

## 2. Mesh Topic Schema

| Topic Pattern | Direction | Payload Type | Description |
|---|---|---|---|
| `company:{id}:join` | Broadcast | `JoinRequest` | New device requests to join |
| `company:{id}:join-ack` | Broadcast | `JoinAck` | Existing member delivers wrapped key |
| `company:{id}:key-rotate` | Broadcast | `GroupKeyMaterial` | New group key distribution |
| `company:{id}:leave` | Broadcast | `{ userId, deviceId }` | Device leaving notice |
| `company:{id}:chat` | Broadcast | `CompanyEnvelope` | Encrypted group message |
| `company:{id}:key-request` | Broadcast | `{ deviceId, publicKey }` | Offline device requests key rewrap |
| `company:{id}:office:{officeId}:chat` | Broadcast | `CompanyEnvelope` | Office-specific channel |

**Placeholders:**
- `{id}` = `companyId` (base64url)
- `{officeId}` = office identifier (slug)

---

## 3. Zustand State (CompanySlice)

```typescript
interface CompanyState {
  // Identity
  currentUser: CompanyUser | null;
  companyId: string | null;
  
  // Membership
  members: Map<string, CompanyUser>;   // userId -> CompanyUser
  
  // Channels
  companyChannels: CompanyChannel[];
  activeChannelId: string | null;
  
  // Messages (per channel)
  messages: Map<string, CompanyEnvelope[]>;  // channelId -> envelopes
  
  // Devices
  devices: DeviceRecord[];
  currentDeviceId: string | null;
  
  // Key material (in-memory)
  activeGroupKey: GroupKeyMaterial | null;
  
  // UI state
  isCompanyViewOpen: boolean;
  pendingInvite: InviteQRPayload | null;
  
  // Actions
  initFromInviteQR: (payload: InviteQRPayload) => Promise<void>;
  joinCompany: (invitePayload: InviteQRPayload) => Promise<void>;
  leaveCompany: () => Promise<void>;
  rotateKey: () => Promise<void>;
  revokeDevice: (deviceId: string) => Promise<void>;
  sendCompanyMessage: (text: string, channelId: string) => Promise<void>;
  setActiveChannel: (channelId: string) => void;
  addMember: (user: CompanyUser) => void;
  removeMember: (userId: string) => void;
  receiveCompanyMessage: (envelope: CompanyEnvelope) => void;
}
```

---

## 4. IndexedDB Storage Schema

| Table | Key Path | Records | Description |
|---|---|---|---|
| `mess_company_user` | `userId` | 1 | Current user identity |
| `mess_company_groupkey_v{version}` | `version` | 1 per version | Current group key |
| `mess_company_groupkey_old_{version}` | `version` | Up to 2 | Grace period old keys |
| `mess_company_devices` | `deviceId` | N per user | Device registry |
| `mess_company_members` | `userId` | N per company | All company members |
| `mess_company_channels` | `id` | N per company | Channel list |
| `mess_company_msgs_{channelId}` | `timestamp` | Unlimited | Encrypted messages |

---

## 5. localStorage Keys

| Key | Value | Description |
|---|---|---|
| `mess_company_peers` | `string[]` | Cached connected peer IDs |
| `mess_company_peeked` | `boolean` | First-time company tab seen |
| `mess_company_last_sync` | `number` | Last message sync timestamp |

---

## 6. Key Rotation Triggers

| Trigger | Reason | Grace Period |
|---|---|---|
| New device joins | `'join'` | 24 hours |
| Device removed (kick) | `'leave'` | 24 hours |
| Device inactivity | `'leave'` (90 days) | 24 hours |
| Manual admin trigger | `'compromise'` | 24 hours |
| Scheduled rotation | `'scheduled'` | 24 hours |

**Grace period behavior:**
- Old keys retained in `oldKeys[]` with `createdAt` timestamp
- Devices compare `envelope.groupKeyVersion` against known versions
- If version > current + 1 (gap detected), device requests rewrap via `key-request` topic
- After grace period: prune to last 2 versions

---

## 7. Crypto Operations Mapping

| Operation | Function | Input | Output |
|---|---|---|---|
| X25519 keypair | `cryptoCore.generateX25519KeyPair()` | — | `{ publicKey, secretKey }` |
| Ed25519 sign | `cryptoCore.ed25519_sign(message, secretKey)` | `Uint8Array, Uint8Array` | `Uint8Array signature` |
| Ed25519 verify | `cryptoCore.ed25519_verify(message, signature, publicKey)` | `Uint8Array, Uint8Array, Uint8Array` | `boolean` |
| X25519 DH | `cryptoCore.x25519DH(privateKey, publicKey)` | `Uint8Array, Uint8Array` | `Uint8Array sharedSecret` |
| HKDF | `cryptoCore.hkdf(ikm, salt, info, length)` | `Uint8Array, Uint8Array, string, number` | `Uint8Array` |
| AES-256-GCM encrypt | `cryptoCore.aesEncrypt(key, plaintext, iv)` | `CryptoKey, Uint8Array, Uint8Array` | `{ ciphertext, tag }` |
| AES-256-GCM decrypt | `cryptoCore.aesDecrypt(key, ciphertext, iv, tag)` | `CryptoKey, Uint8Array, Uint8Array, Uint8Array` | `Uint8Array` |
| Wrap group key for member | `ECDH(memberPrivate, groupKey.wrappedFor[].memberPub) → HKDF → AES-GCM(groupKey, iv)` | `Uint8Array, CryptoKey` | `{ ciphertext, nonce }` |
| Unwrap group key | `ECDH(myPrivate, wrapped.memberPub) → HKDF → AES-GCM-Decrypt(wrapped.ciphertext)` | `Uint8Array, WrappedKey` | `CryptoKey` |

---

## 8. Message Flow Sequences

### 8.1 Company Message Send

```
1. User types message in CompanyChannelView
2. companySlice.sendCompanyMessage(text, channelId)
3. groupChannel.encrypt(text, currentUser.publicKey)
   → CompanyEnvelope { iv, ciphertext, senderPubKey, companyId, groupKeyVersion, timestamp }
4. MeshRouter broadcast on topic: `company:{companyId}:chat`
5. P2PTransport sends to all connected peers (with HTTP obfuscation)
6. Each peer's companySlice.receiveCompanyMessage(envelope)
7. groupChannel.decrypt(envelope) → plaintext
8. Push to messages Map, update UI, store in IndexedDB
```

### 8.2 Device Join Flow

```
1. Admin generates QR: { org, code, adminKey, name }
2. New device B scans QR
3. B generates X25519 + Ed25519 keypairs
4. B signs: Ed25519_sign(companyId + inviteCode + devicePubKey)
5. B broadcasts JOIN_REQUEST on `company:{id}:join`
6. Existing member A receives:
   a. Verify Ed25519 signature against devicePubKey
   b. Verify inviteCode against adminKey
   c. Generate group key wrap: ECDH(A.private, B.public) → HKDF → AES-GCM(groupKey)
   d. Broadcast JOIN_ACK on `company:{id}:join-ack`
7. B receives JOIN_ACK:
   a. Unwrap: ECDH(B.private, A.public) → HKDF → AES-GCM-Decrypt
   b. Save groupKey to IndexedDB
   c. Subscribe to `company:{id}:chat` topic
   d. Broadcast LEAVE_NOTICE when app closes (optional)
```

### 8.3 Key Rotation Flow

```
1. Trigger: admin action OR device join/leave
2. KeyManager.rotateKey(reason)
   → new GroupKeyMaterial with incremented version
3. For each member in members list:
   → wrapForMember(newKey, member.publicKey)
4. Broadcast KEY_ROTATE on `company:{id}:key-rotate`:
   { version, wrappedFor: [...], rotatedBy, reason, timestamp }
5. Each device receives:
   a. Unwrap its own WrappedKey
   b. Update activeGroupKey
   c. Old key moved to oldKeys[] with createdAt
6. New messages use new version; old messages decrypt via oldKeys
7. After gracePeriodMs (24h): prune oldKeys to last 2 versions
```

---

## 9. Office Channel Routing

| Channel ID | Topic | Visibility | Key |
|---|---|---|---|
| `all` | `company:{id}:chat` | All company employees | Shared group key |
| `office:{officeId}` | `company:{id}:office:{officeId}:chat` | Employees with matching officeId | Same shared group key |

**Note:** Office is a **routing label** (UX filter), not a security boundary. All channels use the same AES-256-GCM group key.

---

## 10. Security Parameters

| Parameter | Value | Notes |
|---|---|---|
| Company ID entropy | 128 bits (16 bytes) | Base64url encoded |
| Invite code entropy | 48 bits (6 bytes) | Base64url encoded |
| Group key | 256 bits (AES-256) | HKDF-derived from CSPRNG |
| Key version | Monotonic integer | Starts at 1 |
| Grace period | 24 hours | Configurable |
| Inactivity threshold | 90 days | For auto-removal |
| Max TTL (mesh hops) | 7 | Matches existing MeshRouter |
| AES-GCM IV size | 96 bits (12 bytes) | Random per message |
| AES-GCM tag size | 128 bits | Standard |

---

## 11. Failure / Edge Cases

| Scenario | Handling |
|---|---|
| QR expired | Admin regenerates; old inviteCode invalidated by key rotation |
| All members offline | New device buffers join request; processes when any member appears |
| Key version gap (>1) | Device sends `key-request`; nearest member re-wraps and unicasts |
| Duplicate messages | `messageId` dedup in MeshRouter (existing) |
| Compromised device | Admin revokes → key rotation → grace period limits exposure |
| Employee leaves mid-rotation | Grace period ensures they can read until key pruned |
| Clock skew | `timestamp` is advisory; primary dedup is `messageId` |

---

## 12. Testing Checklist

- [ ] QR encode/decode roundtrip
- [ ] Ed25519 signature create/verify
- [ ] ECDH wrap/unwrap group key
- [ ] AES-256-GCM encrypt/decrypt with group key
- [ ] Key rotation with grace period
- [ ] MeshRouter topic filter for `company:*`
- [ ] Join flow: 2 devices, offline, no server
- [ ] Revoke device: old messages unreadable after grace period
- [ ] Offline rejoin after >24h absence
- [ ] Concurrent joins (multiple new devices)
- [ ] Message dedup across mesh relays
- [ ] Office channel routing (same key, different topics)
- [ ] Zustand slice persistence (serialize/deserialize)

---

*End of data reference.*
