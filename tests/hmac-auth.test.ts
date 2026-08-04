import { describe, it, expect } from 'vitest'
import { HMACAuth } from '../src/lib/p2p/HMACAuth'

describe('HMACAuth', () => {
  it('should generate a key', async () => {
    const key = await HMACAuth.generateKey()
    expect(key).toBeDefined()
    expect(key).toHaveLength(64) // 32 bytes = 64 hex chars
  })

  it('should sign and verify data', async () => {
    const key = await HMACAuth.generateKey()
    const data = 'test message'
    const signature = await HMACAuth.sign(key, data)
    expect(signature).toBeDefined()
    const valid = await HMACAuth.verify(key, data, signature)
    expect(valid).toBe(true)
    const invalid = await HMACAuth.verify(key, 'tampered', signature)
    expect(invalid).toBe(false)
  })

  it('should reject tampered messages', async () => {
    const key = await HMACAuth.generateKey()
    const data = 'original message'
    const signature = await HMACAuth.sign(key, data)
    const tampered = await HMACAuth.verify(key, 'tampered message', signature)
    expect(tampered).toBe(false)
  })

  it('should handle empty message', async () => {
    const key = await HMACAuth.generateKey()
    const signature = await HMACAuth.sign(key, '')
    const valid = await HMACAuth.verify(key, '', signature)
    expect(valid).toBe(true)
  })
})
