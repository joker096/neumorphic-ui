import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Square, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type CallType = 'audio' | 'video' | 'screen';

interface CallScreenProps {
  call: {
    id: string;
    remotePeer: { displayName: string; stream?: MediaStream };
    localStream: MediaStream | null;
    screenStream: MediaStream | null;
    isMuted: boolean;
    isVideoEnabled: boolean;
    isRecording: boolean;
    callType: CallType;
    status: string;
  };
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreen: () => void;
  onToggleRecord: () => void;
  onChangeCallType?: (newType: CallType) => void;
}

function StatusDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        className="w-1 h-1 rounded-full bg-white/60"
      />
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        className="w-1 h-1 rounded-full bg-white/60"
      />
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
        className="w-1 h-1 rounded-full bg-white/60"
      />
    </span>
  );
}

function ControlButton({
  active,
  activeColor,
  icon: Icon,
  label,
  onClick,
  size = 'md',
}: {
  active?: boolean;
  activeColor?: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-11 h-11' : 'w-14 h-14';
  const iconSize = size === 'lg' ? 26 : size === 'sm' ? 18 : 22;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`relative ${sizeClasses} rounded-full flex items-center justify-center transition-all duration-200 ${
        active
          ? `bg-white/25 text-white shadow-lg backdrop-blur-sm`
          : 'bg-white/10 text-white/70 hover:bg-white/18 hover:text-white backdrop-blur-sm'
      }`}
      title={label}
      aria-label={label}
    >
      <Icon size={iconSize} strokeWidth={active ? 2.5 : 1.8} />
      {active && activeColor && (
        <motion.span
          layoutId="active-indicator"
          className={`absolute inset-0 rounded-full border-2 ${activeColor}`}
          initial={false}
        />
      )}
    </motion.button>
  );
}

export const CallScreen: React.FC<CallScreenProps> = ({
  call,
  onEnd,
  onToggleMute,
  onToggleVideo,
  onToggleScreen,
  onToggleRecord,
  onChangeCallType,
}) => {
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [showControls, setShowControls] = React.useState(true);
  const hideTimer = React.useRef<number | null>(null);

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
  const initial = call.remotePeer.displayName?.charAt(0).toUpperCase() || 'U';

  const handleToggleControls = () => {
    setShowControls(prev => !prev);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  React.useEffect(() => {
    if (isVideo && showControls) {
      hideTimer.current = window.setTimeout(() => setShowControls(false), 4000);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls, isVideo]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      <div
        className="flex-1 relative cursor-pointer"
        onClick={handleToggleControls}
      >
        {isVideo ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {(!call.isVideoEnabled || call.callType === 'screen') && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500/80 to-orange-700/80 flex items-center justify-center shadow-2xl">
                  <span className="text-5xl font-bold text-white tracking-tight">{initial}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-2xl shadow-orange-500/20">
                <span className="text-6xl font-bold text-white tracking-tight drop-shadow-lg">
                  {initial}
                </span>
              </div>
              <div className="absolute -inset-4 rounded-full bg-orange-500/10 animate-pulse" />
              <div className="absolute -inset-8 rounded-full bg-orange-500/5 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </motion.div>
          </div>
        )}

        {isVideo && call.localStream && call.isVideoEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-6 right-4 w-36 h-52 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-0 left-0 right-0 p-6 pointer-events-none"
            >
              <div className="flex items-center justify-between">
                <div className="pointer-events-auto">
                  <h2 className="text-white text-xl font-bold tracking-tight drop-shadow-lg">
                    {call.remotePeer.displayName || 'Unknown'}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/70 text-sm font-medium capitalize tracking-wide drop-shadow">
                      {call.status}
                    </span>
                    {call.status === 'connecting' && <StatusDots />}
                  </div>
                </div>
                <AnimatePresence>
                  {call.isRecording && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30"
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                      <span className="text-xs font-bold text-red-400 tracking-wider">REC</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="h-28 bg-black/60 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 px-6"
          >
            <ControlButton
              active={call.isMuted}
              activeColor="border-red-400/60"
              icon={call.isMuted ? MicOff : Mic}
              label={call.isMuted ? 'Unmute' : 'Mute'}
              onClick={onToggleMute}
            />

            <ControlButton
              active={!call.isVideoEnabled}
              activeColor="border-red-400/60"
              icon={call.isVideoEnabled ? Video : VideoOff}
              label={call.isVideoEnabled ? 'Turn off video' : 'Turn on video'}
              onClick={onToggleVideo}
              size="sm"
            />

            <ControlButton
              active={!!call.screenStream}
              activeColor="border-blue-400/60"
              icon={Monitor}
              label="Share screen"
              onClick={onToggleScreen}
              size="sm"
            />

            <ControlButton
              active={call.isRecording}
              activeColor="border-red-400/60"
              icon={Square}
              label={call.isRecording ? 'Stop recording' : 'Record'}
              onClick={onToggleRecord}
              size="sm"
            />

            <ControlButton
              active={call.callType === 'video'}
              activeColor="border-blue-400/60"
              icon={call.callType === 'audio' ? Radio : Video}
              label={call.callType === 'audio' ? 'Switch to Video' : 'Switch to Audio'}
              onClick={() => onChangeCallType?.(call.callType === 'audio' ? 'video' : 'audio')}
            />

            <motion.button
              onClick={onEnd}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow"
              title="End call"
              aria-label="End call"
            >
              <PhoneOff size={26} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
