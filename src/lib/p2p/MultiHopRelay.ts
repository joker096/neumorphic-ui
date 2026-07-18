// src/lib/p2p/MultiHopRelay.ts
// Kadabra-style multi-hop relay for routing messages through
// intermediate nodes when direct connection is not available.

import { MeshRouter } from './MeshRouter';
import type { MessageEnvelope as MessageEnvelopeType } from '../messaging/MessageEnvelope';

export class MultiHopRelay {
  private static relayBuffer = new Map<string, MessageEnvelopeType>();
  private static forwardHandler: ((envelope: MessageEnvelopeType) => void) | null = null;

  static setForwardHandler(handler: (envelope: MessageEnvelopeType) => void): void {
    this.forwardHandler = handler;
  }

  static async relayMessage(envelope: MessageEnvelopeType): Promise<boolean> {
    const path = MeshRouter.getShortestPath(envelope.recipient);
    if (!path || path.length === 0) {
      console.warn('[MultiHopRelay] No route found for', envelope.recipient);
      return false;
    }

    // Store the envelope in the relay buffer
    this.relayBuffer.set(envelope.recipient, envelope);

    // Update the envelope path
    envelope.path = path;

    // Forward to handler if set
    if (this.forwardHandler) {
      this.forwardHandler(envelope);
    }

    return true;
  }

  static addToBuffer(envelope: MessageEnvelopeType): void {
    this.relayBuffer.set(envelope.recipient, envelope);
  }

  static getBufferedMessage(recipient: string): MessageEnvelopeType | null {
    return this.relayBuffer.get(recipient) || null;
  }

  static clearBuffer(): void {
    this.relayBuffer.clear();
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [, msg] of this.relayBuffer) {
      if (msg.ttl > 0 && (now - msg.timestamp) > msg.ttl * 1000) {
        this.relayBuffer.delete(msg.recipient);
      }
    }
  }
}