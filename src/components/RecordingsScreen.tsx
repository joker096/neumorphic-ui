import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Trash2, Download, Heart, Star, Mic, Video, MoreVertical, X, Volume2, VolumeX, ChevronLeft, ListFilter } from 'lucide-react';
import { SearchInput } from './ui/SearchInput';
import { useAppStore } from '../store';
import { callRecorderService, type CallRecording } from '../lib/callRecorderService';
import { useI18n } from '../lib/i18n';

interface RecordingsScreenProps {
  theme?: 'dark' | 'light';
  onBack: () => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function RecordingItem({ recording, onPlay, onDelete, onExport, onToggleFavorite, isDark = false }: {
  recording: CallRecording;
  onPlay: (r: CallRecording) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
  isDark?: boolean;
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const isVideo = recording.callType === 'video' || recording.callType === 'group_video';
  const names = recording.participants.map(p => p.displayName).join(', ');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onPlay(recording)}
        className={`shrink-0 w-10 h-10 rounded-[14px] flex items-center justify-center ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}
      >
        {isVideo ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </motion.button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm truncate ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
            {recording.title || names || t('recordings.untitled')}
          </span>
          {recording.isFavorite && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />}
        </div>
        <div className={`flex items-center gap-2 text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          <span>{formatDate(recording.createdAt)}</span>
          <span className="opacity-30">&middot;</span>
          <span>{formatDuration(recording.recordingDuration)}</span>
          <span className="opacity-30">&middot;</span>
          <span>{(recording.fileSize / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onPlay(recording)}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-orange-500 text-white`}
      >
        <Play className="w-4 h-4 ml-0.5" />
      </motion.button>
      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
          aria-label="More options" role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMenuOpen(!menuOpen); }}>
          <MoreVertical className="w-5 h-5" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className={`absolute right-0 top-full mt-1 z-20 w-44 rounded-2xl py-1.5 shadow-2xl border ${
              isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'
            }`}>
              <button onClick={() => { onToggleFavorite(recording.id); setMenuOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-sm text-left flex items-center gap-2.5 ${
                  isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-slate-700'
                }`}>
                <Heart className="w-4 h-4" /> {recording.isFavorite ? t('recordings.removeFavorite') : t('recordings.addToFavorites')}
              </button>
              <button onClick={() => { onExport(recording.id, recording.title || 'recording'); setMenuOpen(false); }}
                className={`w-full px-3.5 py-2.5 text-sm text-left flex items-center gap-2.5 ${
                  isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-slate-700'
                }`}>
                <Download className="w-4 h-4" /> {t('recordings.export')}
              </button>
              <div className={`border-t my-1 ${isDark ? 'border-white/5' : 'border-black/5'}`} />
              <button onClick={() => { onDelete(recording.id); setMenuOpen(false); }}
                className="w-full px-3.5 py-2.5 text-sm text-left flex items-center gap-2.5 text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" /> {t('recordings.delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function RecordingPlayer({ recording, blobUrl, isDark = false, onClose, onDelete, onExport }: {
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

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
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
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 shadow-2xl ${
          isDark ? 'bg-[#1a1d24] border border-white/5' : 'bg-white'
        }`}
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
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'
            }`}>-15s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(-5)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'
            }`}>-5s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(5)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'
            }`}>+5s</motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => skip(15)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'
            }`}>+15s</motion.button>
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
            className={`px-2.5 py-1 text-xs font-mono rounded-lg ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'
            }`}>{rate}x</motion.button>
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

export function RecordingsScreen({ theme = 'dark', onBack }: RecordingsScreenProps) {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const recordings = useAppStore((s: any) => s.recordings || []);
  const searchQuery = useAppStore((s: any) => s.recordingsSearchQuery || '');
  const sortBy = useAppStore((s: any) => s.recordingsSortBy || 'date');
  const sortOrder = useAppStore((s: any) => s.recordingsSortOrder || 'desc');
  const updateSettings = useAppStore((s: any) => s.updateSettings);
  const addRecording = useAppStore((s: any) => s.addRecording);
  const deleteRecordingStore = useAppStore((s: any) => s.deleteRecording);
  const toggleFavorite = useAppStore((s: any) => s.toggleFavorite);

  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlay = useCallback(async (rec: CallRecording) => {
    setLoading(true);
    setSelectedRecording(rec);
    try {
      const blob = await callRecorderService.getRecordingBlob(rec.blobId);
      if (blob) setBlobUrl(URL.createObjectURL(blob));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setSelectedRecording(null);
  }, [blobUrl]);

  const handleDelete = useCallback(async (id: string) => {
    await callRecorderService.deleteRecording(id);
    deleteRecordingStore(id);
    if (selectedRecording?.id === id) handleClose();
  }, [deleteRecordingStore, selectedRecording, handleClose]);

  const handleExport = useCallback((id: string, title: string) => {
    callRecorderService.exportRecording(id, title);
  }, []);

  const filtered = useMemo(() => {
    let list = [...(recordings as CallRecording[])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.title?.toLowerCase().includes(q) || r.participants.some(p => p.displayName.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date': cmp = a.createdAt - b.createdAt; break;
        case 'duration': cmp = a.recordingDuration - b.recordingDuration; break;
        case 'type': cmp = a.callType.localeCompare(b.callType); break;
        case 'name': cmp = (a.title || '').localeCompare(b.title || ''); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [recordings, searchQuery, sortBy, sortOrder]);

  const sortOptions = [
    { value: 'date', label: t('recordings.sortDate') },
    { value: 'duration', label: t('recordings.sortDuration') },
    { value: 'type', label: t('recordings.sortType') },
    { value: 'name', label: t('recordings.sortName') },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 px-4 py-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-[#1a1d24] border border-white/10 hover:bg-white/10' : 'bg-white border border-black/10 hover:bg-black/5'
          }`}>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('recordings.title')}</h2>
      </div>

      <div className="px-4 mb-3">
        <SearchInput value={searchQuery} onChange={(v) => updateSettings({ recordingsSearchQuery: v })}
          placeholder={t('recordings.searchPlaceholder')} isDark={isDark} />
      </div>

      <div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto scrollbar-none" onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
        {sortOptions.map(opt => (
          <motion.button key={opt.value} whileTap={{ scale: 0.95 }}
            onClick={() => updateSettings({ recordingsSortBy: opt.value })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sortBy === opt.value
                ? 'bg-orange-500 text-white shadow-sm'
                : isDark ? 'bg-[#1a1d24] text-gray-400 hover:text-gray-200' : 'bg-white text-slate-500 hover:text-slate-800 border border-black/10'
            }`}>
            {opt.label} {sortBy === opt.value && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
          </motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => updateSettings({ recordingsSortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isDark ? 'bg-[#1a1d24] text-gray-400' : 'bg-white text-slate-500 border border-black/10'
          }`}>
          {sortOrder === 'asc' ? 'ASC' : 'DESC'}
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
              <Mic className={`w-7 h-7 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('recordings.empty')}</p>
            <p className={`text-xs mt-1 opacity-50 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('recordings.emptySubtitle') || 'No recordings yet'}</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {filtered.map(rec => (
              <RecordingItem key={rec.id} recording={rec} isDark={isDark}
                onPlay={handlePlay} onDelete={handleDelete} onExport={handleExport} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRecording && blobUrl && (
          <RecordingPlayer recording={selectedRecording} blobUrl={blobUrl} isDark={isDark}
            onClose={handleClose} onDelete={handleDelete} onExport={handleExport} />
        )}
      </AnimatePresence>
    </div>
  );
}
