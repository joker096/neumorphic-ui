import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MicOff, Video, Volume2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store';
import { callRecorderService } from '../lib/callRecorderService';

export const FloatingCallWidget = ({ theme }: { theme: 'dark' | 'light' }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const { activeCall, setActiveCall } = useAppStore();
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const unsub = callRecorderService.onStateChange(setIsRecording);
    let interval: number;
    if (activeCall) {
      interval = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [activeCall]);

  if (!activeCall) return null;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        drag
        dragMomentum={false}
        className={`fixed bottom-6 right-6 z-[100] p-4 rounded-[28px] shadow-2xl flex items-center gap-4 cursor-grab active:cursor-grabbing border ${
          isDark 
            ? "bg-[#1a1d24]/90 backdrop-blur-xl border-white/10 shadow-[0_16px_32px_rgba(0,0,0,0.6)]" 
            : "bg-white/90 backdrop-blur-xl border-black/5 shadow-[0_16px_32px_rgba(165,175,190,0.4)]"
        }`}
      >
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] font-bold text-red-400 tracking-wider">REC</span>
            </div>
          )}
           <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {activeCall.isVideo && <Video size={14} className={isDark ? "text-orange-400" : "text-orange-600"} />}
                <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-800"}`}>
                  {activeCall.number || "Unknown"}
                </span>
              </div>
              <span className={`text-xs font-mono font-medium ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                {formatDuration(duration)}
              </span>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted })}
              title={activeCall.isMuted ? t('chat.unmute') : t('chat.mute')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                activeCall.isMuted 
                  ? (isDark ? "bg-white/20 text-white" : "bg-black/10 text-black")
                  : (isDark ? "bg-[#13151b] text-gray-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700")
              }`}
            >
              <MicOff size={18} />
            </button>
            <button 
              onClick={() => setActiveCall(null)}
              title={t('chat.endCall')}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
               <Phone size={20} className="rotate-[135deg] fill-white/20" strokeWidth={2.5} />
            </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
