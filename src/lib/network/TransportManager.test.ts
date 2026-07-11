// src/lib/network/TransportManager.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { TransportManager } from './TransportManager'

describe('TransportManager', () => {
  beforeEach(() => {
    TransportManager.reset()
  })

  it('should configure transport', () => {
    TransportManager.configure({ mode: 'websocket', relayOnly: true })
    expect(TransportManager.getMode()).toBe('websocket')
  })

  it('should get current mode', () => {
    TransportManager.configure({ mode: 'mesh' })
    expect(TransportManager.getMode()).toBe('mesh')
  })

  it('should check relay only mode', () => {
    TransportManager.setRelayOnly(true)
    expect(TransportManager.isRelayOnly()).toBe(true)
  })

  it('should switch mode', async () => {
    await TransportManager.switchMode('tor')
    expect(TransportManager.getMode()).toBe('tor')
  })

  it('should get ICE servers', () => {
    const servers = TransportManager.getIceServers()
    expect(Array.isArray(servers)).toBe(true)
  })

  it('should get signaling URLs', () => {
    const urls = TransportManager.getSignalingUrls()
    expect(Array.isArray(urls)).toBe(true)
  })

  it('should reset to default', () => {
    TransportManager.configure({ mode: 'tor', relayOnly: true })
    TransportManager.reset()
    expect(TransportManager.getMode()).toBe('webrtc')
    expect(TransportManager.isRelayOnly()).toBe(false)
  })

  it('should switch to mesh when relay only', () => {
    TransportManager.setRelayOnly(true)
    expect(TransportManager.getMode()).toBe('mesh')
  })
})
