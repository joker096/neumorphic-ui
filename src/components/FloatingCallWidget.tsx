import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MicOff, Mic, Video } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useAppStore } from '../store';
import { callRecorderService } from '../lib/callRecorderService';
import { formatDuration } from './recordings/recordingUtils';
import { CALL_END_GRADIENT } from '../constants/callConstants';
import { callManager } from '../lib/call/CallManager';

export const FloatingCallWidget = ({ theme = 'dark' }: { theme?: 'dark' | 'light' }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const { activeCall, setActiveCall, callMinimized, setCallMinimized } = useAppStore();
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const unsub = callRecorderService.onStateChange(setIsRecording);
    let interval: number | undefined;
    if (activeCall) {
      interval = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - activeCall.startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval !== undefined) clearInterval(interval);
      unsub();
    };
  }, [activeCall]);

  if (!activeCall || !callMinimized) return null;

  const handleExpand = () => setCallMinimized(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        drag
        dragMomentum={false}
        onClick={handleExpand}
        className={`fixed bottom-6 right-6 z-[100] p-4 neo-raised flex items-center gap-4 cursor-grab active:cursor-grabbing`}
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
              <span className={`text-sm font-bold ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
                {activeCall.remotePeer?.displayName || t('call.unknownCaller')}
              </span>
            </div>
            <span className={`text-xs font-mono font-medium ${isDark ? "text-orange-400" : "text-orange-600"}`}>
              {formatDuration(duration)}
            </span>
          </div>
        </div>
         
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted }); }}
            title={activeCall.isMuted ? t('chat.unmute') : t('chat.mute')}
            aria-label={activeCall.isMuted ? t('chat.unmute') : t('chat.mute')}
            className={`neo-circle w-11 h-11 rounded-full flex items-center justify-center ${
              activeCall.isMuted 
                ? "neo-circle-pressed text-[var(--danger)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {activeCall.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); callManager.endCall().catch(() => {}); setActiveCall(null); }}
            title={t('chat.endCall')}
            aria-label={t('chat.endCall')}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${CALL_END_GRADIENT} hover:brightness-110`}
          >
            <Phone size={20} className="rotate-[135deg] fill-white/20" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};





