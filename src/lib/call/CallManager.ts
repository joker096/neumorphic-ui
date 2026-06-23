import { nanoid } from 'nanoid';
import { callRecorderService } from '../../lib/callRecorderService';
import { useAppStore } from '../../store';
import type { CallPeer, CallEventType, CallEventHandler, ActiveCall, CallType } from './types';

class CallManager {
  private static instance: CallManager | null = null;
  private activeCall: ActiveCall | null = null;
  private pendingPeerStreams = new Map<string, MediaStream>();
  private handlers = new Set<CallEventHandler>();
  private isScreenSharing = false;
  private screenStream: MediaStream | null = null;
  private localStream: MediaStream | null = null;
  private isRecording = false;

  constructor() {
    CallManager.instance = this;
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
          }
        : null,
    );
    this.activeCall = call;
  }

  async startCall(
    peerId: string,
    displayName: string,
    callType: CallType = 'audio',
    participants: CallPeer[] = [],
  ): Promise<ActiveCall> {
    if (this.activeCall) await this.endCall();
    const callId = nanoid();
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType !== 'audio',
    });
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
    const callId = nanoid();
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType !== 'audio',
    });
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
    this.emit('call:accepted', { call });
    return call;
  }

  async endCall(): Promise<void> {
    if (this.activeCall?.isRecording && this.activeCall?.recordingId) {
      callRecorderService.stopRecording();
    }
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
    const prev = this.activeCall;
    this.updateStore(null);
    this.pendingPeerStreams.clear();
    if (prev) this.emit('call:ended', { callId: prev.callId });
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

  async toggleRecording(): Promise<boolean> {
    if (!this.activeCall) return false;
    if (this.activeCall.isRecording) {
      callRecorderService.stopRecording();
      this.activeCall = { ...this.activeCall, isRecording: false, recordingId: undefined };
      this.updateStore(this.activeCall);
      this.emit('call:recording-toggled', { recording: false });
      return false;
    }

    const recordingId = this.activeCall.recordingId || nanoid();
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
