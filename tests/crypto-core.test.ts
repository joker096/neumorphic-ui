import { describe, it, expect } from 'vitest'
import { CryptoCore, buf2hex, hex2buf, b64encode, b64decode, generateX25519KeyPair, x25519DH, cryptoCore } from '../src/lib/crypto/cryptoCore'
import { DoubleRatchet } from '../src/lib/crypto/doubleRatchet'
import { MessageEncryptionService } from '../src/lib/crypto/MessageEncryptionService'

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

  it('should generate and verify HMAC', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256', length: 256 }, true, ['sign', 'verify'],
    )
    const data = 'test message'
    const signature = await core.generateHMAC(key, data)
    expect(signature).toBeDefined()
    const valid = await core.verifyHMAC(key, data, signature)
    expect(valid).toBe(true)
    const invalid = await core.verifyHMAC(key, 'tampered', signature)
    expect(invalid).toBe(false)
  })
})

describe('Double Ratchet', () => {
  it('should initialize and produce a public key', async () => {
    const { ratchet, publicKey } = await DoubleRatchet.initialize()
    expect(ratchet).toBeDefined()
    expect(publicKey).toBeDefined()
    expect(publicKey.length).toBe(32)
  })

  it('should encrypt a message', async () => {
    const { ratchet } = await DoubleRatchet.initialize()
    const encrypted = await ratchet.encrypt('hello')
    expect(encrypted.ciphertext).toBeDefined()
    expect(encrypted.nonce).toBeDefined()
    expect(encrypted.publicKey).toBeDefined()
    expect(encrypted.messageHash).toBeDefined()
  })

  it('should produce different ciphertexts for different messages', async () => {
    const { ratchet } = await DoubleRatchet.initialize()
    await ratchet.encrypt('msg1')
    const enc2 = await ratchet.encrypt('msg2')
    await ratchet.ratchet(new Uint8Array(32).fill(1))
    const enc3 = await ratchet.encrypt('msg3')
    expect(enc2.ciphertext).not.toBe(enc3.ciphertext)
  })

  it('should create ratchet from persisted state', async () => {
    const { ratchet } = await DoubleRatchet.initialize()
    const state = ratchet.getState()
    const restored = await DoubleRatchet.createFromState(state)
    const encrypted = await restored.encrypt('restored')
    expect(encrypted.ciphertext).toBeDefined()
  })

  it('should preserve localDHKeyPair after ratchet call (fix for cross-instance decrypt)', async () => {
    const { ratchet, publicKey } = await DoubleRatchet.initialize()
    const publicKeyBefore = publicKey

    const remoteKey = new Uint8Array(32).fill(1)
    await ratchet.ratchet(remoteKey)

    // The ratchet should use the existing localDHKeyPair, not generate a new one
    const state = ratchet.getState()
    expect(state.localDHKeyPair.publicKey).toEqual(publicKeyBefore)
  })

  it('should encrypt and decrypt with single ratchet', async () => {
    const { ratchet } = await DoubleRatchet.initialize()
    const encrypted = await ratchet.encrypt('test message')
    const decrypted = await ratchet.decrypt(encrypted.ciphertext, encrypted.nonce, encrypted.publicKey)
    expect(decrypted.isValid).toBe(true)
    expect(decrypted.plaintext).toBe('test message')
  })

  it('should support ratchet step', async () => {
    const { ratchet } = await DoubleRatchet.initialize()
    await ratchet.encrypt('msg1')
    await ratchet.ratchetStep()
    const encrypted = await ratchet.encrypt('msg2')
    expect(encrypted.ciphertext).toBeDefined()
  })
})

describe('MessageEncryptionService', () => {
  it('should initialize a session', async () => {
    const service = new MessageEncryptionService()
    await service.initSession('chat1', 'a'.repeat(43))
    expect(service.hasSession('chat1')).toBe(true)
  })

  it('should encrypt with ratchet', async () => {
    const service = new MessageEncryptionService()
    await service.initSession('chat1', 'a'.repeat(43))
    const encrypted = await service.encrypt('chat1', 'hello world')
    expect(encrypted.ciphertext).toBeDefined()
    expect(encrypted.nonce).toBeDefined()
    expect(encrypted.publicKey).toBeDefined()
    expect(encrypted.messageHash).toBeDefined()
    expect(encrypted.senderPublicKey).toBeDefined()
    expect(encrypted.timestamp).toBeDefined()
  })

  it('should remove a session', () => {
    const service = new MessageEncryptionService()
    service.initSession('chat1', 'a'.repeat(43))
    service.removeSession('chat1')
    expect(service.hasSession('chat1')).toBe(false)
  })

  it('should handle multiple sessions', async () => {
    const service = new MessageEncryptionService()
    await service.initSession('chat1', 'a'.repeat(43))
    await service.initSession('chat2', 'b'.repeat(43))
    expect(service.hasSession('chat1')).toBe(true)
    expect(service.hasSession('chat2')).toBe(true)
    const enc1 = await service.encrypt('chat1', 'msg1')
    const enc2 = await service.encrypt('chat2', 'msg2')
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext)
  })

  it('should export and import state', async () => {
    const service = new MessageEncryptionService()
    await service.initSession('chat1', 'a'.repeat(43))
    const exported = service.getExportableState()
    expect(exported.chat1).toBeDefined()
    const restored = new MessageEncryptionService()
    await restored.importState(exported)
    expect(restored.hasSession('chat1')).toBe(true)
  })
})
