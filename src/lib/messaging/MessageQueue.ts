// src/lib/messaging/MessageQueue.ts
import { MessageEnvelope } from './MessageEnvelope';

export class MessageQueue {
  private queue: Map<string, MessageEnvelope> = new Map();
  private maxQueueSize = 1000;

  async addMessage(msg: MessageEnvelope): Promise<void> {
    if (this.isExpired(msg)) {
      return;
    }
    this.queue.set(msg.timestamp.toString(), msg);
    if (this.queue.size > this.maxQueueSize) {
      const firstKey = this.queue.keys().next().value;
      this.queue.delete(firstKey);
    }
  }

  isExpired(msg: MessageEnvelope): boolean {
    if (msg.ttl <= 0) return false;
    const age = Date.now() - msg.timestamp;
    return age > msg.ttl * 1000;
  }

  getNextMessageForRecipient(recipient: string): MessageEnvelope | null {
    for (const [, msg] of this.queue) {
      if (msg.recipient === recipient || msg.recipient === '*') {
        return msg;
      }
    }
    return null;
  }

  removeMessage(timestamp: string): void {
    this.queue.delete(timestamp);
  }

  clear(): void {
    this.queue.clear();
  }
}
