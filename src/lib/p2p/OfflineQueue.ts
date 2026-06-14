import * as idb from 'idb-keyval'

export interface QueuedMessage {
  messageId: string
  targetPeer: string
  data: string
  timestamp: number
  attempts: number
  lastAttempt: number
  ttl?: number
}

const QUEUE_STORE = 'p2p-offline-queue'

export class OfflineQueue {
  private queue: Map<string, QueuedMessage[]> = new Map()
  private loaded = false

  async load(): Promise<void> {
    if (this.loaded) return
    try {
      const stored = await idb.get(QUEUE_STORE)
      if (stored && typeof stored === 'object') {
        for (const [peer, msgs] of Object.entries(stored as Record<string, QueuedMessage[]>)) {
          this.queue.set(peer, msgs)
        }
      }
    } catch (err) {
      console.error('[OfflineQueue] Failed to load queue:', err)
    }
    this.loaded = true
  }

  private async persist(): Promise<void> {
    try {
      const obj: Record<string, QueuedMessage[]> = {}
      for (const [peer, msgs] of this.queue) {
        obj[peer] = msgs
      }
      await idb.set(QUEUE_STORE, obj)
    } catch (err) {
      console.error('[OfflineQueue] Failed to persist queue:', err)
    }
  }

  async enqueue(peerId: string, data: string, ttl = 5): Promise<string> {
    const msg: QueuedMessage = {
      messageId: crypto.randomUUID(),
      targetPeer: peerId,
      data,
      timestamp: Date.now(),
      attempts: 0,
      lastAttempt: 0,
      ttl,
    }

    if (!this.queue.has(peerId)) {
      this.queue.set(peerId, [])
    }
    this.queue.get(peerId)!.push(msg)
    await this.persist()
    return msg.messageId
  }

  async flush(peerId: string, sender: (data: string) => Promise<boolean>): Promise<void> {
    const msgs = this.queue.get(peerId)
    if (!msgs || msgs.length === 0) return

    const delivered: QueuedMessage[] = []
    const failed: QueuedMessage[] = []

    for (const msg of msgs) {
      msg.attempts++
      msg.lastAttempt = Date.now()
      try {
        const ok = await sender(msg.data)
        if (ok) {
          delivered.push(msg)
        } else {
          failed.push(msg)
        }
      } catch {
        failed.push(msg)
      }
    }

    const remaining = failed.filter(m => (m.ttl ?? 5) > m.attempts)
    const expired = failed.filter(m => (m.ttl ?? 5) <= m.attempts)

    if (delivered.length > 0 || expired.length > 0) {
      const peerQueue = this.queue.get(peerId) || []
      this.queue.set(peerId, peerQueue.filter(m =>
        !delivered.find(d => d.messageId === m.messageId) &&
        !expired.find(e => e.messageId === m.messageId)
      ))
      if (this.queue.get(peerId)?.length === 0) {
        this.queue.delete(peerId)
      }
    }

    await this.persist()
  }

  async flushAll(sender: (peerId: string, data: string) => Promise<boolean>): Promise<void> {
    for (const [peerId] of this.queue) {
      await this.flush(peerId, (data) => sender(peerId, data))
    }
  }

  getPending(peerId?: string): QueuedMessage[] {
    if (peerId) return this.queue.get(peerId) || []
    const all: QueuedMessage[] = []
    for (const msgs of this.queue.values()) {
      all.push(...msgs)
    }
    return all
  }

  getPendingCount(): number {
    let count = 0
    for (const msgs of this.queue.values()) {
      count += msgs.length
    }
    return count
  }

  async remove(messageId: string): Promise<void> {
    for (const [peer, msgs] of this.queue) {
      const filtered = msgs.filter(m => m.messageId !== messageId)
      if (filtered.length !== msgs.length) {
        if (filtered.length === 0) {
          this.queue.delete(peer)
        } else {
          this.queue.set(peer, filtered)
        }
        await this.persist()
        return
      }
    }
  }

  clear(): void {
    this.queue.clear()
    idb.del(QUEUE_STORE).catch(() => {})
  }

  async cleanupExpired(): Promise<number> {
    let removed = 0
    const now = Date.now()
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

    for (const [peer, msgs] of this.queue) {
      const filtered = msgs.filter(m => {
        const expired = (m.ttl ?? 5) <= m.attempts
        const tooOld = now - m.timestamp > MAX_AGE
        return !expired && !tooOld
      })
      removed += msgs.length - filtered.length
      if (filtered.length === 0) {
        this.queue.delete(peer)
      } else {
        this.queue.set(peer, filtered)
      }
    }

    if (removed > 0) await this.persist()
    return removed
  }

  startAutoCleanup(intervalMs = 300000): () => void {
    const interval = setInterval(() => {
      this.cleanupExpired().catch(() => {})
    }, intervalMs)
    return () => clearInterval(interval)
  }
}
