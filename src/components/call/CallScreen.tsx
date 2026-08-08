import React from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Square, Radio, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../../lib/i18n';
import type { ActiveCall, CallType } from '../../lib/call/types';
import { IncomingCallSheet } from './IncomingCallSheet';

interface CallScreenProps {
  call: ActiveCall;
  incomingCall: { peerId: string; displayName: string; callType: 'audio' | 'video' } | null;
  onEnd: () => void;
  acceptCall: (peerId: string, name: string, type: 'audio' | 'video') => Promise<any>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  setActiveCall: (call: ActiveCall | null) => void;
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
          ? `bg-white/25 text-[var(--text-primary)] shadow-lg backdrop-blur-sm`
          : 'bg-white/10 text-white/70 hover:bg-white/18 hover:text-[var(--text-primary)] backdrop-blur-sm'
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
  incomingCall,
  onEnd,
  acceptCall,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  toggleRecording,
  setActiveCall,
}) => {
  const { t } = useI18n();
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [showControls, setShowControls] = React.useState(true);
  const hideTimer = React.useRef<number | null>(null);

  if (!call) return null;

  React.useEffect(() => {
    if (remoteVideoRef.current && call.remotePeer) {
      remoteVideoRef.current.srcObject = (call as any).remotePeer.stream || null;
    }
  }, [(call as any).remotePeer?.stream]);

  React.useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  const isVideo = call.callType === 'video' || call.callType === 'screen';
  const remoteName = call.remotePeer?.displayName || t('call.unknownCaller');
  const initial = remoteName.charAt(0).toUpperCase() || 'U';
  const statusLabel = call.status === 'connecting' ? t('call.connecting') : call.status;

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

  const handleChangeCallType = (newType: CallType) => {
    if (call.callType === newType) return;
    if (newType === 'video') toggleVideo();
    const newCall = { ...call, callType: newType, isVideoEnabled: newType === 'video', isVideo: newType === 'video' };
    setActiveCall(newCall);
  };

  return (
    <>
      {call && (
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
                      <span className="text-5xl font-bold text-[var(--text-primary)] tracking-tight">{initial}</span>
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
                    <span className="text-6xl font-bold text-[var(--text-primary)] tracking-tight drop-shadow-lg">
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
                 className="absolute bottom-4 sm:bottom-6 right-2 sm:right-4 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-2xl bg-zinc-900"
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
                      <h2 className="text-[var(--text-primary)] text-xl font-bold tracking-tight drop-shadow-lg">
                        {remoteName}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/70 text-sm font-medium capitalize tracking-wide drop-shadow">
                          {statusLabel}
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
                          <span className="text-xs font-bold text-red-400 tracking-wider">{t('call.recording')}</span>
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
                className="h-24 sm:h-28 bg-black/60 backdrop-blur-xl border-t border-[var(--border-color)] flex items-center justify-center gap-2 sm:gap-4 px-4 sm:px-6"
              >
                <ControlButton
                  active={call.isMuted}
                  activeColor="border-red-400/60"
                  icon={call.isMuted ? MicOff : Mic}
                  label={call.isMuted ? t('call.unmute') : t('call.mute')}
                  onClick={toggleMute}
                />

                <ControlButton
                  active={!call.isVideoEnabled}
                  activeColor="border-red-400/60"
                  icon={call.isVideoEnabled ? Video : VideoOff}
                  label={call.isVideoEnabled ? t('call.turnOffVideo') : t('call.turnOnVideo')}
                  onClick={toggleVideo}
                  size="sm"
                />

                <ControlButton
                  active={!!call.screenStream}
                  activeColor="border-blue-400/60"
                  icon={Monitor}
                  label={t('call.shareScreen')}
                  onClick={toggleScreenShare}
                  size="sm"
                />

                <ControlButton
                  active={call.isRecording}
                  activeColor="border-red-400/60"
                  icon={Square}
                  label={call.isRecording ? t('call.stopRecording') : t('call.record')}
                  onClick={toggleRecording}
                  size="sm"
                />

                <ControlButton
                  active={call.callType === 'video'}
                  activeColor="border-blue-400/60"
                  icon={call.callType === 'audio' ? Radio : Video}
                  label={call.callType === 'audio' ? t('call.switchToVideo') : t('call.switchToAudio')}
                  onClick={() => handleChangeCallType(call.callType === 'audio' ? 'video' : 'audio')}
                />

                <motion.button
                  onClick={onEnd}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-[var(--text-primary)] flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow"
                  title={t('call.endCall')}
                  aria-label={t('call.endCall')}
                >
                  <PhoneOff size={26} strokeWidth={2.5} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      {incomingCall && (
        <IncomingCallSheet
          callerName={incomingCall.displayName}
          callType={incomingCall.callType}
          onAccept={async () => {
            await acceptCall(incomingCall.peerId, incomingCall.displayName, incomingCall.callType);
          }}
          onReject={async () => {
            await onEnd();
          }}
          onAcceptVideo={async () => {
            await acceptCall(incomingCall.peerId, incomingCall.displayName, 'video');
          }}
        />
      )}
    </>
  );
};
