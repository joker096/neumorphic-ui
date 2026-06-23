import React from 'react';
import { PhoneOff, MicOff, Video, VideoOff, Monitor, Square, X } from 'lucide-react';
import { motion } from 'motion/react';

interface CallScreenProps {
  call: {
    id: string;
    remotePeer: { displayName: string; stream?: MediaStream };
    localStream: MediaStream | null;
    screenStream: MediaStream | null;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isRecording: boolean;
    callType: 'audio' | 'video' | 'screen';
    status: string;
  };
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreen: () => void;
  onToggleRecord: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  call,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onToggleScreen,
  onToggleRecord,
}) => {
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (remoteVideoRef.current && call.remotePeer.stream) {
      remoteVideoRef.current.srcObject = call.remotePeer.stream;
    }
  }, [call.remotePeer.stream]);

  React.useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  const isVideo = call.callType === 'video' || call.callType === 'screen';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      <div className="flex-1 relative">
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {(call.remotePeer.displayName || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {isVideo && (
          <div className="absolute bottom-24 right-4 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-gray-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-xl font-semibold">
                {call.remotePeer.displayName || 'Unknown'}
              </h2>
              <p className="text-white/70 text-sm capitalize">{call.status}</p>
            </div>
            {call.isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-xs font-bold text-red-400">REC</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-32 bg-black/90 flex items-center justify-center gap-6 px-6">
        <button
          onClick={onToggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            call.isMuted
              ? 'bg-red-500 text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {call.isMuted ? <MicOff size={24} /> : <MicOff size={24} className="opacity-50" />}
        </button>

        {isVideo && (
          <button
            onClick={onToggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              !call.isVideoEnabled
                ? 'bg-red-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {call.isVideoEnabled ? <Video size={24} className="opacity-50" /> : <VideoOff size={24} />}
          </button>
        )}

        <button
          onClick={onToggleScreen}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            call.screenStream
              ? 'bg-blue-500 text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <Monitor size={24} />
        </button>

        <button
          onClick={onToggleRecord}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            call.isRecording
              ? 'bg-red-500 text-white'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <Square size={24} />
        </button>

        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </motion.div>
  );
};
