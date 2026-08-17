import React from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { useAnimationsEnabled } from '../../contexts/AnimationContext';
import { useI18n } from '../../lib/i18n';
import { CALL_AVATAR_GRADIENT } from '../../constants/callConstants';

interface IncomingCallSheetProps {
  callerName: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
  onAcceptVideo?: () => void;
}

function ActionButton({
  icon: Icon,
  tone,
  onClick,
  enabled,
  label,
}: {
  icon: React.ElementType;
  tone: 'reject' | 'accept' | 'video';
  onClick: () => void;
  enabled?: boolean;
  label: string;
}) {
  const toneMap = {
    reject: 'text-[var(--danger)]',
    accept: 'text-[var(--success)]',
    video: 'text-[var(--accent)]',
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={enabled ? { scale: 0.9 } : undefined}
      whileHover={enabled ? { scale: 1.08 } : undefined}
      className={`w-20 h-20 rounded-full neo-circle ${toneMap[tone]} flex items-center justify-center`}
      title={label}
      aria-label={label}
    >
      <Icon size={32} strokeWidth={2.5} />
    </motion.button>
  );
}

export const IncomingCallSheet: React.FC<IncomingCallSheetProps> = ({
  callerName,
  callType,
  onAccept,
  onReject,
  onAcceptVideo,
}) => {
  const enabled = useAnimationsEnabled();
  const { t } = useI18n();
  const callerInitial = callerName.charAt(0).toUpperCase() || t('call.unknownCaller').charAt(0).toUpperCase();
  const [ringing, setRinging] = React.useState(0);

  React.useEffect(() => {
    const id = window.setInterval(() => setRinging((r) => r + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const formatRinging = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={enabled ? { opacity: 0 } : undefined}
      animate={enabled ? { opacity: 1 } : undefined}
      exit={enabled ? { opacity: 0 } : undefined}
      transition={enabled ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] } : undefined}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--bg-primary)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--accent-soft)_0%,_transparent_65%)] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={enabled ? { scale: 0.6, opacity: 0 } : undefined}
          animate={enabled ? { scale: 1, opacity: 1 } : undefined}
          transition={enabled ? { duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] } : undefined}
          className="relative mb-8"
        >
          <div className="absolute -inset-4 rounded-full bg-[var(--accent)]/15 animate-pulse" />
          <div className="absolute -inset-8 rounded-full bg-[var(--accent)]/10 animate-pulse" style={{ animationDelay: '0.4s' }} />
          <div className="neo-raised w-40 h-40 rounded-full flex items-center justify-center">
            <div className={`w-32 h-32 rounded-full ${CALL_AVATAR_GRADIENT} flex items-center justify-center`}>
              <span className="text-6xl font-bold text-white drop-shadow-lg">
                {callerInitial}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={enabled ? { y: 20, opacity: 0 } : undefined}
          animate={enabled ? { y: 0, opacity: 1 } : undefined}
          transition={enabled ? { duration: 0.4, delay: 0.25 } : undefined}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            {callerName}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full neo-raised-sm">
              {callType === 'video' ? (
                <Video size={16} className="text-[var(--accent)]" />
              ) : (
                <Mic size={16} className="text-[var(--accent)]" />
              )}
              <span className="text-[var(--text-secondary)] text-sm font-medium">
                {callType === 'video' ? t('call.videoCall') : t('call.voiceCall')}
              </span>
            </div>
          </div>
          <motion.p
            animate={enabled ? { opacity: [0.4, 0.8, 0.4] } : undefined}
            transition={enabled ? { duration: 2, repeat: Infinity } : undefined}
            className="text-[var(--text-tertiary)] text-sm mt-4 font-medium tracking-wide"
          >
            {t('call.incomingCall')} · {formatRinging(ringing)}
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        initial={enabled ? { y: 40, opacity: 0 } : undefined}
        animate={enabled ? { y: 0, opacity: 1 } : undefined}
        transition={enabled ? { duration: 0.4, delay: 0.35 } : undefined}
        className="h-44 flex items-center justify-center gap-12 px-6 relative z-10"
      >
        <ActionButton icon={PhoneOff} tone="reject" onClick={onReject} enabled={enabled} label={t('call.rejectCall')} />

        <div className="flex flex-col gap-3">
          <ActionButton icon={Phone} tone="accept" onClick={onAccept} enabled={enabled} label={t('call.acceptCall')} />
          {onAcceptVideo && (
            <ActionButton icon={Video} tone="video" onClick={onAcceptVideo} enabled={enabled} label={t('call.acceptVideoCall')} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

