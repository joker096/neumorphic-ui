import { describe, it, expect, beforeEach } from 'vitest'
import { AnonymityLayer } from '../src/lib/network/AnonymityLayer'
import { useAppStore } from '../src/store'

describe('AnonymityLayer', () => {
  beforeEach(() => {
    localStorage.clear()
    AnonymityLayer.configure({
      enabled: false,
      torBridge: '',
      obfuscationMode: 'none',
      relayOnly: false,
      timestampFuzzing: false,
      metadataKillswitches: {
        typingIndicators: true,
        deliveryReceipts: true,
        onlineStatus: true,
        readReceipts: true,
      },
    })
  })

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
    AnonymityLayer.configure({ timestampFuzzing: true })
    const original = 1000000
    const fuzzed = AnonymityLayer.fuzzTimestamp(original)
    expect(fuzzed).toBeGreaterThanOrEqual(400000) // -5 min
    expect(fuzzed).toBeLessThanOrEqual(1600000) // +5 min
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

  it('should persist and load config from localStorage', () => {
    const config = { enabled: true, relayOnly: true, timestampFuzzing: true }
    localStorage.setItem('anonymity_config', JSON.stringify(config))
    AnonymityLayer.init()
    expect(AnonymityLayer.isEnabled()).toBe(true)
    expect(AnonymityLayer.isRelayOnly()).toBe(true)
  })

  it('should show typing indicator based on store state', () => {
    AnonymityLayer.configure({ enabled: false })
    const state = useAppStore.getState()
    const result = AnonymityLayer.shouldShowTypingIndicator()
    expect(result).toBe(!state.typingIndicators)
  })

  it('should hide typing indicator when anonymity enabled', () => {
    AnonymityLayer.configure({ enabled: true })
    expect(AnonymityLayer.shouldShowTypingIndicator()).toBe(false)
  })

  it('should hide delivery receipt when anonymity enabled', () => {
    AnonymityLayer.configure({ enabled: true })
    expect(AnonymityLayer.shouldShowDeliveryReceipt()).toBe(false)
  })

  it('should hide online status when anonymity enabled', () => {
    AnonymityLayer.configure({ enabled: true })
    expect(AnonymityLayer.shouldShowOnlineStatus()).toBe(false)
  })

  it('should hide read receipt when anonymity enabled', () => {
    AnonymityLayer.configure({ enabled: true })
    expect(AnonymityLayer.shouldShowReadReceipt()).toBe(false)
  })

  it('should show online status based on store state when anonymity disabled', () => {
    AnonymityLayer.configure({ enabled: false })
    const state = useAppStore.getState()
    expect(AnonymityLayer.shouldShowOnlineStatus()).toBe(!state.onlineStatus)
  })

  it('should not fuzz timestamp when disabled', () => {
    AnonymityLayer.configure({ timestampFuzzing: false })
    expect(AnonymityLayer.fuzzTimestamp(1000000)).toBe(1000000)
  })
})
