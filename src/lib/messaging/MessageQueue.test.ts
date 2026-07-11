// src/lib/messaging/MessageQueue.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessageQueue } from './MessageQueue'

describe('MessageQueue', () => {
  let queue: MessageQueue

  beforeEach(() => {
    queue = new MessageQueue()
    // Clear the internal queue by creating a new instance
    ;(queue as any).queue.clear()
  })

  it('should add a message to the queue', async () => {
    const msg = {
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

    await queue.addMessage(msg)
    const result = queue.getNextMessageForRecipient('recipient')
    expect(result).not.toBeNull()
    expect(result?.encryptedPayload).toBe('data')
  })

  it('should filter expired messages', async () => {
    const expiredMsg = {
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
      priority: 'low' as const,
    }

    await queue.addMessage(expiredMsg)
    const result = queue.getNextMessageForRecipient('recipient')
    expect(result).toBeNull()
  })

  it('should deliver broadcast messages', async () => {
    const broadcast = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: '*',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'broadcast',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    await queue.addMessage(broadcast)
    const result = queue.getNextMessageForRecipient('anyone')
    expect(result).not.toBeNull()
  })

  it('should remove messages', async () => {
    const msg = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'remove-me',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }

    await queue.addMessage(msg)
    queue.removeMessage(msg.timestamp.toString())
    const result = queue.getNextMessageForRecipient('recipient')
    expect(result).toBeNull()
  })

  it('should clear all messages', async () => {
    const msg1 = {
      version: 1,
      type: 'message' as const,
      sender: 'sender',
      recipient: 'recipient',
      timestamp: Date.now(),
      ttl: 3600,
      encryptedPayload: 'msg1',
      iv: 'iv',
      mac: 'mac',
      forwardSecrecy: false,
      priority: 'normal' as const,
    }
    const msg2 = { ...msg1, encryptedPayload: 'msg2' }

    await queue.addMessage(msg1)
    await queue.addMessage(msg2)
    queue.clear()

    const result = queue.getNextMessageForRecipient('recipient')
    expect(result).toBeNull()
  })
})
