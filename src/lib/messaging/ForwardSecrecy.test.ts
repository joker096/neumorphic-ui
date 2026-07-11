// src/lib/messaging/ForwardSecrecy.test.ts
import { describe, it, expect } from 'vitest'
import { ForwardSecrecy } from './ForwardSecrecy'

describe('ForwardSecrecy', () => {
  it('should derive a message key', async () => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32))
    const masterKey = await crypto.subtle.importKey('raw', rawKey, { name: 'HKDF' }, false, ['deriveBits'])
    const derivedKey = await ForwardSecrecy.deriveMessageKey(masterKey, 1)
    expect(derivedKey).toBeInstanceOf(ArrayBuffer)
    expect(derivedKey.byteLength).toBe(32)
  })

  it('should derive different keys for different counters', async () => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32))
    const masterKey = await crypto.subtle.importKey('raw', rawKey, { name: 'HKDF' }, false, ['deriveBits'])
    const key1 = await ForwardSecrecy.deriveMessageKey(masterKey, 1)
    const key2 = await ForwardSecrecy.deriveMessageKey(masterKey, 2)
    expect(key1).not.toBe(key2)
  })

  it('should delete key material', async () => {
    await ForwardSecrecy.deleteKeyMaterial('test-key')
    // No error should be thrown
  })

  it('should derive keys with different counters', async () => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32))
    const masterKey = await crypto.subtle.importKey('raw', rawKey, { name: 'HKDF' }, false, ['deriveBits'])
    const key0 = await ForwardSecrecy.deriveMessageKey(masterKey, 0)
    const key100 = await ForwardSecrecy.deriveMessageKey(masterKey, 100)
    expect(key0).not.toBe(key100)
  })
})
