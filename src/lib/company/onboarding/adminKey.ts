import { generateEd25519KeyPair, ed25519_sign, ed25519_verify } from '../../crypto/ed25519'
import { buf2hex, hex2buf } from '../../crypto/cryptoCore'

export interface AdminKeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export interface AdminSignedPayload {
  payload: string
  signature: Uint8Array
}

export function generateAdminKeyPair(): AdminKeyPair {
  const { publicKey, secretKey } = generateEd25519KeyPair()
  return { publicKey, secretKey }
}

export function signInvitePayload(payload: string, adminSecret: Uint8Array): Uint8Array {
  return ed25519_sign(payload, adminSecret)
}

export function verifyInviteSignature(payload: string, signature: Uint8Array, adminPubKey: Uint8Array): boolean {
  return ed25519_verify(payload, signature, adminPubKey)
}

export function serializeAdminKey(keyPair: AdminKeyPair): { publicKeyHex: string; secretKeyHex: string } {
  return {
    publicKeyHex: buf2hex(keyPair.publicKey),
    secretKeyHex: buf2hex(keyPair.secretKey),
  }
}

export function deserializeAdminKey(data: { publicKeyHex: string; secretKeyHex: string }): AdminKeyPair {
  return {
    publicKey: hex2buf(data.publicKeyHex),
    secretKey: hex2buf(data.secretKeyHex),
  }
}