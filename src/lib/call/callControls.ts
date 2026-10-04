import type { CallType } from './types';
import type { CallManagerInternals } from './callManagerInternals';
import { acquireVideoTrack } from './callDevices';

export async function toggleMute(self: CallManagerInternals): Promise<boolean> {
  if (!self.localStream) return false;
  const audioTrack = self.localStream.getAudioTracks()[0];
  if (!audioTrack) return false;
  const next = !(self.activeCall?.isMuted ?? false);
  audioTrack.enabled = !next;
  if (self.activeCall) {
    self.activeCall = { ...self.activeCall, isMuted: next };
    self.updateStore(self.activeCall);
    self.emit('call:mute-toggled', { muted: next });
  }
  return next;
}

export async function toggleVideo(self: CallManagerInternals): Promise<boolean> {
  if (!self.localStream) return false;
  const videoTrack = self.localStream.getVideoTracks()[0];
  if (!videoTrack) return false;
  const next = !(self.activeCall?.isVideoEnabled ?? false);
  videoTrack.enabled = !next;
  if (self.activeCall) {
    self.activeCall = { ...self.activeCall, isVideoEnabled: next };
    self.updateStore(self.activeCall);
    self.emit('call:video-toggled', { enabled: next });
  }
  return next;
}

export async function toggleScreenShare(self: CallManagerInternals): Promise<boolean> {
  if (self.isScreenSharing) {
    if (self.screenStream) self.screenStream.getTracks().forEach((t) => t.stop());
    self.screenStream = null;
    self.isScreenSharing = false;
    self.emit('call:screen-share-toggled', { sharing: false });
    return false;
  }

  try {
    self.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    self.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
      toggleScreenShare(self).catch(() => {});
    });
    self.isScreenSharing = true;
    self.emit('call:screen-share-toggled', { sharing: true });
    return true;
  } catch {
    return false;
  }
}

export async function changeCallType(self: CallManagerInternals, newType: CallType): Promise<boolean> {
  if (!self.activeCall) return false;
  if (newType === self.activeCall.callType) return true;

  try {
    if (newType === 'video' && !self.localStream?.getVideoTracks().length) {
      const track = await acquireVideoTrack(self);
      if (self.localStream && track) self.localStream.addTrack(track);
    } else {
      self.localStream?.getVideoTracks().forEach((t) => (t.enabled = newType !== 'audio'));
    }
  } catch {
    return false;
  }
  const isVideo = newType === 'video' || newType === 'screen';
  self.activeCall = {
    ...self.activeCall,
    callType: newType,
    isVideoEnabled: isVideo,
    isVideo: isVideo,
  };
  self.updateStore(self.activeCall);
  self.emit('call:accepted', { call: self.activeCall });
  return true;
}

export async function toggleSpeaker(self: CallManagerInternals): Promise<boolean> {
  if (!self.activeCall) return false;
  const next = !self.activeCall.isSpeaker;
  self.activeCall = { ...self.activeCall, isSpeaker: next };
  self.updateStore(self.activeCall);
  self.emit('call:accepted', { call: self.activeCall });
  return next;
}

/** Swaps between front/user and environment cameras for a video call. */
export async function flipCamera(self: CallManagerInternals): Promise<boolean> {
  if (!self.localStream || !self.activeCall) return false;
  const videoTrack = self.localStream.getVideoTracks()[0];
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
    const tracks = self.localStream.getTracks().filter((t) => t.kind !== 'video');
    tracks.push(newTrack);
    self.localStream = new MediaStream(tracks);
    self.activeCall = { ...self.activeCall, localStream: self.localStream };
    self.updateStore(self.activeCall);
    self.emit('call:video-toggled', { enabled: true });
    return true;
  } catch {
    return false;
  }
}
