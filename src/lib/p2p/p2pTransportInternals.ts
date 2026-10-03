import type {
  CallMediaHandlers,
  MetadataSignalType,
  P2PConnectionHandler,
  P2PMessageHandler,
} from './P2PTransport'

/**
 * Shared mutable state of a live `P2PTransport`. The connect/signaling/
 * pairing/peer-connection logic lives in sibling modules and operates on this
 * object, so the transport class stays a thin façade. Fields stay flat on the
 * instance (regression tests read them directly).
 */
export interface P2PTransportInternals {
  peerConnection: RTCPeerConnection | null
  dataChannel: RTCDataChannel | null
  callControlChannel: RTCDataChannel | null
  signalingWs: WebSocket | null
  signalingUrl: string
  localPublicKey: string
  peerPublicKey: string | null
  onMessage: P2PMessageHandler
  onConnected: P2PConnectionHandler
  onDisconnected: P2PConnectionHandler
  iceServers: RTCIceServer[]
  hmacKey: string | null
  localDhPrivateKey: Uint8Array | null
  isRelayOnly: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
  pendingCandidates: RTCIceCandidateInit[]
  metadataSignalHandlers: Set<(type: MetadataSignalType, data: any) => void>
  mediaHandlers: CallMediaHandlers | null
  outgoingStreams: MediaStream[]
  pendingOutgoingTracks: MediaStreamTrack[]
  localHandlesTracks: boolean
  obfuscationEnabled: boolean
  stopped: boolean
  sessionAesKey: CryptoKey | null
  seenEncryptedPayloads: Set<string>
  receiveChain: Promise<void>
  outgoingSequence: number
  incomingSequence: number
  outgoingControlSequence: number
  incomingControlSequence: number
  metadataSeq: number
  seenMetadataSeqs: Map<string, number>
  signalingSeq: number
  incomingSignalingSeqs: Map<string, number>
  identitySecretKey: Uint8Array | null
  identityPublicKey: Uint8Array | null
  pairingMode: boolean
  localCandidates: RTCIceCandidateInit[]
  resolvePairingGather: (() => void) | null
  lastDhPubHex: string | null
}
