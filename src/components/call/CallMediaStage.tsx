import React from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { GroupCallParticipants } from "./GroupCallParticipants";
import {
  CALL_AVATAR_GRADIENT,
  CALL_AVATAR_GRADIENT_SOFT,
  CALL_AUDIO_STAGE_GRADIENT,
} from "../../constants/callConstants";

interface CallMediaStageProps {
  call: any;
  isVideo: boolean;
  isGroup: boolean;
  initial: string;
  statusLabel: string;
  t: (key: string, options?: any) => string;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export const CallMediaStage: React.FC<CallMediaStageProps> = ({
  call, isVideo, isGroup, initial, statusLabel, t, remoteVideoRef, localVideoRef,
}) => {
  if (isVideo) {
    if (isGroup) {
      return (
        <div className="absolute inset-0 bg-[var(--bg-primary)] overflow-auto">
          <GroupCallParticipants
            participants={call.participants.map((p: any) => ({
              peerId: p.peerId,
              displayName: p.displayName,
              stream: p.stream,
              isMuted: p.peerId === call.remotePeer?.peerId ? call.isMuted : undefined,
            }))}
          />
        </div>
      );
    }
    const showAvatarFallback = !call.isVideoEnabled || call.callType === 'screen' || !call.remotePeer?.stream;
    return (
      <>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {showAvatarFallback && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <div className="neo-raised w-32 h-32 rounded-full flex items-center justify-center">
              <div className={`w-24 h-24 rounded-full ${CALL_AVATAR_GRADIENT_SOFT} flex items-center justify-center`}>
                <span className="text-5xl font-bold text-white tracking-tight">{initial}</span>
              </div>
            </div>
          </div>
        )}
        {call.status === 'connecting' && !call.remotePeer?.stream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px]">
            <Loader2 size={40} className="animate-spin text-white/80" />
            <span className="text-white/70 text-sm font-medium">{statusLabel}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden ${CALL_AUDIO_STAGE_GRADIENT}`}>
      {/* Telegram-style blurred avatar backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square">
          <div className={`w-full h-full rounded-full ${CALL_AVATAR_GRADIENT} opacity-25 blur-3xl scale-150`} />
        </div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent-soft)_0%,_transparent_60%)] pointer-events-none" />
      {isGroup && (
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-md px-6 mb-8 relative z-10">
          {call.participants.map((p: any) => (
            <div
              key={p.peerId}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full neo-raised-sm ${
                p.peerId === call.remotePeer?.peerId ? 'ring-1 ring-[var(--accent)]/50' : ''
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                {(p.displayName || '?').charAt(0).toUpperCase()}
              </span>
              <span className="text-[var(--text-secondary)] text-xs font-medium truncate max-w-[8rem]">
                {p.displayName || t('call.unknownCaller')}
              </span>
            </div>
          ))}
        </div>
      )}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10"
      >
        <div className="absolute -inset-4 rounded-full bg-[var(--accent)]/15 animate-pulse" />
        <div className="absolute -inset-8 rounded-full bg-[var(--accent)]/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="neo-raised w-40 h-40 sm:w-52 sm:h-52 rounded-full flex items-center justify-center">
          <div className={`w-32 h-32 sm:w-44 sm:h-44 rounded-full ${CALL_AVATAR_GRADIENT} flex items-center justify-center`}>
            <span className="text-6xl sm:text-7xl font-bold text-white tracking-tight drop-shadow-lg">
              {initial}
            </span>
          </div>
        </div>
      </motion.div>
      {call.status === 'connecting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 mt-10 flex items-center gap-2 text-[var(--text-secondary)]"
        >
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium tracking-wide">{statusLabel}</span>
        </motion.div>
      )}
    </div>
  );
};
