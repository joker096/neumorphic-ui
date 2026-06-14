import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff } from 'lucide-react';

interface CallIncomingScreenProps {
  isOpen: boolean;
  callerName: string;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isDark: boolean;
}

export function CallIncomingScreen({ isOpen, callerName, isVideo, onAccept, onDecline, isDark }: CallIncomingScreenProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            className={`p-10 rounded-[32px] flex flex-col items-center gap-6 ${
              isDark ? 'bg-[#1a1d24] border border-white/10' : 'bg-white border border-black/5 shadow-xl'
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
              isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              {callerName.charAt(0)}
            </div>
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {callerName}
              </h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {isVideo ? 'Incoming video call...' : 'Incoming voice call...'}
              </p>
            </div>
            <div className="flex gap-6">
              <button
                onClick={onDecline}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <PhoneOff size={24} />
              </button>
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Phone size={24} className="fill-white/20" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
