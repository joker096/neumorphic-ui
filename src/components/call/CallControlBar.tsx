import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Square, Radio,
  Volume2, Volume1, RefreshCw,
} from "lucide-react";
import type { CallType } from "../../lib/call/types";
import { ControlButton } from "./CallControls";
import { CALL_CONTROL_ACTIVE_COLORS, CALL_END_GRADIENT } from "../../constants/callConstants";

interface CallControlBarProps {
  showControls: boolean;
  call: any;
  t: (key: string, options?: any) => string;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker?: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  onFlipCamera?: () => void;
  onChangeCallType: (type: CallType) => void;
  onEnd: () => void;
}

export const CallControlBar: React.FC<CallControlBarProps> = ({
  showControls, call, t, toggleMute, toggleVideo, toggleSpeaker,
  toggleScreenShare, toggleRecording, onFlipCamera, onChangeCallType, onEnd,
}) => {
  const isVideo = !!call && (call.callType === 'video' || call.callType === 'screen');
  const canFlip = isVideo && !!call.localStream && !call.isPreview && !!onFlipCamera;

  return (
  <AnimatePresence>
    {showControls && (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100vw-2rem)]"
      >
        <div className="neo-raised rounded-[2rem] px-3 sm:px-5 py-3 flex items-center gap-2 sm:gap-3">
          <ControlButton
            active={call.isMuted}
            activeColor={CALL_CONTROL_ACTIVE_COLORS.danger}
            icon={call.isMuted ? MicOff : Mic}
            label={call.isMuted ? t('call.unmute') : t('call.mute')}
            onClick={toggleMute}
          />

          <ControlButton
            active={!call.isVideoEnabled}
            activeColor={CALL_CONTROL_ACTIVE_COLORS.danger}
            icon={call.isVideoEnabled ? Video : VideoOff}
            label={call.isVideoEnabled ? t('call.turnOffVideo') : t('call.turnOnVideo')}
            onClick={toggleVideo}
            size="sm"
          />

          {canFlip && (
            <ControlButton
              icon={RefreshCw}
              label={t('call.flipCamera')}
              onClick={onFlipCamera}
              size="sm"
            />
          )}

          {toggleSpeaker && (
            <ControlButton
              active={call.isSpeaker}
              activeColor={CALL_CONTROL_ACTIVE_COLORS.info}
              icon={call.isSpeaker ? Volume2 : Volume1}
              label={call.isSpeaker ? t('call.speakerOn') : t('call.speakerOff')}
              onClick={toggleSpeaker}
              size="sm"
            />
          )}

          <ControlButton
            active={!!call.screenStream}
            activeColor={CALL_CONTROL_ACTIVE_COLORS.info}
            icon={Monitor}
            label={t('call.shareScreen')}
            onClick={toggleScreenShare}
            size="sm"
          />

          <ControlButton
            active={call.isRecording}
            activeColor={CALL_CONTROL_ACTIVE_COLORS.danger}
            icon={Square}
            label={call.isRecording ? t('call.stopRecording') : t('call.record')}
            onClick={toggleRecording}
            size="sm"
          />

          <ControlButton
            active={call.callType === 'video'}
            activeColor={CALL_CONTROL_ACTIVE_COLORS.info}
            icon={call.callType === 'audio' ? Radio : Video}
            label={call.callType === 'audio' ? t('call.switchToVideo') : t('call.switchToAudio')}
            onClick={() => onChangeCallType(call.callType === 'audio' ? 'video' : 'audio')}
          />

          <motion.button
            onClick={onEnd}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className={`w-16 h-16 rounded-full ${CALL_END_GRADIENT} text-white flex items-center justify-center shadow-lg shadow-[var(--danger)]/30 hover:shadow-[var(--danger)]/50 transition-shadow`}
            title={t('call.endCall')}
            aria-label={t('call.endCall')}
          >
            <PhoneOff size={26} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  );
};
