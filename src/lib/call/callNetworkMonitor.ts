import { CALL_NETWORK_QUALITY_MS } from '../../constants/callConstants';
import type { CallManagerInternals } from './callManagerInternals';
import { CONNECT_DELAY_MS, NETWORK_ERROR_TIMEOUT_MS } from './callManagerInternals';
import { maybeAutoStartRecording } from './callRecording';

/**
 * Marks an active `connected` call as `reconnecting` when the transport or
 * browser network drops. No-op for other statuses.
 */
export function markReconnecting(self: CallManagerInternals): void {
  const call = self.activeCall;
  if (!call || call.status !== 'connected') return;
  self.qualityLevel = null;
  self.activeCall = { ...call, status: 'reconnecting' };
  self.updateStore(self.activeCall);
  self.emit('call:reconnecting', { call: self.activeCall });
  armNetworkErrorTimer(self);
}

/** Restores an active `reconnecting`/`error` call to `connected` when the network recovers. */
export function markConnected(self: CallManagerInternals): void {
  const call = self.activeCall;
  if (!call || (call.status !== 'reconnecting' && call.status !== 'error')) return;
  clearNetworkErrorTimer(self);
  self.activeCall = { ...call, status: 'connected' };
  self.updateStore(self.activeCall);
  self.emit('call:reconnected', { call: self.activeCall });
}

/**
 * Arms the network-error timer once, when a call is demoted to `reconnecting`.
 * If the call is not restored before it fires, it is marked `error`.
 */
export function armNetworkErrorTimer(self: CallManagerInternals): void {
  if (self.networkErrorTimer) return;
  self.networkErrorTimer = setTimeout(() => {
    self.networkErrorTimer = null;
    const call = self.activeCall;
    if (!call || call.status !== 'reconnecting') return;
    self.activeCall = { ...call, status: 'error' };
    self.updateStore(self.activeCall);
    self.emit('call:network-error', { call: self.activeCall });
  }, NETWORK_ERROR_TIMEOUT_MS);
}

export function clearNetworkErrorTimer(self: CallManagerInternals): void {
  if (self.networkErrorTimer) {
    clearTimeout(self.networkErrorTimer);
    self.networkErrorTimer = null;
  }
}

/**
 * Tracks the in-call network quality level (3 good / 2 fair / 1 poor) derived
 * from the transport latency and emits `call:quality` when it changes. The
 * first reading after (re)connect is the baseline so the bar is not
 * re-announced.
 */
export function trackQuality(self: CallManagerInternals, latencyMs: number): void {
  const call = self.activeCall;
  if (!call || call.status !== 'connected') {
    self.qualityLevel = null;
    return;
  }
  const level = latencyMs < CALL_NETWORK_QUALITY_MS.good ? 3 : latencyMs < CALL_NETWORK_QUALITY_MS.fair ? 2 : 1;
  if (self.qualityLevel === null) {
    self.qualityLevel = level;
    return;
  }
  if (level === self.qualityLevel) return;
  self.qualityLevel = level;
  self.emit('call:quality', { level });
}

/** Flips a `connecting` call to `connected` after a short simulated handshake. */
export function scheduleConnected(self: CallManagerInternals, callId: string): void {
  setTimeout(() => {
    const call = self.activeCall;
    if (!call || call.callId !== callId || call.status !== 'connecting') return;
    self.activeCall = { ...call, status: 'connected' };
    self.updateStore(self.activeCall);
    self.emit('call:accepted', { call: self.activeCall });
    void maybeAutoStartRecording(self);
  }, CONNECT_DELAY_MS);
}
