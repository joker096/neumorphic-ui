import * as idb from 'idb-keyval'
import { cryptoCore, buf2hex, hex2buf } from '../crypto/cryptoCore'

const PIN_STORE_KEY = 'mess_identity_pins'

type PinMap = Record<string, string> // peerId -> identityPublicHex

let memoryCache: PinMap | null = null

async function loadPins(): Promise<PinMap> {
  if (memoryCache) return memoryCache
  try {
    const stored = await idb.get<string>(PIN_STORE_KEY)
    memoryCache = stored ? (JSON.parse(stored) as PinMap) : {}
  } catch {
    memoryCache = {}
  }
  return memoryCache
}

async function savePins(pins: PinMap): Promise<void> {
  memoryCache = pins
  try {
    await idb.set(PIN_STORE_KEY, JSON.stringify(pins))
  } catch {
    /* persistence is best-effort; memory cache still active */
  }
}

/**
 * Sign an ephemeral Diffie-Hellman public key with the local Ed25519 identity
 * secret key. The signature lets the peer bind this session's DH key to a
 * stable identity, defeating signaling-layer MITM (an attacker cannot forge a
 * different DH key without the identity private key).
 */
export function signDh(identitySecret: Uint8Array, dhPubHex: string): string {
  return buf2hex(cryptoCore.signEd25519(identitySecret, dhPubHex))
}

/**
 * Verify that `dhPubHex` was signed by the holder of `identityPubHex`.
 */
export function verifyDhSignature(
  identityPubHex: string,
  dhPubHex: string,
  dhSigHex: string,
): boolean {
  try {
    return cryptoCore.verifyEd25519Signature(
      hex2buf(identityPubHex),
      dhPubHex,
      hex2buf(dhSigHex),
    )
  } catch {
    return false
  }
}

/**
 * Trust-On-First-Use pinning: the first time we see an identity public key for a
 * peer we pin it; any later mismatch is rejected (detects key rotation / MITM).
 * Returns false if the DH signature is invalid or the pinned identity changed.
 */
export async function verifyOrPinPeer(
  peerId: string,
  identityPubHex: string,
  dhPubHex: string,
  dhSigHex: string,
): Promise<boolean> {
  if (!verifyDhSignature(identityPubHex, dhPubHex, dhSigHex)) return false

  const pins = await loadPins()
  const existing = pins[peerId]
  if (existing && existing !== identityPubHex) return false
  if (!existing) {
    pins[peerId] = identityPubHex
    await savePins(pins)
  }
  return true
}

export async function getPinnedIdentity(peerId: string): Promise<string | undefined> {
  const pins = await loadPins()
  return pins[peerId]
}

export async function resetIdentityPins(): Promise<void> {
  await savePins({})
}
