import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Download, Trash2, X, Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import type { CallRecording } from '../../lib/callRecorderService';
import { formatDuration } from './recordingUtils';

export function RecordingPlayer({ recording, blobUrl, isDark = false, onClose, onDelete, onExport }: {
  recording: CallRecording;
  blobUrl: string;
  isDark?: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onExport: (id: string, title: string) => void;
}) {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = blobUrl;
      audioRef.current.play().catch(() => setPlaying(false));
    }
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    };
  }, [blobUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  const skip = (sec: number) => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + sec, duration));
  };

  const cycleRate = () => {
    const idx = rates.indexOf(rate);
    const next = rates[(idx + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl ${isDark ? 'bg-[#1a1d24] border border-white/5' : 'bg-white'}`}
      >
        <audio ref={audioRef}
          onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }}
          onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
          onEnded={() => setPlaying(false)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        />
        <div className={`flex items-center justify-between mb-5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{recording.title || t('recordings.recording')}</h3>
            {recording.participants.length > 0 && (
              <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {recording.participants.map(p => p.displayName).join(', ')}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className={`p-2 rounded-full shrink-0 ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        <input type="range" min={0} max={duration || 0} value={currentTime}
          onChange={(e) => { const t = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = t; setCurrentTime(t); }}
          className="w-full h-1.5 accent-orange-500 cursor-pointer mb-1.5 rounded-full appearance-none bg-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md" />
        <div className={`flex justify-between text-xs mb-5 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-15)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>-15s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-5)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>-5s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(5)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>+5s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(15)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>+15s</motion.button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMuted(!muted)}
              className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </motion.button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setMuted(false); }}
              className="w-20 h-1 accent-orange-500 cursor-pointer" />
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={cycleRate}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>{rate}x</motion.button>
          <div className="flex items-center gap-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onExport(recording.id, recording.title || 'recording')}
              className={`p-2 rounded-full ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>
              <Download className="w-4 h-4" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(recording.id)}
              className="p-2 rounded-full text-red-500 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
