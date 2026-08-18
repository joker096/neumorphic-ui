// src/lib/crypto/postKeyManager.ts
// Per-post key generation for channel posts

import { generateX25519KeyPair, b64encode } from '../cryptoCore';

export interface PostKey {
  id: string;
  publicKey: string; // base64-encoded X25519 public key
  privateKey: string; // base64-encoded X25519 private key
  createdAt: number;
  chatId?: string; // linked to the channel post
}

/**
 * Generate a per-post encryption key for channel posts
 */
export function generatePostKey(chatId: string): PostKey {
  const kp = generateX25519KeyPair();
  return {
    id: crypto.randomUUID(),
    publicKey: b64encode(kp.publicKey),
    privateKey: b64encode(kp.secretKey),
    createdAt: Date.now(),
    chatId,
  };
}
