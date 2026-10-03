import { getRelayToken, withToken } from '../network/relayToken'
import { generateX25519KeyPair, buf2hex } from '../crypto/cryptoCore'
import { signDh } from './identityPin'
import { createPeerConnection } from './p2pPeerConnection'
import { setupCallControlChannel, setupDataChannel } from './p2pDataChannel'
import { handleSignalingMessage } from './p2pSignalingHandlers'
import type { MetadataSignalType } from './P2PTransport'
import type { P2PTransportInternals } from './p2pTransportInternals'

export async function connectTransport(self: P2PTransportInternals): Promise<void> {
  self.stopped = false
  if (self.signalingWs?.readyState === WebSocket.OPEN) return

  const token = await getRelayToken().catch(() => '')
  const url = withToken(self.signalingUrl, token)

  return new Promise((resolve, reject) => {
    try {
      self.signalingWs = new WebSocket(url)
    } catch (err) {
      reject(err)
      return
    }
    const ws = self.signalingWs
    let settled = false
    const connectTimer = setTimeout(() => {
      if (settled) return
      settled = true
      if (self.signalingWs === ws) self.signalingWs = null
      ws.onclose = null
      ws.close()
      reject(new Error('Signaling connect timeout'))
    }, 10000)
    const settle = () => {
      settled = true
      clearTimeout(connectTimer)
    }

    ws.onopen = () => {
      if (settled) return
      ws.send(
        JSON.stringify({
          type: 'register',
          publicKey: self.localPublicKey,
        }),
      )
    }

    ws.onmessage = (event) => {
      if (settled) return
      let msg: any
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'registered') {
        settle()
        self.signalingWs!.onmessage = (e) => handleSignalingEvent(self, e)
        self.reconnectAttempts = 0
        resolve()
      } else if (msg.type === 'challenge') {
        // The key is already bound to another live socket (same identity:
        // main signaling WS + this transport). Prove ownership by signing the
        // server nonce — an attacker cannot sign, so hijack stays impossible.
        if (!self.identitySecretKey || !self.identityPublicKey) {
          settle()
          reject(new Error('Ownership challenge requires identity keys'))
          return
        }
        const nonce = typeof msg.nonce === 'string' ? msg.nonce : ''
        if (!nonce) {
          settle()
          reject(new Error('Invalid challenge nonce'))
          return
        }
        ws.send(
          JSON.stringify({
            type: 'register-challenge',
            publicKey: self.localPublicKey,
            nonce,
            signature: signDh(self.identitySecretKey, nonce),
          }),
        )
      } else if (msg.type === 'error') {
        settle()
        reject(new Error(msg.message))
      }
    }

    ws.onerror = () => {
      if (settled) return
      settle()
      reject(new Error('WebSocket connection failed'))
    }

    ws.onclose = () => {
      handleWsClose(self)
    }
  })
}

/** Answer an offer that arrived out-of-band (inbound dial-back): the offer
 * was received on the main signaling WS; this transport connects under the
 * same identity key (ownership-challenge register) and processes it as its
 * own negotiation. No new offer is created, so no glare occurs. */
export async function acceptOfferOnTransport(
  self: P2PTransportInternals,
  peerPublicKey: string,
  frame: any,
): Promise<void> {
  self.peerPublicKey = peerPublicKey
  await connectTransport(self)
  await handleSignalingMessage(self, { ...frame, type: 'offer', from: peerPublicKey })
}

export async function callPeer(
  self: P2PTransportInternals,
  peerPublicKey: string,
): Promise<void> {
  self.peerPublicKey = peerPublicKey

  // Ephemeral ECDH key agreement: generate a one-time keypair and exchange the
  // public key over signaling. The HMAC key is derived locally from the peer's
  // public key + our private key, so the HMAC key itself is never transmitted.
  const kp = generateX25519KeyPair()
  self.localDhPrivateKey = kp.secretKey
  const dhPub = buf2hex(kp.publicKey)
  self.lastDhPubHex = dhPub

  // Authenticate this session's DH public key with our persistent Ed25519
  // identity so a signaling-layer MITM cannot substitute keys. Mandatory:
  // a handshake without a signed ephemeral DH key is refused outright.
  if (!self.identitySecretKey || !self.identityPublicKey) {
    throw new Error('[P2PTransport] identity keys required to initiate a call')
  }
  const identityPub = buf2hex(self.identityPublicKey)
  const dhSig = signDh(self.identitySecretKey, dhPub)

  createPeerConnection(self)

  self.dataChannel = self.peerConnection!.createDataChannel('messenger', {
    ordered: true,
  })
  setupDataChannel(self)

  self.callControlChannel = self.peerConnection!.createDataChannel('call-control', {
    ordered: true,
  })
  setupCallControlChannel(self)

  const offer = await self.peerConnection!.createOffer()
  await self.peerConnection!.setLocalDescription(offer)

  sendSignaling(self, {
    type: 'offer',
    target: peerPublicKey,
    sdp: offer,
    dhPub,
    identityPub,
    dhSig,
  })
}

export function handleSignalingEvent(self: P2PTransportInternals, event: MessageEvent): void {
  let msg: any
  try {
    msg = JSON.parse(event.data)
  } catch {
    return
  }
  handleSignalingMessage(self, msg).catch((err) =>
    console.error('[P2PTransport] Signaling handler error:', err),
  )
}

export function handleWsClose(self: P2PTransportInternals): void {
  if (self.stopped) return
  if (self.peerPublicKey) {
    self.onDisconnected(self.peerPublicKey)
  }
  if (self.reconnectAttempts < self.maxReconnectAttempts) {
    self.reconnectAttempts++
    // Exponential backoff capped at 30s (house pattern, matches
    // signaling/manager.ts) — avoids reconnect thundering herds after a
    // signaling outage instead of hammering the relay at fixed 1s intervals.
    const delay = Math.min(1000 * Math.pow(2, self.reconnectAttempts - 1), 30000)
    setTimeout(() => { void connectTransport(self) }, delay)
  }
}

export function sendSignaling(self: P2PTransportInternals, data: object): void {
  if (self.signalingWs?.readyState === WebSocket.OPEN) {
    self.signalingSeq++
    self.signalingWs.send(JSON.stringify({
      ...data,
      seq: self.signalingSeq,
    }))
  }
}

export function sendMetadataSignal(
  self: P2PTransportInternals,
  type: MetadataSignalType,
  data?: any,
): void {
  if (self.signalingWs?.readyState !== WebSocket.OPEN) return
  self.signalingWs.send(JSON.stringify({
    type,
    target: self.peerPublicKey,
    data,
    seq: ++self.metadataSeq,
  }))
}

export function onMetadataSignal(
  self: P2PTransportInternals,
  handler: (type: MetadataSignalType, data: any) => void,
): void {
  self.metadataSignalHandlers.add(handler)
}

export function handleMetadataSignal(
  self: P2PTransportInternals,
  type: MetadataSignalType,
  data: any,
): void {
  for (const handler of self.metadataSignalHandlers) {
    handler(type, data)
  }
}
