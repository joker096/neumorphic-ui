export type CallType = 'audio' | 'video' | 'screen';
export type CallDirection = 'incoming' | 'outgoing';
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'ended';

export interface IncomingCall {
  peerId: string;
  displayName: string;
  callType: 'audio' | 'video';
}
export interface CallPeer {
  peerId: string;
  displayName?: string;
  stream?: MediaStream;
}

export interface ActiveCall {
  callId: string;
  direction: CallDirection;
  status: CallStatus;
  callType: CallType;
  remotePeer: CallPeer;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isSpeaker: boolean;
  isVideoEnabled: boolean;
  isVideo: boolean;
  isRecording: boolean;
  startTime: number;
  number?: string;
  participants: CallPeer[];
  recordingId?: string;
  isPreview?: boolean;
}

export type CallErrorReason = 'permission' | 'no-device' | 'device-busy' | 'unknown';

export interface DeviceCheckResult {
  supported: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
}

export type CallEventType =
  | 'call:incoming'
  | 'call:accepted'
  | 'call:rejected'
  | 'call:ended'
  | 'call:mute-toggled'
  | 'call:video-toggled'
  | 'call:screen-share-toggled'
  | 'call:recording-toggled'
  | 'call:peer-joined'
  | 'call:peer-left'
  | 'call:error'
  | 'call:reconnecting'
  | 'call:reconnected'
  | 'call:network-error'
  | 'call:quality';

export type CallEventHandler = (event: { type: CallEventType; data?: any }) => void;
