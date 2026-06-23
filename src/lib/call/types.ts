export type CallType = 'audio' | 'video' | 'screen';
export type CallDirection = 'incoming' | 'outgoing';
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended';
export type CallRole = 'initiator' | 'answerer';

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
  | 'call:error';

export type CallEventHandler = (event: { type: CallEventType; data?: any }) => void;
