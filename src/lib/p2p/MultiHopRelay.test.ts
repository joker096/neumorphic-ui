// src/lib/p2p/MultiHopRelay.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MultiHopRelay } from './MultiHopRelay'
import { MeshRouter } from './MeshRouter'
import type { MessageEnvelope } from '../messaging/MessageEnvelope'

describe('MultiHopRelay', () => {
  beforeEach(() => {
    MultiHopRelay.clearBuffer()
    MeshRouter.clear()
  })

  it('should relay a message with path', async () => {
    MeshRouter.addRoute('recipient', ['hop1', 'hop2'], 3600)

    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'data',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: true,
      priority: 'normal' as const,
    }

    // Set up forward handler before calling relayMessage
    const forwardSpy = vi.fn()
    MultiHopRelay.setForwardHandler(forwardSpy)

    const result = await MultiHopRelay.relayMessage(envelope)
    expect(result).toBe(true)
  })

  it('should add message to buffer', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'data',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'low' as const,
    }

    MultiHopRelay.addToBuffer(envelope)
    const buffered = MultiHopRelay.getBufferedMessage('recipient')
    expect(buffered).not.toBeNull()
  })

  it('should get buffered message', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'test',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    MultiHopRelay.addToBuffer(envelope)
    const result = MultiHopRelay.getBufferedMessage('recipient')
    expect(result?.encryptedPayload).toBe('test')
  })

  it('should clear buffer', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'clear',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    MultiHopRelay.addToBuffer(envelope)
    MultiHopRelay.clearBuffer()
    const result = MultiHopRelay.getBufferedMessage('recipient')
    expect(result).toBeNull()
  })

  it('should cleanup expired messages', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now() - 7200000,
      ttl: 1800,
      encryptedPayload: 'expired',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    MultiHopRelay.addToBuffer(envelope)
    MultiHopRelay.cleanup()
    const result = MultiHopRelay.getBufferedMessage('recipient')
    expect(result).toBeNull()
  })

  it('should cleanup non-expired messages', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'valid',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    MultiHopRelay.addToBuffer(envelope)
    MultiHopRelay.cleanup()
    const result = MultiHopRelay.getBufferedMessage('recipient')
    expect(result).not.toBeNull()
  })

  it('should handle no route found', async () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'no-route',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'data',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    const result = await MultiHopRelay.relayMessage(envelope)
    expect(result).toBe(false)
  })
})
