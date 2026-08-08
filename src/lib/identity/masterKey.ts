import * as nacl from 'tweetnacl'
import { buf2hex, hex2buf } from '../crypto/cryptoCore'
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

  const x25519Kp = nacl.box.keyPair.fromSecretKey(x25519Secret)
  const signKp = nacl.sign.keyPair.fromSeed(ed25519Secret)

  const aesKey = await crypto.subtle.importKey('raw', aesRawKey, 'AES-GCM', true, ['encrypt', 'decrypt'])

  return {
    seed,
    aesKey,
    aesKeyHex: buf2hex(aesRawKey),
    x25519Secret,
    x25519Public: x25519Kp.publicKey,
    ed25519Secret,
    ed25519Public: signKp.publicKey,
  }
}

export async function storeMasterSeed(seed: Uint8Array): Promise<void> {
  await idb.set(SEED_STORAGE_KEY, buf2hex(seed))
}

export async function hasMasterIdentity(): Promise<boolean> {
  const stored = await idb.get<string>(SEED_STORAGE_KEY)
  return !!stored
}

export async function getMasterKeySet(): Promise<MasterKeySet> {
  const stored = await idb.get<string>(SEED_STORAGE_KEY)
  if (!stored) {
    const seed = await generateMasterSeed()
    await storeMasterSeed(seed)
    return deriveKeysFromSeed(seed)
  }
  return deriveKeysFromSeed(hex2buf(stored))
}
