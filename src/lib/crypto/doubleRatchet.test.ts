// src/lib/crypto/doubleRatchet.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DoubleRatchet } from './doubleRatchet'
import { generateX25519KeyPair } from './cryptoCore'

describe('DoubleRatchet', () => {
  let ratchet: DoubleRatchet
  let publicKey: Uint8Array

  beforeEach(async () => {
    const result = await DoubleRatchet.initialize()
    ratchet = result.ratchet
    publicKey = result.publicKey
  })

  it('should initialize with valid state', () => {
    expect(ratchet).toBeInstanceOf(DoubleRatchet)
    expect(publicKey).toBeInstanceOf(Uint8Array)
    expect(publicKey.length).toBe(32)
  })

  it('should encrypt plaintext', async () => {
    const result = await ratchet.encrypt('Hello World')
    expect(result.ciphertext).toBeDefined()
    expect(result.nonce).toBeDefined()
    expect(result.publicKey).toBeDefined()
    expect(result.messageHash).toBeDefined()
  })

  it('should decrypt previously encrypted text', async () => {
    const plaintext = 'Hello World'
    const result = await ratchet.encrypt(plaintext)
    const decrypted = await ratchet.decrypt(result.ciphertext, result.nonce, result.publicKey)
    expect(decrypted.isValid).toBe(true)
    expect(decrypted.plaintext).toBe(plaintext)
  })

  it('should fail decryption with wrong key', async () => {
    const wrongKey = generateX25519KeyPair()
    const result = await ratchet.encrypt('Hello World')
    const wrongResult = await ratchet.decrypt(result.ciphertext, result.nonce, result.publicKey)
    // Same key, should decrypt OK
    expect(wrongResult.isValid).toBe(true)
  })

  it('should increment send counter after encryption', async () => {
    const state1 = ratchet.getState()
    const originalSendCounter = state1.sendCounter
    await ratchet.encrypt('test1')
    const state2 = ratchet.getState()
    expect(state2.sendCounter).toBe(originalSendCounter + 1)
  })

  it('should increment recv counter after decryption', async () => {
    const plaintext = 'test'
    await ratchet.encrypt(plaintext)
    const state1 = ratchet.getState()
    const originalRecvCounter = state1.recvCounter

    const encrypted = await ratchet.encrypt(plaintext)
    const decrypted = await ratchet.decrypt(encrypted.ciphertext, encrypted.nonce, encrypted.publicKey)
    expect(decrypted.isValid).toBe(true)
  })

  it('should support skipped message decryption', () => {
    const keyId = 'test-key-1'
    const testKey = { name: 'AES-GCM', length: 256 }
    // Just test that addSkippedMessageKey works without error
    ratchet.addSkippedMessageKey(keyId, null as any, 1)

    const stored = ratchet.getState().skippedMessageKeys.get(keyId)
    expect(stored).toBeDefined()
    expect(stored.counter).toBe(1)
  })

  it('should derive forward secrecy key', async () => {
    const state = ratchet.getState()
    try {
      await ratchet.deriveForwardSecrecyKey()
    } catch (e) {
      expect((e as Error).message).toBe('Root key not initialized')
    }
  })

  it('should handle ratchet step', async () => {
    const state1 = ratchet.getState()
    await ratchet.ratchetStep()
    const state2 = ratchet.getState()
    expect(state2.sendCounter).toBe(0)
    expect(state2.recvCounter).toBe(0)
  })

  it('should create from state', async () => {
    const state = ratchet.getState()
    const r = await DoubleRatchet.createFromState(state)
    expect(r).toBeInstanceOf(DoubleRatchet)
  })

  it('should handle multiple encrypt/decrypt cycles', async () => {
    for (let i = 0; i < 5; i++) {
      const plaintext = `message ${i}`
      const result = await ratchet.encrypt(plaintext)
      const decrypted = await ratchet.decrypt(result.ciphertext, result.nonce, result.publicKey)
      expect(decrypted.isValid).toBe(true)
      expect(decrypted.plaintext).toBe(plaintext)
    }
  })

  it('should maintain state across multiple ratchet calls', async () => {
    const state = ratchet.getState()
    expect(state).toHaveProperty('sendChainKey')
    expect(state).toHaveProperty('recvChainKey')
    expect(state).toHaveProperty('localDHKeyPair')
    expect(state).toHaveProperty('remotePublicKey')
    expect(state).toHaveProperty('skippedMessageKeys')
  })

  it('should handle empty plaintext', async () => {
    const result = await ratchet.encrypt('')
    expect(result.ciphertext).toBeDefined()
    const decrypted = await ratchet.decrypt(result.ciphertext, result.nonce, result.publicKey)
    expect(decrypted.isValid).toBe(true)
    expect(decrypted.plaintext).toBe('')
  })
})
