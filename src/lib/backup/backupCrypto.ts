export const PBKDF2_ITERATIONS = 600000
export const SALT_LENGTH = 32
export const IV_LENGTH = 12
export const HMAC_LENGTH = 32

export interface BackupEncryptionParams {
  salt: Uint8Array
  iv: Uint8Array
  password: string
  totpCode?: string
}

export async function deriveBackupEncryptionKey(params: BackupEncryptionParams): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(params.password), 'PBKDF2', false, ['deriveKey'])
  const baseKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: params.salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )

  if (params.totpCode) {
    const totpMaterial = await crypto.subtle.importKey('raw', enc.encode(params.password + params.totpCode), 'PBKDF2', false, ['deriveKey'])
    const totpKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: params.salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      totpMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
    const rawBase = new Uint8Array(await crypto.subtle.exportKey('raw', baseKey))
    const rawTotp = new Uint8Array(await crypto.subtle.exportKey('raw', totpKey))
    const combined = new Uint8Array(64)
    combined.set(rawBase, 0)
    combined.set(rawTotp, 32)
    const finalHash = new Uint8Array(await crypto.subtle.digest('SHA-256', combined))
    return crypto.subtle.importKey('raw', finalHash, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }

  return baseKey
}

export async function deriveBackupHmacKey(password: string, salt: Uint8Array, totpCode?: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password + (totpCode || '')), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function encryptBackupPayload(plaintext: Uint8Array, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext))
}

export async function decryptBackupPayload(ciphertext: Uint8Array, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext))
}

export async function computeHmac(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
}

export async function verifyHmac(data: Uint8Array, expectedMac: Uint8Array, key: CryptoKey): Promise<boolean> {
  return crypto.subtle.verify('HMAC', key, expectedMac, data)
}
