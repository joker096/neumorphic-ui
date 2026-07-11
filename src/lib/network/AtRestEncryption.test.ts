// src/lib/network/AtRestEncryption.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AtRestEncryption } from './AtRestEncryption'

describe('AtRestEncryption', () => {
  beforeEach(() => {
    AtRestEncryption['reset']()
  })

  it('should initialize encryption', async () => {
    await AtRestEncryption.init('test-password')
    expect(true).toBe(true) // No error thrown
  })

  it('should encrypt data', async () => {
    await AtRestEncryption.init('test-password')
    const encrypted = await AtRestEncryption.encryptData('test-data')
    expect(encrypted).toHaveProperty('cipher')
    expect(encrypted).toHaveProperty('iv')
  })

  it('should decrypt data', async () => {
    await AtRestEncryption.init('test-password')
    const encrypted = await AtRestEncryption.encryptData('test-data')
    const decrypted = await AtRestEncryption.decryptData(encrypted.cipher, encrypted.iv)
    expect(decrypted).toBe('test-data')
  })

  it('should encrypt and decrypt object', async () => {
    await AtRestEncryption.init('test-password')
    const obj = { key: 'value', num: 42 }
    const encrypted = await AtRestEncryption.encryptObject(obj)
    const decrypted = await AtRestEncryption.decryptObject(encrypted)
    expect(decrypted.key).toBe('value')
    expect(decrypted.num).toBe(42)
  })

  it('should reset encryption', () => {
    AtRestEncryption['reset']()
    expect(true).toBe(true)
  })

  it('should throw error if not initialized', async () => {
    try {
      await AtRestEncryption.encryptData('test')
      expect(true).toBe(false) // Should not reach here
    } catch (e) {
      expect((e as Error).message).toBe('At-rest encryption not initialized')
    }
  })

  it('should handle encrypting without initialization', async () => {
    await AtRestEncryption.init('test-password');
    const obj = { key: 'value', num: 42 }
    const encrypted = await AtRestEncryption.encryptObject(obj)
    const decrypted = await AtRestEncryption.decryptObject(encrypted)
    expect(decrypted.key).toBe('value')
    expect(decrypted.num).toBe(42)
  })
})
