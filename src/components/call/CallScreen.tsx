import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MicOff } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import type { ActiveCall, CallType } from '../../lib/call/types';
import { IncomingCallSheet } from './IncomingCallSheet';
import { CallMediaStage } from './CallMediaStage';
import { CallControlBar } from './CallControlBar';
import { CallTopBar } from './CallTopBar';
import {
  CALL_DEFAULT_INITIAL,
  CALL_STATUS_LABEL_KEYS,
} from '../../constants/callConstants';

interface CallScreenProps {
  call: ActiveCall;
  incomingCall: { peerId: string; displayName: string; callType: 'audio' | 'video' } | null;
  onEnd: () => void;
  acceptCall: (peerId: string, name: string, type: 'audio' | 'video') => Promise<any>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  toggleSpeaker?: () => void;
  flipCamera?: () => void;
  changeCallType?: (type: CallType) => void;
  setActiveCall: (call: ActiveCall | null) => void;
  onMinimize?: () => void;
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
  toggleSpeaker,
  flipCamera,
  changeCallType,
  setActiveCall,
  onMinimize,
}) => {
  const { t } = useI18n();
  const remoteVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [showControls, setShowControls] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const hideTimer = React.useRef<number | null>(null);

  const isVideo = !!call && (call.callType === 'video' || call.callType === 'screen');
  const isGroup = !!call && Array.isArray(call.participants) && call.participants.length > 1;

  React.useEffect(() => {
    if (remoteVideoRef.current && call?.remotePeer) {
      remoteVideoRef.current.srcObject = call.remotePeer?.stream || null;
    }
  }, [call?.remotePeer?.stream]);

  React.useEffect(() => {
    if (localVideoRef.current && call?.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call?.localStream]);

  React.useEffect(() => {
    if (remoteAudioRef.current && call?.remotePeer?.stream) {
      remoteAudioRef.current.srcObject = call.remotePeer.stream;
    }
  }, [call?.remotePeer?.stream]);

  React.useEffect(() => {
    if (isVideo && showControls) {
      hideTimer.current = window.setTimeout(() => setShowControls(false), 4000);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls, isVideo]);

  React.useEffect(() => {
    setElapsed(call?.status === 'connected' ? Math.floor((Date.now() - (call.startTime || Date.now())) / 1000) : 0);
    if (call?.status !== 'connected') return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - (call.startTime || Date.now())) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [call?.status, call?.startTime]);

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  React.useEffect(() => {
    const applySink = (el: HTMLMediaElement | null) => {
      const anyEl = el as any;
      if (!anyEl || typeof anyEl.setSinkId !== 'function') return;
      try {
        if (call?.isSpeaker) {
          anyEl.setSinkId('default');
        }
      } catch {
        /* setSinkId not supported / no permission */
      }
    };
    applySink(remoteAudioRef.current);
    applySink(remoteVideoRef.current);
  }, [call?.isSpeaker]);

  if (!call) return null;

  const remoteName = call.remotePeer?.displayName || t('call.unknownCaller');
  const initial = remoteName.charAt(0).toUpperCase() || CALL_DEFAULT_INITIAL;
  const statusKey = CALL_STATUS_LABEL_KEYS[call.status];
  const statusLabel = statusKey ? t(statusKey) : call.status;

  const handleToggleControls = () => {
    setShowControls(prev => !prev);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const handleChangeCallType = (newType: CallType) => {
    if (call.callType === newType) return;
    if (changeCallType) {
      changeCallType(newType);
      return;
    }
    const newCall = { ...call, callType: newType, isVideoEnabled: newType === 'video', isVideo: newType === 'video' };
    setActiveCall(newCall);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  return (
    <>
      {call && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-[var(--bg-primary)] flex flex-col"
        >
          <audio ref={remoteAudioRef} autoPlay playsInline />

          <div
            className="flex-1 relative cursor-pointer"
            onClick={handleToggleControls}
          >
            <CallMediaStage
              call={call}
              isVideo={isVideo}
              isGroup={isGroup}
              initial={initial}
              statusLabel={statusLabel}
              t={t}
              remoteVideoRef={remoteVideoRef}
              localVideoRef={localVideoRef}
            />

            {isVideo && call.localStream && call.isVideoEnabled && !isGroup && (
              <motion.div
                 initial={{ opacity: 0, y: 20, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 drag
                 dragMomentum={false}
                 dragConstraints={containerRef as any}
                 className="absolute bottom-28 sm:bottom-32 right-3 sm:right-5 w-28 h-40 sm:w-36 sm:h-52 rounded-[1.5rem] overflow-hidden neo-raised ring-1 ring-[var(--accent)]/20 cursor-grab active:cursor-grabbing"
               >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover -scale-x-100"
                />
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent flex items-center gap-1">
                  <span className="text-[11px] font-medium text-white/90 truncate">{t('call.you')}</span>
                  {call.isMuted && <MicOff size={11} className="text-[var(--danger)] shrink-0" />}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {showControls && isVideo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 pointer-events-none"
                />
              )}
            </AnimatePresence>

            <CallTopBar
              showControls={showControls}
              remoteName={remoteName}
              isGroup={isGroup}
              participantCount={call.participants.length}
              statusLabel={statusLabel}
              elapsed={elapsed}
              status={call.status}
              isPreview={(call as any).isPreview}
              isRecording={call.isRecording}
              t={t}
              isVideo={isVideo}
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              onMinimize={onMinimize}
            />
          </div>

          <CallControlBar
            showControls={showControls}
            call={call}
            t={t}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
            toggleSpeaker={toggleSpeaker}
            toggleScreenShare={toggleScreenShare}
            toggleRecording={toggleRecording}
            onFlipCamera={flipCamera}
            onChangeCallType={handleChangeCallType}
            onEnd={onEnd}
          />
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
