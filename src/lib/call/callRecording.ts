import { nanoid } from 'nanoid';
import { callRecorderService } from '../../lib/callRecorderService';
import { useAppStore } from '../../store';
import type { ActiveCall } from './types';
import type { CallManagerInternals } from './callManagerInternals';

/**
 * Auto-starts recording once a call is connected when the "Record calls
 * automatically" setting is on and the matching save-recording toggle is
 * enabled. Skips preview/demo calls (no real tracks). Failure to start is
 * silent — the call keeps running without a recording.
 */
export async function maybeAutoStartRecording(self: CallManagerInternals): Promise<void> {
  const call = self.activeCall;
  if (!call || call.isPreview || call.isRecording) return;
  const store = useAppStore.getState();
  if (!store.autoRecordCalls) return;
  const keep = call.callType === 'audio' ? store.saveAudioRecordings : store.saveVideoRecordings;
  if (!keep) return;
  try {
    const stream = self.getMixedStream();
    if (stream.getTracks().length === 0) return;
    const recordingId = nanoid();
    const ok = await callRecorderService.startRecording(recordingId, stream, call.callType !== 'audio');
    if (!ok) return;
    if (self.activeCall?.callId !== call.callId) return;
    self.activeCall = { ...call, isRecording: true, recordingId };
    self.updateStore(self.activeCall);
    self.emit('call:recording-toggled', { recording: true });
  } catch {
    /* recorder unavailable — the call keeps running without a recording */
  }
}

export function logCallToHistory(self: CallManagerInternals, call: ActiveCall): void {
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

export async function toggleRecording(self: CallManagerInternals): Promise<boolean> {
  if (!self.activeCall) return false;
  if (self.activeCall.isRecording) {
    callRecorderService.stopRecording();
    // Keep recordingId so the call history can link to the saved recording.
    self.activeCall = { ...self.activeCall, isRecording: false };
    self.updateStore(self.activeCall);
    self.emit('call:recording-toggled', { recording: false });
    return false;
  }

  const recordingId = nanoid();
  const stream = self.getMixedStream();
  const ok = await callRecorderService.startRecording(recordingId, stream, self.activeCall.callType !== 'audio');
  if (!ok) return false;

  self.activeCall = { ...self.activeCall, isRecording: true, recordingId };
  self.updateStore(self.activeCall);
  self.emit('call:recording-toggled', { recording: true });
  return true;
}
