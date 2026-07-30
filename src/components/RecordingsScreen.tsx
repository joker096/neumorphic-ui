import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Trash2, Download, Heart, Star, Mic, Video, MoreVertical, X, Volume2, VolumeX, ChevronLeft, ListFilter } from 'lucide-react';
import { SearchInput } from './ui/SearchInput';
import { useAppStore } from '../store';
import { callRecorderService, type CallRecording } from '../lib/callRecorderService';
import { useI18n } from '../lib/i18n';
import { formatDate, formatDuration } from './recordings/recordingUtils';
import { RecordingPlayer } from './recordings/RecordingPlayer';

interface RecordingsScreenProps {
  theme?: 'dark' | 'light';
  onBack: () => void;
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
        className={`shrink-0 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-orange-500 text-[var(--text-primary)]`}
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
              isDark ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
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
              <div className={`border-t my-1 ${isDark ? 'border-[var(--border-color)]' : 'border-[var(--border-color)]'}`} />
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
            isDark ? 'bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-white/10' : 'bg-white border border-[var(--border-color)] hover:bg-black/5'
          }`}>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <h2 className={`text-xl font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>{t('recordings.title')}</h2>
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
                ? 'bg-orange-500 text-[var(--text-primary)] shadow-sm'
                : isDark ? 'bg-[var(--bg-tertiary)] text-gray-400 hover:text-gray-200' : 'bg-white text-slate-500 hover:text-slate-800 border border-[var(--border-color)]'
            }`}>
            {opt.label} {sortBy === opt.value && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
          </motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => updateSettings({ recordingsSortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            isDark ? 'bg-[var(--bg-tertiary)] text-gray-400' : 'bg-white text-slate-500 border border-[var(--border-color)]'
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




