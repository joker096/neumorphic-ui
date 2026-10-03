import { generateX25519KeyPair, buf2hex } from '../crypto/cryptoCore'
import { signDh, verifyOrPinPeer } from './identityPin'
import { createPeerConnection } from './p2pPeerConnection'
import { pairingIdentityFields } from './p2pPairingSession'
import { deriveSessionFromPeerDh, resetSession } from './p2pSessionKeys'
import { handleMetadataSignal, sendSignaling } from './p2pSignaling'
import type { P2PTransportInternals } from './p2pTransportInternals'

export async function handleSignalingMessage(
  self: P2PTransportInternals,
  msg: any,
): Promise<void> {
  // Anti-replay defense-in-depth (server enforces authoritatively). A fresh
  // offer marks a new negotiation: reset the per-sender tracker (WebRTC
  // renegotiation legitimately restarts sequencing). Answer/ICE frames must
  // strictly increase within the negotiation; stale frames are dropped.
  if (Number.isInteger(msg.seq) && msg.seq > 0) {
    if (msg.type === 'offer') {
      self.incomingSignalingSeqs.set(msg.from, msg.seq)
    } else {
      const last = self.incomingSignalingSeqs.get(msg.from) ?? 0
      if (msg.seq <= last) {
        console.warn('[P2PTransport] Dropping stale signaling frame (anti-replay)')
        return
      }
      self.incomingSignalingSeqs.set(msg.from, msg.seq)
    }
  }
  switch (msg.type) {
    case 'offer':
      await handleOffer(self, msg)
      break
    case 'answer':
      await handleAnswer(self, msg)
      break
    case 'ice-candidate':
      await handleIceCandidate(self, msg)
      break
    case 'typing-indicator':
    case 'delivery-receipt':
    case 'online-status':
    case 'read-receipt': {
      if (Number.isInteger(msg.seq) && msg.seq > 0) {
        const last = self.seenMetadataSeqs.get(msg.type) ?? 0
        if (msg.seq <= last) {
          console.warn('[P2PTransport] Dropping stale metadata frame (anti-replay)')
          return
        }
        self.seenMetadataSeqs.set(msg.type, msg.seq)
      }
      handleMetadataSignal(self, msg.type, msg.data)
      break
    }
  }
}

export async function handleOffer(self: P2PTransportInternals, msg: any): Promise<void> {
  self.peerPublicKey = msg.from

  if (!msg.dhPub) {
    console.warn('[P2PTransport] Rejecting offer without dhPub (fail-closed)')
    resetSession(self)
    return
  }

  // Mandatory identity: refuse an unsigned ephemeral DH key (MITM could
  // substitute its own key without admission). This closes the roadmap item
  // «обязательная криптографическая identity-проверка».
  if (!msg.identityPub || !msg.dhSig) {
    console.warn('[P2PTransport] Rejecting offer without identity signature (fail-closed)')
    resetSession(self)
    return
  }
  if (!self.identitySecretKey || !self.identityPublicKey) {
    console.warn('[P2PTransport] Rejecting offer: local identity keys missing (fail-closed)')
    resetSession(self)
    return
  }

  // Renegotiation (media added to an established session): handle before
  // createPeerConnection — recreating the connection would tear down the data
  // channel. Session keys are not re-derived; only the SDP is exchanged.
  if (self.peerConnection && self.peerConnection.currentRemoteDescription) {
    try {
      await self.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp))
      const answer = await self.peerConnection.createAnswer()
      await self.peerConnection.setLocalDescription(answer)
      sendSignaling(self, {
        type: 'answer',
        target: msg.from,
        sdp: answer,
        dhPub: self.lastDhPubHex ?? undefined,
        ...pairingIdentityFields(self, self.lastDhPubHex ?? ''),
      })
      return
    } catch {
      console.warn('[P2PTransport] Renegotiation failed; falling back to full offer handling')
    }
  }

  createPeerConnection(self)

  await self.peerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sdp))

  const answer = await self.peerConnection!.createAnswer()
  await self.peerConnection!.setLocalDescription(answer)

  // Authenticate the caller's DH key against its pinned identity (TOFU).
  // The identity signature is now mandatory (checked above) — verify here.
  const peerId = msg.from ?? ''
  const idOk = await verifyOrPinPeer(peerId, msg.identityPub, msg.dhPub, msg.dhSig)
  if (!idOk) {
    console.warn('[P2PTransport] Peer identity/HMAC authentication failed; rejecting offer')
    resetSession(self)
    return
  }
  const ownKp = generateX25519KeyPair()
  self.localDhPrivateKey = ownKp.secretKey
  const myDhPub = buf2hex(ownKp.publicKey)
  self.lastDhPubHex = myDhPub
  await deriveSessionFromPeerDh(self, msg.dhPub)
  const myIdentityPub = buf2hex(self.identityPublicKey)
  const myDhSig = signDh(self.identitySecretKey, myDhPub)
  sendSignaling(self, {
    type: 'answer',
    target: msg.from,
    sdp: answer,
    dhPub: myDhPub,
    identityPub: myIdentityPub,
    dhSig: myDhSig,
  })

  for (const c of self.pendingCandidates) {
    await self.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
  }
  self.pendingCandidates = []
}

export async function handleAnswer(self: P2PTransportInternals, msg: any): Promise<void> {
  if (!msg.dhPub || !self.localDhPrivateKey) {
    console.warn('[P2PTransport] Rejecting answer without dhPub (fail-closed)')
    resetSession(self)
    return
  }

  // Authenticate the callee's DH key against its pinned identity (TOFU).
  // Mandatory: an unsigned answer is refused (identity check closed).
  if (!msg.identityPub || !msg.dhSig) {
    console.warn('[P2PTransport] Rejecting answer without identity signature (fail-closed)')
    resetSession(self)
    return
  }
  {
    const peerId = self.peerPublicKey ?? ''
    const ok = await verifyOrPinPeer(peerId, msg.identityPub, msg.dhPub, msg.dhSig)
    if (!ok) {
      console.warn('[P2PTransport] Peer identity/HMAC authentication failed; rejecting answer')
      resetSession(self)
      return
    }
  }
  await deriveSessionFromPeerDh(self, msg.dhPub)

  await self.peerConnection!.setRemoteDescription(
    new RTCSessionDescription(msg.sdp),
  )

  for (const c of self.pendingCandidates) {
    await self.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
  }
  self.pendingCandidates = []
}

async function handleIceCandidate(self: P2PTransportInternals, msg: any): Promise<void> {
  if (!self.peerConnection || !self.peerConnection.currentRemoteDescription) {
    self.pendingCandidates.push(msg.candidate)
    return
  }
  try {
    await self.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate))
  } catch (err) {
    console.error('[P2PTransport] Failed to add ICE candidate:', err)
  }
}
