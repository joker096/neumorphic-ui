import { useEffect, useState, useCallback } from 'react';
import { callManager } from '../lib/call/CallManager';
import type { ActiveCall, CallEventType } from '../lib/call/types';

export const useCall = () => {
  const [call, setCall] = useState<ActiveCall | null>(callManager.getActiveCall());

  useEffect(() => {
    const unsub = callManager.subscribe((event: { type: CallEventType; data?: any }) => {
      switch (event.type) {
        case 'call:accepted':
        case 'call:peer-joined':
        case 'call:mute-toggled':
        case 'call:video-toggled':
        case 'call:screen-share-toggled':
        case 'call:recording-toggled':
          setCall(callManager.getActiveCall());
          break;
        case 'call:ended':
          setCall(null);
          break;
        default:
          break;
      }
    });
    return unsub;
  }, []);

  const startCall = useCallback(
    async (peerId: string, displayName: string, callType: 'audio' | 'video' = 'audio') => {
      const c = await callManager.startCall(peerId, displayName, callType);
      setCall(c);
      return c;
    },
    [],
  );

  const acceptCall = useCallback(
    async (peerId: string, displayName: string, callType: 'audio' | 'video') => {
      const c = await callManager.acceptCall(peerId, displayName, callType);
      setCall(c);
      return c;
    },
    [],
  );

  const endCall = useCallback(async () => {
    await callManager.endCall();
    setCall(null);
  }, []);

  const toggleMute = useCallback(async () => {
    await callManager.toggleMute();
    setCall(callManager.getActiveCall());
  }, []);

  const toggleVideo = useCallback(async () => {
    await callManager.toggleVideo();
    setCall(callManager.getActiveCall());
  }, []);

  const toggleScreenShare = useCallback(async () => {
    await callManager.toggleScreenShare();
    setCall(callManager.getActiveCall());
  }, []);

  const toggleRecording = useCallback(async () => {
    await callManager.toggleRecording();
    setCall(callManager.getActiveCall());
  }, []);

  return {
    call,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleRecording,
  };
};
