import { HMACAuth } from './HMACAuth'

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
  private isRelayOnly = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private pendingCandidates: RTCIceCandidateInit[] = []
  private metadataSignalHandlers: Set<(type: MetadataSignalType, data: any) => void> = new Set()
  private mediaHandlers: CallMediaHandlers | null = null
  private outgoingStreams: MediaStream[] = []
  private pendingOutgoingTracks: MediaStreamTrack[] = []
  private localHandlesTracks = false

  constructor(config: P2PTransportConfig) {
    this.signalingUrl = config.signalingUrl
    this.localPublicKey = config.localPublicKey
    this.onMessage = config.onMessage
    this.onConnected = config.onConnected
    this.onDisconnected = config.onDisconnected
    this.iceServers = config.iceServers ?? [
      { urls: 'stun:stun.l.google.com:19302' },
    ]
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

    return new Promise((resolve, reject) => {
      try {
        this.signalingWs = new WebSocket(this.signalingUrl)
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
        const msg = JSON.parse(event.data)
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
    if (!this.signalingWs || this.signalingWs.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to signaling server. Call connect() first.')
    }

    this.peerPublicKey = peerPublicKey
    this.hmacKey = await HMACAuth.generateKey()

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
      hmacKey: this.hmacKey,
    })
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

  send(data: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[P2PTransport] Data channel not open')
      return
    }

    if (this.hmacKey) {
      HMACAuth.sign(this.hmacKey, data).then((sig) => {
        this.dataChannel!.send(`${sig}|${data}`)
      })
    } else {
      this.dataChannel.send(data)
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

      this.onMessage(data)
    }

    this.dataChannel.onerror = (err) => {
      console.error('[P2PTransport] Data channel error:', err)
    }
  }

  private handleSignalingEvent = (event: MessageEvent) => {
    const msg = JSON.parse(event.data)
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
    this.hmacKey = msg.hmacKey || null

    this.createPeerConnection()

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(msg.sdp))

    const answer = await this.peerConnection!.createAnswer()
    await this.peerConnection!.setLocalDescription(answer)

    this.sendSignaling({
      type: 'answer',
      target: msg.from,
      sdp: answer,
      hmacKey: this.hmacKey,
    })

    for (const c of this.pendingCandidates) {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(c))
    }
    this.pendingCandidates = []
  }

  private async handleAnswer(msg: any): Promise<void> {
    if (msg.hmacKey) {
      this.hmacKey = msg.hmacKey
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
