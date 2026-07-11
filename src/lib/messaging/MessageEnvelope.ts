// src/lib/messaging/MessageEnvelope.ts
export type MessageEnvelopeType = 'message' | 'file' | 'call' | 'metadata';
export type MessagePriority = 'low' | 'normal' | 'urgent';

export interface MessageEnvelope {
  version: number;
  type: MessageEnvelopeType;
  sender: string; // X25519 public key base64
  recipient: string; // X25519 public key or '*' for broadcast
  timestamp: number;
  ttl: number; // Time-to-live in seconds (0 = no expiration)
  encryptedPayload: string; // AES-GCM encrypted content
  iv: string; // AES-GCM IV
  mac: string; // HMAC-SHA256
  forwardSecrecy: boolean;
  priority: MessagePriority;
  path?: string[]; // Routing path for mesh
}

export function isEnvelopeExpired(envelope: MessageEnvelope): boolean {
  if (envelope.ttl === 0) return false
  const ageMs = Date.now() - envelope.timestamp
  const expired = ageMs > envelope.ttl * 1000
  if (expired) {
    console.warn(`[MessageEnvelope] Expired: ${ageMs}ms > ${envelope.ttl * 1000}ms`)
  }
  return expired
}
