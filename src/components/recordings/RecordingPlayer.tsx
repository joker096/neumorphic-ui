import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Play, Pause, Download, Trash2, X, Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import type { CallRecording } from '../../lib/callRecorderService';
import { formatDuration } from './recordingUtils';

const CARD_CLASS = 'w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]';
const HIT_CLASS = 'min-w-11 min-h-11 flex items-center justify-center rounded-full hover:bg-[var(--msg-bg-panel-hover)] active:scale-95';
const SKIP_CLASS = 'w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center text-xs font-medium hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-secondary)]';
const RANGE_CLASS = 'w-full h-1.5 cursor-pointer mb-1.5 rounded-full appearance-none bg-[var(--msg-bg-input)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:shadow-md';

export function RecordingPlayer({ recording, blobUrl, onClose, onDelete, onExport }: {
  recording: CallRecording;
  blobUrl: string;
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
      const p = audioRef.current.play();
      if (p) p.catch(() => setPlaying(false));
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className={CARD_CLASS}
      >
        <audio ref={audioRef}
          onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }}
          onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
          onEnded={() => setPlaying(false)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        />
        <div className="flex items-center justify-between mb-5 text-[var(--text-primary)]">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{recording.title || t('recordings.recording')}</h3>
            {recording.participants.length > 0 && (
              <p className="text-xs mt-0.5 truncate text-[var(--text-secondary)]">
                {recording.participants.map(p => p.displayName).join(', ')}
              </p>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            aria-label={t('common.close')}
            title={t('common.close')}
            className={`${HIT_CLASS} shrink-0`}>
            <X size={20} />
          </motion.button>
        </div>
        <input type="range" min={0} max={duration || 0} value={currentTime}
          onChange={(e) => { const t = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = t; setCurrentTime(t); }}
          aria-label={t('a11y.seek', 'Seek')}
          className={RANGE_CLASS} />
        <div className="flex justify-between text-xs mb-5 text-[var(--text-secondary)]">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-15)} aria-label="-15s" className={SKIP_CLASS}>-15s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-5)} aria-label="-5s" className={SKIP_CLASS}>-5s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={togglePlay}
            aria-label={playing ? t('systemPlayer.pause') : t('systemPlayer.play')}
            title={playing ? t('systemPlayer.pause') : t('systemPlayer.play')}
            className="w-14 h-14 rounded-full bg-[var(--accent)] text-[var(--ink-on-saturate)] flex items-center justify-center shadow-[var(--shadow-btn-primary)] active:scale-95">
            {playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(5)} aria-label="+5s" className={SKIP_CLASS}>+5s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(15)} aria-label="+15s" className={SKIP_CLASS}>+15s</motion.button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMuted(!muted)}
              aria-label={muted ? t('systemPlayer.unmute') : t('systemPlayer.mute')}
              title={muted ? t('systemPlayer.unmute') : t('systemPlayer.mute')}
              className={HIT_CLASS}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </motion.button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setMuted(false); }}
              aria-label={t('a11y.volume', 'Volume')}
              className="w-20 h-1 cursor-pointer rounded-full appearance-none bg-[var(--msg-bg-input)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent)]" />
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={cycleRate}
            className="min-h-11 min-w-11 flex items-center justify-center px-2 text-xs font-mono rounded-lg hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-secondary)]">{rate}x</motion.button>
          <div className="flex items-center gap-1">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onExport(recording.id, recording.title || 'recording')}
              aria-label={t('recordings.export')}
              title={t('recordings.export')}
              className={HIT_CLASS}>
              <Download size={16} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(recording.id)}
              aria-label={t('recordings.delete')}
              title={t('recordings.delete')}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[var(--danger)] hover:bg-[var(--danger-soft)] active:scale-95">
              <Trash2 size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
