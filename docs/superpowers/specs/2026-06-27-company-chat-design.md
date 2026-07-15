# Company Chat — Design Specification

**Version:** 1.0  
**Date:** 2026-06-27  
**Target scale:** 5–50 people, 1–3 offices  
**Offline requirement:** LAN mesh works without Internet; government-level censorship resilient  

---

## 1. Problem Statement

In a company with 5–50 employees across 1–3 offices, teams need to communicate privately within their company boundary. Requirements:

- Employees of **Company A** see **only** other Company A employees in private chats
- Employees of **Company B** see **only** other Company B employees
- Internets cutoff (government blocking) must not prevent intra-office communication
- Joining the company network is possible **offline** — no server required for first onboarding
- Admin retains ability to revoke access when employee leaves

---

## 2. Architecture Decision: Option A (Shared Secret / QR Invite)

**Why A over B (BLE proximity)?**

| Criterion | A — QR/Secret | B — BLE Proximity |
|---|---|---|
| Multi-city support | ✅ Works globally | ❌ Requires physical presence |
| Remote/hybrid workers | ✅ Included | ❌ Excluded |
| Battery | ✅ Minimal drain | ❌ Constant BLE scan drains battery |
| Admin management | ✅ Remote revoke + rotate | ❌ Cannot revoke remotely |
| SIM swap / routing attack surface | Low (offline QR exchange) | Higher (RF fingerprinting possible) |

**Chosen approach:** QR contains companyId + inviteCode + admin Ed25519 signature. No server needed for first join.

---

## 3. System Overview

```
┌─────────────────────────────────────────────────────┐
│                  Company Mesh Layer                  │
│                                                     │
│  ┌──────────────┐    ┌──────────────┐              │
│  │  QR Invite   │───▶│  Provisioning │              │
│  │  (offline)   │    │  Protocol    │              │
│  └──────────────┘    └──────┬───────┘              │
│                             │                       │
│  ┌──────────────┐    ┌──────▼───────┐              │
│  │ CompanyGroup │◀───│  Key Manager │              │
│  │  Channel     │    │  (AES-256)   │              │
│  └──────┬───────┘    └──────────────┘              │
│         │                                           │
│  ┌──────▼──────────────────────────┐               │
│  │          MeshRouter             │               │
│  │  (existing, reuse as-is)       │               │
│  └──────┬──────────────────────────┘               │
│         │ broadcast on topic: `company:{companyId}`│
│  ┌──────▼───────────────────────────────────────┐  │
│  │         P2PTransport (existing)              │  │
│  │  HTTP-obfuscated WebRTC / LAN direct         │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 4. New Files to Create

```
src/lib/company/
  types.ts                    # All company-domain interfaces
  companyUser.ts              # CompanyUser CRUD + storage
  deviceRegistry.ts           # DeviceRecord per user
  onboarding/
    adminKey.ts               # Admin signing + verification
    inviteQR.ts               # QR encode/decode
    joinFlow.ts               # Full join protocol
  groupChannel/
    keyManager.ts             # Group key lifecycle (create/rotate/wrap/unwrap)
    groupChannel.ts           # encrypt/decrypt/broadcast API
    groupMessage.ts           # Envelope: {iv, ciphertext, senderPubKey, version}
  officeRouting.ts            # office:{id} topic helpers

src/components/CompanyChat/
  CompanyChatOverlay.tsx      # Company chat overlay on top of existing ChatPreviewLayer
  CompanyChannelView.tsx      # Company-wide broadcast chat view
  OfficeChannelView.tsx       # Per-office channel view
  CompanyContactsView.tsx     # Colleagues list filtered by company
  JoinByQrModal.tsx           # Camera QR scanner + join flow UI
  CompanySettingsView.tsx     # Admin: members, key rotation, revoke
  CreateCompanyWizard.tsx     # First-time company creation

src/store/companySlice.ts     # Zustand slice: companyId, currentMember, channels, members
```

---

## 5. Modified Files

| File | Change |
|---|---|
| `src/store/index.ts` | Add `companySlice` merge |
| `src/App.tsx` | Wire companySlice into app; add CompanyChatOverlay |
| `src/components/ChatPreviewLayer.tsx` | Add company tab + company context menu |
| `src/lib/p2p/MeshRouter.ts` | Add topic filter `company:{id}` broadcast |
| `src/lib/network/network.ts` | Register company message handler |
| `src/lib/crypto/MessageEncryptionService.ts` | Add `encryptForGroup` / `decryptFromGroup` |
| `src/constants/storage.ts` | Add STORAGE_KEYS for company data |

---

## 6. Detailed Specifications

### 6.1 CompanyUser (types.ts)

```typescript
export interface CompanyUser {
  userId: string;              // "usr_b64(8)"
  companyId: string;           // "org_b64(16)"
  displayName: string;
  publicKey: Uint8Array;       // X25519 — for 1:1 DM inside company
  signatureKey: Uint8Array;    // Ed25519 — signs onboarding requests
  devices: DeviceRecord[];
  joinedAt: number;
  role: 'admin' | 'member';
}

export interface DeviceRecord {
  deviceId: string;
  name: string;
  publicKey: Uint8Array;       // X25519 device key
  masterKeyRef: string;        // IndexedDB key reference
  isCurrent: boolean;
  lastActive: number;
}
```

---

### 6.2 Onboarding Protocol (offline, no server)

**Step 1 — QR Generation (Admin, one-time):**

```
admin generates:
  companyId  = 16 random bytes (base64url)
  inviteCode = 6 random bytes (base64url)
  adminPub   = Ed25519 public key (hex)
  expiresAt  = optional Unix timestamp

payload = { org: companyId, code: inviteCode, name: "Acme Corp", adminKey: adminPub }
QR encode payload → admin prints on sticker / shares in any channel

admin also stores: { companyId, inviteCode, adminSecret, groupKey (AES-256) }
```

**Step 2 — Join (New Employee Device B):**

```
1. B scans QR → extracts { org, code, adminKey, name }
2. B generates: { deviceId, x25519KeyPair, ed25519KeyPair }
3. B signs onboarding request: sign(ed25519, { org, code, devicePubKey })
4. B broadcasts on mesh topic: `company:{org}:join`:
   {
     type: "company-join-request",
     companyId,
     inviteCode,
     devicePublicKey: base64(x25519Public),
     signature: base64(Ed25519 signature),
     displayName: "..."
   }
5. Existing member A receives request:
   a. verifyEd25519(payload, signature, devicePublicKey) — confirms integrity
   b. verifyInviteCode(companyId, inviteCode, adminPub) — confirms valid invite
   c. If valid: A generates groupKeyWrapped = encryptAES(groupKey, devicePublicKey)
   d. A broadcasts on `company:{org}:join-ack`:
      {
        type: "company-join-ack",
        groupKey: encryptAES(groupKey, B.x25519Public),  // only B can decrypt
        groupKeyVersion: currentVersion,
        members: [list of member pubkeys],
        wrappedBy: A.publicKey
      }
6. B receives ack, decrypts groupKey with own x25519Private, saves to IndexedDB
7. B now has groupKey → can encrypt/decrypt all company messages
```

**Security note:** `encryptAES(groupKey, devicePublicKey)` = ECDH(devicePrivate, devicePublic) → HKDF key → AES-256-GCM encrypt. Reuses existing `cryptoCore.x25519DH()`.

---

### 6.3 Group Key Management (groupChannel/keyManager.ts)

```typescript
export interface GroupKeyMaterial {
  version: number;              // monotonically increasing
  key: CryptoKey;               // AES-256-GCM
  wrappedFor: WrappedKey[];     // per-member ECDH-wrapped copies
  createdAt: number;
}

export interface WrappedKey {
  memberPublicKey: string;      // base64 X25519
  ciphertext: string;           // ECDH-derived AES-wrapped key
  nonce: string;                // AES-GCM nonce
}

export class GroupKeyManager {
  // Group key lifecycle
  createGroupKey(): GroupKeyMaterial;
  wrapForMember(key: CryptoKey, memberPub: Uint8Array): WrappedKey;
  rotateKey(reason: 'join' | 'leave' | 'compromise' | 'scheduled'): GroupKeyMaterial;
  decryptWrappedKey(wrapped: WrappedKey, myPrivate: Uint8Array): CryptoKey;
 
  // Grace period: keep old keys for X hours
  gracePeriodMs = 24 * 60 * 60 * 1000;
  oldKeys: GroupKeyMaterial[] = [];  // kept during grace period
}
```

**Key rotation triggers:**
- New device joins company → rotate
- Device removed (explicit kick OR 90-day inactivity) → rotate
- Admin triggers manual rotation → rotate
- `groupKeyVersion` advanced in message envelope; old versions decrypted via `oldKeys[]`

**Grace period behavior:**
```
on rotate:
  1. new GMK created, wrapped for all current members
  2. old GMK pushed to oldKeys[] with createdAt timestamp
  3. old messages still decryptable via oldKeys
  4. After gracePeriodMs: oldKeys pruned to last 2 versions
  5. Offline employees returning after >24h: request key re-wrap from any online colleague
```

---

### 6.4 Group Channel Encryption (groupChannel/groupChannel.ts)

```typescript
export interface CompanyEnvelope {
  iv: string;                   // base64 AES-GCM IV
  ciphertext: string;           // base64 encrypted payload
  senderPubKey: string;         // base64 X25519 of sender
  companyId: string;
  groupKeyVersion: number;
  timestamp: number;
}
```

**Encrypt flow:**
```
groupChannel.encrypt(plaintext, sender):
  1. encode = JSON.stringify({ text: plaintext, sender: b64(senderPub) })
  2. iv = crypto.getRandomValues(new Uint8Array(12))
  3. ciphertext = AES-GCM(groupKey, iv, encode)
  4. return { iv: b64(iv), ciphertext: b64(ciphertext), senderPubKey: b64(senderPub), companyId, groupKeyVersion: keyManager.version, timestamp: Date.now() }
```

**Decrypt flow:**
```
groupChannel.decrypt(envelope):
  1. Find key matching envelope.groupKeyVersion:
     - try current groupKey
     - try oldKeys in reverse order (newest first)
  2. plaintext = AES-GCM-Decrypt(key, envelope.iv, envelope.ciphertext)
  3. return JSON.parse(plaintext)
  4. If no key matches: return null (message unreadable, log warning)
```

---

### 6.5 Mesh Topic Schema

| Topic | Direction | Payload |
|---|---|---|
| `company:{id}:join` | → all peers | JOIN_REQUEST |
| `company:{id}:join-ack` | → specific peer | JOIN_ACK (wrapped key) |
| `company:{id}:key-rotate` | → all peers | NEW_KEY_MATERIAL |
| `company:{id}:leave` | → all peers | LEAVE_NOTICE |
| `company:{id}:chat` | → all peers | CompanyEnvelope |
| `company:{id}:key-request` | → all peers | REQUEST_REWRAP (offline rejoin) |

Reuses `MeshRouter` existing mechanisms:
- `MeshRouter.handleForward()` already supports relay
- `MeshRouter.addForwardCallback()` registers handler for topic messages
- TTL-based store-and-forward keeps messages during disconnect

---

### 6.6 Intra-Office Channels (zones)

```typescript
// Topics encode both company and optional office filter
const TOPIC_ALL = `company:${companyId}:chat`;           // whole company
const TOPIC_OFFICE = (officeId: string) => `company:${companyId}:office:${officeId}:chat`;

// Messages on TOPIC_OFFICE are encrypted with SAME group key
// (no separate key — office is a routing label, not a security boundary)
// Members self-select which office channel they listen to
```

**Why same key?** 50 people, 3 offices — separate keys per office = 3x key-management complexity. Security model is company-level; office is UX routing.

---

### 6.7 Zustand Slice (store/companySlice.ts)

```typescript
export interface CompanyState {
  // Identity
  currentUser: CompanyUser | null;
  companyId: string | null;
  
  // Membership
  members: Map<string, CompanyUser>;          // userId -> CompanyUser
  
  // Channels
  companyChannels: CompanyChannel[];          // [{id: 'all', officeId?: string, name, unread}]
  activeChannelId: string | null;
  
  // Company messages (per-channel)
  messages: Map<string, CompanyEnvelope[]>;   // channelId -> envelopes
  
  // Device registry
  devices: DeviceRecord[];
  currentDeviceId: string | null;
  
  // Key material (in-memory only, persisted as wrapped keys in IndexedDB)
  activeGroupKey: GroupKeyMaterial | null;
  
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
}
```

---

## 7. Crypto Reference (reuses existing)

| Operation | Location | Reuse |
|---|---|---|
| X25519 keypair | `src/lib/crypto/cryptoCore.ts` `generateX25519KeyPair()` | Direct |
| Ed25519 sign/verify | `src/lib/crypto/cryptoCore.ts` `ed25519_sign/verify` | Direct |
| X25519 DH | `src/lib/crypto/cryptoCore.ts` `x25519DH()` | Direct |
| HKDF | `src/lib/crypto/cryptoCore.ts` `hkdf()` | Direct |
| AES-256-GCM | `src/lib/crypto/cryptoCore.ts` `aesEncrypt/decrypt()` | Direct |
| Double Ratchet (1:1 DM) | `src/lib/crypto/doubleRatchet.ts` | Reuse as-is for peer DMs |
| MessageEncryptionService | `src/lib/crypto/MessageEncryptionService.ts` | Will add `encryptForGroup/decryptFromGroup` |

---

## 8. Storage (IndexedDB / localStorage)

| Data | Storage | Key |
|---|---|---|
| CompanyUser current | IndexedDB | `mess_company_user` |
| GroupKeyMaterial current | IndexedDB | `mess_company_groupkey_v{version}` |
| Wrapped old keys | IndexedDB | `mess_company_groupkey_old_{version}` |
| Device registry | IndexedDB | `mess_company_devices` |
| Members list | IndexedDB | `mess_company_members` |
| Channels list | IndexedDB | `mess_company_channels` |
| Messages (encrypted) | IndexedDB | `mess_company_msgs_{channelId}` |
| Connected peers cache | localStorage | `mess_company_peers` |

---

## 9. UI Overview

```
┌─────────────────────────────────────────────────┐
│  ChatPreviewLayer (existing)                     │
│  ┌─────────┐ ┌─────────┐ ┌───────────────────┐ │
│  │ Chats   │ │Groups  │ │ Company           │ │ ← new tab
│  │         │ │        │ │ ┌────────────────┐ │ │
│  │         │ │        │ │ │ #all-company   │ │ │
│  │         │ │        │ │ │ #office-moscow │ │ │
│  │         │ │        │ │ │ #office-london │ │ │
│  │         │ │        │ │ └────────────────┘ │ │
│  └─────────┘ └─────────┘ └───────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  CompanyChannelView (when #all-company selected) │
│  ┌─────────────────────────────────────────────┐ │
│  │ Header: "Acme Corp · all employees"        │ │
│  │ [Members: 12] [Settings (admin only)]      │ │
│  ├─────────────────────────────────────────────┤ │
│  │ Messages (encrypted group broadcast)        │ │
│  │                                             │ │
│  │ ┌────────────────────┐                     │ │
│  │ │ 👤 Alice · 10:32   │                     │ │
│  │ │ Meeting at 3pm     │                     │ │
│  │ └────────────────────┘                     │ │
│  │                                             │ │
│  │ ┌────────────────────┐                     │ │
│  │ │ 👤 Bob · 10:33     │                     │ │
│  │ │ Server migration   │                     │ │
│  │ │ done ✅            │                     │ │
│  │ └────────────────────┘                     │ │
│  ├─────────────────────────────────────────────┤ │
│  │ [Type a message...]              [Send]     │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 10. Offline Resilience

| Scenario | Behavior |
|---|---|
| No Internet, same office | LAN WebRTC direct or BLE-like local broadcast; MeshRouter store-and-forward bridges gaps |
| No Internet, different offices | Devices buffer messages; on reconnection, sync via MeshRouter with dedup + TTL |
| Mesh partially connected | Messages propagate through longest-connected peer; TTL=7 hops |
| Admin offline, key rotation needed | Any existing member can trigger rotation once threshold (e.g., 2 of 3 admins) is met via local consensus — multi-sig on group key change |
| QR lost / phone dead | Admin regenerates QR with new inviteCode; old code invalidated by incrementing `groupKeyVersion` and broadcasting key-rotate |

---

## 11. Security Considerations

| Threat | Mitigation |
|---|---|
| QR interception by non-employee | Without `adminKey` signature verification, wrapped group key unusable; attacker cannot derive group key |
| Device stolen | Admin revokes deviceId; key rotation triggered; old key grace period 24h limits exposure window |
| Employee leaves | Admin revokes device; key rotated; employee's copies of old key expire after grace period |
| Mesh MITM | All company messages encrypted AES-256-GCM; transport obfuscation (existing HTTP-mask mode) masks metadata |
| Replay attacks | `timestamp` + `senderPubKey` + `groupKeyVersion` in every envelope; dedup via `messageId` |
| Offline device stale key | Device detects version mismatch on reconnect; requests key-rewrap via `company:{id}:key-request` topic |

---

## 12. Implementation Phases

| Phase | Scope | Est. effort |
|---|---|---|
| **P1 — Core data layer** | types.ts, companySlice, IndexedDB storage, MeshRouter topic hooks | 2–3 days |
| **P2 — Onboarding** | QR generation/scan, join protocol, admin key verification | 2–3 days |
| **P3 — Group channel** | KeyManager, GroupChannel encrypt/decrypt, MeshRouter integration | 3–4 days |
| **P4 — UI** | CompanyChatOverlay, channel views, contacts view, QR modal | 3–4 days |
| **P5 — Hardening** | Key rotation, revoke, grace period, edge cases | 2–3 days |
| **P6 — Office zones** | Per-office topics, routing, UI tabs | 1–2 days |

**Total:** ~13–19 days for a single developer.

---

*End of specification.*
