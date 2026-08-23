import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useCall } from "../../hooks/useCall";
import { useAppStore } from "../../store";
import { CallScreen } from "../call/CallScreen";

type IncomingCall = { peerId: string; displayName: string; callType: 'audio' | 'video' };

export const CallOverlay = () => {
  const callMinimized = useAppStore((s) => s.callMinimized);
  const setCallMinimized = useAppStore((s) => s.setCallMinimized);
  const setActiveCall = useAppStore((s) => s.setActiveCall);
  const {
    call, acceptCall, endCall, toggleMute, toggleVideo,
    toggleScreenShare, toggleRecording, toggleSpeaker, flipCamera, changeCallType,
  } = useCall();
  const [incomingCall] = useState<IncomingCall | null>(null);

  return (
    <AnimatePresence>
      {call && !callMinimized && (
        <CallScreen
          call={call}
          incomingCall={incomingCall}
          onEnd={endCall}
          acceptCall={acceptCall}
          toggleMute={toggleMute}
          toggleVideo={toggleVideo}
          toggleScreenShare={toggleScreenShare}
          toggleRecording={toggleRecording}
          toggleSpeaker={toggleSpeaker}
          flipCamera={flipCamera}
          changeCallType={changeCallType}
          setActiveCall={setActiveCall}
          onMinimize={() => setCallMinimized(true)}
        />
      )}
    </AnimatePresence>
  );
};
