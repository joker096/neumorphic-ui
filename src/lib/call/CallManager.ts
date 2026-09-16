import { nanoid } from 'nanoid';
import { callRecorderService } from '../../lib/callRecorderService';
import { useAppStore } from '../../store';
import { CALL_NETWORK_QUALITY_MS } from '../../constants/callConstants';
import { p2pNetwork } from '../p2p/network';
import { encodeCallSignal, nextFrameSeq, type CallSignalFrame } from '../p2p/chatFrame';
import type { P2PTransport } from '../p2p/P2PTransport';
import type { CallPeer, CallEventType, CallEventHandler, ActiveCall, CallType, CallErrorReason, DeviceCheckResult, IncomingCall } from './types';

class CallManager {
  private static instance: CallManager | null = null;
  private activeCall: ActiveCall | null = null;
  private pendingPeerStreams = new Map<string, MediaStream>();
  private handlers = new Set<CallEventHandler>();
  private isScreenSharing = false;
  private screenStream: MediaStream | null = null;
  private localStream: MediaStream | null = null;
  private isRecording = false;
  private incomingTimer: ReturnType<typeof setTimeout> | null = null;
  private networkErrorTimer: ReturnType<typeof setTimeout> | null = null;
  private qualityLevel: number | null = null;

  /** Time (ms) a call stays in `connecting` before being marked `connected`. */
  static readonly CONNECT_DELAY_MS = 1500;

  /** Time (ms) a demoted call stays `reconnecting` before surfacing a network error. */
  static readonly NETWORK_ERROR_TIMEOUT_MS = 10_000;

  constructor() {
    CallManager.instance = this;
    useAppStore.subscribe((state, prev) => {
      if (state.connectionStatus !== prev.connectionStatus) {
        if (state.connectionStatus === 'connected') this.markConnected();
        else if (prev.connectionStatus === 'connected') this.markReconnecting();
      }
      if (state.latencyMs !== prev.latencyMs) this.trackQuality(state.latencyMs);
    });
    window.addEventListener('offline', () => this.markReconnecting());
    window.addEventListener('online', () => this.markConnected());
  }

  static getInstance(): CallManager {
    if (!CallManager.instance) CallManager.instance = new CallManager();
    return CallManager.instance;
  }

  subscribe(handler: CallEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(type: CallEventType, data?: any) {
    this.handlers.forEach((h) => {
      try { h({ type, data }); } catch (e) { console.error(`call-manager: ${type} handler error`, e); }
    });
  }

  private updateStore(call: ActiveCall | null) {
    useAppStore.getState().setActiveCall(
      call
        ? {
            callId: call.callId,
            direction: call.direction,
            status: call.status,
            callType: call.callType,
            remotePeer: call.remotePeer,
            localStream: call.localStream,
            screenStream: call.screenStream,
            isMuted: call.isMuted,
            isSpeaker: call.isSpeaker,
            isVideoEnabled: call.isVideoEnabled,
            isVideo: call.callType === 'video' || call.callType === 'screen',
            isRecording: call.isRecording,
            startTime: call.startTime,
            participants: call.participants,
            recordingId: call.recordingId,
            isPreview: call.isPreview,
          }
        : null,
    );
    this.activeCall = call;
  }

  /**
   * Requests camera/microphone access. On failure emits `call:error` with a
   * user-facing reason and rethrows so callers keep their existing rejection flow.
   */
  private async acquireLocalStream(callType: CallType): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType !== 'audio',
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      const reason: CallErrorReason =
        name === 'NotAllowedError'
          ? 'permission'
          : name === 'NotFoundError'
            ? 'no-device'
            : name === 'NotReadableError' || name === 'OverconstrainedError'
              ? 'device-busy'
              : 'unknown';
      this.emit('call:error', { reason });
      throw err;
    }
  }

  /**
   * Reports which media devices are available. Used before starting a call so
   * a missing microphone/camera is caught before the peer is rung.
   */
  async checkDevices(): Promise<DeviceCheckResult> {
    const md = navigator.mediaDevices;
    if (!md) return { supported: false, hasAudio: false, hasVideo: false };
    try {
      const devices = await md.enumerateDevices();
      return {
        supported: true,
        hasAudio: devices.some((d) => d.kind === 'audioinput'),
        hasVideo: devices.some((d) => d.kind === 'videoinput'),
      };
    } catch {
      // Enumeration can fail before permission is granted; fall through so
      // getUserMedia surfaces the real error.
      return { supported: true, hasAudio: true, hasVideo: true };
    }
  }

  /**
   * Blocks the call start when the required devices are missing. Emits
   * `call:error` and throws so callers keep their rejection flow.
   */
  private async assertDevicesAvailable(callType: CallType) {
    const md = navigator.mediaDevices;
    if (!md) {
      this.emit('call:error', { reason: 'unknown' });
      throw new DOMException('Media devices unsupported', 'UnknownError');
    }
    let devices: MediaDeviceInfo[];
    try {
      devices = await md.enumerateDevices();
    } catch {
      return;
    }
    if (devices.length === 0) return; // can't determine without permission — getUserMedia decides
    const hasAudio = devices.some((d) => d.kind === 'audioinput');
    const hasVideo = devices.some((d) => d.kind === 'videoinput');
    if (!hasAudio || (callType !== 'audio' && !hasVideo)) {
      this.emit('call:error', { reason: 'no-device' });
      throw new DOMException('Required device missing', 'NotFoundError');
    }
  }

  /**
   * Marks an active `connected` call as `reconnecting` when the transport or
   * browser network drops. No-op for other statuses.
   */
  private markReconnecting() {
    const call = this.activeCall;
    if (!call || call.status !== 'connected') return;
    this.qualityLevel = null;
    this.activeCall = { ...call, status: 'reconnecting' };
    this.updateStore(this.activeCall);
    this.emit('call:reconnecting', { call: this.activeCall });
    this.armNetworkErrorTimer();
  }

  /** Restores an active `reconnecting`/`error` call to `connected` when the network recovers. */
  private markConnected() {
    const call = this.activeCall;
    if (!call || (call.status !== 'reconnecting' && call.status !== 'error')) return;
    this.clearNetworkErrorTimer();
    this.activeCall = { ...call, status: 'connected' };
    this.updateStore(this.activeCall);
    this.emit('call:reconnected', { call: this.activeCall });
  }

  /**
   * Arms the network-error timer once, when a call is demoted to `reconnecting`.
   * If the call is not restored before it fires, it is marked `error`.
   */
  private armNetworkErrorTimer() {
    if (this.networkErrorTimer) return;
    this.networkErrorTimer = setTimeout(() => {
      this.networkErrorTimer = null;
      const call = this.activeCall;
      if (!call || call.status !== 'reconnecting') return;
      this.activeCall = { ...call, status: 'error' };
      this.updateStore(this.activeCall);
      this.emit('call:network-error', { call: this.activeCall });
    }, CallManager.NETWORK_ERROR_TIMEOUT_MS);
  }

  private clearNetworkErrorTimer() {
    if (this.networkErrorTimer) {
      clearTimeout(this.networkErrorTimer);
      this.networkErrorTimer = null;
    }
  }

  /**
   * Tracks the in-call network quality level (3 good / 2 fair / 1 poor) derived
   * from the transport latency and emits `call:quality` when it changes. The
   * first reading after (re)connect is the baseline so the bar is not
   * re-announced.
   */
  private trackQuality(latencyMs: number) {
    const call = this.activeCall;
    if (!call || call.status !== 'connected') {
      this.qualityLevel = null;
      return;
    }
    const level = latencyMs < CALL_NETWORK_QUALITY_MS.good ? 3 : latencyMs < CALL_NETWORK_QUALITY_MS.fair ? 2 : 1;
    if (this.qualityLevel === null) {
      this.qualityLevel = level;
      return;
    }
    if (level === this.qualityLevel) return;
    this.qualityLevel = level;
    this.emit('call:quality', { level });
  }

  /** Flips a `connecting` call to `connected` after a short simulated handshake. */
  private scheduleConnected(callId: string) {
    setTimeout(() => {
      const call = this.activeCall;
      if (!call || call.callId !== callId || call.status !== 'connecting') return;
      this.activeCall = { ...call, status: 'connected' };
      this.updateStore(this.activeCall);
      this.emit('call:accepted', { call: this.activeCall });
      void this.maybeAutoStartRecording();
    }, CallManager.CONNECT_DELAY_MS);
  }

  /** Wire-level peer ids are 64/128-char hex Ed25519 keys; uuid chat ids stay simulated. */
  private isRealPeer(peerId: string): boolean {
    return /^[0-9a-f]{64,128}$/i.test(peerId);
  }

  private async realTransportFor(peerId: string): Promise<P2PTransport | null> {
    if (!this.isRealPeer(peerId) || !p2pNetwork.isReady()) return null;
    let transport = p2pNetwork.getTransport(peerId);
    if (!transport) {
      try {
        await p2pNetwork.connect(peerId);
      } catch {
        return null;
      }
      transport = p2pNetwork.getTransport(peerId);
    }
    return transport && p2pNetwork.isConnected(peerId) ? transport : null;
  }

  private attachMediaHandlers(transport: P2PTransport) {
    transport.attachMediaHandlers({
      onRemoteTrack: (peerId, stream) => this.handleRemoteTrack(peerId, stream),
      onCallClosed: (peerId) => this.handleRemoteCallSignal(peerId, { type: 'call-end', seq: nextFrameSeq(), callId: '', timestamp: Date.now() }),
      onMediaEnded: () => {},
    });
  }

  /**
   * Establishes a real WebRTC leg for an outgoing call when the peer id is a
   * wire identity key: connects/attaches the P2P transport, sends local media
   * tracks and rings the peer over the messenger data channel. Best-effort —
   * any failure leaves the simulated handshake in place.
   */
  private async tryStartRealTransport(peerId: string, callId: string, callType: CallType) {
    try {
      const transport = await this.realTransportFor(peerId);
      if (!transport) return;
      this.attachMediaHandlers(transport);
      if (this.localStream) await transport.addOutgoingStream(this.localStream);
      const wireType: 'audio' | 'video' = callType === 'screen' ? 'video' : callType;
      await p2pNetwork.sendTo(peerId, encodeCallSignal({ type: 'call-ring', seq: nextFrameSeq(), callId, callType: wireType, timestamp: Date.now() }));
    } catch {
      /* no transport — keep the simulated call path */
    }
  }

  /** Mirrors `tryStartRealTransport` for an answered incoming call. */
  private async tryAcceptRealTransport(peerId: string, callId: string, callType: CallType) {
    try {
      const transport = await this.realTransportFor(peerId);
      if (!transport) return;
      this.attachMediaHandlers(transport);
      if (this.localStream) await transport.addOutgoingStream(this.localStream);
      const wireType: 'audio' | 'video' = callType === 'screen' ? 'video' : callType;
      await p2pNetwork.sendTo(peerId, encodeCallSignal({ type: 'call-accept', seq: nextFrameSeq(), callId, callType: wireType, timestamp: Date.now() }));
    } catch {
      /* no transport — keep the simulated call path */
    }
  }

  /** Attaches an inbound remote media stream to the matching live call. */
  private handleRemoteTrack(peerKey: string, stream: MediaStream) {
    const call = this.activeCall;
    if (call && call.remotePeer.peerId === peerKey) {
      const participants = call.participants.map((p) =>
        p.peerId === peerKey ? { ...p, stream } : p,
      );
      this.activeCall = {
        ...call,
        status: call.status === 'connecting' ? 'connected' : call.status,
        remotePeer: { ...call.remotePeer, stream },
        participants,
      };
      this.updateStore(this.activeCall);
      if (call.status === 'connecting') {
        this.emit('call:accepted', { call: this.activeCall });
        void this.maybeAutoStartRecording();
      } else {
        this.emit('call:peer-joined', { call: this.activeCall });
      }
      return;
    }
    this.pendingPeerStreams.set(peerKey, stream);
  }

  /** Handles `call1:` ring/accept/end frames routed to the call manager. */
  handleRemoteCallSignal(peerId: string, frame: CallSignalFrame) {
    if (frame.type === 'call-ring') {
      const current = this.activeCall;
      if (current) {
        p2pNetwork.sendTo(peerId, encodeCallSignal({ type: 'call-end', seq: nextFrameSeq(), callId: frame.callId, timestamp: Date.now() })).catch(() => {});
        return;
      }
      const name = p2pNetwork.getPeerName(peerId) ?? peerId.slice(0, 8);
      this.startIncomingCall(peerId, name, frame.callType ?? 'audio');
      return;
    }
    if (frame.type === 'call-accept') {
      const call = this.activeCall;
      if (!call || call.remotePeer.peerId !== peerId || call.status !== 'connecting') return;
      this.activeCall = { ...call, status: 'connected' };
      this.updateStore(this.activeCall);
      this.emit('call:accepted', { call: this.activeCall });
      void this.maybeAutoStartRecording();
      return;
    }
    if (frame.type === 'call-end') {
      const call = this.activeCall;
      if (call && call.remotePeer.peerId === peerId) void this.endCall();
      else useAppStore.getState().setIncomingCall(null);
    }
  }

  /**
   * Auto-starts recording once a call is connected when the "Record calls
   * automatically" setting is on and the matching save-recording toggle is
   * enabled. Skips preview/demo calls (no real tracks). Failure to start is
   * silent — the call keeps running without a recording.
   */
  private async maybeAutoStartRecording(): Promise<void> {
    const call = this.activeCall;
    if (!call || call.isPreview || call.isRecording) return;
    const store = useAppStore.getState();
    if (!store.autoRecordCalls) return;
    const keep = call.callType === 'audio' ? store.saveAudioRecordings : store.saveVideoRecordings;
    if (!keep) return;
    try {
      const stream = this.getMixedStream();
      if (stream.getTracks().length === 0) return;
      const recordingId = nanoid();
      const ok = await callRecorderService.startRecording(recordingId, stream, call.callType !== 'audio');
      if (!ok) return;
      if (this.activeCall?.callId !== call.callId) return;
      this.activeCall = { ...call, isRecording: true, recordingId };
      this.updateStore(this.activeCall);
      this.emit('call:recording-toggled', { recording: true });
    } catch {
      /* recorder unavailable — the call keeps running without a recording */
    }
  }

  async startCall(
    peerId: string,
    displayName: string,
    callType: CallType = 'audio',
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    if (this.activeCall) await this.endCall();
    await this.assertDevicesAvailable(callType);
    const callId = nanoid();
    this.localStream = await this.acquireLocalStream(callType);
    const call: ActiveCall = {
      callId,
      direction: 'outgoing',
      status: 'connecting',
      callType,
      remotePeer: { peerId, displayName },
      localStream: this.localStream,
      screenStream: null,
      isMuted: false,
      isSpeaker: false,
      isVideoEnabled: callType !== 'audio',
      isVideo: callType === 'video' || callType === 'screen',
      isRecording: false,
      startTime: Date.now(),
      participants: [this.localPeer(peerId, displayName), ...participants],
    };
    this.updateStore(call);
    this.scheduleConnected(callId);
    this.emit('call:accepted', { call });
    void this.tryStartRealTransport(peerId, callId, callType);
    return call;
  }

  /**
   * Starts a preview/demo call without requesting camera/microphone access.
   * Routes through the same state pipeline as a real call so the full CallScreen
   * (driven by `useCall`) renders, and in-call toggles mutate this active call.
   */
  async startPreviewCall(
    peerId: string,
    displayName: string,
    callType: CallType = 'audio',
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    if (this.activeCall) await this.endCall();
    const call: ActiveCall = {
      callId: `preview_${nanoid()}`,
      direction: 'outgoing',
      status: 'connecting',
      callType,
      remotePeer: { peerId, displayName },
      localStream: null,
      screenStream: null,
      isMuted: false,
      isSpeaker: false,
      isVideoEnabled: callType !== 'audio',
      isVideo: callType === 'video' || callType === 'screen',
      isRecording: false,
      startTime: Date.now(),
      participants: [this.localPeer(peerId, displayName), ...participants],
      isPreview: true,
    };
    this.activeCall = call;
    this.updateStore(call);
    this.scheduleConnected(call.callId);
    this.emit('call:accepted', { call });
    return call;
  }

  async acceptCall(
    peerId: string,
    displayName: string,
    callType: CallType,
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    if (this.activeCall) await this.endCall();
    await this.assertDevicesAvailable(callType);
    const callId = nanoid();
    this.localStream = await this.acquireLocalStream(callType);
    const call: ActiveCall = {
      callId,
      direction: 'incoming',
      status: 'connecting',
      callType,
      remotePeer: { peerId, displayName },
      localStream: this.localStream,
      screenStream: null,
      isMuted: false,
      isSpeaker: false,
      isVideoEnabled: callType !== 'audio',
      isVideo: callType === 'video' || callType === 'screen',
      isRecording: false,
      startTime: Date.now(),
      participants: [this.localPeer(peerId, displayName), ...participants],
    };
    this.updateStore(call);
    this.scheduleConnected(callId);
    this.emit('call:accepted', { call });
    void this.tryAcceptRealTransport(peerId, callId, callType);
    return call;
  }

  async endCall(): Promise<void> {
    const prev = this.activeCall;
    if (prev && this.isRealPeer(prev.remotePeer.peerId)) {
      p2pNetwork
        .sendTo(prev.remotePeer.peerId, encodeCallSignal({ type: 'call-end', seq: nextFrameSeq(), callId: prev.callId, timestamp: Date.now() }))
        .catch(() => {});
    }
    if (this.activeCall?.isRecording && this.activeCall?.recordingId) {
      callRecorderService.stopRecording();
    }
    this.clearNetworkErrorTimer();
    this.qualityLevel = null;
    this.stopTracks();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    this.isScreenSharing = false;
    this.updateStore(null);
    this.pendingPeerStreams.clear();
    if (prev) {
      this.logCallToHistory(prev);
      this.emit('call:ended', { callId: prev.callId });
    }
  }

  private logCallToHistory(call: ActiveCall) {
    const store = useAppStore.getState();
    const name = call.remotePeer?.displayName || '';
    const type: 'missed' | 'incoming' | 'outgoing' | 'declined' =
      call.direction === 'incoming' ? 'incoming' : 'outgoing';
    let duration: string | undefined;
    if (call.status === 'connected') {
      const total = Math.max(0, Math.floor((Date.now() - (call.startTime || Date.now())) / 1000));
      const m = Math.floor(total / 60);
      const s = total % 60;
      duration = `${m}m ${s}s`;
    }
    store.addCallToHistory({ name, type, duration, recordingId: call.recordingId });
  }

  /**
   * Rings an incoming call (sheet overlay). If nobody answers within
   * `timeoutMs`, it is logged to the call history as `missed`.
   */
  startIncomingCall(peerId: string, displayName: string, callType: 'audio' | 'video' = 'audio', timeoutMs = 30000) {
    if (this.incomingTimer) clearTimeout(this.incomingTimer);
    const store = useAppStore.getState();
    store.setIncomingCall({ peerId, displayName, callType });
    this.incomingTimer = setTimeout(() => {
      this.incomingTimer = null;
      const current = useAppStore.getState().incomingCall;
      if (!current || current.peerId !== peerId) return;
      useAppStore.getState().setIncomingCall(null);
      useAppStore.getState().addCallToHistory({ name: displayName, type: 'missed' });
    }, timeoutMs);
  }

  /**
   * Accepts the ringing incoming call (optionally forcing a call type).
   * The sheet stays open when access fails so the user can retry or reject.
   */
  async answerIncoming(forceType?: 'audio' | 'video'): Promise<ActiveCall | null> {
    const incoming = useAppStore.getState().incomingCall;
    if (!incoming) return null;
    const call = await this.acceptCall(incoming.peerId, incoming.displayName, forceType ?? incoming.callType);
    useAppStore.getState().setIncomingCall(null);
    return call;
  }

  /** Rejects the ringing incoming call; logged to history as `declined`. */
  rejectIncoming() {
    const incoming = useAppStore.getState().incomingCall;
    if (!incoming) return;
    useAppStore.getState().setIncomingCall(null);
    useAppStore.getState().addCallToHistory({ name: incoming.displayName, type: 'declined' });
    if (this.isRealPeer(incoming.peerId)) {
      p2pNetwork
        .sendTo(incoming.peerId, encodeCallSignal({ type: 'call-end', seq: nextFrameSeq(), callId: '', timestamp: Date.now() }))
        .catch(() => {});
    }
    this.emit('call:rejected', { peerId: incoming.peerId });
  }

  async toggleMute(): Promise<boolean> {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;
    const next = !(this.activeCall?.isMuted ?? false);
    audioTrack.enabled = !next;
    if (this.activeCall) {
      this.activeCall = { ...this.activeCall, isMuted: next };
      this.updateStore(this.activeCall);
      this.emit('call:mute-toggled', { muted: next });
    }
    return next;
  }

  async toggleVideo(): Promise<boolean> {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;
    const next = !(this.activeCall?.isVideoEnabled ?? false);
    videoTrack.enabled = !next;
    if (this.activeCall) {
      this.activeCall = { ...this.activeCall, isVideoEnabled: next };
      this.updateStore(this.activeCall);
      this.emit('call:video-toggled', { enabled: next });
    }
    return next;
  }

  async toggleScreenShare(): Promise<boolean> {
    if (this.isScreenSharing) {
      if (this.screenStream) this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
      this.isScreenSharing = false;
      this.emit('call:screen-share-toggled', { sharing: false });
      return false;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.toggleScreenShare().catch(() => {});
      });
      this.isScreenSharing = true;
      this.emit('call:screen-share-toggled', { sharing: true });
      return true;
    } catch {
      return false;
    }
  }

  async changeCallType(newType: CallType): Promise<boolean> {
    if (!this.activeCall) return false;
    if (newType === this.activeCall.callType) return true;

    try {
      if (newType === 'video' && !this.localStream?.getVideoTracks().length) {
        const track = await this.acquireVideoTrack();
        if (this.localStream && track) this.localStream.addTrack(track);
      } else {
        this.localStream?.getVideoTracks().forEach((t) => (t.enabled = newType !== 'audio'));
      }
    } catch {
      return false;
    }
    const isVideo = newType === 'video' || newType === 'screen';
    this.activeCall = {
      ...this.activeCall,
      callType: newType,
      isVideoEnabled: isVideo,
      isVideo: isVideo,
    };
    this.updateStore(this.activeCall);
    this.emit('call:accepted', { call: this.activeCall });
    return true;
  }

  /**
   * Requests a camera track for an in-call audio→video switch. The companion
   * audio track from the request is stopped so only the live one remains.
   */
  private async acquireVideoTrack(): Promise<MediaStreamTrack | null> {
    const stream = await this.acquireLocalStream('video');
    const videoTrack = stream.getVideoTracks()[0];
    stream.getTracks().forEach((t) => {
      if (t.kind !== 'video') t.stop();
    });
    return videoTrack ?? null;
  }

  async toggleSpeaker(): Promise<boolean> {
    if (!this.activeCall) return false;
    const next = !this.activeCall.isSpeaker;
    this.activeCall = { ...this.activeCall, isSpeaker: next };
    this.updateStore(this.activeCall);
    this.emit('call:accepted', { call: this.activeCall });
    return next;
  }

  /** Swaps between front/user and environment cameras for a video call. */
  async flipCamera(): Promise<boolean> {
    if (!this.localStream || !this.activeCall) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;
    try {
      const current = videoTrack.getSettings().facingMode ?? 'user';
      const nextFacing = current === 'user' ? 'environment' : 'user';
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      const newTrack = newStream.getVideoTracks()[0];
      videoTrack.stop();
      const tracks = this.localStream.getTracks().filter((t) => t.kind !== 'video');
      tracks.push(newTrack);
      this.localStream = new MediaStream(tracks);
      this.activeCall = { ...this.activeCall, localStream: this.localStream };
      this.updateStore(this.activeCall);
      this.emit('call:video-toggled', { enabled: true });
      return true;
    } catch {
      return false;
    }
  }

  async toggleRecording(): Promise<boolean> {
    if (!this.activeCall) return false;
    if (this.activeCall.isRecording) {
      callRecorderService.stopRecording();
      // Keep recordingId so the call history can link to the saved recording.
      this.activeCall = { ...this.activeCall, isRecording: false };
      this.updateStore(this.activeCall);
      this.emit('call:recording-toggled', { recording: false });
      return false;
    }

    const recordingId = nanoid();
    const stream = this.getMixedStream();
    const ok = await callRecorderService.startRecording(recordingId, stream, this.activeCall.callType !== 'audio');
    if (!ok) return false;

    this.activeCall = { ...this.activeCall, isRecording: true, recordingId };
    this.updateStore(this.activeCall);
    this.emit('call:recording-toggled', { recording: true });
    return true;
  }

  private getMixedStream(): MediaStream {
    const tracks: MediaStreamTrack[] = [];
    if (this.localStream) tracks.push(...this.localStream.getTracks());
    if (this.screenStream) tracks.push(...this.screenStream.getTracks());
    this.pendingPeerStreams.forEach((s) => tracks.push(...s.getTracks()));
    return new MediaStream(tracks);
  }

  private localPeer(peerId: string, displayName: string): CallPeer {
    return {
      peerId,
      displayName,
      stream: this.localStream || undefined,
    };
  }

  private stopTracks() {
    this.pendingPeerStreams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    this.pendingPeerStreams.clear();
  }

  getActiveCall(): ActiveCall | null {
    return this.activeCall;
  }
}

export const callManager = CallManager.getInstance();
