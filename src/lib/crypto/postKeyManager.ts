// src/lib/crypto/postKeyManager.ts
// Per-post key generation for E2EE comments on channel posts

import { generateX25519KeyPair, b64encode, b64decode } from '../cryptoCore';
import { DoubleRatchet } from '../crypto/doubleRatchet';

export interface PostKey {
  id: string;
  publicKey: string; // base64-encoded X25519 public key
  privateKey: string; // base64-encoded X25519 private key
  createdAt: number;
  chatId?: string; // linked to the channel post
}

export interface PostKeyPair {
  postKey: PostKey;
  ratchet: DoubleRatchet;
}

/**
 * Generate a per-post encryption key for E2EE comments
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

/**
 * Generate a Double Ratchet pair for a post's comment thread
 */
export async function generatePostKeyPair(postKey: PostKey): Promise<PostKeyPair> {
  const emptyKey = new Uint8Array(32);
  const dummyKey = await crypto.subtle.importKey(
    'raw', emptyKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );

  const { ratchet, publicKey } = await DoubleRatchet.initialize();
  
  return {
    postKey,
    ratchet,
  };
}

/**
 * Exchange a post key with a commenter (peer-to-peer)
 */
export async function exchangePostKey(
  postKey: PostKey,
  peerPublicKey: Uint8Array,
  localRatchet: DoubleRatchet
): Promise<void> {
  await localRatchet.ratchet(peerPublicKey);
}
