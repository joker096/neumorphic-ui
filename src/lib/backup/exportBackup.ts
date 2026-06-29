import {
  deriveBackupEncryptionKey,
  deriveBackupHmacKey,
  encryptBackupPayload,
  decryptBackupPayload,
  computeHmac,
  verifyHmac,
  SALT_LENGTH,
  IV_LENGTH,
} from './backupCrypto'
import { encodeMabak, decodeMabak } from './backupFormat'
import { getMasterKeySet } from '../identity/masterKey'
import type { MasterKeySet } from '../identity/masterKey'
import { deviceSecurity } from '../deviceSecurity'
import { deriveKeysFromSeed } from '../identity/masterKey'

export interface BackupOptions {
  password: string
  totpCode?: string
}

export interface BackupPayload {
  version: number
  createdAt: string
  masterSeed: string
  x25519Secret: string
  x25519Public: string
  ed25519Secret: string
  ed25519Public: string
  store: Record<string, unknown>
}

export async function exportBackup(storeState: Record<string, unknown>, options: BackupOptions): Promise<Blob> {
  const masterSet = await getMasterKeySet()

  const payload: BackupPayload = {
    version: 1,
    createdAt: new Date().toISOString(),
    masterSeed: buf2hex(masterSet.seed),
    x25519Secret: buf2hex(masterSet.x25519Secret),
    x25519Public: buf2hex(masterSet.x25519Public),
    ed25519Secret: buf2hex(masterSet.ed25519Secret),
    ed25519Public: buf2hex(masterSet.ed25519Public),
    store: storeState,
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  const encKey = await deriveBackupEncryptionKey({ salt, iv, password: options.password, totpCode: options.totpCode })
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const encrypted = await encryptBackupPayload(plaintext, encKey, iv)

  const hmacKey = await deriveBackupHmacKey(options.password, salt, options.totpCode)
  const hmac = await computeHmac(encrypted, hmacKey)

  const binary = encodeMabak(encrypted, salt, iv, hmac)
  return new Blob([binary], { type: 'application/octet-stream' })
}

export async function importBackup(blob: Blob, options: BackupOptions): Promise<BackupPayload> {
  const data = new Uint8Array(await blob.arrayBuffer())
  const file = decodeMabak(data)

  const hmacKey = await deriveBackupHmacKey(options.password, file.header.salt, file.header.hasTotp ? options.totpCode : undefined)
  const valid = await verifyHmac(file.payload, file.hmac, hmacKey)
  if (!valid) throw new Error('Backup integrity check failed — wrong password or corrupted file')

  const encKey = await deriveBackupEncryptionKey({
    salt: file.header.salt,
    iv: file.header.iv,
    password: options.password,
    totpCode: file.header.hasTotp ? options.totpCode : undefined,
  })
  const decrypted = await decryptBackupPayload(file.payload, encKey, file.header.iv)
  const payload: BackupPayload = JSON.parse(new TextDecoder().decode(decrypted))

  const seed = hex2buf(payload.masterSeed)
  const masterKeySet = await deriveKeysFromSeed(seed)
  await deviceSecurity.storeMasterKeyHex(masterKeySet.aesKeyHex)

  return payload
}

// Legacy exports
export { encryptBackupData, decryptBackupData } from './cloudBackup'

function buf2hex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}
