import {
  decryptSessionPayload,
  deriveSessionKeys,
  encryptSessionPayload,
} from './sessionCrypto'
import type { P2PTransportInternals } from './p2pTransportInternals'

/**
 * Derive the per-session HMAC + AES-GCM keys from the peer's ephemeral DH
 * public key. Both keys come from the same SHA-512 digest of the ECDH shared
 * secret, split into two independent 32-byte halves. The keys are derived
 * locally on both peers and are never transmitted.
 */
export async function deriveSessionFromPeerDh(
  self: P2PTransportInternals,
  peerDhPubHex: string,
): Promise<boolean> {
  if (!self.localDhPrivateKey) return false
  try {
    const keys = await deriveSessionKeys(self.localDhPrivateKey, peerDhPubHex)
    if (!keys) return false
    self.hmacKey = keys.hmacKey
    self.sessionAesKey = keys.aesKey
    self.outgoingSequence = 0
    self.incomingSequence = 0
    self.seenEncryptedPayloads.clear()
    return true
  } catch {
    self.hmacKey = null
    self.sessionAesKey = null
    return false
  }
}

export function encryptPayload(self: P2PTransportInternals, data: string): Promise<string> {
  return encryptSessionPayload(self.sessionAesKey!, data)
}

export function decryptPayload(
  self: P2PTransportInternals,
  payload: string,
): Promise<string | null> {
  return decryptSessionPayload(self.sessionAesKey, payload)
}

export function resetSession(self: P2PTransportInternals): void {
  self.peerPublicKey = null
  self.peerConnection?.close()
  self.peerConnection = null
  self.localDhPrivateKey = null
  self.hmacKey = null
  self.sessionAesKey = null
  self.pendingCandidates = []
}

export function hasSessionKeys(self: P2PTransportInternals): boolean {
  return Boolean(self.hmacKey && self.sessionAesKey)
}
