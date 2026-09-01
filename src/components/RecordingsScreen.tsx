import { useEffect, useMemo, useState } from 'react';
import { Download, Mic, Play, Search, Star, Trash2, Video } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { SubView } from './ui/SubView';
import { DataState } from './ui/DataState';
import { RecordingPlayer } from './recordings/RecordingPlayer';
import { callRecorderService, type CallRecording } from '../lib/callRecorderService';
import { recordingStorage } from '../lib/recordingStorage';
import { useAppStore } from '../store';
import { formatDate } from './recordings/recordingUtils';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RecordingsScreen = ({ isDark = false, onBack }: { isDark?: boolean; onBack?: () => void }) => {
  const { t } = useI18n();
  const recordings = useAppStore(s => s.recordings);
  const setRecordings = useAppStore(s => s.setRecordings);
  const deleteRecording = useAppStore(s => s.deleteRecording);
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState<{ recording: CallRecording; blobUrl: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    recordingStorage.listRecordings()
      .then(metas => {
        if (cancelled) return;
        const inStore = useAppStore.getState().recordings;
        const byId = new Map<string, CallRecording>();
        metas.forEach(m => byId.set(m.id, {
          id: m.id,
          callId: m.id,
          callType: m.callType,
          participants: [],
          startedAt: m.createdAt,
          duration: 0,
          recordingDuration: 0,
          fileSize: m.fileSize,
          mimeType: m.callType.startsWith('video') ? 'video/webm' : 'audio/webm',
          blobId: m.blobId,
          isFavorite: false,
          tags: [],
          createdAt: m.createdAt,
        }));
        inStore.forEach(r => byId.set(r.id, r as CallRecording));
        const merged = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
        setRecordings(merged);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [setRecordings]);

  const filtered = useMemo(() => {
    const list = [...recordings].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(r => (r.title ?? '').toLowerCase().includes(q) || (r.callType ?? '').includes(q));
  }, [recordings, query]);

  const play = async (recording: CallRecording) => {
    if (recording.callType.startsWith('video')) return;
    try {
      const blob = await callRecorderService.getRecordingBlob(recording.id);
      if (!blob) return;
      setPlaying({ recording, blobUrl: URL.createObjectURL(blob) });
    } catch {
      /* blob missing — item stays listed, player stays closed */
    }
  };

  const closePlayer = () => {
    if (playing) URL.revokeObjectURL(playing.blobUrl);
    setPlaying(null);
  };

  const handleExport = (id: string, title: string) => {
    callRecorderService.exportRecording(id, title || t('recordings.untitled'));
  };

  const handleDelete = async (id: string) => {
    try {
      await recordingStorage.deleteRecording(id);
    } catch {
      /* meta/blob gone — still remove from list */
    }
    deleteRecording(id);
    if (playing?.recording.id === id) closePlayer();
  };

  return (
    <SubView title={t('recordings.title', 'Recordings')} isDark={isDark} onBack={onBack || (() => {})}>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('recordings.searchPlaceholder', 'Search recordings...')}
            aria-label={t('recordings.searchPlaceholder', 'Search recordings...')}
            className={`w-full h-11 pl-9 pr-3 rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-gray-500' : 'bg-white text-slate-800 placeholder:text-slate-400'}`}
          />
        </div>

        {filtered.length === 0 ? (
          <DataState
            status="empty"
            isDark={isDark}
            title={t('recordings.empty', 'Your call recordings will appear here')}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((rec) => {
              const r = rec as CallRecording;
              const isVideo = (r.callType ?? 'audio').startsWith('video');
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)]' : 'bg-white hover:bg-gray-50 border border-gray-100'}`}
                >
                  <button
                    onClick={() => toggleFavorite(r.id)}
                    className={`min-w-11 min-h-11 flex items-center justify-center rounded-full ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}
                    aria-label={r.isFavorite ? t('recordings.removeFavorite') : t('recordings.addToFavorites')}
                  >
                    <Star
                      size={16}
                      className={r.isFavorite
                        ? (isDark ? 'text-amber-400' : 'text-amber-500')
                        : (isDark ? 'text-gray-500' : 'text-slate-400')}
                      fill={r.isFavorite ? 'currentColor' : 'none'}
                    />
                  </button>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    {isVideo
                      ? <Video size={18} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                      : <Mic size={18} className={isDark ? 'text-emerald-400' : 'text-emerald-600'} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
                      {r.title || t('recordings.untitled')}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {formatDate(r.createdAt)}
                      {r.fileSize > 0 && ` · ${formatSize(r.fileSize)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isVideo && (
                      <button
                        onClick={() => play(r)}
                        className={`min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-white/5' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
                        aria-label={t('recordings.play')}
                      >
                        <Play size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleExport(r.id, r.title || t('recordings.untitled'))}
                      className={`min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-white/5' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
                      aria-label={t('recordings.export')}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className={`min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-red-400 hover:bg-red-500/10' : 'bg-gray-100 text-slate-600 hover:bg-red-50 hover:text-red-500'}`}
                      aria-label={t('recordings.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {playing && (
          <RecordingPlayer
            recording={playing.recording}
            blobUrl={playing.blobUrl}
            isDark={isDark}
            onClose={closePlayer}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        )}
      </div>
    </SubView>
  );
};
