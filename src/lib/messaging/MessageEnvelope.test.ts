// src/lib/messaging/MessageEnvelope.test.ts
import { describe, it, expect } from 'vitest'
import type { MessageEnvelope } from './MessageEnvelope'

describe('MessageEnvelope', () => {
  it('should create a valid envelope', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message',
      sender: 'sender-key',
      recipient: 'recipient-key',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'encrypted-data',
      iv: 'iv-hex',
      mac: 'mac-hex',
      forwardSecrecy: true,
      priority: 'normal',
    }

    expect(envelope.version).toBe(1)
    expect(envelope.type).toBe('message')
    expect(envelope.sender).toBe('sender-key')
    expect(envelope.recipient).toBe('recipient-key')
    expect(envelope.ttl).toBe(3600)
    expect(envelope.forwardSecrecy).toBe(true)
    expect(envelope.priority).toBe('normal')
  })

  it('should support broadcast recipient', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message',
      sender: 'sender-key',
      recipient: '*',
      timestamp: Date.now(),
      ttl: 0,
      encryptedPayload: '',
      iv: '',
      mac: '',
      forwardSecrecy: false,
      priority: 'urgent',
    }

    expect(envelope.recipient).toBe('*')
    expect(envelope.priority).toBe('urgent')
  })

  it('should support path property', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'file',
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 7200,
      encryptedPayload: 'payload',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: true,
      priority: 'low',
      path: ['node1', 'node2', 'node3'],
    }

    expect(envelope.path).toEqual(['node1', 'node2', 'node3'])
  })

  it('should support all message types', () => {
    const types = ['message', 'file', 'call', 'metadata'] as const
    for (const type of types) {
      const envelope: MessageEnvelope = {
        version: 1,
        type,
        sender: 'sender',
        recipient: 'recipient',
        timestamp: Date.now(),
        ttl: 1800,
        encryptedPayload: 'data',
        iv: 'iv',
        mac: 'mac',
        forwardSecrecy: false,
        priority: 'normal',
      }
      expect(envelope.type).toBe(type)
    }
  })

  it('should support TTL of 0 (no expiration)', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message',
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 0,
      encryptedPayload: 'data',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: true,
      priority: 'normal',
    }

    expect(envelope.ttl).toBe(0)
  })

  it('should serialize to JSON', () => {
    const envelope: MessageEnvelope = {
      version: 1,
      type: 'message',
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'data',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: true,
      priority: 'normal',
    }

    const json = JSON.stringify(envelope)
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.type).toBe('message')
    expect(parsed.sender).toBe('sender')
  })
})
