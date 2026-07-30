import { motion } from "motion/react";
import {
  Mic, MicOff, Phone, User, Video, Volume1, Volume2, X,
} from "lucide-react";

interface ActiveCallOverlayProps {
  isDark: boolean;
  number: string;
  callDuration: string;
  isMuted: boolean;
  isVideoCall: boolean;
  isSpeaker: boolean;
  t: (key: string, options?: any) => string;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function ActiveCallOverlay({
  isDark, number, callDuration, isMuted, isVideoCall, isSpeaker,
  t, onToggleMute, onToggleSpeaker, onToggleVideo, onEndCall,
}: ActiveCallOverlayProps) {
  return (
    <motion.div
      key="active-call"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center flex-1 w-full relative z-10 gap-8"
    >
      <motion.div
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner ${isDark ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] text-slate-700"}`}>
          <User size={48} className={isDark ? "text-gray-500" : "text-slate-400"} />
        </div>
        {isVideoCall && (
          <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center border-2 ${isDark ? "bg-orange-500 border-[var(--bg-secondary)] text-[var(--text-primary)]" : "bg-orange-500 border-[var(--bg-secondary)] text-[var(--text-primary)]"}`}>
            <Video size={16} />
          </div>
        )}
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        <span className={`text-[24px] font-bold tracking-tight ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
          {number.length > 0 ? number : t('chat.unknownCaller')}
        </span>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`text-[15px] font-mono font-medium tracking-widest ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
        >
          {callDuration}
        </motion.span>
      </div>
      <div className="flex gap-6 mt-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
          onClick={onToggleMute}
          title={isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
          aria-label={isMuted ? t('chat.unmuteMicrophone') : t('chat.muteMicrophone')}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
            isMuted
              ? isDark ? "bg-white text-[var(--text-secondary)] shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-slate-800 text-[var(--text-primary)] shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
              : isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:bg-white/10 border border-[var(--border-color)]" : "bg-[var(--bg-primary)] text-slate-500 hover:bg-white border border-[var(--border-color)]"
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
          onClick={onToggleSpeaker}
          title={isSpeaker ? t('chat.disableSpeaker') : t('chat.enableSpeaker')}
          aria-label={isSpeaker ? t('chat.disableSpeaker') : t('chat.enableSpeaker')}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
            isSpeaker
              ? isDark ? "bg-orange-500 text-[var(--text-primary)] shadow-[0_0_20px_rgba(249,115,22,0.4)]" : "bg-orange-500 text-[var(--text-primary)] shadow-[0_4px_10px_rgba(249,115,22,0.3)]"
              : isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:bg-white/10 border border-[var(--border-color)]" : "bg-[var(--bg-primary)] text-slate-500 hover:bg-white border border-[var(--border-color)]"
          }`}
        >
          {isSpeaker ? <Volume2 size={22} /> : <Volume1 size={22} />}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
          onClick={onToggleVideo}
          title={isVideoCall ? t('call.turnOffVideo') : t('call.turnOnVideo')}
          aria-label={isVideoCall ? t('call.turnOffVideo') : t('call.turnOnVideo')}
          className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
            isVideoCall
              ? isDark ? "bg-orange-500 text-[var(--text-primary)] shadow-[0_0_20px_rgba(249,115,22,0.4)]" : "bg-orange-500 text-[var(--text-primary)] shadow-[0_4px_10px_rgba(249,115,22,0.3)]"
              : isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:bg-white/10 border border-[var(--border-color)]" : "bg-[var(--bg-primary)] text-slate-500 hover:bg-white border border-[var(--border-color)]"
          }`}
        >
          <Video size={22} />
        </motion.button>
      </div>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 text-[var(--text-primary)] flex items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-400 transition-colors"
        title={t('chat.endCall')}
        aria-label={t('chat.endCall')}
      >
        <Phone size={24} className="rotate-[135deg]" />
      </motion.button>
    </motion.div>
  );
}




