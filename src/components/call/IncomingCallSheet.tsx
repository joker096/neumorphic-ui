import React from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video, Mic } from 'lucide-react';

interface IncomingCallSheetProps {
  callerName: string;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingCallSheet: React.FC<IncomingCallSheetProps> = ({
  callerName,
  callType,
  onAccept,
  onReject,
}) => {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[200] bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center"
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6"
        >
          <span className="text-5xl font-bold text-white">
            {callerName.charAt(0).toUpperCase()}
          </span>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-2"
        >
          {callerName}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 text-lg flex items-center gap-2"
        >
          {callType === 'video' ? <Video size={20} /> : <Mic size={20} />}
          {callType === 'video' ? 'Video call' : 'Voice call'}
        </motion.p>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/50 text-sm mt-2"
        >
          Incoming call...
        </motion.p>
      </div>

      <div className="h-40 flex items-center justify-center gap-12 px-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onReject}
          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl"
        >
          <PhoneOff size={36} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAccept}
          className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-2xl"
        >
          <Phone size={36} />
        </motion.button>
      </div>
    </motion.div>
  );
};
