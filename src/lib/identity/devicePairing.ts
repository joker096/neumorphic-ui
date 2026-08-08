import * as nacl from 'tweetnacl'
import { b64encode, b64decode } from '../crypto/cryptoCore'
import type { MasterKeySet } from './masterKey'

export interface PairingRequest {
  challenge: string
  serverUrl: string
  masterPublicKey: string
  ephemeralPublicKey: string
  expiresAt: number
}

export interface PairingResponse {
  deviceId: string
  deviceName: string
  devicePublicKey: string
  encryptedSessionKey: string
  signature: string
  totpCode?: string
}

export function createPairingQrData(
  master: MasterKeySet,
  serverUrl: string,
): { data: string; secretKey: Uint8Array } {
  const ephemeral = nacl.box.keyPair()
  const req: PairingRequest = {
    challenge: crypto.randomUUID(),
    serverUrl,
    masterPublicKey: b64encode(master.x25519Public),
    ephemeralPublicKey: b64encode(ephemeral.publicKey),
    expiresAt: Date.now() + 5 * 60 * 1000,
  }
  return {
    data: b64encode(new TextEncoder().encode(JSON.stringify(req))),
    secretKey: ephemeral.secretKey,
  }
}

export function parsePairingQrData(
  encoded: string,
): { request: PairingRequest; ephemeralPublicKey: Uint8Array } {
  const json = new TextDecoder().decode(b64decode(encoded))
  let request: PairingRequest
  try {
    request = JSON.parse(json)
  } catch {
    throw new Error('Invalid pairing QR data: malformed JSON')
  }
  if (typeof request !== 'object' || request === null) throw new Error('Invalid pairing QR data')
  if (typeof request.challenge !== 'string' || typeof request.serverUrl !== 'string' || typeof request.masterPublicKey !== 'string' || typeof request.ephemeralPublicKey !== 'string' || typeof request.expiresAt !== 'number') {
    throw new Error('Invalid pairing QR data: missing or malformed fields')
  }
  if (Date.now() > request.expiresAt) throw new Error('Pairing QR code expired')
  return {
    request,
    ephemeralPublicKey: b64decode(request.ephemeralPublicKey),
  }
}

export function createPairingResponse(
  request: PairingRequest,
  master: MasterKeySet,
  deviceName: string,
  ephemeralSecretKey: Uint8Array,
  deviceKeyPair: { x25519Secret: Uint8Array; x25519Public: Uint8Array },
  totpCode?: string,
): PairingResponse {
  const sharedSecret = nacl.box.before(b64decode(request.ephemeralPublicKey), ephemeralSecretKey)
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const sessionKeyData = JSON.stringify({
    deviceSecret: b64encode(deviceKeyPair.x25519Secret),
    masterSecret: b64encode(master.x25519Secret),
    ed25519Secret: b64encode(master.ed25519Secret),
  })
  const encryptedSessionKey = nacl.box.after(
    new TextEncoder().encode(sessionKeyData),
    nonce,
    sharedSecret,
  )
  const combined = new Uint8Array(nonce.length + encryptedSessionKey.length)
  combined.set(nonce)
  combined.set(encryptedSessionKey, nonce.length)

  const signature = b64encode(nacl.sign.detached(deviceKeyPair.x25519Public, master.ed25519Secret))

  return {
    deviceId: 'dvc_' + b64encode(deviceKeyPair.x25519Public).replace(/[+/=]/g, '').slice(0, 16),
    deviceName,
    devicePublicKey: b64encode(deviceKeyPair.x25519Public),
    encryptedSessionKey: b64encode(combined),
    signature,
    totpCode,
  }
}

export function verifyPairingResponse(
  response: PairingResponse,
  master: MasterKeySet,
): { deviceId: string; devicePublicKey: Uint8Array; deviceSecret: Uint8Array } | null {
  const devicePubKey = b64decode(response.devicePublicKey)
  const valid = nacl.sign.detached.verify(devicePubKey, b64decode(response.signature), master.ed25519Public)
  if (!valid) return null

  return {
    deviceId: response.deviceId,
    devicePublicKey: devicePubKey,
    deviceSecret: new Uint8Array(0),
  }
}
