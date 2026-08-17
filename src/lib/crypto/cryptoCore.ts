import * as nacl from 'tweetnacl'
import type { X25519KeyPair, EncryptedPayload } from './types'

export function b64encode(data: Uint8Array): string {
  const chunks: string[] = []
  const chunkSize = 8192
  for (let i = 0; i < data.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, data.length)
    chunks.push(String.fromCharCode(...data.subarray(i, end)))
  }
  return btoa(chunks.join(''))
}

export function b64decode(s: string): Uint8Array {
  if (typeof s !== 'string' || s.length === 0) {
    throw new TypeError('b64decode: input must be a non-empty string')
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(s)) {
    throw new RangeError('b64decode: invalid base64 characters')
  }
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

export { DoubleRatchet } from './doubleRatchet'
export type { DoubleRatchetState } from './doubleRatchet'

const HEX_TABLE = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

export function buf2hex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i += 4096) {
    const end = Math.min(i + 4096, bytes.length)
    let hex = ''
    for (let j = i; j < end; j++) {
      hex += HEX_TABLE[bytes[j]]
    }
    parts.push(hex)
  }
  return parts.join('')
}

export function hex2buf(hexString: string): Uint8Array {
  if (typeof hexString !== 'string' || hexString.length === 0) {
    throw new TypeError('hex2buf: input must be a non-empty string')
  }
  if (!/^[0-9a-fA-F]+$/.test(hexString)) {
    throw new RangeError('hex2buf: invalid hex characters')
  }
  if (hexString.length % 2 !== 0) {
    throw new RangeError('hex2buf: hex string must have even length')
  }
  const bytes = new Uint8Array(hexString.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16)
  }
  return bytes
}

export function generateX25519KeyPair(): X25519KeyPair {
  const kp = nacl.box.keyPair()
  return { publicKey: kp.publicKey, secretKey: kp.secretKey }
}

export function x25519DH(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return nacl.scalarMult(privateKey, publicKey)
}

/**
 * Derive a shared HMAC key from an X25519 ECDH exchange.
 * The raw ECDH shared secret is run through a KDF (SHA-512 via tweetnacl) so the
 * resulting key has no residual algebraic structure. Both peers derive the same
 * key from their own private key + the peer's public key, so the key is never
 * transmitted over the wire.
 */
export function deriveSharedHmacKey(privateKey: Uint8Array, publicKey: Uint8Array): string {
  const shared = x25519DH(privateKey, publicKey)
  return buf2hex(nacl.hash(shared))
}

export class KyberKEM {
  static async generateKeyPair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    const { ml_kem768 } = await import('@noble/post-quantum/ml-kem.js')
    return ml_kem768.keygen()
  }

  static async encapsulate(publicKey: Uint8Array): Promise<{ cipherText: Uint8Array; sharedSecret: Uint8Array }> {
    const { ml_kem768 } = await import('@noble/post-quantum/ml-kem.js')
    return ml_kem768.encapsulate(publicKey)
  }

  static async decapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
    const { ml_kem768 } = await import('@noble/post-quantum/ml-kem.js')
    return ml_kem768.decapsulate(cipherText, secretKey)
  }

  static async hybridHandshake(remotePublicKey: Uint8Array): Promise<{
    sharedSecret: Uint8Array
    kemCipherText: Uint8Array
    kemPublicKey: Uint8Array
  }> {
    const kp = await KyberKEM.generateKeyPair()
    const enc = await KyberKEM.encapsulate(remotePublicKey)
    const dh = x25519DH(kp.secretKey, remotePublicKey)
    const combined = new Uint8Array(64)
    combined.set(enc.sharedSecret, 0)
    combined.set(dh, 32)
    const hash = await crypto.subtle.digest('SHA-256', combined)
    return {
      sharedSecret: new Uint8Array(hash),
      kemCipherText: enc.cipherText,
      kemPublicKey: kp.publicKey,
    }
  }

  static async kem(
    publicKey: CryptoKey,
    _privateKey?: CryptoKey,
  ): Promise<{ ciphertext: ArrayBuffer; sharedSecret: ArrayBuffer }> {
    const pkBytes = new Uint8Array(await crypto.subtle.exportKey('raw', publicKey))
    const enc = await KyberKEM.encapsulate(pkBytes)
    return {
      ciphertext: enc.cipherText.buffer,
      sharedSecret: enc.sharedSecret.buffer,
    }
  }
}

export class CryptoCore {
  async deriveAESKeyFromPassword(
    password: string, saltHex?: string, iterations = 100000,
  ): Promise<{ key: CryptoKey; saltHex: string }> {
    const passKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
    let salt: Uint8Array
    if (saltHex) {
      salt = hex2buf(saltHex)
    } else {
      salt = crypto.getRandomValues(new Uint8Array(16))
    }
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      passKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
    return { key, saltHex: saltHex || buf2hex(salt) }
  }

  async encryptData(data: string, key: CryptoKey): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, new TextEncoder().encode(data),
    )
    return { cipher: buf2hex(cipherBuffer), iv: buf2hex(iv) }
  }

  async decryptData(cipherHex: string, ivHex: string, key: CryptoKey): Promise<string> {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: hex2buf(ivHex) }, key, hex2buf(cipherHex),
    )
    return new TextDecoder().decode(decryptedBuffer)
  }

  async hashAppLockPIN(pin: string, saltHex?: string, iterations = 100000) {
    const passKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
    let salt: Uint8Array
    if (saltHex) {
      salt = hex2buf(saltHex)
    } else {
      salt = crypto.getRandomValues(new Uint8Array(16))
    }
    const hash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, passKey, 256,
    )
    return { hash: buf2hex(hash), saltHex: saltHex || buf2hex(salt) }
  }

  signEd25519(privateKey: Uint8Array, message: string): Uint8Array {
    const msgBuf = new TextEncoder().encode(message)
    return nacl.sign.detached(msgBuf, privateKey)
  }

  verifyEd25519Signature(publicKey: Uint8Array, message: string, signature: Uint8Array): boolean {
    try {
      const signedMsg = new Uint8Array(signature.length + message.length)
      signedMsg.set(signature)
      signedMsg.set(new TextEncoder().encode(message), signature.length)
      return nacl.sign.open(signedMsg, publicKey) !== null
    } catch {
      return false
    }
  }

  async secureWipe(): Promise<void> {
    try {
      // Delete all IndexedDB databases
      let dbs: IDBDatabaseInfo[] = []
      if (window.indexedDB.databases) {
        try {
          dbs = await window.indexedDB.databases()
        } catch { /* noop */ }
      }
      for (const db of dbs) {
        if (db.name) {
          await new Promise<void>((resolve) => {
            const req = window.indexedDB.deleteDatabase(db.name)
            req.onsuccess = () => resolve()
            req.onerror = () => resolve()
          })
        }
      }
    } catch { /* noop */ }

    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      } catch { /* noop */ }
    }

    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) {
          await reg.unregister().catch(() => { /* noop */ })
        }
      } catch { /* noop */ }
    }

    try {
      localStorage.clear()
    } catch { /* noop */ }
    try {
      sessionStorage.clear()
    } catch { /* noop */ }

    window.location.reload()
  }
}

export const cryptoCore = new CryptoCore()
