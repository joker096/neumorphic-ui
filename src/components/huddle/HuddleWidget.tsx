import React from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { callManager } from '../../lib/call/CallManager';
import { useI18n } from '../../lib/i18n';
import type { CallEventType } from '../../lib/call/types';
import { CALL_HUDDLE_DEFAULT_NAME, CALL_HUDDLE_IDLE_GRADIENT, CALL_HUDDLE_ACTIVE_GRADIENT } from '../../constants/callConstants';

interface HuddleWidgetProps {
  chatId: string;
  chatName?: string;
}

export const HuddleWidget: React.FC<HuddleWidgetProps> = ({ chatId, chatName }) => {
  const { t } = useI18n();
  const [isInHuddle, setIsInHuddle] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const [participants, setParticipants] = React.useState<string[]>([]);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const unsub = callManager.subscribe((event: { type: CallEventType; data?: any }) => {
      switch (event.type) {
        case 'call:peer-joined':
          setParticipants((prev) => [...prev, event.data?.peerId || '']);
          break;
        case 'call:peer-left':
          setParticipants((prev) => prev.filter((p) => p !== event.data?.peerId));
          break;
        case 'call:ended':
          setIsInHuddle(false);
          setParticipants([]);
          break;
        default:
          break;
      }
    });
    return unsub;
  }, []);

  const handleJoin = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await callManager.startCall(chatId, chatName || CALL_HUDDLE_DEFAULT_NAME, 'audio');
      setIsInHuddle(true);
      setIsActive(true);
    } catch {
      // Microphone permission denied or call start failed — the join button
      // remains available so the user can retry.
    }
  };

  const handleLeave = async () => {
    await callManager.endCall();
    setIsInHuddle(false);
    setIsActive(false);
    setParticipants([]);
  };

  const handleToggleMute = async () => {
    const muted = await callManager.toggleMute();
    setIsMuted(muted);
  };

  if (!isActive) {
    return (
      <div className={`p-4 rounded-2xl ${CALL_HUDDLE_IDLE_GRADIENT} border border-[var(--border-color)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Mic size={18} className="text-[var(--text-primary)]" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-medium text-sm">{t('huddle.title')}</p>
              <p className="text-white/50 text-xs">{t('huddle.voiceChat')}</p>
            </div>
          </div>
          <button
            onClick={handleJoin}
            className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-[var(--text-primary)] text-sm font-medium"
          >
            {t('huddle.join')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl ${CALL_HUDDLE_ACTIVE_GRADIENT} border border-green-500/30`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
            <Mic size={18} className="text-[var(--text-primary)]" />
          </div>
          <div>
            <p className="text-[var(--text-primary)] font-medium text-sm">{t('huddle.active')}</p>
            <p className="text-white/50 text-xs">{t('huddle.participants', { count: participants.length + 1 })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isMuted
                ? 'bg-red-500 text-[var(--text-primary)]'
                : 'bg-white/20 text-[var(--text-primary)] hover:bg-white/30'
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={handleLeave}
            className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-[var(--text-primary)] text-sm font-medium"
          >
            {t('huddle.leave')}
          </button>
        </div>
      </div>
    </div>
  );
};

