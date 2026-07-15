import React from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';
import { useAnimationsEnabled } from '../../contexts/AnimationContext';

interface IncomingCallSheetProps {
  callerName: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
  onAcceptVideo?: () => void;
}

function ActionButton({
  icon: Icon,
  color,
  onClick,
  enabled,
}: {
  icon: React.ElementType;
  color: 'red' | 'green' | 'blue';
  onClick: () => void;
  enabled?: boolean;
}) {
  const colorMap = {
    red: 'from-red-500 to-red-700 shadow-red-500/30',
    green: 'from-green-500 to-green-700 shadow-green-500/30',
    blue: 'from-blue-500 to-blue-700 shadow-blue-500/30',
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={enabled ? { scale: 0.9 } : undefined}
      whileHover={enabled ? { scale: 1.1 } : undefined}
      className={`w-20 h-20 rounded-full bg-gradient-to-br ${colorMap[color]} text-white flex items-center justify-center shadow-2xl transition-shadow hover:shadow-2xl`}
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

  return (
    <motion.div
      initial={enabled ? { opacity: 0 } : undefined}
      animate={enabled ? { opacity: 1 } : undefined}
      exit={enabled ? { opacity: 0 } : undefined}
      transition={enabled ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] } : undefined}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-black to-black"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(249,115,22,0.08)_0%,_transparent_70%)] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={enabled ? { scale: 0.6, opacity: 0 } : undefined}
          animate={enabled ? { scale: 1, opacity: 1 } : undefined}
          transition={enabled ? { duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] } : undefined}
          className="relative mb-8"
        >
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-2xl shadow-orange-500/20">
            <span className="text-6xl font-bold text-white drop-shadow-lg">
              {callerName.charAt(0).toUpperCase()}
            </span>
          </div>
          {enabled && (
            <>
              <div className="absolute -inset-3 rounded-full bg-orange-500/10 animate-pulse" />
              <div className="absolute -inset-6 rounded-full bg-orange-500/5 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </>
          )}
        </motion.div>

        <motion.div
          initial={enabled ? { y: 20, opacity: 0 } : undefined}
          animate={enabled ? { y: 0, opacity: 1 } : undefined}
          transition={enabled ? { duration: 0.4, delay: 0.25 } : undefined}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg tracking-tight">
            {callerName}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
              {callType === 'video' ? (
                <Video size={16} className="text-blue-400" />
              ) : (
                <Mic size={16} className="text-orange-400" />
              )}
              <span className="text-white/70 text-sm font-medium">
                {callType === 'video' ? 'Video call' : 'Voice call'}
              </span>
            </div>
          </div>
          <motion.p
            animate={enabled ? { opacity: [0.4, 0.8, 0.4] } : undefined}
            transition={enabled ? { duration: 2, repeat: Infinity } : undefined}
            className="text-white/40 text-sm mt-4 font-medium tracking-wide"
          >
            Incoming call...
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        initial={enabled ? { y: 40, opacity: 0 } : undefined}
        animate={enabled ? { y: 0, opacity: 1 } : undefined}
        transition={enabled ? { duration: 0.4, delay: 0.35 } : undefined}
        className="h-44 flex items-center justify-center gap-12 px-6 relative z-10"
      >
        <ActionButton icon={PhoneOff} color="red" onClick={onReject} enabled={enabled} />

        <div className="flex flex-col gap-3">
          <ActionButton icon={Phone} color="green" onClick={onAccept} enabled={enabled} />
          {onAcceptVideo && (
            <ActionButton icon={Video} color="blue" onClick={onAcceptVideo} enabled={enabled} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
