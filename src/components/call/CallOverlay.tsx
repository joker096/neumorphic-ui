import { CallScreen } from "./CallScreen";
import { IncomingCallSheet } from "./IncomingCallSheet";

interface CallOverlayProps {
  call: any;
  incomingCall: { peerId: string; displayName: string; callType: 'audio' | 'video' } | null;
  endCall: () => void;
  acceptCall: (peerId: string, name: string, type: 'audio' | 'video') => Promise<any>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  setActiveCall: (call: any) => void;
}

export function CallOverlay({ call, incomingCall, endCall, acceptCall, toggleMute, toggleVideo, toggleScreenShare, toggleRecording, setActiveCall }: CallOverlayProps) {
  if (!call) return null;

  return (
    <>
      <CallScreen
        call={{
          id: call.callId,
          remotePeer: { displayName: call.remotePeer.displayName || '', stream: call.remotePeer.stream },
          localStream: call.localStream,
          screenStream: call.screenStream,
          isMuted: call.isMuted,
          isVideoEnabled: call.isVideoEnabled,
          isRecording: call.isRecording,
          callType: call.callType,
          status: call.status,
        }}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleScreen={toggleScreenShare}
        onToggleRecord={toggleRecording}
        onChangeCallType={(newType) => {
          if (call) {
            if (newType === call.callType) return;
            if (newType === 'video') toggleVideo();
            const newCall = { ...call, callType: newType, isVideoEnabled: newType === 'video', isVideo: newType === 'video' };
            setActiveCall(newCall);
          }
        }}
      />
      {incomingCall && (
        <IncomingCallSheet
          callerName={incomingCall.displayName}
          callType={incomingCall.callType}
          onAccept={async () => {
            await acceptCall(incomingCall.peerId, incomingCall.displayName, incomingCall.callType);
          }}
          onReject={async () => {
            await endCall();
          }}
          onAcceptVideo={async () => {
            await acceptCall(incomingCall.peerId, incomingCall.displayName, 'video');
          }}
        />
      )}
    </>
  );
}
