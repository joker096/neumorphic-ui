import * as idb from 'idb-keyval'

const SEED_LENGTH = 32
export const SEED_STORAGE_KEY = 'mess_master_seed'
const STATIC_SALT = 'mess-anger-master-derivation-v1'

export interface MasterKeySet {
  seed: Uint8Array
  aesKey: CryptoKey
  aesKeyHex: string
  x25519Secret: Uint8Array
  x25519Public: Uint8Array
  ed25519Secret: Uint8Array
  ed25519Public: Uint8Array
}

export async function generateMasterSeed(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(SEED_LENGTH))
}

export async function deriveKeysFromSeed(seed: Uint8Array): Promise<MasterKeySet> {
  const { buf2hex } = await import('../crypto/cryptoCore')
  const info = new TextEncoder().encode(STATIC_SALT)
  const keyMaterial = await crypto.subtle.importKey('raw', seed, 'HKDF', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt: new Uint8Array(32), info, hash: 'SHA-256' },
    keyMaterial,
    256 * 4
  )

  const dv = new Uint8Array(derived)
  const x25519Secret = dv.slice(0, 32)
  const ed25519Secret = dv.slice(32, 64)
  const aesRawKey = dv.slice(64, 96)
  const futureUse = dv.slice(96, 128)

  const nacl = await import('tweetnacl')
  const x25519Kp = nacl.box.keyPair.fromSecretKey(x25519Secret)
  const signKp = nacl.sign.keyPair.fromSeed(ed25519Secret)

  const aesKey = await crypto.subtle.importKey('raw', aesRawKey, 'AES-GCM', true, ['encrypt', 'decrypt'])

  return {
    seed,
    aesKey,
    aesKeyHex: buf2hex(aesRawKey),
    x25519Secret,
    x25519Public: x25519Kp.publicKey,
    ed25519Secret: signKp.secretKey,
    ed25519Public: signKp.publicKey,
  }
}

// Encrypted-at-rest storage prefix. Root key material must NOT sit plaintext in
// IndexedDB: an IDB snapshot/backup exfil alone must not leak identity keys.
const SEED_ENC_PREFIX = 'enc:v1:'

async function deviceBoundKey(): Promise<CryptoKey> {
  const { deviceSecurity } = await import('../deviceSecurity')
  return deviceSecurity.getDeviceBoundKey()
}

export async function storeMasterSeed(seed: Uint8Array): Promise<void> {
  const { buf2hex, cryptoCore } = await import('../crypto/cryptoCore')
  const key = await deviceBoundKey()
  if (!key) {
    // Fail closed: never persist root key material in plaintext. A missing
    // device-bound key only happens outside real browsers (JS runtimes without
    // navigator/window); browsers always derive a fingerprint key, so identity
    // boot is unaffected there. Tests/exotic runtimes must provide a bound key.
    throw new Error('master key: device-bound encryption unavailable, refusing to persist plaintext seed')
  }
  const { cipher, iv } = await cryptoCore.encryptData(buf2hex(seed), key)
  await idb.set(SEED_STORAGE_KEY, `${SEED_ENC_PREFIX}${iv}:${cipher}`)
}

export async function hasMasterIdentity(): Promise<boolean> {
  const stored = await idb.get<string>(SEED_STORAGE_KEY)
  return !!stored
}

// Single-flight resolver: parallel cold-boot callers (network init, main-WS
// registration, identity seeding) must derive from the SAME seed. Without this,
// two concurrent getMasterKeySet() on an empty IDB each generate+persist their
// own seed — the last writer wins in IDB while earlier callers keep a stale
// keypair, so the network signs with a key the identity store no longer holds.
let masterSetPromise: Promise<MasterKeySet> | null = null

export function getMasterKeySet(): Promise<MasterKeySet> {
  if (!masterSetPromise) {
    masterSetPromise = readMasterKeySet().finally(() => {
      masterSetPromise = null
    })
  }
  return masterSetPromise
}

async function readMasterKeySet(): Promise<MasterKeySet> {
  const { hex2buf } = await import('../crypto/cryptoCore')
  const stored = await idb.get<string>(SEED_STORAGE_KEY)
  if (!stored) {
    const seed = await generateMasterSeed()
    await storeMasterSeed(seed)
    return deriveKeysFromSeed(seed)
  }
  if (stored.startsWith(SEED_ENC_PREFIX)) {
    const { cryptoCore } = await import('../crypto/cryptoCore')
    const payload = stored.slice(SEED_ENC_PREFIX.length)
    const sep = payload.indexOf(':')
    if (sep === -1) throw new Error('master key: malformed encrypted seed')
    // Throws when the device-bound key no longer matches (fingerprint changed).
    // Identity is preserved so the user can restore from their recovery phrase.
    const seedHex = await cryptoCore.decryptData(payload.slice(sep + 1), payload.slice(0, sep), await deviceBoundKey())
    return deriveKeysFromSeed(hex2buf(seedHex))
  }
  // Legacy plaintext from a previous version → migrate to device-bound
  // encryption without dropping the existing identity.
  const seed = hex2buf(stored)
  try {
    await storeMasterSeed(seed)
  } catch {
    // Migration is best-effort; the legacy value remains readable.
  }
  return deriveKeysFromSeed(seed)
}
