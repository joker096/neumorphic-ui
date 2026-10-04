import type { ActiveCall, CallEventType, CallEventHandler } from './types';
import type { CallSignalFrame } from '../p2p/chatFrame';

/** Time (ms) a call stays in `connecting` before being marked `connected`. */
export const CONNECT_DELAY_MS = 1500;

/** Time (ms) a demoted call stays `reconnecting` before surfacing a network error. */
export const NETWORK_ERROR_TIMEOUT_MS = 10_000;

/**
 * Shared mutable state of the `callManager` singleton. The session, signaling,
 * network-monitor, recording and control logic lives in sibling modules that
 * operate on this object, so the manager class stays a thin façade. Fields stay
 * flat on the instance (regression tests read them directly).
 */
export interface CallManagerInternals {
  activeCall: ActiveCall | null;
  pendingPeerStreams: Map<string, MediaStream>;
  handlers: Set<CallEventHandler>;
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  localStream: MediaStream | null;
  incomingTimer: ReturnType<typeof setTimeout> | null;
  networkErrorTimer: ReturnType<typeof setTimeout> | null;
  qualityLevel: number | null;
  emit(type: CallEventType, data?: any): void;
  updateStore(call: ActiveCall | null): void;
  getMixedStream(): MediaStream;
  handleRemoteTrack(peerKey: string, stream: MediaStream): void;
  handleRemoteCallSignal(peerId: string, frame: CallSignalFrame): void;
}
