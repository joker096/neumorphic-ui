import { HMACAuth } from './HMACAuth'
import { getRelayToken, withToken } from '../network/relayToken'
import {
  generateX25519KeyPair,
  buf2hex,
  hex2buf,
  b64encode,
  b64decode,
  deriveSharedSessionKeys,
} from '../crypto/cryptoCore'
import { signDh, verifyOrPinPeer } from './identityPin'

/** Hard ceiling for a single messenger frame payload (64 KiB). */
const MAX_PAYLOAD_BYTES = 65536

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

export interface LanPairingPayload {
  peerId: string
  role: 'offer' | 'answer'
  dhPub: string
  identityPub?: string
  dhSig?: string
  sdp: RTCSessionDescriptionInit
}

export class P2PTransport {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private callControlChannel: RTCDataChannel | null = null
  private signalingWs: WebSocket | null = null
  private signalingUrl: string
  private localPublicKey: string
  private peerPublicKey: string | null = null
  private onMessage: P2PMessageHandler
  private onConnected: P2PConnectionHandler
  private onDisconnected: P2PConnectionHandler
  private iceServers: RTCIceServer[]
  private hmacKey: string | null = null
  private localDhPrivateKey: Uint8Array | null = null
  private isRelayOnly = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private pendingCandidates: RTCIceCandidateInit[] = []
  private metadataSignalHandlers: Set<(type: MetadataSignalType, data: any) => void> = new Set()
  private mediaHandlers: CallMediaHandlers | null = null
  private outgoingStreams: MediaStream[] = []
  private pendingOutgoingTracks: MediaStreamTrack[] = []
  private localHandlesTracks = false
  private obfuscationEnabled = true
  private stopped = false
  private sessionAesKey: CryptoKey | null = null
  private seenEncryptedPayloads = new Set<string>()
  private receiveChain: Promise<void> = Promise.resolve()
  private outgoingSequence = 0
  private incomingSequence = 0
  private outgoingControlSequence = 0
  private incomingControlSequence = 0
  private metadataSeq = 0
  private seenMetadataSeqs = new Map<string, number>()
  private signalingSeq = 0
  private incomingSignalingSeqs = new Map<string, number>()
  private identitySecretKey: Uint8Array | null = null
  private identityPublicKey: Uint8Array | null = null
  private pairingMode = false
  private localCandidates: RTCIceCandidateInit[] = []
  private resolvePairingGather: (() => void) | null = null
  private lastDhPubHex: string | null = null

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
    this.outgoingStreams.push(stream);
    const tracks = stream.getTracks();
    if (!this.peerConnection) {
      this.pendingOutgoingTracks.push(...tracks);
      return;
    }
    tracks.forEach((track) => this.peerConnection!.addTrack(track, stream));
  }

  async removeOutgoingStream(stream: MediaStream): Promise<void> {
    this.outgoingStreams = this.outgoingStreams.filter((s) => s !== stream);
    if (!this.peerConnection) return;
    const senders = this.peerConnection.getSenders();
    stream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track === track);
      if (sender) this.peerConnection!.removeTrack(sender);
    });
  }

  async connect(): Promise<void> {
    this.stopped = false
    if (this.signalingWs?.readyState === WebSocket.OPEN) return

    const token = await getRelayToken().catch(() => '')
    const url = withToken(this.signalingUrl, token)

    return new Promise((resolve, reject) => {
      try {
        this.signalingWs = new WebSocket(url)
      } catch (err) {
        reject(err)
        return
      }
      const ws = this.signalingWs
      let settled = false
      const connectTimer = setTimeout(() => {
        if (settled) return
        settled = true
        if (this.signalingWs === ws) this.signalingWs = null
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
            publicKey: this.localPublicKey,
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
          this.signalingWs!.onmessage = this.handleSignalingEvent
          this.reconnectAttempts = 0
          resolve()
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
        this.handleWsClose()
      }
    })
  }

  async call(peerPublicKey: string): Promise<void> {
    this.peerPublicKey = peerPublicKey

    // Ephemeral ECDH key agreement: generate a one-time keypair and exchange the
    // public key over signaling. The HMAC key is derived locally from the peer's
    // public key + our private key, so the HMAC key itself is never transmitted.
    const kp = generateX25519KeyPair()
    this.localDhPrivateKey = kp.secretKey
    const dhPub = buf2hex(kp.publicKey)
    this.lastDhPubHex = dhPub

    // Authenticate this session's DH public key with our persistent Ed25519
    // identity so a signaling-layer MITM cannot substitute keys. Mandatory:
    // a handshake without a signed ephemeral DH key is refused outright.
    if (!this.identitySecretKey || !this.identityPublicKey) {
      throw new Error('[P2PTransport] identity keys required to initiate a call')
    }
    const identityPub = buf2hex(this.identityPublicKey)
    const dhSig = signDh(this.identitySecretKey, dhPub)

    this.createPeerConnection()

    this.dataChannel = this.peerConnection!.createDataChannel('messenger', {
      ordered: true,
    })
    this.setupDataChannel()

    this.callControlChannel = this.peerConnection!.createDataChannel('call-control', {
      ordered: true,
    })
    this.setupCallControlChannel()

    const offer = await this.peerConnection!.createOffer()
    await this.peerConnection!.setLocalDescription(offer)

    this.sendSignaling({
      type: 'offer',
      target: peerPublicKey,
      sdp: offer,
      dhPub,
      identityPub,
      dhSig,
    })
  }

  /**
   * Derive the per-session HMAC + AES-GCM keys from the peer's ephemeral DH
   * public key. Both keys come from the same SHA-512 digest of the ECDH shared
   * secret, split into two independent 32-byte halves. The keys are derived
   * locally on both peers and are never transmitted.
   */
  private async deriveSessionFromPeerDh(peerDhPubHex: string): Promise<boolean> {
    if (!this.localDhPrivateKey) return false
    try {
      const peerKey = hex2buf(peerDhPubHex)
      if (peerKey.length !== 32) return false
      const { hmacKey, aesKeyHex } = deriveSharedSessionKeys(this.localDhPrivateKey, peerKey)
      this.hmacKey = hmacKey
      this.sessionAesKey = await crypto.subtle.importKey(
        'raw',
        hex2buf(aesKeyHex),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      )
      this.outgoingSequence = 0
      this.incomingSequence = 0
      this.seenEncryptedPayloads.clear()
      return true
    } catch {
      this.hmacKey = null
      this.sessionAesKey = null
      return false
    }
  }

  private setupCallControlChannel(): void {
    if (!this.callControlChannel) return;
    this.callControlChannel.onmessage = (event) => {
      try {
        void this.processCallControlMessage(event.data as string)
      } catch {
        // ignore
      }
    };
  }

  private async processCallControlMessage(raw: string): Promise<void> {
    let data = raw
    if (this.hmacKey) {
      const pipeIdx = data.indexOf('|')
      if (pipeIdx === -1) {
        console.warn('[P2PTransport] Missing HMAC signature (call-control)')
        return
      }
      const sigHex = data.slice(0, pipeIdx)
      const payload = data.slice(pipeIdx + 1)
      const valid = await HMACAuth.verify(this.hmacKey, payload, sigHex)
      if (!valid) {
        console.warn('[P2PTransport] Invalid HMAC signature (call-control)')
        return
      }
      data = payload
    }

    const sequenceSeparator = data.indexOf('|')
    if (sequenceSeparator <= 0) {
      console.warn('[P2PTransport] Rejecting legacy call-control frame without sequence (strict mode)')
      return
    }
    if (sequenceSeparator > 0) {
      const sequence = Number(data.slice(0, sequenceSeparator))
      if (Number.isSafeInteger(sequence) && sequence > 0) {
        if (sequence <= this.incomingControlSequence) return
        data = data.slice(sequenceSeparator + 1)
        const senderSeparator = data.indexOf('|')
        if (senderSeparator > 0) {
          const senderPublicKey = data.slice(0, senderSeparator)
          if (this.peerPublicKey && senderPublicKey !== this.peerPublicKey) return
          data = data.slice(senderSeparator + 1)
        }
        this.incomingControlSequence = sequence
      }
    }

    if (this.sessionAesKey) {
      if (this.seenEncryptedPayloads.has(data)) return
      this.seenEncryptedPayloads.add(data)
      if (this.seenEncryptedPayloads.size > 2048) {
        const oldest = this.seenEncryptedPayloads.values().next().value
        if (oldest) this.seenEncryptedPayloads.delete(oldest)
      }
    }

    if (this.obfuscationEnabled && this.sessionAesKey) {
      const plain = await this.decryptPayload(data)
      if (plain === null) return
      data = plain
    }

    const msg = JSON.parse(data)
    this.handleCallControlMessage(msg)
  }

  private handleCallControlMessage(msg: any): void {
    if (!this.mediaHandlers || !this.peerPublicKey) return;
    switch (msg.type) {
      case 'mute-toggled':
        this.mediaHandlers.onMediaEnded(this.peerPublicKey, msg.kind);
        break;
      case 'screen-share':
        break;
      default:
        break;
    }
  }

  async send(data: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('P2P data channel is not open')
    }

    const dataBytes = new TextEncoder().encode(data).length
    if (dataBytes > MAX_PAYLOAD_BYTES) {
      throw new Error(`[P2PTransport] Payload exceeds 64KiB limit (${dataBytes} bytes)`)
    }

    let payload = data;
    if (this.obfuscationEnabled && this.sessionAesKey) {
      payload = await this.encryptPayload(data);
    }

    const sequence = ++this.outgoingSequence
    const authenticatedPayload = `${sequence}|${this.localPublicKey}|${payload}`
    if (this.hmacKey) {
      const sig = await HMACAuth.sign(this.hmacKey, authenticatedPayload)
      this.dataChannel.send(`${sig}|${authenticatedPayload}`)
    } else {
      this.dataChannel.send(authenticatedPayload)
    }
  }

  private async encryptPayload(data: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.sessionAesKey!,
      new TextEncoder().encode(data),
    )
    return `${b64encode(iv)}:${b64encode(new Uint8Array(cipher))}`
  }

  private async decryptPayload(payload: string): Promise<string | null> {
    if (!this.sessionAesKey) return null
    const sep = payload.indexOf(':')
    if (sep === -1) {
      console.warn('[P2PTransport] Missing AES-GCM IV separator')
      return null
    }
    try {
      const iv = b64decode(payload.slice(0, sep))
      const cipher = b64decode(payload.slice(sep + 1))
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.sessionAesKey,
        cipher,
      )
      return new TextDecoder().decode(plain)
    } catch {
      console.warn('[P2PTransport] Failed to decrypt session payload')
      return null
    }
  }

  async sendCallControl(data: any): Promise<void> {
    if (!this.callControlChannel || this.callControlChannel.readyState !== 'open') return
    let payload = JSON.stringify(data);
    if (this.obfuscationEnabled && this.sessionAesKey) {
      payload = await this.encryptPayload(payload);
    }
    const sequence = ++this.outgoingControlSequence
    const authenticatedPayload = `${sequence}|${this.localPublicKey}|${payload}`
    if (this.hmacKey) {
      const sig = await HMACAuth.sign(this.hmacKey, authenticatedPayload)
      this.callControlChannel.send(`${sig}|${authenticatedPayload}`)
    } else {
      this.callControlChannel.send(authenticatedPayload)
    }
  }

  disconnect(): void {
    this.stopped = true
    this.dataChannel?.close()
    this.dataChannel = null
    this.callControlChannel?.close()
    this.callControlChannel = null
    this.peerConnection?.close()
    this.peerConnection = null
    this.signalingWs?.close()
    this.signalingWs = null
    this.peerPublicKey = null
    this.hmacKey = null
    this.sessionAesKey = null
    this.seenEncryptedPayloads.clear()
    this.receiveChain = Promise.resolve()
    this.outgoingSequence = 0
    this.incomingSequence = 0
    this.outgoingControlSequence = 0
    this.incomingControlSequence = 0
    this.metadataSeq = 0
    this.seenMetadataSeqs.clear()
    this.localDhPrivateKey = null
    this.pendingCandidates = []
    this.localCandidates = []
    this.resolvePairingGather = null
    this.reconnectAttempts = 0
    this.outgoingStreams = [];
    this.pendingOutgoingTracks = [];
    this.localHandlesTracks = false;
    this.lastDhPubHex = null;
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
    if (!this.pairingMode) throw new Error('[P2PTransport] enablePairingMode() required')
    if (!this.identitySecretKey || !this.identityPublicKey) {
      throw new Error('[P2PTransport] identity keys required to pair')
    }
    const kp = generateX25519KeyPair()
    this.localDhPrivateKey = kp.secretKey
    const dhPub = buf2hex(kp.publicKey)
    this.peerPublicKey = this.localPublicKey

    this.preparePairingSession()
    this.createPeerConnection()
    this.dataChannel = this.peerConnection!.createDataChannel('messenger', { ordered: true })
    this.setupDataChannel()
    this.callControlChannel = this.peerConnection!.createDataChannel('call-control', { ordered: true })
    this.setupCallControlChannel()

    const offer = await this.peerConnection!.createOffer()
    await this.peerConnection!.setLocalDescription(offer)
    await this.waitForGather()
    const payload: LanPairingPayload = {
      peerId: this.localPublicKey,
      role: 'offer',
      dhPub,
      ...this.pairingIdentityFields(dhPub),
      sdp: this.peerConnection!.localDescription ?? offer,
    }
    return PAIRING_MAGIC + JSON.stringify(payload)
  }

  /**
   * Callee side: consume the caller's QR payload, derive shared keys, and
   * produce the answer QR payload. Fails closed (keys + connection rolled
   * back) on any malformed or unauthenticated payload.
   */
  async acceptPairingOffer(payloadStr: string): Promise<string> {
    if (!this.pairingMode) throw new Error('[P2PTransport] enablePairingMode() required')
    const payload = this.parsePairingPayload(payloadStr, 'offer')
    this.peerPublicKey = payload.peerId

    if (!payload.dhPub) throw this.failPairing('offer without dhPub (fail-closed)')

    this.preparePairingSession()
    this.createPeerConnection()
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    } catch {
      throw this.failPairing('invalid offer sdp')
    }
    const answer = await this.peerConnection!.createAnswer()
    await this.peerConnection!.setLocalDescription(answer)

    await this.authenticatePairing(payload)
    const ownKp = generateX25519KeyPair()
    this.localDhPrivateKey = ownKp.secretKey
    const myDhPub = buf2hex(ownKp.publicKey)
    const keyOk = await this.deriveSessionFromPeerDh(payload.dhPub)
    if (!keyOk) throw this.failPairing('session key derivation failed')

    await this.waitForGather()
    const answerPayload: LanPairingPayload = {
      peerId: this.localPublicKey,
      role: 'answer',
      dhPub: myDhPub,
      ...this.pairingIdentityFields(myDhPub),
      sdp: this.peerConnection!.localDescription ?? answer,
    }
    return PAIRING_MAGIC + JSON.stringify(answerPayload)
  }

  /** Caller side: consume the callee's answer QR payload to complete pairing. */
  async acceptPairingAnswer(payloadStr: string): Promise<void> {
    if (!this.pairingMode) throw new Error('[P2PTransport] enablePairingMode() required')
    const payload = this.parsePairingPayload(payloadStr, 'answer')
    this.peerPublicKey = payload.peerId

    if (!payload.dhPub || !this.localDhPrivateKey) throw this.failPairing('answer without dhPub (fail-closed)')

    await this.authenticatePairing(payload)
    const keyOk = await this.deriveSessionFromPeerDh(payload.dhPub)
    if (!keyOk) throw this.failPairing('session key derivation failed')
    try {
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    } catch {
      throw this.failPairing('invalid answer sdp')
    }
    for (const c of this.pendingCandidates) {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
    }
    this.pendingCandidates = []
  }

  /** Identity of the local transport for the current session, if any. */
  getSessionPeer(): string | null {
    return this.peerPublicKey
  }

  hasSessionKeys(): boolean {
    return Boolean(this.hmacKey && this.sessionAesKey)
  }

  private parsePairingPayload(payloadStr: string, expectedRole: 'offer' | 'answer'): LanPairingPayload {
    if (typeof payloadStr !== 'string' || !payloadStr.startsWith(PAIRING_MAGIC)) {
      throw new Error('[P2PTransport] invalid pairing payload: missing magic header')
    }
    let payload: any
    try {
      payload = JSON.parse(payloadStr.slice(PAIRING_MAGIC.length))
    } catch {
      throw new Error('[P2PTransport] invalid pairing payload: not JSON')
    }
    if (payload.role !== expectedRole) {
      throw new Error(`[P2PTransport] invalid pairing payload: expected role "${expectedRole}"`)
    }
    if (
      typeof payload.peerId !== 'string' ||
      typeof payload.dhPub !== 'string' ||
      !payload.sdp ||
      typeof payload.sdp.type !== 'string'
    ) {
      throw new Error('[P2PTransport] malformed pairing payload')
    }
    return payload as LanPairingPayload
  }

  private async authenticatePairing(payload: LanPairingPayload): Promise<void> {
    // Mandatory identity — a pairing payload without a signed ephemeral DH
    // key is refused outright (no confidentiality-only sessions anymore).
    if (!payload.identityPub || !payload.dhSig) {
      throw this.failPairing('offer without identity signature (fail-closed)')
    }
    const ok = await verifyOrPinPeer(payload.peerId, payload.identityPub, payload.dhPub, payload.dhSig)
    if (!ok) throw this.failPairing('peer identity authentication failed (TOFU)')
  }

  private pairingIdentityFields(dhPub: string): { identityPub: string; dhSig: string } {
    if (!this.identitySecretKey || !this.identityPublicKey) {
      throw new Error('[P2PTransport] identity keys required to pair')
    }
    return {
      identityPub: buf2hex(this.identityPublicKey),
      dhSig: signDh(this.identitySecretKey, dhPub),
    }
  }

  private preparePairingSession(): void {
    this.localCandidates = []
    this.resolvePairingGather = null
  }

  private async waitForGather(): Promise<void> {
    const pc = this.peerConnection
    if (pc && pc.iceGatheringState === 'complete') {
      return
    }
    await new Promise<void>((resolve) => {
      this.resolvePairingGather = resolve
      const safety = setTimeout(() => {
        if (this.resolvePairingGather === resolve) {
          this.resolvePairingGather = null
          resolve()
        }
      }, 5000)
      ;(safety as any).unref?.()
    })
  }

  private failPairing(reason: string): Error {
    this.peerPublicKey = null
    this.peerConnection?.close()
    this.peerConnection = null
    this.localDhPrivateKey = null
    this.hmacKey = null
    this.sessionAesKey = null
    this.pendingCandidates = []
    return new Error(`[P2PTransport] pairing failed: ${reason}`)
  }

  private createPeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.close()
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceTransportPolicy: this.isRelayOnly ? 'relay' : 'all',
    })

    this.peerConnection.onicecandidate = (event) => {
      if (this.pairingMode) {
        // Serverless mode: collect candidates locally; the last (null)
        // candidate marks the end of gathering and lets waitForGather() resolve.
        if (event.candidate) {
          this.localCandidates.push(event.candidate.toJSON())
        } else if (this.pairingMode) {
          this.resolvePairingGather?.()
        }
        return
      }
      if (event.candidate && this.peerPublicKey) {
        this.sendSignaling({
          type: 'ice-candidate',
          target: this.peerPublicKey,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection!.connectionState === 'connected') {
        if (this.peerPublicKey) {
          this.onConnected(this.peerPublicKey)
        }
      } else if (
        this.peerConnection!.connectionState === 'disconnected' ||
        this.peerConnection!.connectionState === 'failed'
      ) {
        if (this.peerPublicKey) {
          this.onDisconnected(this.peerPublicKey)
        }
      }
    }

    // Media added after the initial offer (e.g. attaching a call stream to an
    // already-established messenger session) requires renegotiation.
    this.peerConnection.onnegotiationneeded = async () => {
      const peer = this.peerPublicKey
      if (!peer || !this.lastDhPubHex || !this.peerConnection) return
      if (!this.identitySecretKey || !this.identityPublicKey) return // identity required
      try {
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)
        this.sendSignaling({
          type: 'offer',
          target: peer,
          sdp: offer,
          dhPub: this.lastDhPubHex,
          identityPub: buf2hex(this.identityPublicKey),
          dhSig: signDh(this.identitySecretKey, this.lastDhPubHex),
        })
      } catch {
        /* renegotiation failed — the session keeps working without the new media */
      }
    }

    this.peerConnection.ondatachannel = (event) => {
      if (event.channel.label === 'call-control') {
        this.callControlChannel = event.channel
        this.setupCallControlChannel()
      } else {
        this.dataChannel = event.channel
        this.setupDataChannel()
      }
    }

    if (!this.localHandlesTracks) {
      this.peerConnection.ontrack = (event) => {
        if (!this.mediaHandlers || !this.peerPublicKey) return;
        const stream = event.streams[0];
        if (!stream) return;
        this.mediaHandlers.onRemoteTrack(this.peerPublicKey, stream);
        const kind = event.track.kind as 'audio' | 'video';
        event.track.addEventListener('ended', () => {
          this.mediaHandlers?.onMediaEnded(this.peerPublicKey, kind);
        });
      };
      this.localHandlesTracks = true;
    }

    this.pendingOutgoingTracks.forEach((track) => this.peerConnection!.addTrack(track, new MediaStream([track])));
    this.pendingOutgoingTracks = [];
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return

    this.dataChannel.onopen = () => {
      if (this.peerPublicKey) {
        this.onConnected(this.peerPublicKey)
      }
    }

    this.dataChannel.onclose = () => {
      if (this.peerPublicKey) {
        this.onDisconnected(this.peerPublicKey)
      }
    }

    const processMessage = async (event: MessageEvent) => {
      let data = event.data as string

      if (this.hmacKey) {
        const pipeIdx = data.indexOf('|')
        if (pipeIdx === -1) {
          console.warn('[P2PTransport] Missing HMAC signature')
          return
        }
        const sigHex = data.slice(0, pipeIdx)
        const payload = data.slice(pipeIdx + 1)
        const valid = await HMACAuth.verify(this.hmacKey, payload, sigHex)
        if (!valid) {
          console.warn('[P2PTransport] Invalid HMAC signature')
          return
        }
        data = payload
      }

      const sequenceSeparator = data.indexOf('|')
      if (sequenceSeparator > 0) {
        const sequence = Number(data.slice(0, sequenceSeparator))
        if (Number.isSafeInteger(sequence) && sequence > 0) {
          if (sequence <= this.incomingSequence) return
          data = data.slice(sequenceSeparator + 1)
          const senderSeparator = data.indexOf('|')
          if (senderSeparator > 0) {
            const senderPublicKey = data.slice(0, senderSeparator)
            if (this.peerPublicKey && senderPublicKey !== this.peerPublicKey) return
            data = data.slice(senderSeparator + 1)
          }
          this.incomingSequence = sequence
        }
      }

      // AES-GCM payloads use a fresh IV per send, so an identical authenticated
      // payload is a replay of an already accepted frame.
      if (this.sessionAesKey) {
        if (this.seenEncryptedPayloads.has(data)) return
        this.seenEncryptedPayloads.add(data)
        if (this.seenEncryptedPayloads.size > 2048) {
          const oldest = this.seenEncryptedPayloads.values().next().value
          if (oldest) this.seenEncryptedPayloads.delete(oldest)
        }
      }

      if (this.obfuscationEnabled && this.sessionAesKey) {
        const plain = await this.decryptPayload(data)
        if (plain === null) return
        data = plain
      }

      this.onMessage(data)
    }

    this.dataChannel.onmessage = (event) => {
      this.receiveChain = this.receiveChain
        .then(() => processMessage(event))
        .catch((error) => console.warn('[P2PTransport] Receive processing failed', error))
    }

    this.dataChannel.onerror = (err) => {
      console.error('[P2PTransport] Data channel error:', err)
    }
  }

  private handleSignalingEvent = (event: MessageEvent) => {
    let msg: any
    try {
      msg = JSON.parse(event.data)
    } catch {
      return
    }
    this.handleSignalingMessage(msg).catch((err) =>
      console.error('[P2PTransport] Signaling handler error:', err),
    )
  }

  private async handleSignalingMessage(msg: any): Promise<void> {
    // Anti-replay defense-in-depth (server enforces authoritatively). A fresh
    // offer marks a new negotiation: reset the per-sender tracker (WebRTC
    // renegotiation legitimately restarts sequencing). Answer/ICE frames must
    // strictly increase within the negotiation; stale frames are dropped.
    if (Number.isInteger(msg.seq) && msg.seq > 0) {
      if (msg.type === 'offer') {
        this.incomingSignalingSeqs.set(msg.from, msg.seq)
      } else {
        const last = this.incomingSignalingSeqs.get(msg.from) ?? 0
        if (msg.seq <= last) {
          console.warn('[P2PTransport] Dropping stale signaling frame (anti-replay)')
          return
        }
        this.incomingSignalingSeqs.set(msg.from, msg.seq)
      }
    }
    switch (msg.type) {
      case 'offer':
        await this.handleOffer(msg)
        break
      case 'answer':
        await this.handleAnswer(msg)
        break
      case 'ice-candidate':
        await this.handleIceCandidate(msg)
        break
      case 'typing-indicator':
      case 'delivery-receipt':
      case 'online-status':
      case 'read-receipt': {
        if (Number.isInteger(msg.seq) && msg.seq > 0) {
          const last = this.seenMetadataSeqs.get(msg.type) ?? 0
          if (msg.seq <= last) {
            console.warn('[P2PTransport] Dropping stale metadata frame (anti-replay)')
            return
          }
          this.seenMetadataSeqs.set(msg.type, msg.seq)
        }
        this.handleMetadataSignal(msg.type, msg.data)
        break
      }
    }
  }

  private async handleOffer(msg: any): Promise<void> {
    this.peerPublicKey = msg.from

    if (!msg.dhPub) {
      console.warn('[P2PTransport] Rejecting offer without dhPub (fail-closed)')
      this.peerPublicKey = null
      this.peerConnection?.close()
      this.peerConnection = null
      this.localDhPrivateKey = null
      this.hmacKey = null
      this.sessionAesKey = null
      this.pendingCandidates = []
      return
    }

    // Mandatory identity: refuse an unsigned ephemeral DH key (MITM could
    // substitute its own key without admission). This closes the roadmap item
    // «обязательная криптографическая identity-проверка».
    if (!msg.identityPub || !msg.dhSig) {
      console.warn('[P2PTransport] Rejecting offer without identity signature (fail-closed)')
      this.peerPublicKey = null
      this.peerConnection?.close()
      this.peerConnection = null
      this.localDhPrivateKey = null
      this.hmacKey = null
      this.sessionAesKey = null
      this.pendingCandidates = []
      return
    }
    if (!this.identitySecretKey || !this.identityPublicKey) {
      console.warn('[P2PTransport] Rejecting offer: local identity keys missing (fail-closed)')
      this.peerPublicKey = null
      this.peerConnection?.close()
      this.peerConnection = null
      this.localDhPrivateKey = null
      this.hmacKey = null
      this.sessionAesKey = null
      this.pendingCandidates = []
      return
    }

    // Renegotiation (media added to an established session): handle before
    // createPeerConnection — recreating the connection would tear down the data
    // channel. Session keys are not re-derived; only the SDP is exchanged.
    if (this.peerConnection && this.peerConnection.currentRemoteDescription) {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp))
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)
        this.sendSignaling({
          type: 'answer',
          target: msg.from,
          sdp: answer,
          dhPub: this.lastDhPubHex ?? undefined,
          ...this.pairingIdentityFields(this.lastDhPubHex ?? ''),
        })
        return
      } catch {
        console.warn('[P2PTransport] Renegotiation failed; falling back to full offer handling')
      }
    }

    this.createPeerConnection()

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sdp))

    const answer = await this.peerConnection!.createAnswer()
    await this.peerConnection!.setLocalDescription(answer)

    // Authenticate the caller's DH key against its pinned identity (TOFU).
    // The identity signature is now mandatory (checked above) — verify here.
    const peerId = msg.from ?? ''
    const idOk = await verifyOrPinPeer(peerId, msg.identityPub, msg.dhPub, msg.dhSig)
    if (!idOk) {
      console.warn('[P2PTransport] Peer identity/HMAC authentication failed; rejecting offer')
      this.peerPublicKey = null
      this.peerConnection?.close()
      this.peerConnection = null
      this.localDhPrivateKey = null
      this.hmacKey = null
      this.sessionAesKey = null
      this.pendingCandidates = []
      return
    }
    const ownKp = generateX25519KeyPair()
    this.localDhPrivateKey = ownKp.secretKey
    const myDhPub = buf2hex(ownKp.publicKey)
    this.lastDhPubHex = myDhPub
    await this.deriveSessionFromPeerDh(msg.dhPub)
    const myIdentityPub = buf2hex(this.identityPublicKey)
    const myDhSig = signDh(this.identitySecretKey, myDhPub)
    this.sendSignaling({
      type: 'answer',
      target: msg.from,
      sdp: answer,
      dhPub: myDhPub,
      identityPub: myIdentityPub,
      dhSig: myDhSig,
    })

    for (const c of this.pendingCandidates) {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
    }
    this.pendingCandidates = []
  }

  private async handleAnswer(msg: any): Promise<void> {
    if (!msg.dhPub || !this.localDhPrivateKey) {
      console.warn('[P2PTransport] Rejecting answer without dhPub (fail-closed)')
      this.peerPublicKey = null
      this.peerConnection?.close()
      this.peerConnection = null
      this.localDhPrivateKey = null
      this.hmacKey = null
      this.sessionAesKey = null
      this.pendingCandidates = []
      return
    }

    // Authenticate the callee's DH key against its pinned identity (TOFU).
    // Mandatory: an unsigned answer is refused (identity check closed).
    if (!msg.identityPub || !msg.dhSig) {
      console.warn('[P2PTransport] Rejecting answer without identity signature (fail-closed)')
      this.peerPublicKey = null
      this.peerConnection?.close()
      this.peerConnection = null
      this.localDhPrivateKey = null
      this.hmacKey = null
      this.sessionAesKey = null
      this.pendingCandidates = []
      return
    }
    {
      const peerId = this.peerPublicKey ?? ''
      const ok = await verifyOrPinPeer(peerId, msg.identityPub, msg.dhPub, msg.dhSig)
      if (!ok) {
        console.warn('[P2PTransport] Peer identity/HMAC authentication failed; rejecting answer')
        this.peerPublicKey = null
        this.peerConnection?.close()
        this.peerConnection = null
        this.localDhPrivateKey = null
        this.hmacKey = null
        this.sessionAesKey = null
        this.pendingCandidates = []
        return
      }
    }
    await this.deriveSessionFromPeerDh(msg.dhPub)

    await this.peerConnection!.setRemoteDescription(
      new RTCSessionDescription(msg.sdp),
    )

    for (const c of this.pendingCandidates) {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
    }
    this.pendingCandidates = []
  }

  private async handleIceCandidate(msg: any): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.currentRemoteDescription) {
      this.pendingCandidates.push(msg.candidate)
      return
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate))
    } catch (err) {
      console.error('[P2PTransport] Failed to add ICE candidate:', err)
    }
  }

  private handleWsClose(): void {
    if (this.stopped) return
    if (this.peerPublicKey) {
      this.onDisconnected(this.peerPublicKey)
    }
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      // Exponential backoff capped at 30s (house pattern, matches
      // signaling/manager.ts) — avoids reconnect thundering herds after a
      // signaling outage instead of hammering the relay at fixed 1s intervals.
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000)
      setTimeout(() => this.connect(), delay)
    }
  }

  private sendSignaling(data: object): void {
    if (this.signalingWs?.readyState === WebSocket.OPEN) {
      this.signalingSeq++
      this.signalingWs.send(JSON.stringify({
        ...data,
        seq: this.signalingSeq,
      }))
    }
  }

  sendMetadataSignal(type: MetadataSignalType, data?: any): void {
    if (this.signalingWs?.readyState !== WebSocket.OPEN) return
    this.signalingWs.send(JSON.stringify({
      type,
      target: this.peerPublicKey,
      data,
      seq: ++this.metadataSeq,
    }))
  }

  onMetadataSignal(handler: (type: MetadataSignalType, data: any) => void): void {
    this.metadataSignalHandlers.add(handler)
  }

  handleMetadataSignal(type: MetadataSignalType, data: any): void {
    for (const handler of this.metadataSignalHandlers) {
      handler(type, data)
    }
  }
}
