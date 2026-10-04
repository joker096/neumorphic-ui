import { useAppStore } from '../../store';
import type { ActiveCall, CallEventType, CallEventHandler, CallPeer, CallType, DeviceCheckResult } from './types';
import type { CallSignalFrame } from '../p2p/chatFrame';
import {
  CONNECT_DELAY_MS as CALL_CONNECT_DELAY_MS,
  NETWORK_ERROR_TIMEOUT_MS as CALL_NETWORK_ERROR_TIMEOUT_MS,
  type CallManagerInternals,
} from './callManagerInternals';
import { checkDevices as checkDevicesImpl } from './callDevices';
import {
  markConnected as markConnectedImpl,
  markReconnecting as markReconnectingImpl,
  trackQuality as trackQualityImpl,
} from './callNetworkMonitor';
import {
  handleRemoteCallSignal as handleRemoteCallSignalImpl,
  handleRemoteTrack as handleRemoteTrackImpl,
} from './callInbound';
import {
  acceptCall as acceptCallImpl,
  answerIncoming as answerIncomingImpl,
  endCall as endCallImpl,
  rejectIncoming as rejectIncomingImpl,
  startCall as startCallImpl,
  startIncomingCall as startIncomingCallImpl,
  startPreviewCall as startPreviewCallImpl,
} from './callSession';
import {
  changeCallType as changeCallTypeImpl,
  flipCamera as flipCameraImpl,
  toggleMute as toggleMuteImpl,
  toggleScreenShare as toggleScreenShareImpl,
  toggleSpeaker as toggleSpeakerImpl,
  toggleVideo as toggleVideoImpl,
} from './callControls';
import { toggleRecording as toggleRecordingImpl } from './callRecording';

/**
 * Call façade. Holds the singleton state (see `callManagerInternals.ts`) and
 * delegates every operation to the sibling modules: session lifecycle,
 * signaling, network monitoring, recording and in-call controls.
 */
class CallManager implements CallManagerInternals {
  private static instance: CallManager | null = null;
  activeCall: ActiveCall | null = null;
  pendingPeerStreams = new Map<string, MediaStream>();
  handlers = new Set<CallEventHandler>();
  isScreenSharing = false;
  screenStream: MediaStream | null = null;
  localStream: MediaStream | null = null;
  incomingTimer: ReturnType<typeof setTimeout> | null = null;
  networkErrorTimer: ReturnType<typeof setTimeout> | null = null;
  qualityLevel: number | null = null;

  /** Time (ms) a call stays in `connecting` before being marked `connected`. */
  static readonly CONNECT_DELAY_MS = CALL_CONNECT_DELAY_MS;

  /** Time (ms) a demoted call stays `reconnecting` before surfacing a network error. */
  static readonly NETWORK_ERROR_TIMEOUT_MS = CALL_NETWORK_ERROR_TIMEOUT_MS;

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

  emit(type: CallEventType, data?: any) {
    this.handlers.forEach((h) => {
      try { h({ type, data }); } catch (e) { console.error(`call-manager: ${type} handler error`, e); }
    });
  }

  updateStore(call: ActiveCall | null) {
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

  getMixedStream(): MediaStream {
    const tracks: MediaStreamTrack[] = [];
    if (this.localStream) tracks.push(...this.localStream.getTracks());
    if (this.screenStream) tracks.push(...this.screenStream.getTracks());
    this.pendingPeerStreams.forEach((s) => tracks.push(...s.getTracks()));
    return new MediaStream(tracks);
  }

  private markReconnecting() { markReconnectingImpl(this); }

  private markConnected() { markConnectedImpl(this); }

  private trackQuality(latencyMs: number) { trackQualityImpl(this, latencyMs); }

  checkDevices(): Promise<DeviceCheckResult> {
    return checkDevicesImpl();
  }

  handleRemoteCallSignal(peerId: string, frame: CallSignalFrame): void {
    handleRemoteCallSignalImpl(this, peerId, frame);
  }

  handleRemoteTrack(peerKey: string, stream: MediaStream): void {
    handleRemoteTrackImpl(this, peerKey, stream);
  }

  async startCall(
    peerId: string,
    displayName: string,
    callType: CallType = 'audio',
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    return startCallImpl(this, peerId, displayName, callType, participants);
  }

  async startPreviewCall(
    peerId: string,
    displayName: string,
    callType: CallType = 'audio',
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    return startPreviewCallImpl(this, peerId, displayName, callType, participants);
  }

  async acceptCall(
    peerId: string,
    displayName: string,
    callType: CallType,
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    return acceptCallImpl(this, peerId, displayName, callType, participants);
  }

  async endCall(): Promise<void> {
    return endCallImpl(this);
  }

  startIncomingCall(peerId: string, displayName: string, callType: 'audio' | 'video' = 'audio', timeoutMs = 30000): void {
    startIncomingCallImpl(this, peerId, displayName, callType, timeoutMs);
  }

  async answerIncoming(forceType?: 'audio' | 'video'): Promise<ActiveCall | null> {
    return answerIncomingImpl(this, forceType);
  }

  rejectIncoming(): void {
    rejectIncomingImpl(this);
  }

  async toggleMute(): Promise<boolean> {
    return toggleMuteImpl(this);
  }

  async toggleVideo(): Promise<boolean> {
    return toggleVideoImpl(this);
  }

  async toggleScreenShare(): Promise<boolean> {
    return toggleScreenShareImpl(this);
  }

  async changeCallType(newType: CallType): Promise<boolean> {
    return changeCallTypeImpl(this, newType);
  }

  async toggleSpeaker(): Promise<boolean> {
    return toggleSpeakerImpl(this);
  }

  async flipCamera(): Promise<boolean> {
    return flipCameraImpl(this);
  }

  async toggleRecording(): Promise<boolean> {
    return toggleRecordingImpl(this);
  }

  getActiveCall(): ActiveCall | null {
    return this.activeCall;
  }
}

export const callManager = CallManager.getInstance();
