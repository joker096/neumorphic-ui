import { describe, it, expect } from 'vitest'
import { AnonymityLayer } from '../src/lib/network/AnonymityLayer'

describe('AnonymityLayer', () => {
  it('should be disabled by default', () => {
    expect(AnonymityLayer.isEnabled()).toBe(false)
    expect(AnonymityLayer.isRelayOnly()).toBe(false)
  })

  it('should configure anonymity mode', () => {
    AnonymityLayer.configure({
      enabled: true,
      torBridge: 'obridge',
      obfuscationMode: 'strict',
      relayOnly: true,
      timestampFuzzing: true,
    })
    expect(AnonymityLayer.isEnabled()).toBe(true)
    expect(AnonymityLayer.isRelayOnly()).toBe(true)
  })

  it('should kill metadata when anonymity enabled', () => {
    AnonymityLayer.configure({ enabled: true })
    const ks = AnonymityLayer.getMetadataKillswitches()
    expect(ks.typingIndicators).toBe(true)
    expect(ks.deliveryReceipts).toBe(true)
    expect(ks.onlineStatus).toBe(true)
    expect(ks.readReceipts).toBe(true)
  })

  it('should fuzz timestamps', () => {
    const original = 1000000
    const fuzzed = AnonymityLayer.fuzzTimestamp(original)
    expect(fuzzed).toBeGreaterThanOrEqual(400000) // -5 min
    expect(fuzzed).toBeLessThanOrEqual(1600000) // +5 min
    expect(fuzzed).not.toBe(original)
  })

  it('should return ice servers when relay only', () => {
    AnonymityLayer.configure({ enabled: true, relayOnly: true })
    const servers = AnonymityLayer.getIceServers()
    expect(servers.length).toBeGreaterThanOrEqual(1)
    expect(servers[0].urls).toContain('turn:')
  })

  it('should block metadata signal when anonymity enabled', () => {
    AnonymityLayer.configure({
      enabled: true,
      metadataKillswitches: {
        typingIndicators: true,
        deliveryReceipts: true,
        onlineStatus: true,
        readReceipts: true,
      },
    })
    expect(AnonymityLayer.shouldSendMetadata('typing-indicator')).toBe(false)
    expect(AnonymityLayer.shouldSendMetadata('delivery-receipt')).toBe(false)
    expect(AnonymityLayer.shouldSendMetadata('online-status')).toBe(false)
    expect(AnonymityLayer.shouldSendMetadata('read-receipt')).toBe(false)
  })

  it('should allow metadata signal when anonymity disabled', () => {
    AnonymityLayer.configure({ enabled: false })
    expect(AnonymityLayer.shouldSendMetadata('typing-indicator')).toBe(true)
    expect(AnonymityLayer.shouldSendMetadata('delivery-receipt')).toBe(true)
    expect(AnonymityLayer.shouldSendMetadata('online-status')).toBe(true)
    expect(AnonymityLayer.shouldSendMetadata('read-receipt')).toBe(true)
  })
})
