/**
 * Channel Signing Module
 * 
 * Provides per-channel message signing using X25519 signatures.
 * Channel messages are not E2EE but are authenticated via channel private key.
 * 
 * Usage:
 * - Generate channel keypair when creating a channel
 * - Sign messages before publishing to channel
 * - Verify signatures on message receive
 */

import * as nacl from 'tweetnacl'
import { cryptoCore, buf2hex, hex2buf } from './cryptoCore';

export interface ChannelKeypair {
  publicKey: string; // hex-encoded X25519 public key
  privateKey: string; // hex-encoded X25519 private key
}

export interface SignedMessage {
  message: string;
  signature: string; // hex-encoded X25519 signature
  publicKey: string; // hex-encoded X25519 public key (channel public key)
  timestamp: number;
}

/**
 * Generate a channel keypair (X25519)
 */
export function generateChannelKeypair(): ChannelKeypair {
  const kp = nacl.box.keyPair();
  return {
    publicKey: buf2hex(kp.publicKey),
    privateKey: buf2hex(kp.secretKey),
  };
}

/**
 * Sign a message using the channel private key
 */
export function signMessage(message: string, privateKey: string): SignedMessage {
  const privateBuf = hex2buf(privateKey);
  const signature = cryptoCore.signX25519(privateBuf, message);
  
  return {
    message,
    signature: buf2hex(signature),
    publicKey: '', // will be set by channel creator
    timestamp: Date.now(),
  };
}

/**
 * Verify a signed message using the channel public key
 */
export function verifySignedMessage(message: SignedMessage): boolean {
  try {
    const publicBuf = hex2buf(message.publicKey);
    const signatureBuf = hex2buf(message.signature);
    const isValid = cryptoCore.verifyX25519Signature(publicBuf, message.message, signatureBuf);
    return isValid;
  } catch {
    return false;
  }
}
