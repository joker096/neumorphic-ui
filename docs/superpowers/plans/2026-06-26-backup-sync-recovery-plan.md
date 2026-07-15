# Backup, Sync & Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Self-sovereign identity with encrypted backup, TOTP 2FA, device pairing, and P2P multi-device sync.

**Architecture:** Master seed (256-bit) generates all keys via HKDF. Backup file is binary `.mabak` with PBKDF2 + AES-256-GCM + optional TOTP. Devices pair via QR code over signaling server, then sync state over P2P WebRTC mesh.

**Tech Stack:** tweetnacl (X25519, Ed25519), Web Crypto API (AES-GCM, PBKDF2, HKDF, SHA-256), otpauth (TOTP), existing P2PNetwork/MeshRouter, QRCode/qrcode libraries, Zustand store.

---

### Phase 1: Identity & Keys

#### Task 1.1: Define master seed storage and key derivation

**Files:**
- Create: `src/lib/identity/masterKey.ts`
- Create: `src/lib/identity/index.ts`
- Modify: `src/lib/deviceSecurity.ts`
- Test: `src/lib/identity/masterKey.test.ts`

- [ ] **Step 1: Write masterKey.ts**

```typescript
// src/lib/identity/masterKey.ts
const SEED_LENGTH = 32; // 256 bits

export interface MasterKeySet {
  seed: Uint8Array;       // 32 bytes entropy
  aesKey: CryptoKey;      // AES-256-GCM (existing)
  x25519Secret: Uint8Array;
  x25519Public: Uint8Array;
  ed25519Secret: Uint8Array;
  ed25519Public: Uint8Array;
}

export async function generateMasterSeed(): Promise<Uint8Array> {
  const seed = crypto.getRandomValues(new Uint8Array(SEED_LENGTH));
  return seed;
}

export async function deriveKeysFromSeed(seed: Uint8Array): Promise<MasterKeySet> {
  // HKDF-SHA256 expand: seed -> 32+32+32+32 = 128 bytes
  const info = new TextEncoder().encode('mess-anger-master-keys');
  const keyMaterial = await crypto.subtle.importKey('raw', seed, 'HKDF', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt: new Uint8Array(32), info, hash: 'SHA-256' },
    keyMaterial, 256 * 4 // 4 keys x 256 bits
  );
  const dv = new Uint8Array(derived);
  const x25519Secret = dv.slice(0, 32);
  const x25519Public = new Uint8Array(32); // compute via nacl
  const ed25519Secret = dv.slice(32, 64);
  const ed25519Public = new Uint8Array(32);
  const aesRawKey = dv.slice(64, 96);

  // Compute public keys from secret keys
  // X25519
  const kp = nacl.box.keyPair.fromSecretKey(x25519Secret);
  x25519Public.set(kp.publicKey);
  // Ed25519
  const signKp = nacl.sign.keyPair.fromSecretKey(ed25519Secret);
  ed25519Public.set(signKp.publicKey);

  const aesKey = await crypto.subtle.importKey('raw', aesRawKey, 'AES-GCM', true, ['encrypt', 'decrypt']);

  return { seed, aesKey, x25519Secret, x25519Public, ed25519Secret, ed25519Public };
}
```

- [ ] **Step 2: Write the failing test**

```typescript
// src/lib/identity/masterKey.test.ts
import { describe, it, expect } from 'vitest';
import { generateMasterSeed, deriveKeysFromSeed } from './masterKey';
import nacl from 'tweetnacl';

describe('masterKey', () => {
  it('generates 32-byte seed', async () => {
    const seed = await generateMasterSeed();
    expect(seed.length).toBe(32);
  });

  it('derives consistent keys from same seed', async () => {
    const seed = new Uint8Array(32).fill(42);
    const set1 = await deriveKeysFromSeed(seed);
    const set2 = await deriveKeysFromSeed(seed);
    expect(set1.x25519Secret).toEqual(set2.x25519Secret);
    expect(set1.x25519Public).toEqual(set2.x25519Public);
    expect(set1.ed25519Public).toEqual(set2.ed25519Public);
  });

  it('generates valid X25519 keypair', async () => {
    const seed = await generateMasterSeed();
    const set = await deriveKeysFromSeed(seed);
    const testKp = nacl.box.keyPair.fromSecretKey(set.x25519Secret);
    expect(testKp.publicKey).toEqual(set.x25519Public);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/identity/masterKey.test.ts`
Expected: FAIL (file not found)

- [ ] **Step 4: Implement and run tests to pass**

After implementing, run: `npx vitest run src/lib/identity/masterKey.test.ts`
Expected: PASS

- [ ] **Step 5: Update deviceSecurity.ts to store seed instead of just AES key**

Modify `deviceSecurity.ts`:
- Add `initMasterSeed()` — generates seed, derives all keys, stores seed encrypted in IndexedDB
- Add `getMasterKeySet()` — loads seed from IDB, derives keys, caches
- Keep backward compat with existing `initSessionMasterKey()`
- Store key in IndexedDB as `mess_master_seed` (encrypted with device-bound key)

- [ ] **Step 6: Create identity/index.ts barrel export**

```typescript
export { generateMasterSeed, deriveKeysFromSeed } from './masterKey';
export type { MasterKeySet } from './masterKey';
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/identity/ src/lib/deviceSecurity.ts
git commit -m "feat: add master seed key derivation with X25519 + Ed25519"
```

---

#### Task 1.2: Expand mnemonic to 24-word BIP39

**Files:**
- Modify: `src/lib/recovery/RecoveryManager.ts`
- Modify: `src/lib/recovery/MnemonicGenerator.ts`
- Test: `src/lib/recovery/RecoveryManager.test.ts`

- [ ] **Step 1: Update MnemonicGenerator to use standard BIP39 wordlist**

Replace the 1024-word custom list with full 2048-word BIP39 English wordlist. Generate mnemonic from 32 bytes of entropy (24 words) instead of 16 bytes (10 words). Keep existing encode/decode structure.

```typescript
// MnemonicGenerator.ts key changes
const BIP39_WORDS: string[] = [ /* all 2048 BIP39 words */ ];

export function generateMnemonic(entropy: Uint8Array): string {
  if (entropy.length !== 32) throw new Error('entropy must be 32 bytes');
  // Standard BIP39: entropy + SHA256(entropy)[0..firstByte] -> 11-bit indices -> words
  const checksum = sha256(entropy);
  const bits = bytesToBits(entropy) + bitsToStr(checksum).slice(0, entropy.length / 4);
  const indices = chunkBits(bits, 11);
  return indices.map(i => BIP39_WORDS[i]).join(' ');
}

export function mnemonicToEntropy(phrase: string): Uint8Array {
  const words = phrase.split(' ');
  const bits = words.map(w => BIP39_WORDS.indexOf(w).toString(2).padStart(11, '0')).join('');
  const entropyBits = bits.slice(0, 256);
  const checksumBits = bits.slice(256);
  const entropy = bitsToBytes(entropyBits);
  const checksum = sha256(entropy);
  const expectedChecksum = bitsToStr(checksum).slice(0, 8);
  if (checksumBits !== expectedChecksum) throw new Error('Invalid checksum');
  return entropy;
}
```

- [ ] **Step 2: Update RecoveryManager**

`generateRecoveryPhrase()` now:
1. Returns 24-word BIP39 mnemonic from the master seed (32 bytes)
2. Stores SHA-256 hash of mnemonic in localStorage for verification
3. `restoreFromPhrase(phrase)` now:
   1. Converts mnemonic → 32-byte entropy = master seed
   2. Calls `deriveKeysFromSeed(seed)` to get full key set
   3. Calls `deviceSecurity.storeMasterSeed(seed)` to persist
   4. Returns the derived key set

- [ ] **Step 3: Write and run tests**

```typescript
describe('RecoveryManager', () => {
  it('generates 24-word mnemonic from seed', async () => {
    const seed = new Uint8Array(32).fill(1);
    const phrase = generateMnemonic(seed);
    expect(phrase.split(' ').length).toBe(24);
    const recovered = mnemonicToEntropy(phrase);
    expect(recovered).toEqual(seed);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/recovery/
git commit -m "feat: upgrade mnemonic to 24-word BIP39 encoding master seed"
```

---

#### Task 1.3: Device key management

**Files:**
- Create: `src/lib/identity/deviceKeys.ts`
- Test: `src/lib/identity/deviceKeys.test.ts`

- [ ] **Step 1: Write deviceKeys.ts**

```typescript
import nacl from 'tweetnacl';
import { MasterKeySet } from './masterKey';

export interface DeviceKeyPair {
  deviceId: string;      // 'device-' + base64(x25519Public)
  name: string;
  x25519Secret: Uint8Array;
  x25519Public: Uint8Array;
  signature: Uint8Array; // Ed25519 signature of x25519Public by master key
  createdAt: string;     // ISO8601
}

export function generateDeviceKeyPair(master: MasterKeySet, name: string): DeviceKeyPair {
  const kp = nacl.box.keyPair();
  // Sign the device's X25519 public key with the master Ed25519 key
  const signature = nacl.sign.detached(kp.publicKey, master.ed25519Secret);
  return {
    deviceId: 'device-' + bytesToBase64(kp.publicKey),
    name,
    x25519Secret: kp.secretKey,
    x25519Public: kp.publicKey,
    signature,
    createdAt: new Date().toISOString(),
  };
}

export function verifyDeviceKey(
  device: DeviceKeyPair,
  masterEd25519Public: Uint8Array
): boolean {
  return nacl.sign.detached.verify(device.x25519Public, device.signature, masterEd25519Public);
}
```

Helper `bytesToBase64` goes in a shared util or inline.

- [ ] **Step 2: Write tests and pass**

```typescript
it('generates verifiable device key', async () => {
  const seed = new Uint8Array(32).fill(1);
  const master = await deriveKeysFromSeed(seed);
  const device = generateDeviceKeyPair(master, 'My Phone');
  expect(verifyDeviceKey(device, master.ed25519Public)).toBe(true);
});

it('rejects tampered device key', () => {
  device.x25519Public[0] ^= 0xff; // corrupt
  expect(verifyDeviceKey(device, master.ed25519Public)).toBe(false);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/identity/deviceKeys.ts
git commit -m "feat: device key generation and verification"
```

---

### Phase 2: Backup Format

#### Task 2.1: Backup crypto primitives

**Files:**
- Create: `src/lib/backup/backupCrypto.ts`
- Test: `src/lib/backup/backupCrypto.test.ts`

- [ ] **Step 1: Write backupCrypto.ts**

```typescript
export const PBKDF2_ITERATIONS = 600000;
export const SALT_LENGTH = 32;
export const IV_LENGTH = 12;

export interface BackupEncryptionParams {
  salt: Uint8Array;
  iv: Uint8Array;
  password: string;
  totpCode?: string;
}

export async function deriveBackupKey(params: BackupEncryptionParams): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseSalt = params.salt;
  const baseKey = await pbkdf2(enc.encode(params.password), baseSalt, 256);

  if (params.totpCode) {
    const totpSalt = params.salt; // same salt, different context via HKDF
    const totpKey = await pbkdf2(enc.encode(params.password + params.totpCode), totpSalt, 256);
    const combined = new Uint8Array(64);
    combined.set(new Uint8Array(await crypto.subtle.exportKey('raw', baseKey)), 0);
    combined.set(new Uint8Array(await crypto.subtle.exportKey('raw', totpKey)), 32);
    const finalHash = await crypto.subtle.digest('SHA-256', combined);
    return crypto.subtle.importKey('raw', new Uint8Array(finalHash), 'AES-GCM', false, ['encrypt', 'decrypt']);
  }

  return baseKey;
}

async function pbkdf2(password: Uint8Array, salt: Uint8Array, length: number): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', password, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length },
    true, ['encrypt', 'decrypt']
  );
}

export async function encryptBackupPayload(
  plaintext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return new Uint8Array(encrypted);
}

export async function decryptBackupPayload(
  ciphertext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(decrypted);
}
```

- [ ] **Step 2: Write tests and pass**

```typescript
it('encrypts and decrypts with password', async () => {
  const params: BackupEncryptionParams = { salt: crypto.getRandomValues(new Uint8Array(32)), iv: crypto.getRandomValues(new Uint8Array(12)), password: 'test123' };
  const key = await deriveBackupKey(params);
  const data = new TextEncoder().encode('secret data');
  const encrypted = await encryptBackupPayload(data, key, params.iv);
  const decrypted = await decryptBackupPayload(encrypted, key, params.iv);
  expect(new TextDecoder().decode(decrypted)).toBe('secret data');
});

it('produces different keys with and without TOTP', async () => {
  const params = { salt: new Uint8Array(32), iv: new Uint8Array(12), password: 'test' };
  const key1 = await deriveBackupKey(params);
  const key2 = await deriveBackupKey({ ...params, totpCode: '123456' });
  const raw1 = new Uint8Array(await crypto.subtle.exportKey('raw', key1));
  const raw2 = new Uint8Array(await crypto.subtle.exportKey('raw', key2));
  expect(raw1).not.toEqual(raw2);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/backup/backupCrypto.ts
git commit -m "feat: backup crypto primitives with PBKDF2 + AES-GCM + TOTP"
```

---

#### Task 2.2: Backup binary format (.mabak)

**Files:**
- Create: `src/lib/backup/backupFormat.ts`
- Test: `src/lib/backup/backupFormat.test.ts`

- [ ] **Step 1: Write backupFormat.ts**

```typescript
const MAGIC = new Uint8Array([0x4D, 0x41, 0x42, 0x41, 0x4B, 0x00]); // "MABAK\0"
const VERSION = 1;

export interface MabakHeader {
  version: number;
  hasTotp: boolean;
  salt: Uint8Array;  // 32
  iv: Uint8Array;    // 12
}

export interface MabakFile {
  header: MabakHeader;
  payload: Uint8Array;  // encrypted
  hmac: Uint8Array;     // 32
}

export function encodeMabak(encryptedPayload: Uint8Array, salt: Uint8Array, iv: Uint8Array, hmac: Uint8Array): Uint8Array {
  const header = new Uint8Array(6 + 1 + 1 + 32 + 12);
  let offset = 0;
  header.set(MAGIC, offset); offset += 6;
  header[offset++] = VERSION;
  header[offset++] = 0; // flags (hasTotp = bit0)
  header.set(salt, offset); offset += 32;
  header.set(iv, offset); offset += 12;
  const result = new Uint8Array(header.length + encryptedPayload.length + 32);
  result.set(header);
  result.set(encryptedPayload, header.length);
  result.set(hmac, header.length + encryptedPayload.length);
  return result;
}

export function decodeMabak(data: Uint8Array): MabakFile {
  let offset = 0;
  const magic = data.slice(0, 6);
  if (bytesToHex(magic) !== bytesToHex(MAGIC)) throw new Error('Invalid backup file');
  offset += 6;
  const version = data[offset++];
  const flags = data[offset++];
  const salt = data.slice(offset, offset + 32); offset += 32;
  const iv = data.slice(offset, offset + 12); offset += 12;
  const payloadLen = data.length - offset - 32;
  const payload = data.slice(offset, offset + payloadLen); offset += payloadLen;
  const hmac = data.slice(offset, offset + 32);
  return { header: { version, hasTotp: !!(flags & 1), salt, iv }, payload, hmac };
}
```

- [ ] **Step 2: Write roundtrip test**

```typescript
it('encodes and decodes .mabak', () => {
  const payload = new TextEncoder().encode('test payload');
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const hmac = crypto.getRandomValues(new Uint8Array(32));
  const encoded = encodeMabak(payload, salt, iv, hmac);
  const decoded = decodeMabak(encoded);
  expect(decoded.header.version).toBe(1);
  expect(decoded.header.salt).toEqual(salt);
  expect(decoded.payload).toEqual(payload);
  expect(decoded.hmac).toEqual(hmac);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/backup/backupFormat.ts
git commit -m "feat: .mabak binary format encode/decode"
```

---

#### Task 2.3: Full export/import pipeline

**Files:**
- Modify: `src/lib/backup/exportBackup.ts`
- Test: `src/lib/backup/exportBackup.test.ts`

- [ ] **Step 1: Rewrite exportBackup.ts**

```typescript
// exportBackup.ts — full pipeline
import { deriveBackupKey, encryptBackupPayload, decryptBackupPayload, SALT_LENGTH, IV_LENGTH } from './backupCrypto';
import { encodeMabak, decodeMabak } from './backupFormat';
import { getMasterKeySet } from '../identity/masterKey';

export interface BackupOptions {
  password: string;
  totpCode?: string;
}

export async function exportBackup(options: BackupOptions): Promise<Blob> {
  // 1. Gather full state from store and keys
  const masterSet = await getMasterKeySet();
  const storeState = /* get from Zustand store */;

  // 2. Build JSON payload with all data
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    masterSeed: bytesToHex(masterSet.seed),
    x25519Secret: bytesToHex(masterSet.x25519Secret),
    x25519Public: bytesToHex(masterSet.x25519Public),
    ed25519Secret: bytesToHex(masterSet.ed25519Secret),
    ed25519Public: bytesToHex(masterSet.ed25519Public),
    store: storeState,
  };

  // 3. Encrypt payload
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveBackupKey({ salt, iv, password: options.password, totpCode: options.totpCode });
  const encrypted = await encryptBackupPayload(new TextEncoder().encode(JSON.stringify(payload)), key, iv);

  // 4. Compute HMAC
  const hmacKey = await deriveHmacKey(options.password, salt, options.totpCode);
  const hmac = await computeHmac(encrypted, hmacKey);

  // 5. Encode binary
  const binary = encodeMabak(encrypted, salt, iv, hmac);
  return new Blob([binary], { type: 'application/octet-stream' });
}

export async function importBackup(blob: Blob, options: BackupOptions): Promise<void> {
  const data = new Uint8Array(await blob.arrayBuffer());
  const file = decodeMabak(data);

  // Verify HMAC
  const hmacKey = await deriveHmacKey(options.password, file.header.salt, file.header.hasTotp ? options.totpCode : undefined);
  const expectedHmac = await computeHmac(file.payload, hmacKey);
  if (bytesToHex(file.hmac) !== bytesToHex(expectedHmac)) throw new Error('Backup integrity check failed');

  // Decrypt
  const key = await deriveBackupKey({
    salt: file.header.salt, iv: file.header.iv,
    password: options.password,
    totpCode: file.header.hasTotp ? options.totpCode : undefined,
  });
  const decrypted = await decryptBackupPayload(file.payload, key, file.header.iv);
  const payload = JSON.parse(new TextDecoder().decode(decrypted));

  // Restore keys
  const seed = hexToBytes(payload.masterSeed);
  await storeMasterSeed(seed);

  // Restore app state
  /* hydrate Zustand store from payload.store */
}

async function deriveHmacKey(password: string, salt: Uint8Array, totpCode?: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password + (totpCode || '')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

async function computeHmac(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}
```

- [ ] **Step 2: Write tests**

```typescript
it('exports and imports backup with password', async () => {
  const blob = await exportBackup({ password: 'test123' });
  expect(blob.size).toBeGreaterThan(0);
  // Mock store, import, verify no error
  await importBackup(blob, { password: 'test123' });
});

it('fails import with wrong password', async () => {
  const blob = await exportBackup({ password: 'correct' });
  await expect(importBackup(blob, { password: 'wrong' })).rejects.toThrow();
});
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/backup/exportBackup.ts
git commit -m "feat: full .mabak export/import pipeline"
```

---

### Phase 3: Two-Factor Auth

#### Task 3.1: Client-side TOTP

**Files:**
- Create: `src/lib/auth/clientTotp.ts`
- Modify: `package.json` (add `otpauth` dependency if not present)
- Test: `src/lib/auth/clientTotp.test.ts`

- [ ] **Step 1: Write clientTotp.ts**

```typescript
import * as OTPAuth from 'otpauth';

let _totp: OTPAuth.TOTP | null = null;

export function generateTotpSecret(): { secret: string; url: string } {
  const secret = new OTPAuth.Secret({ size: 20 });
  _totp = new OTPAuth.TOTP({
    issuer: 'Mess&Anger',
    label: 'Account Backup',
    algorithm: 'SHA-256',
    digits: 6,
    period: 30,
    secret,
  });
  return {
    secret: secret.base32,
    url: _totp.toString(),
  };
}

export function verifyTotpCode(token: string): boolean {
  if (!_totp) return false;
  const delta = _totp.validate({ token, window: 1 });
  return delta !== null;
}

export function getCurrentTotpCode(secretBase32: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'Mess&Anger',
    label: 'Account Backup',
    algorithm: 'SHA-256',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  return totp.generate();
}
```

- [ ] **Step 2: Tests and commit**

---

#### Task 3.2: TOTP UI setup screen

**Files:**
- Create: `src/components/settings/TotpSetup.tsx`
- Modify: `src/constants/storage.ts`

UI flow: Generate secret → show QR code + manual code → verify one code → save encrypted.

---

### Phase 4: Device Pairing

#### Task 4.1: Pairing protocol

**Files:**
- Create: `src/lib/identity/devicePairing.ts`
- Test: `src/lib/identity/devicePairing.test.ts`

Protocol:
1. Device A generates `{ challenge: nonce, ephemeralKey: x25519, expiresAt }` → QR
2. Device B scans QR, derives shared secret via ECDH, encrypts its device key
3. Device A decrypts, verifies device key signature → accepts/rejects

---

#### Task 4.2: QR pairing UI

**Files:**
- Create: `src/components/settings/PairingFlow.tsx`

Shows QR as host, camera scanner as joiner.

---

### Phase 5: P2P Sync

#### Task 5.1: Sync message protocol

**Files:**
- Create: `src/lib/sync/syncProtocol.ts`
- Test: `src/lib/sync/syncProtocol.test.ts`

Message types and serialization.

---

#### Task 5.2: Sync engine

**Files:**
- Create: `src/lib/sync/syncEngine.ts`
- Modify: `src/lib/p2p/network.ts`
- Test: `src/lib/sync/syncEngine.test.ts`

State machine: IDLE → REQUESTING → SYNCING → LIVE.

---

#### Task 5.3: Conflict resolution

**Files:**
- Create: `src/lib/sync/conflictResolver.ts`
- Test: `src/lib/sync/conflictResolver.test.ts`

LWW per entity, merge collections.

---

### Phase 6: UI Integration

#### Task 6.1: Backup settings screen

**Files:**
- Create: `src/components/settings/BackupSettings.tsx`

Export button, import file picker, progress indicator.

#### Task 6.2: Device management screen

**Files:**
- Create: `src/components/settings/SyncSettings.tsx`

List paired devices, pair new device button, remove device.

#### Task 6.3: Navigation integration

**Modify:** `src/App.tsx` — add routes for new settings screens.
**Modify:** `src/store/index.ts` — add sync/device/pairing state slices.
