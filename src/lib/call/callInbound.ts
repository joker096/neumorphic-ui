import { p2pNetwork } from '../p2p/network';
import { encodeCallSignal, nextFrameSeq, type CallSignalFrame } from '../p2p/chatFrame';
import { useAppStore } from '../../store';
import type { CallManagerInternals } from './callManagerInternals';
import { maybeAutoStartRecording } from './callRecording';
import { endCall, startIncomingCall } from './callSession';

/** Attaches an inbound remote media stream to the matching live call. */
export function handleRemoteTrack(self: CallManagerInternals, peerKey: string, stream: MediaStream): void {
  const call = self.activeCall;
  if (call && call.remotePeer.peerId === peerKey) {
    const participants = call.participants.map((p) =>
      p.peerId === peerKey ? { ...p, stream } : p,
    );
    self.activeCall = {
      ...call,
      status: call.status === 'connecting' ? 'connected' : call.status,
      remotePeer: { ...call.remotePeer, stream },
      participants,
    };
    self.updateStore(self.activeCall);
    if (call.status === 'connecting') {
      self.emit('call:accepted', { call: self.activeCall });
      void maybeAutoStartRecording(self);
    } else {
      self.emit('call:peer-joined', { call: self.activeCall });
    }
    return;
  }
  self.pendingPeerStreams.set(peerKey, stream);
}

/** Handles `call1:` ring/accept/end frames routed to the call manager. */
export function handleRemoteCallSignal(self: CallManagerInternals, peerId: string, frame: CallSignalFrame): void {
  if (frame.type === 'call-ring') {
    const current = self.activeCall;
    if (current) {
      p2pNetwork.sendTo(peerId, encodeCallSignal({ type: 'call-end', seq: nextFrameSeq(), callId: frame.callId, timestamp: Date.now() })).catch(() => {});
      return;
    }
    const name = p2pNetwork.getPeerName(peerId) ?? peerId.slice(0, 8);
    startIncomingCall(self, peerId, name, frame.callType ?? 'audio');
    return;
  }
  if (frame.type === 'call-accept') {
    const call = self.activeCall;
    if (!call || call.remotePeer.peerId !== peerId || call.status !== 'connecting') return;
    self.activeCall = { ...call, status: 'connected' };
    self.updateStore(self.activeCall);
    self.emit('call:accepted', { call: self.activeCall });
    void maybeAutoStartRecording(self);
    return;
  }
  if (frame.type === 'call-end') {
    const call = self.activeCall;
    if (call && call.remotePeer.peerId === peerId) void endCall(self);
    else useAppStore.getState().setIncomingCall(null);
  }
}
