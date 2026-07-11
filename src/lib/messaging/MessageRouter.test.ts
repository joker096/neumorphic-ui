// src/lib/messaging/MessageRouter.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MessageRouter } from './MessageRouter'
import type { MessageEnvelope } from './MessageEnvelope'

describe('MessageRouter', () => {
  beforeEach(() => {
    MessageRouter.clearRoutingTable()
  })

  it('should route message with path', () => {
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
      path: ['hop1', 'hop2', 'hop3'],
    }

    const route = MessageRouter.routeMessage(envelope)
    expect(route).toEqual(['hop1', 'hop2', 'hop3'])
  })

  it('should fallback to direct routing', () => {
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
      forwardSecrecy: false,
      priority: 'low',
    }

    const route = MessageRouter.routeMessage(envelope)
    expect(route).toEqual(['recipient'])
  })

  it('should add and get route', () => {
    MessageRouter.addRoute('recipient', ['relay1', 'relay2'])
    const route = MessageRouter.getRoute('recipient')
    expect(route).toEqual(['relay1', 'relay2'])
  })

  it('should clear routing table', () => {
    MessageRouter.addRoute('recipient', ['relay'])
    MessageRouter.clearRoutingTable()
    const route = MessageRouter.getRoute('recipient')
    expect(route).toBeNull()
  })

  it('should handle empty path', () => {
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
      forwardSecrecy: false,
      priority: 'normal',
      path: [],
    }

    const route = MessageRouter.routeMessage(envelope)
    expect(route).toEqual(['recipient'])
  })
})
