/**
 * E2E crypto for the embeddable site-chat widget.
 *
 * A visitor on a third-party site gets an ephemeral X25519 guest identity.
 * Messages are sealed to the *channel inbox* public key (published in the
 * embed token) using an X25519 ECDH-derived AES-256-GCM key. The company
 * holds the channel secret and derives the same key from the guest's public
 * key, so only the company can read visitor messages. No central plaintext,
 * no cloud, no telemetry.
 */

import { generateX25519KeyPair, x25519DH, b64encode, b64decode } from '../crypto/cryptoCore';
import { cryptoCore } from '../crypto/cryptoCore';
import type { X25519KeyPair } from '../crypto/types';

export interface ChannelKeyPair {
  publicKeyB64: string;
  secretKeyB64: string;
}

export interface SealedMessage {
  senderPubKey: string; // b64 guest public key
  cipher: string; // hex (AES-GCM)
  iv: string; // hex
}

function importKeyRaw(shared: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', shared, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export function generateChannelKeyPair(): ChannelKeyPair {
  const kp = generateX25519KeyPair();
  return { publicKeyB64: b64encode(kp.publicKey), secretKeyB64: b64encode(kp.secretKey) };
}

/** Guest: encrypt a message to the channel inbox public key. */
export async function sealToChannel(
  guest: X25519KeyPair,
  channelPubB64: string,
  text: string,
): Promise<SealedMessage> {
  const shared = x25519DH(guest.secretKey, b64decode(channelPubB64));
  const key = await importKeyRaw(shared);
  const enc = await cryptoCore.encryptData(text, key);
  return { senderPubKey: b64encode(guest.publicKey), cipher: enc.cipher, iv: enc.iv };
}

/** Company: decrypt a guest message using the channel secret key. */
export async function openFromChannel(
  channelSecretB64: string,
  sealed: SealedMessage,
): Promise<string> {
  const shared = x25519DH(b64decode(channelSecretB64), b64decode(sealed.senderPubKey));
  const key = await importKeyRaw(shared);
  return cryptoCore.decryptData(sealed.cipher, sealed.iv, key);
}

export function makeGuestIdentity(): X25519KeyPair {
  return generateX25519KeyPair();
}
