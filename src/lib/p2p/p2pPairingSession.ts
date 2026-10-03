import { generateX25519KeyPair, buf2hex } from '../crypto/cryptoCore'
import { signDh, verifyOrPinPeer } from './identityPin'
import { parsePairingPayload, type LanPairingPayload } from './p2pPairing'
import { createPeerConnection } from './p2pPeerConnection'
import { setupCallControlChannel, setupDataChannel } from './p2pDataChannel'
import { deriveSessionFromPeerDh, resetSession } from './p2pSessionKeys'
import type { P2PTransportInternals } from './p2pTransportInternals'

/**
 * Caller side: create the pairing offer (a `mess-lan/1:` QR payload).
 * Identity keys are mandatory at construction — a pairing session without a
 * signed ephemeral DH key is refused.
 */
export async function createPairingOffer(
  self: P2PTransportInternals,
  magic: string,
): Promise<string> {
  if (!self.pairingMode) throw new Error('[P2PTransport] enablePairingMode() required')
  if (!self.identitySecretKey || !self.identityPublicKey) {
    throw new Error('[P2PTransport] identity keys required to pair')
  }
  const kp = generateX25519KeyPair()
  self.localDhPrivateKey = kp.secretKey
  const dhPub = buf2hex(kp.publicKey)
  self.peerPublicKey = self.localPublicKey

  preparePairingSession(self)
  createPeerConnection(self)
  self.dataChannel = self.peerConnection!.createDataChannel('messenger', { ordered: true })
  setupDataChannel(self)
  self.callControlChannel = self.peerConnection!.createDataChannel('call-control', { ordered: true })
  setupCallControlChannel(self)

  const offer = await self.peerConnection!.createOffer()
  await self.peerConnection!.setLocalDescription(offer)
  await waitForGather(self)
  const payload: LanPairingPayload = {
    peerId: self.localPublicKey,
    role: 'offer',
    dhPub,
    ...pairingIdentityFields(self, dhPub),
    sdp: self.peerConnection!.localDescription ?? offer,
  }
  return magic + JSON.stringify(payload)
}

/**
 * Callee side: consume the caller's QR payload, derive shared keys, and
 * produce the answer QR payload. Fails closed (keys + connection rolled
 * back) on any malformed or unauthenticated payload.
 */
export async function acceptPairingOffer(
  self: P2PTransportInternals,
  payloadStr: string,
  magic: string,
): Promise<string> {
  if (!self.pairingMode) throw new Error('[P2PTransport] enablePairingMode() required')
  const payload = parsePairingPayloadFor(payloadStr, 'offer', magic)
  self.peerPublicKey = payload.peerId

  if (!payload.dhPub) throw failPairing(self, 'offer without dhPub (fail-closed)')

  preparePairingSession(self)
  createPeerConnection(self)
  try {
    await self.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.sdp))
  } catch {
    throw failPairing(self, 'invalid offer sdp')
  }
  const answer = await self.peerConnection!.createAnswer()
  await self.peerConnection!.setLocalDescription(answer)

  await authenticatePairing(self, payload)
  const ownKp = generateX25519KeyPair()
  self.localDhPrivateKey = ownKp.secretKey
  const myDhPub = buf2hex(ownKp.publicKey)
  const keyOk = await deriveSessionFromPeerDh(self, payload.dhPub)
  if (!keyOk) throw failPairing(self, 'session key derivation failed')

  await waitForGather(self)
  const answerPayload: LanPairingPayload = {
    peerId: self.localPublicKey,
    role: 'answer',
    dhPub: myDhPub,
    ...pairingIdentityFields(self, myDhPub),
    sdp: self.peerConnection!.localDescription ?? answer,
  }
  return magic + JSON.stringify(answerPayload)
}

/** Caller side: consume the callee's answer QR payload to complete pairing. */
export async function acceptPairingAnswer(
  self: P2PTransportInternals,
  payloadStr: string,
  magic: string,
): Promise<void> {
  if (!self.pairingMode) throw new Error('[P2PTransport] enablePairingMode() required')
  const payload = parsePairingPayloadFor(payloadStr, 'answer', magic)
  self.peerPublicKey = payload.peerId

  if (!payload.dhPub || !self.localDhPrivateKey) throw failPairing(self, 'answer without dhPub (fail-closed)')

  await authenticatePairing(self, payload)
  const keyOk = await deriveSessionFromPeerDh(self, payload.dhPub)
  if (!keyOk) throw failPairing(self, 'session key derivation failed')
  try {
    await self.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.sdp))
  } catch {
    throw failPairing(self, 'invalid answer sdp')
  }
  for (const c of self.pendingCandidates) {
    await self.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
  }
  self.pendingCandidates = []
}

function parsePairingPayloadFor(
  payloadStr: string,
  expectedRole: 'offer' | 'answer',
  magic: string,
): LanPairingPayload {
  return parsePairingPayload(payloadStr, expectedRole, magic)
}

async function authenticatePairing(
  self: P2PTransportInternals,
  payload: LanPairingPayload,
): Promise<void> {
  // Mandatory identity — a pairing payload without a signed ephemeral DH
  // key is refused outright (no confidentiality-only sessions anymore).
  if (!payload.identityPub || !payload.dhSig) {
    throw failPairing(self, 'offer without identity signature (fail-closed)')
  }
  const ok = await verifyOrPinPeer(payload.peerId, payload.identityPub, payload.dhPub, payload.dhSig)
  if (!ok) throw failPairing(self, 'peer identity authentication failed (TOFU)')
}

export function pairingIdentityFields(
  self: P2PTransportInternals,
  dhPub: string,
): { identityPub: string; dhSig: string } {
  if (!self.identitySecretKey || !self.identityPublicKey) {
    throw new Error('[P2PTransport] identity keys required to pair')
  }
  return {
    identityPub: buf2hex(self.identityPublicKey),
    dhSig: signDh(self.identitySecretKey, dhPub),
  }
}

function preparePairingSession(self: P2PTransportInternals): void {
  self.localCandidates = []
  self.resolvePairingGather = null
}

async function waitForGather(self: P2PTransportInternals): Promise<void> {
  const pc = self.peerConnection
  if (pc && pc.iceGatheringState === 'complete') {
    return
  }
  await new Promise<void>((resolve) => {
    self.resolvePairingGather = resolve
    const safety = setTimeout(() => {
      if (self.resolvePairingGather === resolve) {
        self.resolvePairingGather = null
        resolve()
      }
    }, 5000)
    ;(safety as any).unref?.()
  })
}

function failPairing(self: P2PTransportInternals, reason: string): Error {
  resetSession(self)
  return new Error(`[P2PTransport] pairing failed: ${reason}`)
}
