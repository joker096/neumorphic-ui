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

const containerVariants = {
  hidden: { y: '100%' },
  visible: { y: 0 },
  exit: { y: '100%' },
};

const contentVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};

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
      variants={containerVariants}
      initial={enabled ? "hidden" : false}
      animate={enabled ? "visible" : undefined}
      exit={enabled ? "exit" : undefined}
      transition={enabled ? { duration: 0.35, ease: [0.32, 0.72, 0, 1] } : undefined}
      className="fixed inset-0 z-[200] bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          variants={contentVariants}
          initial={enabled ? "hidden" : false}
          animate={enabled ? "visible" : undefined}
          transition={enabled ? { duration: 0.3, delay: 0.15 } : undefined}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6"
        >
          <span className="text-5xl font-bold text-white">
            {callerName.charAt(0).toUpperCase()}
          </span>
        </motion.div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {callerName}
        </h2>

        <p className="text-white/70 text-lg flex items-center gap-2">
          {callType === 'video' ? <Video size={20} /> : <Mic size={20} />}
          {callType === 'video' ? 'Video call' : 'Voice call'}
        </p>

        <p className="text-white/50 text-sm mt-2">
          Incoming call...
        </p>
      </div>

      <div className="h-40 flex items-center justify-center gap-12 px-6">
        <motion.button
          whileTap={enabled ? { scale: 0.9 } : undefined}
          whileHover={enabled ? { scale: 1.05 } : undefined}
          onClick={onReject}
          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        >
          <PhoneOff size={36} />
        </motion.button>

        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={enabled ? { scale: 0.9 } : undefined}
            whileHover={enabled ? { scale: 1.05 } : undefined}
            onClick={onAccept}
            className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
          >
            <Phone size={36} />
          </motion.button>
          {onAcceptVideo && (
            <motion.button
              whileTap={enabled ? { scale: 0.9 } : undefined}
              whileHover={enabled ? { scale: 1.05 } : undefined}
              onClick={onAcceptVideo}
              className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
            >
              <Video size={36} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
