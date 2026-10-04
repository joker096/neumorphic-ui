import { nanoid } from 'nanoid';
import { callRecorderService } from '../../lib/callRecorderService';
import { useAppStore } from '../../store';
import { p2pNetwork } from '../p2p/network';
import { encodeCallSignal, nextFrameSeq } from '../p2p/chatFrame';
import type { ActiveCall, CallPeer, CallType } from './types';
import type { CallManagerInternals } from './callManagerInternals';
import { acquireLocalStream, assertDevicesAvailable } from './callDevices';
import { clearNetworkErrorTimer, scheduleConnected } from './callNetworkMonitor';
import { isRealPeer, tryAcceptRealTransport, tryStartRealTransport } from './callSignaling';
import { logCallToHistory } from './callRecording';

function localPeer(self: CallManagerInternals, peerId: string, displayName: string): CallPeer {
  return {
    peerId,
    displayName,
    stream: self.localStream || undefined,
  };
}

function stopTracks(self: CallManagerInternals): void {
  self.pendingPeerStreams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
  self.pendingPeerStreams.clear();
}

export async function startCall(
  self: CallManagerInternals,
  peerId: string,
  displayName: string,
  callType: CallType = 'audio',
  participants: CallPeer[] = [],
): Promise<ActiveCall> {
  if (self.activeCall) await endCall(self);
  await assertDevicesAvailable(self, callType);
  const callId = nanoid();
  self.localStream = await acquireLocalStream(self, callType);
  const call: ActiveCall = {
    callId,
    direction: 'outgoing',
    status: 'connecting',
    callType,
    remotePeer: { peerId, displayName },
    localStream: self.localStream,
    screenStream: null,
    isMuted: false,
    isSpeaker: false,
    isVideoEnabled: callType !== 'audio',
    isVideo: callType === 'video' || callType === 'screen',
    isRecording: false,
    startTime: Date.now(),
    participants: [localPeer(self, peerId, displayName), ...participants],
  };
  self.updateStore(call);
  scheduleConnected(self, callId);
  self.emit('call:accepted', { call });
  void tryStartRealTransport(self, peerId, callId, callType);
  return call;
}

/**
 * Starts a preview/demo call without requesting camera/microphone access.
 * Routes through the same state pipeline as a real call so the full CallScreen
 * (driven by `useCall`) renders, and in-call toggles mutate this active call.
 */
export async function startPreviewCall(
  self: CallManagerInternals,
  peerId: string,
  displayName: string,
  callType: CallType = 'audio',
  participants: CallPeer[] = [],
): Promise<ActiveCall> {
  if (self.activeCall) await endCall(self);
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
    participants: [localPeer(self, peerId, displayName), ...participants],
    isPreview: true,
  };
  self.activeCall = call;
  self.updateStore(call);
  scheduleConnected(self, call.callId);
  self.emit('call:accepted', { call });
  return call;
}

export async function acceptCall(
  self: CallManagerInternals,
  peerId: string,
  displayName: string,
  callType: CallType,
  participants: CallPeer[] = [],
): Promise<ActiveCall> {
  if (self.activeCall) await endCall(self);
  await assertDevicesAvailable(self, callType);
  const callId = nanoid();
  self.localStream = await acquireLocalStream(self, callType);
  const call: ActiveCall = {
    callId,
    direction: 'incoming',
    status: 'connecting',
    callType,
    remotePeer: { peerId, displayName },
    localStream: self.localStream,
    screenStream: null,
    isMuted: false,
    isSpeaker: false,
    isVideoEnabled: callType !== 'audio',
    isVideo: callType === 'video' || callType === 'screen',
    isRecording: false,
    startTime: Date.now(),
    participants: [localPeer(self, peerId, displayName), ...participants],
  };
  self.updateStore(call);
  scheduleConnected(self, callId);
  self.emit('call:accepted', { call });
  void tryAcceptRealTransport(self, peerId, callId, callType);
  return call;
}

export async function endCall(self: CallManagerInternals): Promise<void> {
  const prev = self.activeCall;
  if (prev && isRealPeer(prev.remotePeer.peerId)) {
    p2pNetwork
      .sendTo(prev.remotePeer.peerId, encodeCallSignal({ type: 'call-end', seq: nextFrameSeq(), callId: prev.callId, timestamp: Date.now() }))
      .catch(() => {});
  }
  if (self.activeCall?.isRecording && self.activeCall?.recordingId) {
    callRecorderService.stopRecording();
  }
  clearNetworkErrorTimer(self);
  self.qualityLevel = null;
  stopTracks(self);
  if (self.localStream) {
    self.localStream.getTracks().forEach((t) => t.stop());
    self.localStream = null;
  }
  if (self.screenStream) {
    self.screenStream.getTracks().forEach((t) => t.stop());
    self.screenStream = null;
  }
  self.isScreenSharing = false;
  self.updateStore(null);
  self.pendingPeerStreams.clear();
  if (prev) {
    logCallToHistory(self, prev);
    self.emit('call:ended', { callId: prev.callId });
  }
}

/**
 * Rings an incoming call (sheet overlay). If nobody answers within
 * `timeoutMs`, it is logged to the call history as `missed`.
 */
export function startIncomingCall(
  self: CallManagerInternals,
  peerId: string,
  displayName: string,
  callType: 'audio' | 'video' = 'audio',
  timeoutMs = 30000,
): void {
  if (self.incomingTimer) clearTimeout(self.incomingTimer);
  const store = useAppStore.getState();
  store.setIncomingCall({ peerId, displayName, callType });
  self.incomingTimer = setTimeout(() => {
    self.incomingTimer = null;
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
export async function answerIncoming(self: CallManagerInternals, forceType?: 'audio' | 'video'): Promise<ActiveCall | null> {
  const incoming = useAppStore.getState().incomingCall;
  if (!incoming) return null;
  const call = await acceptCall(self, incoming.peerId, incoming.displayName, forceType ?? incoming.callType);
  useAppStore.getState().setIncomingCall(null);
  return call;
}

/** Rejects the ringing incoming call; logged to history as `declined`. */
export function rejectIncoming(self: CallManagerInternals): void {
  const incoming = useAppStore.getState().incomingCall;
  if (!incoming) return;
  useAppStore.getState().setIncomingCall(null);
  useAppStore.getState().addCallToHistory({ name: incoming.displayName, type: 'declined' });
  if (isRealPeer(incoming.peerId)) {
    p2pNetwork
      .sendTo(incoming.peerId, encodeCallSignal({ type: 'call-end', seq: nextFrameSeq(), callId: '', timestamp: Date.now() }))
      .catch(() => {});
  }
  self.emit('call:rejected', { peerId: incoming.peerId });
}
