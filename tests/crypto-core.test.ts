import { describe, it, expect } from 'vitest'
import { CryptoCore, buf2hex, hex2buf, b64encode, b64decode, generateX25519KeyPair, x25519DH, cryptoCore } from '../src/lib/crypto/cryptoCore'

describe('CryptoCore - Core Operations', () => {
  it('should generate X25519 key pair', () => {
    const kp = generateX25519KeyPair()
    expect(kp).toBeDefined()
    expect(kp.publicKey).toHaveLength(32)
    expect(kp.secretKey).toHaveLength(32)
  })

  it('should perform X25519 Diffie-Hellman correctly', () => {
    const alice = generateX25519KeyPair()
    const bob = generateX25519KeyPair()
    const shared1 = x25519DH(alice.secretKey, bob.publicKey)
    const shared2 = x25519DH(bob.secretKey, alice.publicKey)
    expect(shared1).toEqual(shared2)
  })

  it('should encode/decode base64 correctly', () => {
    const data = new Uint8Array([1, 2, 3, 4])
    const encoded = b64encode(data)
    const decoded = b64decode(encoded)
    expect(decoded).toEqual(data)
  })

  it('should convert buffer to hex and back', () => {
    const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
    const hex = buf2hex(original.buffer as ArrayBuffer)
    const restored = hex2buf(hex)
    expect(restored).toEqual(original)
  })
})

describe('CryptoCore - Key Derivation & Encryption', () => {
  const core = new CryptoCore()

  it('should derive AES key from password (PBKDF2)', async () => {
    const { key, saltHex } = await core.deriveAESKeyFromPassword('test-password', undefined, 1000)
    expect(key).toBeDefined()
    expect(saltHex).toHaveLength(32)
  })

  it('should encrypt and decrypt data with AES-GCM', async () => {
    const { key } = await core.deriveAESKeyFromPassword('test-password', undefined, 1000)
    const encrypted = await core.encryptData('hello world', key)
    expect(encrypted.cipher).toBeDefined()
    expect(encrypted.iv).toBeDefined()
    const decrypted = await core.decryptData(encrypted.cipher, encrypted.iv, key)
    expect(decrypted).toBe('hello world')
  })

  it('should hash a PIN with PBKDF2', async () => {
    const { hash, saltHex } = await core.hashAppLockPIN('1234', undefined, 1000)
    expect(hash).toBeDefined()
    expect(saltHex).toBeDefined()
    const { hash: hash2 } = await core.hashAppLockPIN('1234', saltHex, 1000)
    expect(hash2).toBe(hash)
    const { hash: hash3 } = await core.hashAppLockPIN('0000', saltHex, 1000)
    expect(hash3).not.toBe(hash)
  })

  it('should generate and verify HMAC via WebCrypto', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256', length: 256 }, true, ['sign', 'verify'],
    )
    const data = 'test message'
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
    expect(signature).toBeDefined()
    const valid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data))
    expect(valid).toBe(true)
    const invalid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode('tampered'))
    expect(invalid).toBe(false)
  })
})
