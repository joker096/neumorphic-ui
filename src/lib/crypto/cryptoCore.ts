import * as nacl from 'tweetnacl'
import type { X25519KeyPair, EncryptedPayload, HandshakeResult, EncryptResult } from './types'

export function b64encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
}

export function b64decode(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

export { DoubleRatchet } from './doubleRatchet'
export type { DoubleRatchetState } from './doubleRatchet'

export function buf2hex(buffer: ArrayBuffer): string {
  return Array.prototype.map.call(new Uint8Array(buffer), (x: number) => ('00' + x.toString(16)).slice(-2)).join('')
}

export function hex2buf(hexString: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hexString.length / 2))
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

export class KyberKEM {
  private static readonly KEM_LENGTH = 32

  static async kem(
    publicKey: CryptoKey,
    privateKey: CryptoKey,
  ): Promise<{ ciphertext: ArrayBuffer; sharedSecret: ArrayBuffer }> {
    const sharedSecret = crypto.getRandomValues(new Uint8Array(this.KEM_LENGTH))
    const sharedKey = await crypto.subtle.importKey(
      'raw', sharedSecret, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    )
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
      sharedKey, new Uint8Array(this.KEM_LENGTH),
    )
    return { ciphertext, sharedSecret }
  }
}

export class CryptoCore {
  private identityKeys: X25519KeyPair | null = null
  private keyRotationCount = 0

  async initialize(): Promise<void> {
    this.identityKeys = generateX25519KeyPair()
    this.keyRotationCount = 0
  }

  async generateIdentityKeys(): Promise<{ publicKey: string; privateKey: string; timestamp: number }> {
    this.identityKeys = generateX25519KeyPair()
    return {
      publicKey: b64encode(this.identityKeys.publicKey),
      privateKey: b64encode(this.identityKeys.secretKey),
      timestamp: Date.now(),
    }
  }

  async performHandshake(remotePublicKey: string): Promise<HandshakeResult> {
    if (!this.identityKeys) throw new Error('Identity keys not generated')
    const remoteKey = b64decode(remotePublicKey)
    const sharedSecret = x25519DH(this.identityKeys.secretKey, remoteKey)
    return {
      sharedSecret: b64encode(sharedSecret),
      handshakeId: crypto.randomUUID(),
    }
  }

  async encryptMessage(message: string, publicKey: string): Promise<EncryptResult> {
    const keyBytes = b64decode(publicKey)
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const messageBuffer = new TextEncoder().encode(message)
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, messageBuffer)
    const tag = await crypto.subtle.digest('SHA-256', ciphertext)
    return {
      ciphertext: buf2hex(ciphertext),
      iv: buf2hex(iv),
      tag: buf2hex(tag),
      publicKey,
    }
  }

  async decryptMessage(ciphertext: string, iv: string, publicKey: string): Promise<string> {
    const keyBytes = b64decode(publicKey)
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: hex2buf(iv) }, key, hex2buf(ciphertext))
    return new TextDecoder().decode(decrypted)
  }

  async rotateKeys(): Promise<{ newPublicKey: string; newPrivateKey: string; rotationCount: number }> {
    this.identityKeys = generateX25519KeyPair()
    this.keyRotationCount++
    return {
      newPublicKey: b64encode(this.identityKeys.publicKey),
      newPrivateKey: b64encode(this.identityKeys.secretKey),
      rotationCount: this.keyRotationCount,
    }
  }

  async deriveHKDF(
    ikm: ArrayBuffer,
    info: ArrayBuffer = new Uint8Array(0).buffer,
    salt: ArrayBuffer = new Uint8Array(32).buffer,
    length = 32,
  ): Promise<ArrayBuffer> {
    const keyMaterial = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits', 'deriveKey'])
    return crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, keyMaterial, length * 8)
  }

  async deriveAESKeyFromPassword(
    password: string, saltHex?: string, iterations = 600000,
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

  async hashAppLockPIN(pin: string, saltHex?: string, iterations = 600000) {
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

  async generateHMAC(key: CryptoKey, data: string): Promise<string> {
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
    return buf2hex(signature)
  }

  async verifyHMAC(key: CryptoKey, data: string, signatureHex: string): Promise<boolean> {
    return crypto.subtle.verify('HMAC', key, hex2buf(signatureHex), new TextEncoder().encode(data))
  }

  async importHMACKey(rawKeyHex: string): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', hex2buf(rawKeyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  }

  signX25519(privateKey: Uint8Array, message: string): Uint8Array {
    const msgBuf = new TextEncoder().encode(message)
    return nacl.sign.detached(msgBuf, privateKey)
  }

  verifyX25519Signature(publicKey: Uint8Array, message: string, signature: Uint8Array): boolean {
    const msgBuf = new TextEncoder().encode(message)
    try {
      const result = (nacl.sign.open as any)(signature, msgBuf, publicKey)
      return result !== false
    } catch {
      return false
    }
  }

  async secureWipe(): Promise<void> {
    try {
      const dbs = await window.indexedDB.databases()
      for (const db of dbs) {
        if (db.name) window.indexedDB.deleteDatabase(db.name)
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
          await reg.unregister()
        }
      } catch { /* noop */ }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) localStorage.setItem(key, '00000000000000000000000000000000')
    }
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }
}

export const cryptoCore = new CryptoCore()
