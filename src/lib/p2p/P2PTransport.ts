import {
  addOutgoingStream as addOutgoingStreamImpl,
  removeOutgoingStream as removeOutgoingStreamImpl,
} from './p2pPeerConnection'
import { sendCallControlMessage, sendMessage } from './p2pDataChannel'
import {
  acceptOfferOnTransport,
  callPeer,
  connectTransport,
  handleMetadataSignal as dispatchMetadataSignal,
  onMetadataSignal as registerMetadataSignal,
  sendMetadataSignal as emitMetadataSignal,
} from './p2pSignaling'
import { hasSessionKeys as sessionHasKeys } from './p2pSessionKeys'
import {
  acceptPairingAnswer,
  acceptPairingOffer,
  createPairingOffer,
} from './p2pPairingSession'
import { disconnectTransport } from './p2pTransportLifecycle'
import type { P2PTransportInternals } from './p2pTransportInternals'

export interface CallMediaHandlers {
  onRemoteTrack: (peerId: string, stream: MediaStream) => void;
  onCallClosed: (peerId: string) => void;
  onMediaEnded: (peerId: string, kind: 'audio' | 'video') => void;
}
export interface MediaTrackOptions {
  preferAudioOnly?: boolean;
}

export type P2PMessageHandler = (data: string) => void
export type P2PConnectionHandler = (peerId: string) => void

interface P2PTransportConfig {
  signalingUrl: string
  localPublicKey: string
  iceServers?: RTCIceServer[]
  onMessage: P2PMessageHandler
  onConnected: P2PConnectionHandler
  onDisconnected: P2PConnectionHandler
  obfuscationEnabled?: boolean;
  identitySecretKey?: Uint8Array
  identityPublicKey?: Uint8Array
}

export type MetadataSignalType = 'typing-indicator' | 'delivery-receipt' | 'online-status' | 'read-receipt'

/** Wire format for serverless LAN pairing: `mess-lan/1:` + JSON payload.
 * Handed peer-to-peer via QR / copy-paste — no signaling server involved.
 * The SDP + ephemeral ECDH pubkey travel through the payload; the session
 * HMAC/AES-GCM keys are derived locally on both sides and never transmitted. */
export const PAIRING_MAGIC = 'mess-lan/1:'

/**
 * P2P transport façade. Holds the session state (see
 * `p2pTransportInternals.ts`) and delegates every operation to the sibling
 * modules: signaling, peer-connection/data-channel, session keys and pairing.
 */
export class P2PTransport implements P2PTransportInternals {
  peerConnection: RTCPeerConnection | null = null
  dataChannel: RTCDataChannel | null = null
  callControlChannel: RTCDataChannel | null = null
  signalingWs: WebSocket | null = null
  signalingUrl: string
  localPublicKey: string
  peerPublicKey: string | null = null
  onMessage: P2PMessageHandler
  onConnected: P2PConnectionHandler
  onDisconnected: P2PConnectionHandler
  iceServers: RTCIceServer[]
  hmacKey: string | null = null
  localDhPrivateKey: Uint8Array | null = null
  isRelayOnly = false
  reconnectAttempts = 0
  maxReconnectAttempts = 10
  pendingCandidates: RTCIceCandidateInit[] = []
  metadataSignalHandlers: Set<(type: MetadataSignalType, data: any) => void> = new Set()
  mediaHandlers: CallMediaHandlers | null = null
  outgoingStreams: MediaStream[] = []
  pendingOutgoingTracks: MediaStreamTrack[] = []
  localHandlesTracks = false
  obfuscationEnabled = true
  stopped = false
  sessionAesKey: CryptoKey | null = null
  seenEncryptedPayloads = new Set<string>()
  receiveChain: Promise<void> = Promise.resolve()
  outgoingSequence = 0
  incomingSequence = 0
  outgoingControlSequence = 0
  incomingControlSequence = 0
  metadataSeq = 0
  seenMetadataSeqs = new Map<string, number>()
  signalingSeq = 0
  incomingSignalingSeqs = new Map<string, number>()
  identitySecretKey: Uint8Array | null = null
  identityPublicKey: Uint8Array | null = null
  pairingMode = false
  localCandidates: RTCIceCandidateInit[] = []
  resolvePairingGather: (() => void) | null = null
  lastDhPubHex: string | null = null

  constructor(config: P2PTransportConfig) {
    this.signalingUrl = config.signalingUrl
    this.localPublicKey = config.localPublicKey
    this.onMessage = config.onMessage
    this.onConnected = config.onConnected
    this.onDisconnected = config.onDisconnected
    this.iceServers = config.iceServers ?? [
      { urls: 'stun:turn.neumorphic.local:3478' },
    ]
    this.obfuscationEnabled = config.obfuscationEnabled ?? true
    this.identitySecretKey = config.identitySecretKey ?? null
    this.identityPublicKey = config.identityPublicKey ?? null
  }

  attachMediaHandlers(handlers: CallMediaHandlers): void {
    this.mediaHandlers = handlers;
  }

  async addOutgoingStream(stream: MediaStream): Promise<void> {
    return addOutgoingStreamImpl(this, stream)
  }

  async removeOutgoingStream(stream: MediaStream): Promise<void> {
    return removeOutgoingStreamImpl(this, stream)
  }

  async connect(): Promise<void> {
    return connectTransport(this)
  }

  /** Answer an offer that arrived out-of-band (inbound dial-back): the offer
   * was received on the main signaling WS; this transport connects under the
   * same identity key (ownership-challenge register) and processes it as its
   * own negotiation. No new offer is created, so no glare occurs. */
  async acceptOffer(peerPublicKey: string, frame: any): Promise<void> {
    return acceptOfferOnTransport(this, peerPublicKey, frame)
  }

  async call(peerPublicKey: string): Promise<void> {
    return callPeer(this, peerPublicKey)
  }

  async send(data: string): Promise<void> {
    return sendMessage(this, data)
  }

  async sendCallControl(data: any): Promise<void> {
    return sendCallControlMessage(this, data)
  }

  disconnect(): void {
    disconnectTransport(this)
  }

  setRelayOnly(enabled: boolean): void {
    this.isRelayOnly = enabled
  }

  setIceServers(servers: RTCIceServer[]): void {
    this.iceServers = servers
  }

  /**
   * Serverless LAN-pairing mode. After calling this, `createPairingOffer` /
   * `acceptPairingOffer` / `acceptPairingAnswer` exchange SDP + ephemeral keys
   * as QR payloads instead of a signaling WebSocket. The resulting session
   * uses the same HMAC + AES-GCM transport channel as the relayed path.
   */
  enablePairingMode(): void {
    this.pairingMode = true
  }

  /**
   * Caller side: create the pairing offer (a `mess-lan/1:` QR payload).
   * Identity keys are mandatory at construction — a pairing session without a
   * signed ephemeral DH key is refused.
   */
  async createPairingOffer(): Promise<string> {
    return createPairingOffer(this, PAIRING_MAGIC)
  }

  /**
   * Callee side: consume the caller's QR payload, derive shared keys, and
   * produce the answer QR payload. Fails closed (keys + connection rolled
   * back) on any malformed or unauthenticated payload.
   */
  async acceptPairingOffer(payloadStr: string): Promise<string> {
    return acceptPairingOffer(this, payloadStr, PAIRING_MAGIC)
  }

  /** Caller side: consume the callee's answer QR payload to complete pairing. */
  async acceptPairingAnswer(payloadStr: string): Promise<void> {
    return acceptPairingAnswer(this, payloadStr, PAIRING_MAGIC)
  }

  /** Identity of the local transport for the current session, if any. */
  getSessionPeer(): string | null {
    return this.peerPublicKey
  }

  hasSessionKeys(): boolean {
    return sessionHasKeys(this)
  }

  sendMetadataSignal(type: MetadataSignalType, data?: any): void {
    emitMetadataSignal(this, type, data)
  }

  onMetadataSignal(handler: (type: MetadataSignalType, data: any) => void): void {
    registerMetadataSignal(this, handler)
  }

  handleMetadataSignal(type: MetadataSignalType, data: any): void {
    dispatchMetadataSignal(this, type, data)
  }
}
