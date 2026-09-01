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
  private maxReconnectAttempts = 5
  private pendingCandidates: RTCIceCandidateInit[] = []
  private metadataSignalHandlers: Set<(type: MetadataSignalType, data: any) => void> = new Set()
  private mediaHandlers: CallMediaHandlers | null = null
  private outgoingStreams: MediaStream[] = []
  private pendingOutgoingTracks: MediaStreamTrack[] = []
  private localHandlesTracks = false
  private obfuscationEnabled = true
  private sessionAesKey: CryptoKey | null = null
  private identitySecretKey: Uint8Array | null = null
  private identityPublicKey: Uint8Array | null = null

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

      this.signalingWs.onopen = () => {
        this.signalingWs!.send(
          JSON.stringify({
            type: 'register',
            publicKey: this.localPublicKey,
          }),
        )
      }

      this.signalingWs.onmessage = (event) => {
        let msg: any
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }
        if (msg.type === 'registered') {
          this.signalingWs!.onmessage = this.handleSignalingEvent
          this.reconnectAttempts = 0
          resolve()
        } else if (msg.type === 'error') {
          reject(new Error(msg.message))
        }
      }

      this.signalingWs.onerror = () => {
        reject(new Error('WebSocket connection failed'))
      }

      this.signalingWs.onclose = () => {
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

    // Authenticate this session's DH public key with our persistent Ed25519
    // identity so a signaling-layer MITM cannot substitute keys.
    let identityPub: string | undefined
    let dhSig: string | undefined
    if (this.identitySecretKey && this.identityPublicKey) {
      identityPub = buf2hex(this.identityPublicKey)
      dhSig = signDh(this.identitySecretKey, dhPub)
    }

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
        const msg = JSON.parse(event.data);
        this.handleCallControlMessage(msg);
      } catch {
        // ignore
      }
    };
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
      console.warn('[P2PTransport] Data channel not open')
      return
    }

    let payload = data;
    if (this.obfuscationEnabled && this.sessionAesKey) {
      payload = await this.encryptPayload(data);
    }

    if (this.hmacKey) {
      HMACAuth.sign(this.hmacKey, payload)
        .then((sig) => {
          this.dataChannel!.send(`${sig}|${payload}`)
        })
        .catch((e) => console.warn('[P2PTransport] HMAC sign failed', e))
    } else {
      this.dataChannel.send(payload)
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

  sendCallControl(data: any): void {
    if (!this.callControlChannel || this.callControlChannel.readyState !== 'open') return
    this.callControlChannel.send(JSON.stringify(data));
  }

  disconnect(): void {
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
    this.localDhPrivateKey = null
    this.pendingCandidates = []
    this.reconnectAttempts = 0
    this.outgoingStreams = [];
    this.pendingOutgoingTracks = [];
    this.localHandlesTracks = false;
  }

  setRelayOnly(enabled: boolean): void {
    this.isRelayOnly = enabled
  }

  setIceServers(servers: RTCIceServer[]): void {
    this.iceServers = servers
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

    this.dataChannel.onmessage = async (event) => {
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

      if (this.obfuscationEnabled && this.sessionAesKey) {
        const plain = await this.decryptPayload(data)
        if (plain === null) return
        data = plain
      }

      this.onMessage(data)
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
    }
  }

  private async handleOffer(msg: any): Promise<void> {
    this.peerPublicKey = msg.from

    this.createPeerConnection()

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sdp))

    const answer = await this.peerConnection!.createAnswer()
    await this.peerConnection!.setLocalDescription(answer)

    // Derive the shared HMAC key from the caller's ephemeral DH public key.
    // The HMAC key is derived locally and never transmitted.
    if (msg.dhPub) {
      // Authenticate the caller's DH key against its pinned identity (TOFU).
      if (msg.identityPub && msg.dhSig) {
        const peerId = this.peerPublicKey ?? msg.from ?? ''
        const ok = await verifyOrPinPeer(peerId, msg.identityPub, msg.dhPub, msg.dhSig)
        if (!ok) {
          console.warn('[P2PTransport] Peer identity/HMAC authentication failed; rejecting offer')
          return
        }
      }
      const ownKp = generateX25519KeyPair()
      this.localDhPrivateKey = ownKp.secretKey
      const myDhPub = buf2hex(ownKp.publicKey)
      await this.deriveSessionFromPeerDh(msg.dhPub)
      let myIdentityPub: string | undefined
      let myDhSig: string | undefined
      if (this.identitySecretKey && this.identityPublicKey) {
        myIdentityPub = buf2hex(this.identityPublicKey)
        myDhSig = signDh(this.identitySecretKey, myDhPub)
      }
      this.sendSignaling({
        type: 'answer',
        target: msg.from,
        sdp: answer,
        dhPub: myDhPub,
        identityPub: myIdentityPub,
        dhSig: myDhSig,
      })
    } else {
      // Insecure plaintext HMAC fallback removed: the keys must be derived
      // from ECDH and are never transmitted. Proceed without authentication/encryption.
      this.hmacKey = null
      this.sessionAesKey = null
      this.sendSignaling({
        type: 'answer',
        target: msg.from,
        sdp: answer,
      })
    }

    for (const c of this.pendingCandidates) {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
    }
    this.pendingCandidates = []
  }

  private async handleAnswer(msg: any): Promise<void> {
    if (msg.dhPub && this.localDhPrivateKey) {
      // Authenticate the callee's DH key against its pinned identity (TOFU).
      if (msg.identityPub && msg.dhSig) {
        const peerId = this.peerPublicKey ?? ''
        const ok = await verifyOrPinPeer(peerId, msg.identityPub, msg.dhPub, msg.dhSig)
        if (!ok) {
          console.warn('[P2PTransport] Peer identity/HMAC authentication failed; rejecting answer')
          this.hmacKey = null
          this.sessionAesKey = null
          return
        }
      }
      await this.deriveSessionFromPeerDh(msg.dhPub)
    } else {
      // Insecure plaintext HMAC fallback removed.
      this.hmacKey = null
      this.sessionAesKey = null
    }

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
    if (this.peerPublicKey) {
      this.onDisconnected(this.peerPublicKey)
    }
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * this.reconnectAttempts, 5000)
      setTimeout(() => this.connect(), delay)
    }
  }

  private sendSignaling(data: object): void {
    if (this.signalingWs?.readyState === WebSocket.OPEN) {
      this.signalingWs.send(JSON.stringify(data))
    }
  }

  sendMetadataSignal(type: MetadataSignalType, data?: any): void {
    if (this.signalingWs?.readyState !== WebSocket.OPEN) return
    this.signalingWs.send(JSON.stringify({
      type,
      target: this.peerPublicKey,
      data,
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
